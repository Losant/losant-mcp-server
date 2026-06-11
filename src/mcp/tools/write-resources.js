import { z } from 'zod';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WRITABLE_RESOURCE_TYPES, ALLOW_BULK_CREATE_TYPES, NESTED_RESOURCES, SCHEMAS_PATH } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
import { getResourceFieldId } from './helpers.js';
const log = debug('losant-mcp-server:tools:write-resources');

const SCHEMA_PATH_OVERRIDES = {
  dataTableRow: { post: 'dataTableRowInsert.json', patch: 'dataTableRowInsertUpdate.json' }
};

// Pre-load and compile schemas at startup to avoid per-request I/O
const bodySchemas = {};
for (const type of WRITABLE_RESOURCE_TYPES) {
  const { post: postFile = `${type}Post.json`, patch: patchFile = `${type}Patch.json` } = SCHEMA_PATH_OVERRIDES[type] ?? {};
  bodySchemas[`${type}Post`] = z.fromJSONSchema(JSON.parse(readFileSync(path.join(SCHEMAS_PATH, postFile), 'utf8')));
  bodySchemas[`${type}Patch`] = z.fromJSONSchema(JSON.parse(readFileSync(path.join(SCHEMAS_PATH, patchFile), 'utf8')));
}

const BULK_CREATE_TYPE_TO_BODY_NAME = {
  deviceRecipe: 'bulkInfo'
};

export default {
  name: 'losant_write',
  inputInfo: {
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false
    },
    title: 'Create or Update Losant Resources',
    description: `Create or update Losant resources: ${WRITABLE_RESOURCE_TYPES.join(', ')}. Check losant://schemas/{resourceType}Post or losant://schemas/{resourceType}Patch for the body schema before calling. Read the relevant guide before working with complex types: losant://guides/devices (device, deviceRecipe), losant://guides/integrations (integration), losant://guides/data-tables (dataTable, dataTableRow), losant://guides/resource-jobs (resourceJob).`,
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['createOne', 'updateOne', 'createMany'],
          description: '"createOne" posts a new resource, "updateOne" patches an existing one by resourceId, "createMany" posts multiple new resources'
        },
        resourceType: {
          type: 'string',
          enum: WRITABLE_RESOURCE_TYPES,
          description: 'Type of resource to create or update'
        },
        applicationId: {
          type: 'string',
          description: 'Application ID (24-character hex string)'
        },
        resourceId: {
          type: 'string',
          description: 'Resource ID — required for "updateOne" and "createMany" operations'
        },
        parentResourceId: {
          type: 'string',
          description: 'Parent resource ID — required for nested resource types (e.g., the dataTableId when resourceType is "dataTableRow")'
        },
        body: {
          type: ['object', 'array'],
          description: 'Resource data matching the Post or Patch schema for the given resourceType. For "createMany" on dataTableRow, pass an array of row objects. Do not include read-only fields such as id, creationDate, or lastUpdated.'
        }
      },
      required: ['operation', 'resourceType', 'applicationId', 'body']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({ operation, resourceType, applicationId, resourceId, parentResourceId, body }) => {
      log('Write tool called with parameters:', { operation, resourceType, applicationId, resourceId, parentResourceId });

      if (operation === 'updateOne' && !resourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: 'The "updateOne" operation requires a resourceId.' }]
        });
      }

      if (operation === 'createMany' && !resourceId && !parentResourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: 'The "createMany" operation requires either a resourceId or a parentResourceId.' }]
        });
      }

      if (operation === 'createMany' && !ALLOW_BULK_CREATE_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceType', details: `The "${operation}" operation is not valid for this resource type.` }]
        });
      }

      const parentFieldName = NESTED_RESOURCES[resourceType]?.parentField;
      if (parentFieldName && !parentResourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'parentResourceId', details: `The "${resourceType}" resource type requires a parentResourceId (${parentFieldName}).` }]
        });
      }
      // for now let the API validate it
      // const schemaKey = `${resourceType}${operation === 'createOne' ? 'Post' : 'Patch'}`;
      // const parseResult = bodySchemas[schemaKey].safeParse(body);
      // if (!parseResult.success) {
      //   return invalidRequestError({
      //     message: 'Body validation failed',
      //     errors: parseResult.error.issues.map((issue) => ({
      //       fieldName: issue.path.join('.') || 'body',
      //       details: issue.message
      //     }))
      //   });
      // }

      const requestParams = { applicationId, _links: false, _actions: false, _embedded: false };
      if (parentFieldName) { requestParams[parentFieldName] = parentResourceId; }
      try {
        let response;
        if (operation === 'createOne') {
          response = await losantClient[`${resourceType}s`].post({
            ...requestParams,
            [resourceType]: body
          });
        } else if (operation === 'createMany') {
          if (BULK_CREATE_TYPE_TO_BODY_NAME[resourceType]) {
            response = await losantClient[`${resourceType}`].bulkCreate({
              ...requestParams,
              [`${resourceType}Id`]: resourceId,
              [BULK_CREATE_TYPE_TO_BODY_NAME[resourceType]]: body
            });
          } else {
            // Types like dataTableRow reuse the post endpoint — body must be an array
            response = await losantClient[`${resourceType}s`].post({
              ...requestParams,
              [resourceType]: body
            });
          }
        } else {
          response = await losantClient[resourceType].patch({
            ...requestParams,
            [getResourceFieldId(resourceType)]: resourceId,
            [resourceType]: body
          });
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      } catch (err) {
        return restToMCPError(err, { resourceType });
      }
    };
  }
};
