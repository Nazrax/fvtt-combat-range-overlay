import {MODULE_NAME} from "./constants.js"

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  console.log("Registering debug flag", MODULE_NAME);
  registerPackageDebugFlag(MODULE_NAME);
});

export function isDebugging() {
  // noinspection JSUnresolvedFunction,JSUnresolvedVariable
  return game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_NAME);
}

export function consoleLog(...args) {
  console.log(MODULE_NAME, '|', ...args);
}

export function debugLog(...args) {
  try {
    if (isDebugging()) {
      consoleLog(...args)
    }
  } catch (e) {}
}