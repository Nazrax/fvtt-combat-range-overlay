import {getCurrentToken, getWeaponRanges, uiNotificationsWarn} from "./utility.js"
import {keyboard} from "./keyboard.js";
import {TokenInfo} from "./tokenInfo.js";
import * as Settings from "./settings.js";
import {MODULE_ID} from "./constants.js"
import {debugLog} from "./debug.js"

const TOGGLE_BUTTON = "combatRangeOverlayButton";

// noinspection JSUnusedLocalSymbols
async function _submitDialog(i, html) {
  debugLog("_submitDialog", i, html);
  const updateActor = html.find("[name=update-actor]")[0]?.checked;
  await TokenInfo.current.setWeaponRange(i, updateActor);
}

function _showRangeDialog() {
  const buttons = Object.fromEntries(getWeaponRanges().map((i) => [i, {label: i, callback: (html) => _submitDialog(i, html)}]));

  const content = [];
  if (game.user.isGM) {
    content.push(`<p>${game.i18n.localize(`${MODULE_ID}.quick-settings.update-actor-checkbox`)} <input name="update-actor" type="checkbox"/></td></tr></table></p>`);
  }
  content.push(`<p>${game.i18n.localize(`${MODULE_ID}.quick-settings.weapon-range-header`)}</p>`);

  let d = new Dialog({
    title: game.i18n.localize(`${MODULE_ID}.quick-settings.title`),
    content: content.join("\n"),
    buttons
  }, {id: "croQuickSettingsDialog"});
  d.render(true);
}

async function _toggleButtonClick(toggled, controls) {
  let isActive = Settings.isActive()

  if (keyboard.isDown("Shift")) {  // Pop quick settings
    let token = getCurrentToken();
    if (!token) {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.controls.cant-open-no-selected-token`));
    } else {
      // Assume we want to activate if the user is opening the dialog
      isActive = true;

      _showRangeDialog();
    }
  } else if (keyboard.isDown("Control")) { // Reset measureFrom
    let token = getCurrentToken();
    if (!token) {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.controls.cant-reset-no-token`));
    } else {
      TokenInfo.current.updateMeasureFrom();
      globalThis.combatRangeOverlay.instance.fullRefresh();
    }
  } else {
    isActive = toggled;
    if (toggled) {
      globalThis.combatRangeOverlay.instance.justActivated = true;
    }
  }

  // Ensure button matches active state
  // We _must_ set .active _before_ using await or the button will be drawn and we'll be too late
  controls.find(group => group.name === "token").tools.find(t => t.name === TOGGLE_BUTTON).active = isActive;
  await Settings.setActive(isActive);
}

let toggleButton;
Hooks.on('getSceneControlButtons', (controls) => {
  if (!toggleButton) {
    toggleButton = {
      name: TOGGLE_BUTTON,
      title: `${MODULE_ID}.controlButton`,
      icon: "fas fa-people-arrows",
      toggle: true,
      active: Settings.isActive(),
      onClick: (toggled) => _toggleButtonClick(toggled, controls),
      visible: true,  // TODO: Figure out how to disable this from Settings
    }
  }

  const tokenControls = controls.find(group => group.name === "token").tools
  tokenControls.push(toggleButton);
});