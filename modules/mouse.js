import {MODULE_ID} from "./constants.js"
import {debugLog} from "./debug.js"

/*
const states = {
    DOWN: 'down',
    UP: 'up'
};
*/

class Mouse {
  constructor() {
    this._leftDrag = false;
    this._hooks = []
  }

  addHook(func) {
      this._hooks.push(func);
  }

  clearHooks() {
    this._hooks = []
  }

  isLeftDrag() {
    return this._leftDrag;
  }

  _executeHooks(dragging) {
    for (const func of this._hooks) {
      func(dragging);
    }
  }

  _dragStartWrapper(wrapped, ...args) {
    this._leftDrag = true;
    this._executeHooks(true);
    return wrapped(...args);
  }

  _dragDropWrapper(wrapped, ...args) {
    debugLog(false, "Drag Drop");
    this._leftDrag = false;
    this._executeHooks(false);
    return wrapped(...args);
  }

  _dragCancelWrapper(wrapped, ...args) {
    debugLog(false, "Drag Cancel");
    this._leftDrag = false;
    this._executeHooks(false);
    return wrapped(...args);
  }
}

export const mouse = new Mouse();

Hooks.once("libWrapper.Ready", () => {
  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  libWrapper.ignore_conflicts(MODULE_ID, ['drag-ruler', 'enhanced-terrain-layer'], ['Token.prototype._onDragLeftStart', 'Token.prototype._onDragLeftDrop', 'Token.prototype._onDragLeftCancel'])

  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftStart', mouse._dragStartWrapper.bind(mouse), 'WRAPPER');

  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftDrop', mouse._dragDropWrapper.bind(mouse), 'WRAPPER');

  // noinspection JSUnresolvedVariable,JSUnresolvedFunction
  libWrapper.register(MODULE_ID, 'Token.prototype._onDragLeftCancel', mouse._dragCancelWrapper.bind(mouse), 'WRAPPER');
})
