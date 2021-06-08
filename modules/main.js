import {FLAG_NAMES, MODULE_NAME} from "./constants.js"
import {getCurrentToken, getWeaponRanges} from "./utility.js";
import {keyboard} from "./keyboard.js";
import {mouse} from "./mouse.js";

import './settings.js';
import './controls.js';
import './tokenInfo.js';
import {MovementPlanner} from "./movementPlanner.js"

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
  console.log("This code runs once core initialization is ready and game data is available.");

  const instance = new MovementPlanner()
  globalThis.movementPlanner = {
    instance
  };
  instance.registerHooks();
  keyboard.addHook("Alt", instance.altKeyHandler.bind(instance));
  mouse.addHook(instance.dragHandler.bind(instance))
});

Hooks.on("hoverToken", (token, hovering) =>{
  if (hovering) {
    console.log("Hovering over", token.id, token.x, token.y);
  }
})


