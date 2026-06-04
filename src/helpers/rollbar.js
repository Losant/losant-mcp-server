import config from '../config.js';
import Rollbar from 'rollbar';
const rollbarKey = config.get('rollbarKey');

let rollbar;
if (rollbarKey) {
  rollbar = new Rollbar({
    accessToken: rollbarKey,
    environment: config.get('env'),
    captureUncaught: false,
    captureUnhandledRejections: false,
    exitOnUncaughtException: false,
    enabled: true,
    verbose: true
  });
} else {
  rollbar = new Rollbar({
    accessToken: '',
    captureUncaught: false,
    captureUnhandledRejections: false,
    exitOnUncaughtException: false,
    enabled: true,
    transmit: false,
    verbose: true
  });
}

// because rollbar doesn't have a 'exitOnUnhandledRejection'
// option so we make our own that is better and handle both
// unhandled exceptions and rejections on our own
// see https://github.com/rollbar/rollbar.js/blob/master/src/server/rollbar.js#L407
// for original source
const handleUncaught = (type) => {
  return (error) => {
    rollbar._uncaughtError(error, (err) => {
      if (rollbar.options.enabled && err) {
        console.error(`Error reporting unhandled ${type} to rollbar:\n`, err);
      }
    }, { custom: { type } });
    setImmediate(() => {
      rollbar.wait(() => {
        console.error(`Exiting on unhandled ${type}:\n`, error);
        process.exit(1);
      });
    });
  };
};

if (process.env.NODE_ENV !== 'test') {
  process.on('uncaughtException', handleUncaught('exception'));
  process.on('unhandledRejection', handleUncaught('rejection'));
  process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning') { return; }
    rollbar.warn('Process warning', warning);
  });
}

export default rollbar;
