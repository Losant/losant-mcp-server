import { z } from 'zod';
import { NESTED_RESOURCES, RESOURCE_TYPES, APPLICATION_RESOURCES, ALLOWS_ADVANCED_QUERIES_SET } from '../../constants.js';
import debug from 'debug';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
import { getResourceFieldId } from './helpers.js';
const log = debug('losant-mcp-server:tools:query-resources');

const omittedFieldsByResourceType = {
  applicationDashboard: ['blocks', 'contextConfiguration'],
  flow: ['nodes', 'triggers', 'iconData' ],
  experienceView: ['body'],
  experienceDomain: [ 'sslCert', 'sslBundle' ],
  application: ['globals', 'archiveConfig', 'readme'],
  embeddedDeployment: ['logs'],
  device: ['attributes.description', 'attributes.contentType', 'attributes.attributeTags', 'attributes.system']
};
omittedFieldsByResourceType.edgeDeployment = omittedFieldsByResourceType.embeddedDeployment; // same structure for edge and embedded deployments
omittedFieldsByResourceType.flowVersion = omittedFieldsByResourceType.flow; // same structure for flow and flowVersion

const omittedFieldHint = {
  device: 'Attributes include name and dataType only. Use operation:get with the deviceId to retrieve full attribute details including description, contentType, attributeTags, and system configuration.'
};

const omitFieldByResourceType = {
  applicationDashboard: (items) => {
    items.forEach((item) => {
      let counts = {};
      item.blocks.forEach(({ blockType }) => {
        counts[blockType] = (counts[blockType] || 0) + 1;
      });
      item._omittedCounts = { blocks: counts };
      counts = {};
      item.contextConfiguration.forEach(({ type }) => {
        counts[type] = (counts[type] || 0) + 1;
      });
      item._omittedCounts.contextConfiguration = counts;
      delete item.contextConfiguration;
      delete item.blocks;
    });
  },
  flow: (items) => {
    items.forEach((item) => {
      let counts = {};
      item.nodes.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1;
      });
      item._omittedCounts = { nodes: counts };
      delete item.nodes;
      counts = {};
      item.triggers.forEach((node) => {
        counts[node.type] = (counts[node.type] || 0) + 1;
      });
      item._omittedCounts.triggers = counts;
      delete item.triggers;
      if (item.iconData) {
        item._omittedBytes = { iconData: Buffer.byteLength(item.iconData, 'utf8') };
        delete item.iconData;
      }
    });
  },
  experienceView: (items) => {
    items.forEach((item) => {
      item._omittedBytes = { body: Buffer.byteLength(item.body || '', 'utf8') };
      delete item.body;
    });
  },
  experienceDomain: (items) => {
    items.forEach((item) => {
      item._omittedBytes = { sslCert: Buffer.byteLength(item.sslCert || '', 'utf8'), sslBundle: Buffer.byteLength(item.sslBundle || '', 'utf8') };
      delete item.sslCert;
      delete item.sslBundle;
    });
  },
  application: (items) => {
    items.forEach((item) => {
      item._availableViaGet = { readme: true };
      if (item.globals?.length) {
        item._availableViaGet.globals = true;
      }
      if (item.archiveConfig) {
        item._availableViaGet.archiveConfig = true;
      }
      delete item.globals;
      delete item.archiveConfig;
    });
  },
  embeddedDeployment: (items) => {
    items.forEach((item) => {
      if (item.logs?.length) {
        item._omittedCounts = { logs: item.logs.length };
      }
      delete item.logs;
    });
  },
  device: (items) => {
    items.forEach((item) => {
      if (item.attributes?.length) {
        item.attributes = item.attributes.map(({ name, dataType }) => ({ name, dataType }));
      }
    });
  }
};
omitFieldByResourceType.edgeDeployment = omitFieldByResourceType.embeddedDeployment; // same structure for edge and embedded deployments
omitFieldByResourceType.flowVersion = omitFieldByResourceType.flow; // same structure as flow

const checkForUnexpectedPageOps = (listInput, errors, resourceType, operation) => {
  ['page', 'perPage'].forEach((param) => {
    if (listInput[param] !== undefined) {
      errors.push({ fieldName: param, details: `The '${operation}' operation on '${resourceType}' does not support the '${param}' parameter.` });
    }
  });
};

const checkForUnexpectedFilterOptions = (listInput, errors, resourceType, operation) => {
  ['filterField', 'filter'].forEach((param) => {
    if (listInput[param] !== undefined) {
      errors.push({ fieldName: param, details: `The '${operation}' operation on '${resourceType}' does not support the '${param}' parameter.` });
    }
  });
};

