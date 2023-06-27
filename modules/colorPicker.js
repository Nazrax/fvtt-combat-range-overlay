import {MODULE_ID} from "./constants.js"

export const colorSettingNames = [
    'no-actions',
    'one-action',
    'two-actions',
    'three-actions',
    'four-actions',
    'weapon-one',
    'weapon-two',
    'weapon-three'
]

const defaultColors = ["#ffffff", "#0000ff", "#ffff00", "#ff0000", "#800080", "#ffffff", "#0000ff", "#ffff00"]

Hooks.once("init", () => {
    if (game.modules.get('colorsettings') && game.modules.get('colorsettings')?.active) {
        for (const [index, colorSettingName] of colorSettingNames.entries()) {
            new window.Ardittristan.ColorSetting(MODULE_ID, colorSettingName, {
                name: `${MODULE_ID}.color-picker.${colorSettingName}.name`,
                hint: `${MODULE_ID}.color-picker.${colorSettingName}.hint`,
                label: `${MODULE_ID}.color-picker.label`,
                restricted: false,
                defaultColor: `${defaultColors[index]}`,
                scope: "client",
                onChange: () => {globalThis.combatRangeOverlay.instance.fullRefresh()}
            })
        }
    } else {
        ui.notifications.notify(`${MODULE_ID}.no-color-settings`);
        for (const [index, colorSettingName] of colorSettingNames.entries()) {
            game.settings.register(MODULE_ID, colorSettingName, {
                name: `${MODULE_ID}.color-picker.${colorSettingName}.name`,
                hint: `${MODULE_ID}.color-picker.${colorSettingName}.hint`,
                label: `${MODULE_ID}.color-picker.label`,
                restricted: false,
                defaultColor: `${defaultColors[index]}`,
                scope: "client",
                onChange: () => {globalThis.combatRangeOverlay.instance.fullRefresh()}
            })
        }
    }
})