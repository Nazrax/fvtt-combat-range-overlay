import {DEFAULT_WEAPON_RANGES, MODULE_ID, PRESSED_KEYS} from "./constants.js"
import ModuleInfoApp from "./moduleInfo.js"

export const overlayVisibility = {
  ALWAYS: 'always',
  HOTKEYS: 'hotkeys',
  NEVER: 'never'
};

export const diagonals = {
  FIVE_TEN_FIVE: "fiveTenFive",
  TEN_FIVE_TEN: "tenFiveTen",
  FIVE: "five",
  TEN: "ten"
}

const settingNames = {
  IS_ACTIVE: 'is-active',
  IC_VISIBILITY: 'ic_visibility',
  OOC_VISIBILITY: 'ooc_visibility',
  SHOW_TURN_ORDER: 'show-turn-order',
  SHOW_POTENTIAL_TARGETS: 'show-potential-targets',
  SHOW_DIFFICULT_TERRAIN: 'show-difficult-terrain',
  SHOW_WALLS: 'show-walls',
  MOVEMENT_ALPHA: 'movement-alpha',
  RANGES: 'ranges',
  DIAGONALS: 'diagonals',
  SHOW_WEAPON_RANGE: "show-weapon-range",
  SPEED_ATTR_PATH: "speed-attr-path",
  INFO_BUTTON: "info-button",
  UPDATE_POSITION_IN_COMBAT: "update-position-in-combat"
};
const hiddenSettings = [settingNames.IS_ACTIVE];
const defaultFalse = [settingNames.IS_ACTIVE, settingNames.SHOW_DIFFICULT_TERRAIN, settingNames.SHOW_WALLS, settingNames.IGNORE_DIFFICULT_TERRAIN];
const ignore = [settingNames.MOVEMENT_ALPHA, settingNames.IC_VISIBILITY, settingNames.OOC_VISIBILITY, settingNames.RANGES, settingNames.DIAGONALS, settingNames.SPEED_ATTR_PATH, settingNames.INFO_BUTTON];

