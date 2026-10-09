import { z } from 'zod';

// ========================================
// TOOL - Press Virtual Button (spike, bare passthrough)
// ========================================
export default {
  name: 'losant_flow_press_virtual_button',
  inputInfo: {
    annotations: {
      readOnlyHint: false,
      idempotentHint: false,
      destructiveHint: false
    },
    title: 'Press Losant Flow Virtual Button',
    description: 'Presses a virtual button trigger on a flow to fire a test run. SPIKE: bare passthrough to the API, no validation that the key matches a real trigger.',
    inputSchema: z.fromJSONSchema({
      type: 'object',
      properties: {
        applicationId: { type: 'string', description: 'Application ID.' },
        flowId: { type: 'string', description: 'Flow ID.' },
        key: { type: 'string', description: 'The virtualButton trigger\'s key (from the flow\'s triggers array).' },
        payload: { type: 'object', description: 'Optional payload to send as the trigger\'s data.' }
      },
      required: ['applicationId', 'flowId', 'key']
    })
  },
  runnerFactory: (losantClient) => {
    return async ({ applicationId, flowId, key, payload }) => {
      const result = await losantClient.flow.pressVirtualButton({ applicationId, flowId, button: { key, payload } });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    };
  }
};
