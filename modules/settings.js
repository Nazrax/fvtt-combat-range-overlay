import {MODULE_NAME} from "./constants.js"
import {MovementPlanner} from "./movementPlanner.js"

const settingNames = {
  IS_ACTIVE: 'is-active',
  ALWAYS_SHOW: 'always-show',
  SHOW_TURN_ORDER: 'show-turn-order',
  SHOW_POTENTIAL_TARGETS: 'show-potential-targets',
  SHOW_DIFFICULT_TERRAIN: 'show-difficult-terrain',
  SHOW_WALLS: 'show-walls',
  MOVEMENT_ALPHA: 'movement-alpha'
};
const hiddenSettings = [settingNames.IS_ACTIVE];
const defaultFalse = [settingNames.IS_ACTIVE, settingNames.SHOW_DIFFICULT_TERRAIN, settingNames.SHOW_WALLS, settingNames.ALWAYS_SHOW];
const ignore = [settingNames.MOVEMENT_ALPHA];

Hooks.once("init", () => {
  for (const [key, settingName] of Object.entries(settingNames)) {
    if (!ignore.includes(settingName)) {
      console.log(`Registering setting ${MODULE_NAME}/${settingName}`)
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
  })
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

export function isAlwaysShow() {
  return game.settings.get(MODULE_NAME, settingNames.ALWAYS_SHOW);
}

export function getMovementAlpha() {
  return game.settings.get(MODULE_NAME, settingNames.MOVEMENT_ALPHA);
}
