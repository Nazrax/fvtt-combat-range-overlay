import {getCurrentToken, getWeaponRanges, uiNotificationsWarn} from "./utility.js"
import {TokenInfo} from "./tokenInfo.js";
import * as Settings from "./settings.js";
import {MODULE_ID, PRESSED_KEYS} from "./constants.js"
import {debugLog} from "./debug.js"

const TOGGLE_BUTTON = "combatRangeOverlayButton";

// noinspection JSUnusedLocalSymbols
async function _submitDialog(i, html) {
  debugLog("_submitDialog", i, html);
  const updateActor = html.find("[name=update-actor]")[0]?.checked;
  const speedOverride = html.find("[name=speed-override]")[0]?.value;
  const ignoreTerrain = html.find("[name=ignore-difficult-terrain]")[0]?.checked;
  await TokenInfo.current.setWeaponRange(i, updateActor);
  await TokenInfo.current.setSpeedOverride(speedOverride, updateActor);
  await TokenInfo.current.setIgnoreDifficultTerrain(ignoreTerrain, updateActor);
}

function _showRangeDialog() {
  const buttons = Object.fromEntries(getWeaponRanges().map((i) => [i, {label: i, callback: (html) => _submitDialog(i, html)}]));
  const resetButton = {icon: '<i class="fas fa-arrow-rotate-left"></i>', label: "Reset", callback: () => _token.document.unsetFlag("combat-range-overlay", "weaponRange")}
  buttons.reset = resetButton;

  const speedOverride = TokenInfo.current.speedOverride ?? "";
  const ignoreDifficultTerrainChecked = TokenInfo.current.ignoreDifficultTerrain ? "checked" : "";
  const content = [];
  if (game.user.isGM) {
    content.push(`<p>${game.i18n.localize(`${MODULE_ID}.quick-settings.update-actor-checkbox`)} <input name="update-actor" type="checkbox"/></p>`);
  }
  content.push(`<p>${game.i18n.localize(`${MODULE_ID}.quick-settings.ignore-difficult-terrain`)} <input name="ignore-difficult-terrain" type="checkbox" ${ignoreDifficultTerrainChecked}/></p>`);
  content.push(`<p>${game.i18n.localize(`${MODULE_ID}.quick-settings.speed-override`)} <input name="speed-override" type="text" value="${speedOverride}" size="3" style="width: 40px" maxlength="3"/>`);
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
  let wasActive = Settings.isActive()

  if (PRESSED_KEYS.quickSettings) {  // Pop quick settings
    let token = getCurrentToken();
    if (!token) {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.controls.cant-open-no-selected-token`));
    } else {
      // Assume we want to activate if the user is opening the dialog
      isActive = true;

      _showRangeDialog();
    }
  } else if (PRESSED_KEYS.resetMeasureFrom) { // Reset measureFrom
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

  if (!wasActive && isActive && TokenInfo.current && TokenInfo.current.speed === 0 && TokenInfo.current.getSpeedFromAttributes() == 0) {
    if (game.user.isGM) {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.token-speed-warning-gm`));
    } else {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.token-speed-warning-player`));
      _showRangeDialog();
    }
  }
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