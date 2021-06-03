const states = {
    DOWN: 'down',
    UP: 'up'
};

class Keyboard {
    constructor() {
        this._keyStates = new Map();
    }

    isDown(key) {
        return this._keyStates.has(key) && this._keyStates.get(key) === states.DOWN;
    }

    _keyDownListener(event) {
        this._keyStates.set(event.key, states.DOWN);
    }

    _keyUpListener(event) {
        this._keyStates.set(event.key, states.UP);
    }
}

export const keyboard = new Keyboard();

document.addEventListener('keydown', keyboard._keyDownListener.bind(keyboard));
document.addEventListener('keyup', keyboard._keyUpListener.bind(keyboard));