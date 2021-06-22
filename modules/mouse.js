import {MODULE_NAME} from "./constants.js"

const states = {
    DOWN: 'down',
    UP: 'up'
};

class Mouse {
  constructor() {
    this._leftDrag = false;
    this._hooks = []
  }

  addHook(func) {
      this._hooks.push(func);
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
    console.log("Drag Drop");
    this._leftDrag = false;
    this._executeHooks(false);
    return wrapped(...args);
  }

  _dragCancelWrapper(wrapped, ...args) {
    console.log("Drag Cancel");
    this._leftDrag = false;
    this._executeHooks(false);
    return wrapped(...args);
  }
}

export const mouse = new Mouse();


Hooks.on("libWrapper.Ready", () => {
  libWrapper.ignore_conflicts(MODULE_NAME, ['drag-ruler', 'enhanced-terrain-layer'], ['Token.prototype._onDragLeftStart', 'Token.prototype._onDragLeftDrop', 'Token.prototype._onDragLeftCancel'])

  libWrapper.register(MODULE_NAME, 'Token.prototype._onDragLeftStart', mouse._dragStartWrapper.bind(mouse), 'WRAPPER');
  libWrapper.register(MODULE_NAME, 'Token.prototype._onDragLeftDrop', mouse._dragDropWrapper.bind(mouse), 'WRAPPER');
  libWrapper.register(MODULE_NAME, 'Token.prototype._onDragLeftCancel', mouse._dragCancelWrapper.bind(mouse), 'WRAPPER');
})
