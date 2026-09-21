import { z } from 'zod';
import { DELETABLE_RESOURCE_TYPES, NESTED_RESOURCES } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
import { getResourceFieldId } from './helpers.js';

const log = debug('losant-mcp-server:tools:delete-resources');

export default {
  name: 'losant_delete',
  inputInfo: {
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: true
    },
    title: 'Delete Losant Resources',
    description: `Read losant://guides/losant-delete-tool before using this tool. Permanently deletes a Losant resource: ${DELETABLE_RESOURCE_TYPES.join(', ')}.`,
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        resourceType: {
          type: 'string',
          enum: DELETABLE_RESOURCE_TYPES,
          description: 'Type of resource to delete'
        },
        applicationId: {
          type: 'string',
          description: 'Application ID (24-character hex string)'
        },
        resourceId: {
          type: 'string',
          description: 'Resource ID — required for all resource types except "application" (which is identified by applicationId alone)'
        },
        parentResourceId: {
          type: 'string',
          description: 'Parent resource ID — required for nested resource types (e.g., the dataTableId when resourceType is "dataTableRow", or flowId when resourceType is "flowVersion")'
        }
      },
      required: ['resourceType', 'applicationId']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({ resourceType, applicationId, resourceId, parentResourceId }) => {
      log('Delete tool called with parameters:', { resourceType, applicationId, resourceId, parentResourceId });

      if (resourceType !== 'application' && !resourceId) {
        return invalidRequestError({
          message: 'Tool input validation failed',
          errors: [{ fieldName: 'resourceId', details: 'resourceId is required for all resource types except "application".' }]
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
      if (resourceType !== 'application') {
        requestParams[getResourceFieldId(resourceType)] = resourceId;
      }
      if (parentFieldName) { requestParams[parentFieldName] = parentResourceId; }

      try {
        const response = await losantClient[resourceType].delete(requestParams);
        return {
          content: [{ type: 'text', text: JSON.stringify(response, null, 2) }]
        };
      } catch (err) {
        return restToMCPError(err, { resourceType });
      }
    };
  }
};
