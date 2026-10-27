import deleteToolGuide from './delete-tool-guide.js';
import flowDiagnosticsToolGuide from './flow-diagnostics-tool-guide.js';
import flowDebugListenerToolGuide from './flow-debug-listener-tool-guide.js';
import queryToolGuide from './query-tool-guide.js';
import writeToolGuide from './write-tool-guide.js';

// Every tool guide, in the order they are registered and listed in losant://info.
// Kept in its own module so build-api-index-content.js can generate the index entries without
// importing resources/index.js, which imports the index content back.
export default [
  queryToolGuide,
  writeToolGuide,
  deleteToolGuide,
  flowDiagnosticsToolGuide,
  flowDebugListenerToolGuide
];
