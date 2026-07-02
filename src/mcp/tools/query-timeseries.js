import { z } from 'zod';
import debug from 'debug';
import { isEmpty } from 'omnibelt';
import { restToMCPError, invalidRequestError } from '../../helpers/errors.js';
const log = debug('losant-mcp-server:tools:query-timeseries');

const makeDataReq = async (client, name, params) => {
  try {
    const response = await client.data[name]({ _links: false, _actions: false, _embedded: false, ...params });
    const responseContent = [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }];
    if (isEmpty(response)) {
      responseContent.push({
        type: 'text',
        text: 'No data found for this query, that could mean no data was reported for that time range, or no devices matched the query.'
      });
    }
    return {
      content: responseContent
    };
  } catch (error) {
    return restToMCPError(error);
  }
};

const makeDeviceReq = async (client, name, params) => {
  try {
    const response = await client.device[name]({ _links: false, _actions: false, _embedded: false, ...params });
    const responseContent = [{
      type: 'text',
      text: JSON.stringify(response, null, 2)
    }];
    if (isEmpty(response)) {
      responseContent.push({
        type: 'text',
        text: 'No data found for this query, that could mean no data was reported for that time range, or no devices matched the query.'
      });
    }
    return {
      content: responseContent
    };
  } catch (error) {
    return restToMCPError(error);
  }
};

