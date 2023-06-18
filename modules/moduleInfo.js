import {MODULE_ID} from "./constants.js"

export default class ModuleInfoApp extends FormApplication {
  constructor(options={}) {
    super(options);
  }

  static get defaultOptions() {
    // noinspection JSUnresolvedFunction
    return mergeObject(super.defaultOptions, {
      id: "combat-range-overlay-info",
      title: `${MODULE_ID}.info.title`,
      template: `modules/${MODULE_ID}/templates/info.hbs`,
      popOut: true,
      width: 500,
      height: 700
    });
  }

  // noinspection JSCheckFunctionSignatures
  getData() {
    return {
      version: game.modules.get(MODULE_ID).data.version
    }
  }

  async _updateObject(event, formData) {
  }
}