import { z } from 'zod';
import conf from '../../config.js';

const RESOURCE_URI = 'ui://losant/flow-view';
const apiUrl = conf.get('losant.apiUrl');

// ========================================
// TOOL - Flow View MCP App (spike)
// ========================================
export default {
  name: 'losant_flow_view',
  inputInfo: {
    title: 'View Losant Flow (MCP App)',
    description: 'Opens an interactive widget showing a flow\'s nodes/triggers, a live debug feed, and a control to press a virtual button. SPIKE: no error handling, no validation.',
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'Application ID.' },
        flowId: { type: 'string', description: 'Flow ID.' }
      },
      required: ['applicationId', 'flowId']
    }),
    // _meta must live on the tool definition (registerTool's config), not the per-call result -
    // this is what tells the host "calling this tool renders a UI resource". Both the nested
    // `ui.resourceUri` and flat `ui/resourceUri` forms are set for broader host compatibility
    // (matches @modelcontextprotocol/ext-apps' own registerAppTool normalization).
    // NOTE: csp does NOT belong here - McpUiToolMeta forbids it (`csp?: never`). CSP belongs on
    // the UI resource's own _meta (see resources/index.js's ui://losant/flow-view registration).
    _meta: {
      'ui': { resourceUri: RESOURCE_URI },
      'ui/resourceUri': RESOURCE_URI
    }
  },
  runnerFactory: (losantClient) => {
    return async ({ applicationId, flowId }) => {
      const flow = await losantClient.flow.get({ applicationId, flowId });
      const token = losantClient.getOption('accessToken');

      return {
        content: [{ type: 'text', text: JSON.stringify(flow, null, 2) }],
        structuredContent: {
          applicationId,
          flowId,
          triggers: flow.triggers,
          nodes: flow.nodes,
          debugUrl: `${apiUrl}/applications/${applicationId}/flows/${flowId}/debug?filter=develop&useExtendedJson=true`,
          token
        }
      };
    };
  }
};
