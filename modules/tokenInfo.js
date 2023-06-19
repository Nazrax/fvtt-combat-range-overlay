import {DEFAULT_WEAPON_RANGE, FLAG_NAMES, MODULE_ID} from "./constants.js"
import {canvasTokensGet, getCurrentToken, uiNotificationsWarn} from "./utility.js"
import {debugLog} from "./debug.js"
import {getSpeedAttrPath, updatePositionInCombat} from "./settings.js"

export class TokenInfo {
  static _tokenInfoMap = new Map();

  static resetMap() {
    TokenInfo._tokenInfoMap = new Map();
  }

  constructor(tokenId) {
    this.tokenId = tokenId;
    this.token = canvasTokensGet(this.tokenId);
    this.measureFrom = undefined;
    this.location = undefined;

    this.updateLocation();
    this.updateMeasureFrom();

    TokenInfo._tokenInfoMap.set(tokenId, this);
  }

  updateLocation(updateData) {
    this.location  = {
      x: updateData?.x ?? this.token.x,
      y: updateData?.y ?? this.token.y
    };
  }

  updateMeasureFrom(updateData) {
    this.measureFrom = {
      x: updateData?.x ?? this.token.x,
      y: updateData?.y ?? this.token.y
    };
  }

  static get current() {
    if (getCurrentToken() !== undefined) {
      return TokenInfo.getById(getCurrentToken().id);
    } else {
      return undefined;
    }
  }

  static getById(tokenId) {
    let ti = TokenInfo._tokenInfoMap.get(tokenId);
    if (!ti) {
      ti = new TokenInfo(tokenId);
      TokenInfo._tokenInfoMap.set(tokenId, ti);
    }
    return ti;
  }

  getFlag(flagName, dflt=undefined) {
    // Somehow unlinked tokens get their own copies of actors (they even share IDs) but which have their own flags
    const baseActor = game.actors.get(this.token.actor.id);

    // Idea is being stupid - this isn't actually deprecated
    // noinspection JSDeprecatedSymbols
    return this.token.document.getFlag(MODULE_ID, flagName) ??
      baseActor.getFlag(MODULE_ID, flagName) ??
      dflt;
  }

   get weaponRange() {
    const weapons = this.token.actor.items.filter(i => i.type == 'weapon' && i.isEquipped);
    const baseReach = this.token.actor.system.attributes.reach.base
    let range = []
    for (const weapon of weapons) {
      const hasReach = weapon.system.traits.value.includes('reach')
      if (weapon.system.traits.value.includes('combination')) {
        hasReach ? range.push(baseReach + DEFAULT_WEAPON_RANGE) : range.push(DEFAULT_WEAPON_RANGE);
        range.push(weapon.rangeIncrement);
      } else if (weapon.isRanged || weapon.isThrown) {
        range.push(weapon.rangeIncrement);
      } else hasReach ? range.push(baseReach + DEFAULT_WEAPON_RANGE) : range.push(DEFAULT_WEAPON_RANGE);
    }
    return range;
  }

  get speedOverride() {
    return this.getFlag(FLAG_NAMES.SPEED_OVERRIDE);
  }

  get isIgnoreDifficultTerrain() {
    return this.getFlag(FLAG_NAMES.IGNORE_DIFFICULT_TERRAIN);
  }

  async setFlag(flagName, newValue, updateActor) {
    debugLog("setFlag", flagName, newValue, updateActor);

    // Somehow unlinked tokens get their own copies of actors (they even share IDs) but which have their own flags
    const baseActor = game.actors.get(this.token.actor.id);

    // Idea is being stupid - it's looking up the deprecated versions of the methods
    if (updateActor) {
      // noinspection JSDeprecatedSymbols
      await this.token.document.unsetFlag(MODULE_ID, flagName);
      // noinspection JSDeprecatedSymbols
      await baseActor.setFlag(MODULE_ID, flagName, newValue);
    } else {
      // noinspection JSDeprecatedSymbols
      await this.token.document.setFlag(MODULE_ID, flagName, newValue);
    }
  }