const checkForUnexpectedListOptions = (listInput, errors, resourceType, operation) => {
  ['sortField', 'sortDirection', 'query'].forEach((param) => {
    if (listInput[param] !== undefined) {
      errors.push({ fieldName: param, details: `The '${operation}' operation on '${resourceType}' does not support the '${param}' parameter.` });
    }
  });
  checkForUnexpectedFilterOptions(listInput, errors, resourceType, operation);
  checkForUnexpectedPageOps(listInput, errors, resourceType, operation);
};

const validateSharedParams = ({ resourceType, applicationId, parentResourceId }, requestParams, errors) => {
  const isAppResource = APPLICATION_RESOURCES.includes(resourceType);
  // Check if applicationId is required for this resource type
  if (isAppResource) {
    if (!applicationId) {
      errors.push({
        fieldName: 'applicationId',
        details: `The resource type '${resourceType}' requires an applicationId. You must ask the user which application to use. Ask: "Which application would you like to search in?" Then query resourceType='application' with filterField='name' and filter='UserProvidedName*' to find it. If multiple results, show the user the options and ask them to confirm which one.`
      });
    } else {
      requestParams.applicationId = applicationId;
    }
  } else if (applicationId) {
    errors.push({
      fieldName: 'applicationId',
      details: `The resource type '${resourceType}' is not an application-scoped resource, so applicationId should not be provided. Remove the applicationId parameter.`
    });
  }

  // Check if parentResourceId is required for nested resources
  const parentFieldName = NESTED_RESOURCES[resourceType]?.parentField;
  if (parentFieldName) {
    if (!parentResourceId) {
      const parentResourceType = NESTED_RESOURCES[resourceType].parentType;
      errors.push({
        fieldName: 'parentResourceId',
        details: `The resource type '${resourceType}' is a nested resource requiring a ${parentFieldName}. First query resourceType='${parentResourceType}' to find the parent resource, then extract its 'id' field to use as parentResourceId.`,
        requiredParentField: parentFieldName,
        requiredParentResourceType: parentResourceType
      });
    } else {
      // Map parentResourceId to the correct field name for the API
      requestParams[parentFieldName] = parentResourceId;
    }
  } else if (parentResourceId) {
    errors.push({
      fieldName: 'parentResourceId',
      details: `The resource type '${resourceType}' is not a nested resource, so parentResourceId should not be provided. Remove the parentResourceId parameter.`
    });
  }
};

const queryDataTableRows = async (losantClient, requestParams) => {
  // at this point perPage has been validated and defaulted to 100 if not provided
  requestParams.limit = requestParams.perPage;
  if (requestParams.page !== undefined) {
    requestParams.offset = (requestParams.page || 0) * requestParams.limit;
  }
  // sortField → sortColumn for data table rows
  if (requestParams.sortField) {
    requestParams.sortColumn = requestParams.sortField;
  }
  delete requestParams.page;
  delete requestParams.perPage;
  delete requestParams.sortField;
  const response = await losantClient.dataTableRows.query(requestParams);
  response.page = Math.floor(response.offset / response.limit);
  response.perPage = response.limit;
  response.sortField = response.sortColumn;
  delete response.query; // The API POST body is echoed back in the response. Mostly harmless but confusing — an LLM might wonder what this query means in context.
  delete response.limit;
  delete response.offset;
  delete response.sortColumn;
  return response;
};

const getResourceTool = async (losantClient, { resourceType, resourceId }, requestParams, listInput, errors) => {
  // GET operation - retrieve single resource
  if (!resourceId) {
    errors.push({ fieldName: 'resourceId', details: 'The \'get\' operation requires the \'resourceId\' parameter.' });
  }
  checkForUnexpectedListOptions(listInput, errors, resourceType, 'get');
  if (errors.length) {
    return invalidRequestError({ message: 'Tool input validation failed', errors });
  }

  requestParams[getResourceFieldId(resourceType)] = resourceId;
  const responseContext = [];
  if (resourceType === 'application') {
    let readmeTxt = 'No readme content found for this application.';
    const [response, readmeResponse] = await Promise.all([
      losantClient.application.get(requestParams),
      losantClient.application.readme(requestParams).catch(() => {
        readmeTxt = 'Readme failed to load.';
      })
    ]);
    response.readme = readmeResponse?.content || '';
    responseContext.push({ type: 'text', text: JSON.stringify(response, null, 2) });
    if (!readmeResponse?.lastUpdated) {
      responseContext.push({ type: 'text', text: readmeTxt });
    }
  } else {
    const response = await losantClient[resourceType].get(requestParams);
    responseContext.push({
      type: 'text',
      text: JSON.stringify(response, null, 2)
    });
  }
  return responseContext;
};