// ========================================
// TOOL - Timeseries Data Query Tool
// ========================================
export default {
  name: 'losant_timeseries',
  inputInfo:  {
    title: 'Query Losant Timeseries Data',
    description: "Query device attribute timeseries data, state history, commands, and logs. PROCEDURE: Use this tool to retrieve actual data FROM devices (not device metadata). If device name is provided but deviceId is unknown, first use losant_query to find the device and extract its 'id' field. OPERATION SELECTION: Use 'timeSeriesQuery' or 'lastValueQuery' for multi-device/multi-attribute queries across many devices. Use device-specific operations ('getState', 'getCompositeState', 'getCommand', 'getLogEntries') when querying a single named device. Check losant://docs/data and losant://docs/device for parameter details.",
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['timeSeriesQuery', 'lastValueQuery', 'getState', 'getCompositeState', 'getCommand', 'getLogEntries'],
          description: 'Timeseries operation to perform. timeSeriesQuery/lastValueQuery: multi-device queries. getState/getCompositeState/getCommand/getLogEntries: single-device queries.'
        },
        applicationId: {
          type: 'string',
          description: 'Application ID (24-character hex string). Required for all operations. Get this by querying resourceType=\'application\' with losant_query tool.'
        },
        query: {
          type: 'object',
          description: 'Query object for timeSeriesQuery/lastValueQuery operations. For timeSeriesQuery: contains deviceIds/deviceTags, attributes (array), time range, aggregation settings. For lastValueQuery: contains deviceIds/deviceTags and attribute (singular string, not array). See losant://docs/data for schema details.'
        },
        deviceId: {
          type: 'string',
          description: 'Device ID (24-character hex string). Required for device-specific operations (getState, getCompositeState, getCommand, getLogEntries). If device name is known but not ID, use losant_query to find it first.'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of entries to return (getState, getCommand, getLogEntries). Default: 1'
        },
        start: {
          type: 'string',
          description: 'Start of time range in milliseconds since epoch (all operations support this)'
        },
        end: {
          type: 'string',
          description: 'End of time range in milliseconds since epoch (all operations support this). 0 means now.'
        },
        duration: {
          type: 'string',
          description: 'Duration of time range in milliseconds (alternative to start/end for getState, getCommand, getLogEntries)'
        },
        sortDirection: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction by time (getState, getCommand, getLogEntries). Default: desc'
        },
        attributes: {
          type: 'string',
          description: 'Comma-separated list of attributes to include (getCompositeState). When not provided, returns all attributes.'
        }
      },
      required: ['operation', 'applicationId']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({ operation, applicationId, ...input }) => {
      const requestParams = { applicationId };
      log('Query Tool called with parameters:', { operation, applicationId, ...input });
      const errors = [];
      let responseContent;

      switch (operation) {
        case 'timeSeriesQuery':
        case 'lastValueQuery':
          if (!input.query) {
            errors.push({
              fieldName: 'query',
              details: `The operation '${operation}' requires a query object containing deviceIds/deviceTags, attributes, and time range. See losant://docs/data for query schema.`
            });
          }
          [ 'deviceId', 'limit', 'start', 'end', 'duration', 'sortDirection', 'attributes' ].forEach((param) => {
            if (input[param] !== undefined) {
              errors.push({ fieldName: param, details: `The '${operation}' operation does not support the '${param}' parameter. The '${param}' parameter is only for device-specific operations (getState, getCompositeState, getCommand, getLogEntries).` });
            }
          });
          if (errors.length) {
            return invalidRequestError({ message: 'Tool input validation failed', errors });
          }
          responseContent = await makeDataReq(losantClient, operation, {
            applicationId,
            query: input.query
          });
          break;

        case 'getState':
        case 'getCommand':
        case 'getLogEntries':
          if (input.query) {
            errors.push({ fieldName: 'query', details: `The '${operation}' operation does not support the 'query' parameter. The 'query' parameter is only for timeSeriesQuery and lastValueQuery operations.` });
          }
          if (!input.deviceId) {
            errors.push({
              fieldName: 'deviceId',
              details: `The operation '${operation}' requires a deviceId parameter to specify which device to query. If you only have the device name, use the losant_query tool to find the device and extract its 'id' field to use as deviceId.`
            });
          }
          if (input.limit !== undefined && input.limit <= 0) {
            errors.push({ fieldName: 'limit', details: 'The \'limit\' parameter must be a positive integer.' });
          } else if (input.limit) {
            requestParams.limit = input.limit;
          }
          if (errors.length) {
            return invalidRequestError({ message: 'Tool input validation failed', errors });
          }
          requestParams.deviceId = input.deviceId;
          if (input.start !== undefined) { requestParams.start = input.start; }
          if (input.end !== undefined) { requestParams.end = input.end; }
          if (input.duration !== undefined) { requestParams.duration = input.duration; }
          if (input.sortDirection) { requestParams.sortDirection = input.sortDirection; }
          responseContent = await makeDeviceReq(losantClient, operation, requestParams);
          break;

        case 'getCompositeState':
          if (input.query) {
            errors.push({ fieldName: 'query', details: `The '${operation}' operation does not support the 'query' parameter. The 'query' parameter is only for timeSeriesQuery and lastValueQuery operations.` });
          }
          if (!input.deviceId) {
            errors.push({
              fieldName: 'deviceId',
              details: `The operation '${operation}' requires a deviceId parameter to specify which device to query. If you only have the device name, use the losant_query tool to find the device and extract its 'id' field to use as deviceId.`
            });
          }
          [ 'limit', 'duration', 'sortDirection' ].forEach((param) => {
            if (input[param] !== undefined) {
              errors.push({ fieldName: param, details: `The '${operation}' operation does not support the '${param}' parameter. The '${param}' parameter is only for getState, getCommand, and getLogEntries operations.` });
            }
          });
          if (errors.length) {
            return invalidRequestError({ message: 'Tool input validation failed', errors });
          }
          requestParams.deviceId = input.deviceId;
          if (input.start !== undefined) { requestParams.start = input.start; }
          if (input.end !== undefined) { requestParams.end = input.end; }
          if (input.attributes) { requestParams.attributes = input.attributes; }
          responseContent = await makeDeviceReq(losantClient, operation, requestParams);
          break;

        default:
          return invalidRequestError({
            message: `Unknown operation: ${operation}`
          });
      }

      return responseContent;
    };
  }
};
