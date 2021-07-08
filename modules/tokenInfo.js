import {DEFAULT_WEAPON_RANGE, FLAG_NAMES, MODULE_ID} from "./constants.js"
import {canvasTokensGet, getCurrentToken} from "./utility.js"
import {debugLog} from "./debug.js"

export class TokenInfo {
  static _tokenInfoMap = new Map();

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
    return TokenInfo.getById(getCurrentToken().id);
  }

  static getById(tokenId) {
    let ti = TokenInfo._tokenInfoMap.get(tokenId);
    if (!ti) {
      ti = new TokenInfo(tokenId);
      TokenInfo._tokenInfoMap.set(tokenId, ti);
    }
    return ti;
  }

  get weaponRange() {
    // Idea is being stupid - this isn't actually deprecated
    // noinspection JSDeprecatedSymbols
    return this.token.document.getFlag(MODULE_ID, FLAG_NAMES.WEAPON_RANGE) ?? DEFAULT_WEAPON_RANGE;
  }

  async setWeaponRange(range) {
    // Idea is being stupid - this isn't actually deprecated
    // noinspection JSDeprecatedSymbols
    await this.token.document.setFlag(MODULE_ID, FLAG_NAMES.WEAPON_RANGE, range);
  }

  get speed() {
    const actor = this.token.actor;
    if (!actor) {
      throw("Tried to call getSpeed with an undefined actor");
    }

    const speedAttr = actor.data.data.attributes.speed;
    let speed = speedAttr.total ?? 0;
    // noinspection JSUnresolvedVariable
    speedAttr.otherSpeeds.forEach(otherSpeed => {
      if (otherSpeed.total > speed) {
        speed = otherSpeed.total;
      }
    })
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
  if (!realToken.inCombat) {
    updateMeasureFrom(realToken, updateData);
  }
  globalThis.combatRangeOverlay.instance.fullRefresh();
});
