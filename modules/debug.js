import {MODULE_ID} from "./constants.js"

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(MODULE_ID);
});

export function isDebugging() {
  // noinspection JSUnresolvedFunction,JSUnresolvedVariable
  return game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);
}

export function consoleLog(...args) {
  console.log(MODULE_ID, '|', ...args);
}

export function debugLog(...args) {
  try {
    if (isDebugging()) {
      consoleLog(...args)
    }
  } catch (e) {}
}