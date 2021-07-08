import {DEFAULT_WEAPON_RANGES, MODULE_NAME} from "./constants.js"

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
  DIAGONALS: 'diagonals'
};
const hiddenSettings = [settingNames.IS_ACTIVE];
const defaultFalse = [settingNames.IS_ACTIVE, settingNames.SHOW_DIFFICULT_TERRAIN, settingNames.SHOW_WALLS];
const ignore = [settingNames.MOVEMENT_ALPHA, settingNames.IC_VISIBILITY, settingNames.OOC_VISIBILITY, settingNames.RANGES, settingNames.DIAGONALS];

Hooks.once("init", () => {
  // noinspection JSUnusedLocalSymbols
  for (const [key, settingName] of Object.entries(settingNames)) {
    if (!ignore.includes(settingName)) {
      game.settings.register(MODULE_NAME, settingName, {
        name: `${MODULE_NAME}.${settingName}`,
        hint: `${MODULE_NAME}.${settingName}-hint`,
        scope: "client",
        config: !hiddenSettings.includes(settingName),
        type: Boolean,
        default: !defaultFalse.includes(settingName),
        onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
      });
    }
  }

  game.settings.register(MODULE_NAME, settingNames.MOVEMENT_ALPHA, {
    name: `${MODULE_NAME}.${settingNames.MOVEMENT_ALPHA}`,
    hint: `${MODULE_NAME}.${settingNames.MOVEMENT_ALPHA}-hint`,
    scope: 'client',
    config: true,
    type: Number,
    default: .1,
    range: {
      min: 0,
      max: 1,
      step: .05
    },
    onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
  });

  game.settings.register(MODULE_NAME, settingNames.IC_VISIBILITY, {
    name: `${MODULE_NAME}.${settingNames.IC_VISIBILITY}`,
    hint: `${MODULE_NAME}.${settingNames.IC_VISIBILITY}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: overlayVisibility.ALWAYS,
    choices: {
      always: `${MODULE_NAME}.visibilities.${overlayVisibility.ALWAYS}`,
      hotkeys: `${MODULE_NAME}.visibilities.${overlayVisibility.HOTKEYS}`,
      never: `${MODULE_NAME}.visibilities.${overlayVisibility.NEVER}`,
    },
    onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
  });

  game.settings.register(MODULE_NAME, settingNames.OOC_VISIBILITY, {
    name: `${MODULE_NAME}.${settingNames.OOC_VISIBILITY}`,
    hint: `${MODULE_NAME}.${settingNames.OOC_VISIBILITY}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: overlayVisibility.NEVER,
    choices: {
      always: `${MODULE_NAME}.visibilities.${overlayVisibility.ALWAYS}`,
      hotkeys: `${MODULE_NAME}.visibilities.${overlayVisibility.HOTKEYS}`,
      never: `${MODULE_NAME}.visibilities.${overlayVisibility.NEVER}`,
    },
    onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
  });

  game.settings.register(MODULE_NAME, settingNames.RANGES, {
    name: `${MODULE_NAME}.${settingNames.RANGES}`,
    hint: `${MODULE_NAME}.${settingNames.RANGES}-hint`,
    scope: 'client',
    config: true,
    type: String,
    default: DEFAULT_WEAPON_RANGES,
    onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
  });

  game.settings.register(MODULE_NAME, settingNames.DIAGONALS, {
    name: `${MODULE_NAME}.${settingNames.DIAGONALS}.name`,
    hint: `${MODULE_NAME}.${settingNames.DIAGONALS}.hint`,
    scope: 'world',
    config: true,
    type: String,
    default: overlayVisibility.NEVER,
    choices: {
      fiveTenFive: `${MODULE_NAME}.${settingNames.DIAGONALS}.${diagonals.FIVE_TEN_FIVE}`,
      tenFiveTen: `${MODULE_NAME}.${settingNames.DIAGONALS}.${diagonals.TEN_FIVE_TEN}`,
      five: `${MODULE_NAME}.${settingNames.DIAGONALS}.${diagonals.FIVE}`,
      ten: `${MODULE_NAME}.${settingNames.DIAGONALS}.${diagonals.TEN}`,
    },
    onChange: () => { globalThis.movementPlanner.instance.fullRefresh()}
  });
});

export async function setActive(isActive) {
  await game.settings.set(MODULE_NAME, settingNames.IS_ACTIVE, isActive);
}

export function isActive() {
  return game.settings.get(MODULE_NAME, settingNames.IS_ACTIVE);
}

export function isShowTurnOrder() {
  return game.settings.get(MODULE_NAME, settingNames.SHOW_TURN_ORDER);
}

export function isShowPotentialTargets() {
  return game.settings.get(MODULE_NAME, settingNames.SHOW_POTENTIAL_TARGETS);
}

export function isShowWalls() {
  return game.settings.get(MODULE_NAME, settingNames.SHOW_WALLS);
}

export function isShowDifficultTerrain() {
  return game.settings.get(MODULE_NAME, settingNames.SHOW_DIFFICULT_TERRAIN);
}

export function getICVisibility() {
  return game.settings.get(MODULE_NAME, settingNames.IC_VISIBILITY);
}

export function getOOCVisibility() {
  return game.settings.get(MODULE_NAME, settingNames.OOC_VISIBILITY);
}

export function getMovementAlpha() {
  return game.settings.get(MODULE_NAME, settingNames.MOVEMENT_ALPHA);
}

export function getDiagonals() {
  return game.settings.get(MODULE_NAME, settingNames.DIAGONALS);
}

export function isHotkeys() {
  return game.settings.get(MODULE_NAME, settingNames.HOTKEYS);
}

export function getRanges() {
  return game.settings.get(MODULE_NAME, settingNames.RANGES);
}