import {MODULE_ID} from "./constants.js"

const colorSettingNames = [
    'no-action',
    'one-action',
    'two-actions',
    'three-actions',
    'four-actions',
    'weapon-one',
    'weapon-two',
    'weapon-three'
]

const defaultColors = [0xffffff, 0x0000ff, 0xffff00, 0xff0000, 0x800080, 0xffffff, 0x0000ff, 0xffff00]

Hooks.once("init", () => {
    if (game.modules.get('colorsettings') && game.modules.get('colorsettings')?.active) {
        for (const [index, colorSettingName] of colorSettingNames.entries()) {
            new window.Ardittristan.ColorSetting(MODULE_ID, colorSettingName, {
                name: `${MODULE_ID}.color-picker.${colorSettingName}.name`,
                hint: `${MODULE_ID}.color-picker.${colorSettingName}.hint`,
                label: 'color-picker.label',
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
                label: 'color-picker.label',
                restricted: false,
                defaultColor: `${defaultColors[index]}`,
                scope: "client",
                onChange: () => {globalThis.combatRangeOverlay.instance.fullRefresh()}
            })
        }
    }
})