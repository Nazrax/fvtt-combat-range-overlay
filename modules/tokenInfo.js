import {DEFAULT_WEAPON_RANGE, FLAG_NAMES, MODULE_NAME} from "./constants.js"
import {canvasTokensGet, getCurrentToken} from "./utility.js"

export class TokenInfo {
  static _tokenInfoMap = new Map();

  constructor(tokenId) {
    console.log("Creating new TokenInfo", tokenId);
    this.tokenId = tokenId;
    this.token = canvasTokensGet(this.tokenId);
    this.measureFrom = undefined;
    this.location = undefined;

    this.updateLocation();
    this.updateMeasureFrom();

    TokenInfo._tokenInfoMap.set(tokenId, this);
  }

  updateLocation(location) {
    if (!location) {
      location = {x: this.token.x, y: this.token.y};
    }
    this.location = location;
  }

  updateMeasureFrom(location) {
    if (!location) {
      location = {x: this.token.x, y: this.token.y};
    }
    this.measureFrom = location;
  }

  static current() {
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
    return this.token.getFlag(MODULE_NAME, FLAG_NAMES.WEAPON_RANGE) ?? DEFAULT_WEAPON_RANGE;
  }

  async setWeaponRange(range) {
    await this.token.setFlag(MODULE_NAME, FLAG_NAMES.WEAPON_RANGE, range);
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

function updateMeasureFrom(token) {
  const tokenId = token.id ?? token._id;
  const tokenInfo = TokenInfo.getById(tokenId);
  tokenInfo.updateMeasureFrom({x: token.x, y: token.y});
  console.log(`Updated ${tokenId}'s measureFrom to ${tokenInfo.measureFrom.x}/${tokenInfo.measureFrom.y}`)
}

function updateLocation(token) {
  const tokenId = token.id ?? token._id;
  const tokenInfo = TokenInfo.getById(tokenId);
  tokenInfo.updateLocation({x: token.x, y: token.y});
  console.log(`Updated ${tokenId}'s location to ${tokenInfo.location.x}/${tokenInfo.location.y}`)
}

Hooks.on("createCombatant", (combat, info, something, someId) => {
  const token = canvasTokensGet(info.tokenId);
  updateMeasureFrom(token);
  globalThis.movementPlanner.instance.fullRefresh();
});

Hooks.on("updateCombat", (combat, something, diff, someOtherId) => {
  if (diff?.pf2e?.endTurn) {
    const token = canvasTokensGet(diff.pf2e.endTurn)
    updateMeasureFrom(token);
  }
  globalThis.movementPlanner.instance.fullRefresh();
});

Hooks.on("updateToken", (scene, token, foo, bar) => {
  const tokenId = token.id ?? token._id;
  const realToken = canvasTokensGet(tokenId); // Get the
  //console.log(`updateToken: ${tokenId} moved to ${token.x}/${token.y}`);
  updateLocation(token);
  if (!realToken.inCombat) {
    updateMeasureFrom(token);
  }
  globalThis.movementPlanner.instance.fullRefresh();
});

// Hooks.on("deleteCombatant", (combat, tokenInfo, something, someId) => {
//   console.log(`Deleting ${tokenInfo.tokenId} from combat`);
// });


