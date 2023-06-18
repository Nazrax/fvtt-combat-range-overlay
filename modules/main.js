import {mouse} from "./mouse.js";

import './debug.js';
import './settings.js';
import './controls.js';
import './tokenInfo.js';
import {Overlay} from "./overlay.js"
import {debugLog} from "./debug.js"

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
    roundNumericMovementCost: true
  };
  instance.registerHooks();
  mouse.addHook(instance.dragHandler.bind(instance))
  window.addEventListener("keydown", instance.altKeyHandler.bind(instance));
  window.addEventListener("keyup", instance.altKeyHandler.bind(instance));
});

Hooks.on("hoverToken", (token, hovering) =>{
  if (hovering) {
    debugLog("Hovering over", token.id, token.x, token.y);
  }
})