Hooks.once("init", () => {
  game.settings.registerMenu(MODULE_ID, settingNames.INFO_BUTTON, {
    name: `${MODULE_ID}.${settingNames.INFO_BUTTON}`,
    label: `${MODULE_ID}.${settingNames.INFO_BUTTON}`,
    icon: "fas fa-info-circle",
    type: ModuleInfoApp,
    restricted: false
  });

  // noinspection JSUnusedLocalSymbols
  for (const [key, settingName] of Object.entries(settingNames)) {
    if (!ignore.includes(settingName)) {
      game.settings.register(MODULE_ID, settingName, {
        name: `${MODULE_ID}.${settingName}`,
        hint: `${MODULE_ID}.${settingName}-hint`,
        scope: "client",
        config: !hiddenSettings.includes(settingName),
        type: Boolean,
        default: !defaultFalse.includes(settingName),
        onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
      });
    }
  }

  game.settings.register(MODULE_ID, settingNames.MOVEMENT_ALPHA, {
    name: `${MODULE_ID}.${settingNames.MOVEMENT_ALPHA}`,
    hint: `${MODULE_ID}.${settingNames.MOVEMENT_ALPHA}-hint`,
    scope: 'client',
    config: true,
    type: Number,
    default: .1,
    range: {
      min: 0,
      max: 1,
      step: .05
    },
    onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
  });

  game.settings.register(MODULE_ID, settingNames.IC_VISIBILITY, {
    name: `${MODULE_ID}.${settingNames.IC_VISIBILITY}`,
    hint: `${MODULE_ID}.${settingNames.IC_VISIBILITY}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: overlayVisibility.ALWAYS,
    choices: {
      always: `${MODULE_ID}.visibilities.${overlayVisibility.ALWAYS}`,
      hotkeys: `${MODULE_ID}.visibilities.${overlayVisibility.HOTKEYS}`,
      never: `${MODULE_ID}.visibilities.${overlayVisibility.NEVER}`,
    },
    onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
  });

  game.settings.register(MODULE_ID, settingNames.OOC_VISIBILITY, {
    name: `${MODULE_ID}.${settingNames.OOC_VISIBILITY}`,
    hint: `${MODULE_ID}.${settingNames.OOC_VISIBILITY}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: overlayVisibility.NEVER,
    choices: {
      always: `${MODULE_ID}.visibilities.${overlayVisibility.ALWAYS}`,
      hotkeys: `${MODULE_ID}.visibilities.${overlayVisibility.HOTKEYS}`,
      never: `${MODULE_ID}.visibilities.${overlayVisibility.NEVER}`,
    },
    onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
  });

  game.settings.register(MODULE_ID, settingNames.RANGES, {
    name: `${MODULE_ID}.${settingNames.RANGES}`,
    hint: `${MODULE_ID}.${settingNames.RANGES}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: DEFAULT_WEAPON_RANGES,
    onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
  });

  game.settings.register(MODULE_ID, settingNames.DIAGONALS, {
    name: `${MODULE_ID}.${settingNames.DIAGONALS}.name`,
    hint: `${MODULE_ID}.${settingNames.DIAGONALS}.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: diagonals.FIVE_TEN_FIVE,
    choices: {
      fiveTenFive: `${MODULE_ID}.${settingNames.DIAGONALS}.${diagonals.FIVE_TEN_FIVE}`,
      tenFiveTen: `${MODULE_ID}.${settingNames.DIAGONALS}.${diagonals.TEN_FIVE_TEN}`,
      five: `${MODULE_ID}.${settingNames.DIAGONALS}.${diagonals.FIVE}`,
      ten: `${MODULE_ID}.${settingNames.DIAGONALS}.${diagonals.TEN}`,
    },
    onChange: () => { globalThis.combatRangeOverlay.instance.fullRefresh()}
  });

  game.settings.register(MODULE_ID, settingNames.SPEED_ATTR_PATH, {
    name: `${MODULE_ID}.${settingNames.SPEED_ATTR_PATH}`,
    hint: `${MODULE_ID}.${settingNames.SPEED_ATTR_PATH}-hint`,
    scope: 'world',
    config: true,
    type: String,
    default: ""
  });

  game.keybindings.register(MODULE_ID, 'showOverlay', {
    name: `${MODULE_ID}.keybindings.showOverlay.name`,
    hint: `${MODULE_ID}.keybindings.showOverlay.hint`,
    editable: [
      {
        key: 'AltLeft'
      }
    ],
    onDown: () => {
      PRESSED_KEYS.showOverlay = true;
    },
    onUp: () => {
      PRESSED_KEYS.showOverlay = false;
    }
  })

  game.keybindings.register(MODULE_ID, 'quickSettings', {
    name: `${MODULE_ID}.keybindings.quickSettings.name`,
    hint: `${MODULE_ID}.keybindings.quickSettings.hint`,
    editable: [
      {
        key: 'ShiftLeft'
      }
    ],
    onDown: () => {
      PRESSED_KEYS.quickSettings = true;
    },
    onUp: () => {
      PRESSED_KEYS.quickSettings = false;
    }
  })

  game.keybindings.register(MODULE_ID, 'resetMeasureFrom', {
    name: `${MODULE_ID}.keybindings.resetMeasureFrom.name`,
    hint: `${MODULE_ID}.keybindings.resetMeasureFrom.hint`,
    editable: [
      {
        key: 'ControlLeft'
      }
    ],
    onDown: () => {
      PRESSED_KEYS.resetMeasureFrom = true;
    },
    onUp: () => {
      PRESSED_KEYS.resetMeasureFrom = false;
    }
  })
});

export async function setActive(isActive) {
  await game.settings.set(MODULE_ID, settingNames.IS_ACTIVE, isActive);
}

export function isActive() {
  return game.settings.get(MODULE_ID, settingNames.IS_ACTIVE);
}

export function isShowTurnOrder() {
  return game.settings.get(MODULE_ID, settingNames.SHOW_TURN_ORDER);
}

export function isShowPotentialTargets() {
  return game.settings.get(MODULE_ID, settingNames.SHOW_POTENTIAL_TARGETS);
}

export function isShowWalls() {
  return game.settings.get(MODULE_ID, settingNames.SHOW_WALLS);
}

export function isShowDifficultTerrain() {
  return game.settings.get(MODULE_ID, settingNames.SHOW_DIFFICULT_TERRAIN);
}

export function getICVisibility() {
  return game.settings.get(MODULE_ID, settingNames.IC_VISIBILITY);
}

export function getOOCVisibility() {
  return game.settings.get(MODULE_ID, settingNames.OOC_VISIBILITY);
}

export function getMovementAlpha() {
  return game.settings.get(MODULE_ID, settingNames.MOVEMENT_ALPHA);
}

export function getDiagonals() {
  return game.settings.get(MODULE_ID, settingNames.DIAGONALS);
}

export function isHotkeys() {
  return game.settings.get(MODULE_ID, settingNames.HOTKEYS);
}

export function getRanges() {
  return game.settings.get(MODULE_ID, settingNames.RANGES);
}

export function isShowWeaponRange() {
  return game.settings.get(MODULE_ID, settingNames.SHOW_WEAPON_RANGE);
}

export function getSpeedAttrPath() {
  return game.settings.get(MODULE_ID, settingNames.SPEED_ATTR_PATH);
}

export function updatePositionInCombat() {
  return game.settings.get(MODULE_ID.settingNames.UPDATE_POSITION_IN_COMBAT);
}