const listResourceTool = async (losantClient, { resourceType }, requestParams, listInput, errors) => {
  if (resourceType === 'experienceDomain' || resourceType === 'experienceSlug') {
    checkForUnexpectedListOptions(listInput, errors, resourceType, 'list');
  } else if (resourceType === 'experienceEndpoint') {
    checkForUnexpectedPageOps(listInput, errors, resourceType, 'list');
  } else {
    if (resourceType === 'applicationJobLog') {
      checkForUnexpectedFilterOptions(listInput, errors, resourceType, 'list');
    }
    if (listInput.perPage !== undefined && (listInput.perPage > 100 || listInput.perPage < 1)) {
      errors.push({
        fieldName: 'perPage',
        details: 'The \'perPage\' parameter must be between 1 and 100.'
      });
    }
    requestParams.perPage = listInput.perPage || 100; // Default to 100 items per page for list operations
    if (listInput.page !== undefined) {
      if (listInput.page < 0) {
        errors.push({
          fieldName: 'page',
          details: 'The \'page\' parameter must be a non-negative integer.'
        });
      }
      requestParams.page = listInput.page;
    }
  }
  // LIST operation - query the collection (plural)
  if (listInput.sortField) { requestParams.sortField = listInput.sortField; }
  if (listInput.sortDirection) { requestParams.sortDirection = listInput.sortDirection; }

  // Advanced query overrides simple filter parameters
  if (listInput.query) {
    if (!ALLOWS_ADVANCED_QUERIES_SET.has(resourceType)) {
      errors.push({
        fieldName: 'query',
        details: `The resource type '${resourceType}' does not support advanced queries. Remove the 'query' parameter and use 'filterField' and 'filter' for simple filtering instead.`
      });
    }
    if (listInput.filterField && resourceType !== 'applicationJobLog') {
      errors.push({
        fieldName: 'filterField',
        details: 'The \'filterField\' parameter cannot be used together with the \'query\' parameter. The \'query\' parameter overrides simple filters. Remove the \'filterField\' parameter and include any filtering logic in the \'query\' object instead.'
      });
    }
    if (listInput.filter) {
      errors.push({
        fieldName: 'filter',
        details: 'The \'filter\' parameter cannot be used together with the \'query\' parameter. The \'query\' parameter overrides simple filters. Remove the \'filter\' parameter and include any filtering logic in the \'query\' object instead.'
      });
    }
    requestParams.query = listInput.query;
  } else if (resourceType !== 'applicationJobLog') {
    // Use simple filter only if query not provided
    if (listInput.filterField) { requestParams.filterField = listInput.filterField; }
    if (listInput.filter) { requestParams.filter = listInput.filter; }
  }
  if (errors.length) {
    return invalidRequestError({ message: 'Tool input validation failed', errors });
  }
  // Special case: dataTableRow uses query endpoint for list operations
  let listResponse;
  if (resourceType === 'dataTableRow') {
    listResponse = await queryDataTableRows(losantClient, requestParams);
  } else {
    listResponse = await losantClient[`${resourceType}s`].get(requestParams);
  }
  const responseContent = [];
  if (omitFieldByResourceType[resourceType]) {
    omitFieldByResourceType[resourceType](listResponse.items);
    responseContent.push({
      type: 'text',
      text: JSON.stringify({
        _projection: {
          mode: 'summary',
          omittedFields: omittedFieldsByResourceType[resourceType] || [],
          hint: omittedFieldHint[resourceType] || 'Summary fields only. Use operation:get with an id to retrieve full content.'
        }
      }, null, 2)
    });
  }
  responseContent.push({
    type: 'text',
    text: JSON.stringify(listResponse, null, 2)
  });
  if (listResponse.totalCount !== undefined) {
    const currentItemCount = ((listResponse.perPage * listResponse.page) + listResponse.count);
    const remaining = listResponse.totalCount - currentItemCount;
    if (currentItemCount < listResponse.totalCount) {
      responseContent.push({
        type: 'text',
        text: `Pagination hint: ${remaining} more ${resourceType}(s) exist beyond this page (showing ${listResponse.count} of ${listResponse.totalCount} total). Increment the 'page' parameter to retrieve the next set of results.`
      });
    } else if (listResponse.totalCount > 0 && listResponse.count === 0) {
      responseContent.push({
        type: 'text',
        text: `Pagination hint: ${listResponse.page} exceeds last page. Set page to ${Math.ceil(listResponse.totalCount / listResponse.perPage) - 1} to retrieve the last page of results.`
      });
    }
  }
  return responseContent;
};


