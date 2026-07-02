import { z } from 'zod';
import { WRITABLE_RESOURCE_TYPES, NO_CREATE_TYPES, NESTED_RESOURCES } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
import { getResourceFieldId } from './helpers.js';
const log = debug('losant-mcp-server:tools:write-resources');

export default {
  name: 'losant_write',
  inputInfo: {
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false
    },
    title: 'Create or Update Losant Resources',
    description: `Read losant://guides/losant-write-tool before using this tool. Create or update Losant resources: ${WRITABLE_RESOURCE_TYPES.join(', ')}.`,
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['createOne', 'updateOne'],
          description: '"createOne" posts a new resource, "updateOne" patches an existing one by resourceId'
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
          description: 'Resource ID — required for "updateOne" operation except when updating application OR applicationReadme.'
        },
        parentResourceId: {
          type: 'string',
          description: 'Parent resource ID — required for nested resource types (e.g., the dataTableId when resourceType is "dataTableRow")'
        },
        body: {
          type: 'object',
          description: 'Resource data matching the Post or Patch schema for the given resourceType.'
        }
      },
      required: ['operation', 'resourceType', 'applicationId', 'body']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({
      operation, resourceType, applicationId, resourceId, parentResourceId, body
    }) => {
      log('Write tool called with parameters:', { operation, resourceType, applicationId, resourceId, parentResourceId });

      if (operation === 'createOne' && NO_CREATE_TYPES.has(resourceType)) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'operation', details: `The "createOne" operation is not supported for "${resourceType}" — these resources are created by devices and flows, not the API.` }]
        });
      }

      if (operation === 'updateOne' && resourceType !== 'application' && resourceType !== 'applicationReadme' && !resourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: 'The "updateOne" operation requires a resourceId unless the resourceType is "application" or "applicationReadme".' }]
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
            response = await losantClient[resourceType].patch({
              ...requestParams,
              [getResourceFieldId(resourceType)]: resourceId,
              [resourceType === 'applicationDashboard' ? 'dashboard' : resourceType]: body
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
