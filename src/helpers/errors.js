import { ErrorCode } from '@modelcontextprotocol/sdk/types.js'; // eslint-disable-line import/no-unresolved

export const invalidRequestError = ({ message, ...details } = {}) => {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        code: ErrorCode.InvalidRequest,
        message: `MCP error -32600: ${message || 'Invalid request'}`,
        data: { ...details }
      })
    }],
    isError: true
  };
};

export const restToMCPError = (restError, details = {}) => {
  details.statusCode = restError.statusCode;
  return invalidRequestError({ message: restError.error || restError.message, ...details });
  // TODO hopefully in here we can reform an auth error to cause the MCP to try to reauthenticate
  // https://github.com/modelcontextprotocol/typescript-sdk/issues/1294
  // return formatMCPError({ error: 'API request failed', message, statusCode: restError.statusCode, ...details });
};
