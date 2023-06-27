import {mouse} from "./mouse.js";

import './debug.js';
import './settings.js';
import './controls.js';
import './tokenInfo.js';
import {Overlay} from "./overlay.js"
import {debugLog} from "./debug.js"
import {MODULE_ID} from "./constants.js"
import {colorSettingNames} from "./colorPicker.js"

/* Tasks
 * Basic functionality:
 * - Register Hooks for joining combat and ending combat turn to update current measureFrom
 * - Add Hook to draw overlay
 *
 * Enhanced functionality:
 * - Add visibility selection to dialog
 * - Honor visibility selection
 */

Hooks.on("ready", function() {
  const instance = new Overlay()
  globalThis.combatRangeOverlay = {
    instance,
    showNumericMovementCost: false,
    showPathLines: false,
    roundNumericMovementCost: true,
    actionsToShow: 2,
    colorByActions: [],
    colors: []
  };
  instance.registerHooks();
  globalThis.combatRangeOverlay.actionsToShow = game.settings.get(MODULE_ID, 'actions-shown');
  for (let i = 0; i < 5; i++) {
    globalThis.combatRangeOverlay.colorByActions.push(parseInt(game.settings.get(MODULE_ID, colorSettingNames[i]).slice(0, -2).replace("#", "0x"), 16))
  };
  for (let i = 5; i < 8; i++) {
    globalThis.combatRangeOverlay.colors.push(parseInt(game.settings.get(MODULE_ID, colorSettingNames[i]).slice(0, -2).replace("#", "0x"), 16))
  }
  mouse.addHook(instance.dragHandler.bind(instance))
  window.addEventListener("keydown", instance.altKeyHandler.bind(instance));
  window.addEventListener("keyup", instance.altKeyHandler.bind(instance));
});

Hooks.on("hoverToken", (token, hovering) =>{
  if (hovering) {
    debugLog("Hovering over", token.id, token.x, token.y);
  }
})