// ========================================
// TOOL - Unified List/Get Query Tool
// ========================================
export default {
  name: 'losant_query',
  inputInfo: {
    title: 'Query Losant Resources',
    description: `List or get Losant resources: ${RESOURCE_TYPES.join(', ')}. See losant://guides/losant-query-tool for the step by step procedures, including how to select an application, handle nested resources, and links to per-resource documentation. For advanced MongoDB-style queries, see losant://guides/advanced-queries.`,
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['list', 'get'],
          description: 'Operation to perform: "list" returns a collection, "get" returns a single resource by ID'
        },
        resourceType: {
          type: 'string',
          enum: RESOURCE_TYPES,
          description: "Type of resource to query (singular form). Use 'application' to search for applications first, then extract the 'id' field for applicationId parameter."
        },
        applicationId: {
          type: 'string',
          description: "Application ID (24-character hex string). Required for application-scoped resources (device, flow, etc.). NOT required when querying 'application' resourceType. Get this by first querying resourceType='application' and extracting the 'id' field from results."
        },
        parentResourceId: {
          type: 'string',
          description: "Parent resource ID (24-character hex string). Required for nested resources: flowVersion (needs flowId), dataTableRow (needs dataTableId). First query the parent resource and extract its 'id' field to use here."
        },
        resourceId: {
          type: 'string',
          description: 'Resource ID (required for "get" operation, 24-character hex string) OR if the resourceType is experienceVersion or flowVersion this could be a string name or an ID'
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (list operation, 0-based)'
        },
        perPage: {
          type: 'number',
          description: 'Items per page (list operation). Use 10+ when searching applications by name since names are not unique.'
        },
        sortField: {
          type: 'string',
          description: 'Field to sort by (list operation)'
        },
        sortDirection: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction (list operation)'
        },
        filterField: {
          type: 'string',
          description: "Simple field to filter on (list operation). Use 'name' when searching for almost all resourceTypes, except for a few special cases i.e. experienceEndpoint only allows 'method' or 'route'."
        },
        filter: {
          type: 'string',
          description: "Simple filter value - supports globbing (list operation). Example: 'Embree*' to find applications starting with 'Embree'."
        },
        query: {
          type: 'object',
          description: 'Advanced MongoDB-style query object (list operation). Supports operators: $and, $or, $nor, $eq, $ne, $gt, $lt, $gte, $lte, $in, $nin, $startsWith, $endsWith, $contains, $ci. See losant://guides/advanced-queries and resource-specific schemas for details.'
        },
        params: {
          type: 'object',
          description: 'Additional resource-specific parameters - check documentation for available options'
        }
      },
      required: ['operation', 'resourceType']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({
      operation,
      resourceType,
      applicationId,
      parentResourceId,
      resourceId,
      params = {},
      page,
      perPage,
      sortField,
      sortDirection,
      filterField,
      filter,
      query
    }) => {
      log('Query Tool called with parameters:', {
        operation, resourceType, applicationId, parentResourceId, resourceId, page, perPage, sortField, sortDirection, filterField, filter, query, params
      });
      const listInput = {
        page, perPage, sortField, sortDirection, filterField, filter, query
      };
      const requestParams = { ...params, _links: false, _embedded: false, _actions: false };
      const errors = [];
      validateSharedParams({ resourceType, applicationId, parentResourceId }, requestParams, errors);
      let responseContent;
      switch (operation) {
        case 'list':
          try {
            responseContent = await listResourceTool(losantClient, { resourceType }, requestParams, listInput, errors);
          } catch (err) {
            responseContent = restToMCPError(err, { resourceType });
          }
          break;
        case 'get':
          try {
            responseContent = await getResourceTool(losantClient, { resourceType, resourceId }, requestParams, listInput, errors);
          } catch (err) {
            responseContent = restToMCPError(err, { resourceType });
          }
          break;
        default:
          responseContent = invalidRequestError({ message: `Unknown operation: ${operation}` });
      }

      if (responseContent.isError) {
        return responseContent;
      }

      return {
        content: responseContent
      };
    };
  }
};
