import queryResourcesTool from './query-resources.js';
import queryTimeseriesTool from './query-timeseries.js';
import writeResourcesTool from './write-resources.js';
import deleteResourcesTool from './delete-resources.js';
import flowDiagnosticsTool from './flow-diagnostics.js';
import flowViewTool from './flow-view.js';
import flowPressVirtualButtonTool from './flow-press-virtual-button.js';

const tools = [queryResourcesTool, queryTimeseriesTool, writeResourcesTool, deleteResourcesTool, flowDiagnosticsTool, flowViewTool, flowPressVirtualButtonTool];

const applyDefaultAnnotations = (inputInfo, name) => {
  inputInfo.annotations = {
    title: name,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    ...(inputInfo.annotations || {}),
    openWorldHint: false // All tools only talk to Losant
  };
};

/**
 * Register MCP tools with losant-rest client
 * @param {Object} server - MCP server instance
 * @param {Object} losantClient - Losant REST API client bound to a bearer token
 */
export default (server, losantClient) => {
  tools.forEach(({ name, inputInfo, runnerFactory }) => {
    // Create runner bound to this client
    const runner = runnerFactory(losantClient);
    applyDefaultAnnotations(inputInfo, name);
    server.registerTool(name, inputInfo, runner);
  });
};
