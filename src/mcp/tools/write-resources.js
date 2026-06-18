import { z } from 'zod';
import { WRITABLE_RESOURCE_TYPES, ALLOW_BULK_CREATE_TYPES, ALLOW_UPDATE_MANY_TYPES, NO_CREATE_TYPES, NO_UPDATE_TYPES, NESTED_RESOURCES } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
import { getResourceFieldId } from './helpers.js';
const log = debug('losant-mcp-server:tools:write-resources');

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
    description: `Create or update Losant resources: ${WRITABLE_RESOURCE_TYPES.join(', ')}. Check losant://schemas/{resourceType}Post or losant://schemas/{resourceType}Patch for the body schema before calling. Read the relevant guide first: losant://guides/devices (device, deviceRecipe), losant://guides/integrations (integration), losant://guides/data-tables (dataTable, dataTableRow), losant://guides/resource-jobs (resourceJob), losant://guides/credentials (credential), losant://guides/files (file, privateFile), losant://guides/notebooks (notebook), losant://guides/flows (flow, flowVersion), losant://guides/dashboards (applicationDashboard), losant://guides/experiences (experienceDomain, experienceEndpoint, experienceGroup, experienceSlug, experienceUser, experienceVersion, experienceView).`,
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['createOne', 'updateOne', 'createMany', 'updateMany'],
          description: '"createOne" posts a new resource, "updateOne" patches an existing one by resourceId, "createMany" posts multiple new resources, "updateMany" patches all resources matching a filter'
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
          description: 'Resource ID — required for "updateOne" and "createMany" operations except when updating application OR applicationReadme.'
        },
        parentResourceId: {
          type: 'string',
          description: 'Parent resource ID — required for nested resource types (e.g., the dataTableId when resourceType is "dataTableRow")'
        },
        filter: {
          type: 'object',
          description: 'Required for "updateMany" — properties are spread as query params into the request. For events: { "state": "new" }, { "subject": "Alert*" }, or { "query": { ... } } for advanced filtering.'
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
    return async ({
      operation, resourceType, applicationId, resourceId, parentResourceId, body, filter
    }) => {
      log('Write tool called with parameters:', { operation, resourceType, applicationId, resourceId, parentResourceId });

      if (operation === 'createOne' && NO_CREATE_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'operation', details: `The "createOne" operation is not supported for "${resourceType}" — these resources are created by devices and workflows, not the API.` }]
        });
      }

      if (operation === 'updateOne' && NO_UPDATE_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'operation', details: `The "updateOne" operation is not supported for "${resourceType}" — versions are immutable after creation.` }]
        });
      }

      if (operation === 'updateMany' && !ALLOW_UPDATE_MANY_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceType', details: `The "updateMany" operation is not valid for "${resourceType}".` }]
        });
      }

      if (operation === 'updateMany' && (!filter || !Object.keys(filter).length)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'filter', details: 'The "updateMany" operation requires a non-empty filter to prevent unintended bulk updates.' }]
        });
      }

      if (operation === 'updateOne' && resourceType !== 'application' && resourceType !== 'applicationReadme' && !resourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: 'The "updateOne" operation requires a resourceId unless the resourceType is "application" or "applicationReadme".' }]
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
      const requestParams = { applicationId, _links: false, _actions: false, _embedded: false };
      if (parentFieldName) { requestParams[parentFieldName] = parentResourceId; }
      try {
        let response;
        if (operation === 'createOne') {
          response = await losantClient[`${resourceType}s`].post({
            ...requestParams,
            [resourceType === 'applicationDashboard' ? 'dashboard' : resourceType]: body
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
        } else if (operation === 'updateMany') {
          response = await losantClient[`${resourceType}s`].patch({
            ...requestParams,
            ...filter,
            [resourceType]: body
          });
        } else {
          if (resourceType === 'applicationReadme') {
            response = await losantClient.application.readmePatch({
              ...requestParams,
              readme: body
            });
          } else if (resourceType === 'application') {
            response = await losantClient.application.patch({
              ...requestParams,
              application: body
            });
          } else {
            response = await losantClient[resourceType === 'applicationDashboard' ? 'dashboard' : resourceType].patch({
              ...requestParams,
              [getResourceFieldId(resourceType)]: resourceId,
              [resourceType]: body
            });
          }
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
