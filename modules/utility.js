import {MODULE_NAME} from "./constants.js";
import {FLAG_NAMES} from "./constants.js"

const DEFAULT_WEAPON_RANGE = 5;

export function getCurrentToken() {
  if (canvasTokensControlled().length > 0) {
    return canvasTokensControlled()[0];
  } else {
    const activeTokens = game.user?.character?.getActiveTokens();
    if (activeTokens) {
      return activeTokens[0];
    } else {
      return undefined;
    }
  }
}

export function getWeaponRanges() {
  return [5, 10, 30, 60, 120]; // TODO Actually figure this out by scanning weapons and abilities
}

export function safeDestroy(thing) {
  try {
    thing.destroy();
  } catch (error) {
    // Already destroyed; ignore
  }
}

// For some reason the combatant just has the Token's data structure, not the Token object
export function getCombatantToken(combatant) {
  const tokenId = combatant.tokenId ?? combatant.token.id;
  // noinspection JSUnresolvedFunction
  return canvas.tokens.get(tokenId);
}

// Abstract this to avoid Idea's warnings
export function getCombatantTokenDisposition(combatantToken) {
  // noinspection JSUnresolvedVariable
  return combatantToken.data.disposition;
}

export function calculateGridDistance(pt1, pt2) {
  const dx = Math.abs(pt1.x - pt2.x)
  const dy = Math.abs(pt1.y - pt2.y);
  return Math.abs(dx - dy) + Math.floor(Math.min(dx, dy) * 3 / 2);
}

/*
 * Abstract these to avoid Idea's warnings
 */
export function canvasGridSize() {
  // noinspection JSUnresolvedVariable
  return canvas.grid.size;
}

export function canvasTokensGet(tokenId) {
  // noinspection JSUnresolvedFunction
  return canvas.tokens.get(tokenId);
}

function canvasTokensControlled() {
  // noinspection JSUnresolvedVariable
  return canvas.tokens.controlled;
}

