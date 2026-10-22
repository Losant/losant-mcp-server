import { ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';

export const invalidRequestError = ({ message, ...details } = {}) => {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        code: ProtocolErrorCode.InvalidRequest,
        message: `MCP error -32600: ${message || 'Invalid request'}`,
        data: { ...details }
      })
    }],
    isError: true
  };
};

// For `registerResource`/`ResourceTemplate` read handlers, not tool runners - resources/read
// errors aren't wrapped in a tool-call result, they're thrown and converted by the SDK into a
// JSON-RPC error response. ProtocolError carries `data` as a field separate from `message` (same
// split invalidRequestError gives tools), so a hint can be read by the client without parsing it
// out of the message string.
export const resourceNotFoundError = (message, data) => {
  return new ProtocolError(ProtocolErrorCode.InvalidParams, message, data);
};

export const restToMCPError = (restError, details = {}) => {
  details.statusCode = restError.statusCode;
  return invalidRequestError({ message: restError.error || restError.message, ...details });
  // TODO hopefully in here we can reform an auth error to cause the MCP to try to reauthenticate
  // https://github.com/modelcontextprotocol/typescript-sdk/issues/1294
  // return formatMCPError({ error: 'API request failed', message, statusCode: restError.statusCode, ...details });
};