  async setWeaponRange(range, updateActor=false) {
    await this.setFlag(FLAG_NAMES.WEAPON_RANGE, range, updateActor);
  }

  async setSpeedOverride(speed, updateActor=false) {
    await this.setFlag(FLAG_NAMES.SPEED_OVERRIDE, speed, updateActor);
  }

  async setIgnoreDifficultTerrain(isIgnore, updateActor=false) {
    await this.setFlag(FLAG_NAMES.IGNORE_DIFFICULT_TERRAIN, isIgnore, updateActor);
  }

  get speed() {
    const actor = this.token.actor;
    if (!actor) {
      throw("Tried to call getSpeed with an undefined actor");
    }

    if (this.speedOverride) {
      return this.speedOverride;
    } else if (getSpeedAttrPath()) {
      // noinspection JSCheckFunctionSignatures,JSUnresolvedVariable
      return foundry.utils.getProperty(actor.data, getSpeedAttrPath());
    } else {
      return this.getSpeedFromAttributes()
    }
  }

  getSpeedFromAttributes() {
    const actor = this.token.actor;
    const actorAttrs = actor.system.attributes;

    let speed = 0;
    let otherSpeeds = [];
    if (game.system.id === "pf1" || game.system.id === "D35E") {
      otherSpeeds = Object.entries(otherSpeeds = actorAttrs.speed).map(s => s[1].total);
    } else if (game.system.id === "pf2e") {
      speed = actorAttrs.speed.total;
      // noinspection JSUnresolvedVariable
      otherSpeeds = actorAttrs.speed.otherSpeeds.map(s => s.total);
    } else if (game.system.id === "dnd5e") {
      otherSpeeds = Object.entries(actorAttrs.movement).filter(s => typeof(s[1]) === "number").map(s => s[1]);
    }

    otherSpeeds.forEach(otherSpeed => {
      if (otherSpeed > speed) {
        speed = otherSpeed;
      }
    })

    debugLog("getSpeedFromAttributes()", game.system.id, otherSpeeds, speed);

    return speed;
  }
}

function updateMeasureFrom(token, updateData) {
  const tokenId = token.id;
  const tokenInfo = TokenInfo.getById(tokenId);
  tokenInfo.updateMeasureFrom(updateData);
}

function updateLocation(token, updateData) {
  const tokenId = token.id;
  const tokenInfo = TokenInfo.getById(tokenId);
  tokenInfo.updateLocation(updateData);
}

// noinspection JSUnusedLocalSymbols
Hooks.on("createCombatant", (combatant, options, someId) => {
  const token = canvasTokensGet(combatant.token.id);
  updateMeasureFrom(token);
  globalThis.combatRangeOverlay.instance.fullRefresh();
});

// noinspection JSUnusedLocalSymbols
Hooks.on("deleteCombatant", (combatant, options, someId) => {
  const token = canvasTokensGet(combatant.token.id);
  updateMeasureFrom(token);
  globalThis.combatRangeOverlay.instance.fullRefresh();
});


// noinspection JSUnusedLocalSymbols
Hooks.on("updateCombat", (combat, turnInfo, diff, someId) => {
  if (combat?.previous?.tokenId) {
    const token = canvasTokensGet(combat.previous.tokenId);
    updateMeasureFrom(token);
  }
  globalThis.combatRangeOverlay.instance.fullRefresh();
});

// noinspection JSUnusedLocalSymbols
Hooks.on("updateToken", (tokenDocument, updateData, options, someId) => {
  const tokenId = tokenDocument.id;
  const realToken = canvasTokensGet(tokenId); // Get the real token
  updateLocation(realToken, updateData);
  if (!realToken.inCombat || updatePositionInCombat()) {
    updateMeasureFrom(realToken, updateData);
  }
  globalThis.combatRangeOverlay.instance.fullRefresh();
});

Hooks.on("controlToken", (token, boolFlag) => {
  if (boolFlag && TokenInfo.current.speed === 0 && TokenInfo.current.getSpeedFromAttributes() === 0) {
    if (game.user.isGM) {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.token-speed-warning-gm`));
    } else {
      uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.token-speed-warning-player`));
    }
  }
})
