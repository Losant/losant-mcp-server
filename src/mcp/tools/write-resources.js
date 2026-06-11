import { z } from 'zod';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { WRITABLE_RESOURCE_TYPES, ALLOW_BULK_CREATE_TYPES, SCHEMAS_PATH } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
const log = debug('losant-mcp-server:tools:write-resources');

// Pre-load and compile schemas at startup to avoid per-request I/O
const bodySchemas = {};
for (const type of WRITABLE_RESOURCE_TYPES) {
  const postSchema = JSON.parse(readFileSync(path.join(SCHEMAS_PATH, `${type}Post.json`), 'utf8'));
  const patchSchema = JSON.parse(readFileSync(path.join(SCHEMAS_PATH, `${type}Patch.json`), 'utf8'));
  bodySchemas[`${type}Post`] = z.fromJSONSchema(postSchema);
  bodySchemas[`${type}Patch`] = z.fromJSONSchema(patchSchema);
};

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
    description: `Create or update Losant resources: ${WRITABLE_RESOURCE_TYPES.join(', ')}. Check losant://schemas/{resourceType}Post or losant://schemas/{resourceType}Patch for the body schema before calling. For device and deviceRecipe operations, read losant://guides/devices first — devices have important constraints around deviceClass, attribute dataType immutability, and the recipe-to-device relationship.`,
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
        body: {
          type: 'object',
          description: 'Resource data matching the Post or Patch schema for the given resourceType. Do not include read-only fields such as id, creationDate, or lastUpdated.'
        }
      },
      required: ['operation', 'resourceType', 'applicationId', 'body']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({ operation, resourceType, applicationId, resourceId, body }) => {
      log('Write tool called with parameters:', { operation, resourceType, applicationId, resourceId });

      if ((operation === 'updateOne' || operation === 'createMany') && !resourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: `The "${operation}" operation requires a resourceId.` }]
        });
      }

      if (operation === 'createMany' && !ALLOW_BULK_CREATE_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceType', details: `The "${operation}" operation is not valid for this resource type.` }]
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
      try {
        let response;
        if (operation === 'createOne') {
          response = await losantClient[`${resourceType}s`].post({
            ...requestParams,
            [resourceType]: body
          });
        } else if (operation === 'createMany') {
          response = await losantClient[`${resourceType}`].bulkCreate({
            ...requestParams,
            [`${resourceType}Id`]: resourceId,
            [BULK_CREATE_TYPE_TO_BODY_NAME[resourceType]]: body
          });
        } else {
          response = await losantClient[resourceType].patch({
            ...requestParams,
            [`${resourceType}Id`]: resourceId,
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
