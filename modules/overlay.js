import {
  calculateGridDistance,
  canvasGridSize, canvasTokensGet,
  getCombatantToken,
  getCombatantTokenDisposition,
  getCurrentToken,
  safeDestroy, uiNotificationsInfo, uiNotificationsWarn
} from "./utility.js"

import {GridTile} from "./gridTile.js";
import {FEET_PER_TILE, FUDGE, MAX_DIST, MODULE_ID} from "./constants.js"
import {TokenInfo} from "./tokenInfo.js";
import * as Settings from "./settings.js";
import {mouse} from "./mouse.js";
import {keyboard} from "./keyboard.js";
import {debugLog} from "./debug.js"

const actionsToShow = 2;

// Colors
const colorByActions = [0xffffff, 0x0000ff, 0xffff00, 0xff0000, 0x800080]; // white, blue, yellow, red, purple
const highlightLineColor = 0xffffff; // white
const pathLineColor = 0x0000ff; // blue
const wallLineColor = 0x40e0d0; // turquoise

// Line widths
const wallLineWidth = 3;
const pathLineWidth = 1;
const highlightLineWidth = 3;
const potentialTargetLineWidth = 3;

const TEXT_MARGIN = 2;

const BASE_GRID_SIZE = 70; // For scaling fonts

// Fonts
const movementCostStyle = {
  fontFamily: 'Arial',
  fontSize: 30,
  fill: 0x0000ff, // blue
  stroke: 0xffffff, // white
  strokeThickness: 1
};

const turnOrderStyle = {
  fontFamily: 'Arial',
  fontSize: 25,
  fill: 0xffffff, // white
  stroke: 0x000000, // black
  strokeThickness: 5
};

const weaponRangeStyle = {
  fontFamily: 'Arial',
  fontSize: 20,
  fill: 0xffffff, // white
  stroke: 0x000000, // black
  strokeThickness: 4
};

function getDiagonalDelta() {
  if (Settings.getDiagonals() === Settings.diagonals.FIVE_TEN_FIVE || Settings.getDiagonals() === Settings.diagonals.TEN_FIVE_TEN) {
    return .5;
  } else if (Settings.getDiagonals() === Settings.diagonals.FIVE) {
    return 0;
  } else if (Settings.getDiagonals() === Settings.diagonals.TEN) {
    return 1;
  } else {
    console.log("Invalid diagonal method", Settings.getDiagonals())
    return 0;
  }
}

function diagonalDistance(rawDist) {
  if (Settings.getDiagonals() === Settings.diagonals.FIVE_TEN_FIVE) {
    return Math.floor(rawDist + FUDGE);
  } else if (Settings.getDiagonals() === Settings.diagonals.TEN_FIVE_TEN) {
    return Math.ceil(rawDist - FUDGE);
  } else if (Settings.getDiagonals() === Settings.diagonals.FIVE || Settings.getDiagonals() === Settings.diagonals.TEN) {
    return Math.round(rawDist);
  } else {
    console.log("Invalid diagonal method", Settings.getDiagonals())
    return Math.round(rawDist);
  }
}

export class Overlay {
  constructor() {
    this.overlays = {};
    this.hookIDs = {};
    this.newTarget = false;
    this.justActivated = false;
  }

  // Use Dijkstra's shortest path algorithm
  calculateMovementCosts() {
    // TODO Fix caching
    const tilesPerAction = TokenInfo.current.speed / FEET_PER_TILE;
    const maxTiles = tilesPerAction * actionsToShow;

    const currentToken = getCurrentToken();
    const currentTokenInfo = TokenInfo.getById(currentToken.id);
    const tokenTile = GridTile.fromPixels(currentTokenInfo.measureFrom.x, currentTokenInfo.measureFrom.y);
    tokenTile.distance = 0;

    // Keep a map of grid coordinate -> GridTile
    const tileMap = new Map();
    tileMap.set(tokenTile.key, tokenTile);

    const toVisit = new Set();
    toVisit.add(tokenTile);

    while (toVisit.size > 0) {
      let current = new GridTile(undefined, undefined);

      for (const tile of toVisit) {
        if (tile.distance < current.distance) {
          current = tile;
        }
      }
      if (current.distance === MAX_DIST) { // Stop if cheapest tile is unreachable
        break;
      }
      toVisit.delete(current);
      if (current.visited) {
        console.log("BUG: Trying to visit a tile twice");
        continue;
      }
      current.visited = true;

      const neighborGridXYs = canvas.grid.grid.getNeighbors(current.gx, current.gy);
      for (const neighborGridXY of neighborGridXYs) {
        let neighbor = new GridTile(neighborGridXY[0], neighborGridXY[1]);
        if (tileMap.has(neighbor.key)) {
          neighbor = tileMap.get(neighbor.key);
        } else {
          tileMap.set(neighbor.key, neighbor);
        }

        if (neighbor.visited) {
          continue;
        }

        const ray = new Ray(neighbor.centerPt, current.centerPt);
        if (checkCollision(ray, {blockMovement: true, blockSenses: false, mode: 'any'})) {
          // Blocked, do nothing
        } else {
          let newDistance = current.distance + neighbor.cost;

          let diagonalDelta = getDiagonalDelta();

          if (current.isDiagonal(neighbor)) { // diagonals
            newDistance += diagonalDelta;
          }

          if (diagonalDistance(newDistance) > maxTiles) {
            // Do nothing
          } else if (Math.abs(neighbor.distance - newDistance) < FUDGE) {
            neighbor.upstreams.add(current);
          } else if (newDistance < neighbor.distance) {
            neighbor.upstreams = new Set();
            neighbor.upstreams.add(current);
            neighbor.distance = newDistance;
            toVisit.add(neighbor);
          }
        }
      }
    }

    return new Map([...tileMap].filter(kv => kv[1].distance !== MAX_DIST));
  }

  calculateTargetRangeMap() {
    const targetMap = new Map();
    const weaponRangeInTiles = TokenInfo.current.weaponRange / FEET_PER_TILE;

    for (const targetToken of game.user.targets) {
      targetMap.set(targetToken.id, calculateTilesInRange(weaponRangeInTiles, targetToken));
    }
    return targetMap;
  }

  drawPotentialTargets(movementCosts) {
    const currentToken = getCurrentToken();

    if (!currentToken.inCombat) {
      return;
    }

    const tilesMovedPerAction = TokenInfo.current.speed / FEET_PER_TILE;
    const weaponRangeInTiles = TokenInfo.current.weaponRange / FEET_PER_TILE;
    const myDisposition = getCombatantTokenDisposition(currentToken);
    debugLog("drawPotentialTargets", "|", "Current disposition", myDisposition);

    for (const combatant of game.combat.combatants) {
      const combatantToken = getCombatantToken(combatant);
      debugLog("drawPotentialTargets", "|", "Potential target disposition", getCombatantTokenDisposition(combatantToken), combatantToken.id, combatantToken);

      if (getCombatantTokenDisposition(combatantToken) !== myDisposition) {
        if (combatantToken.visible && !combatant.defeated) {
          let tilesInRange = calculateTilesInRange(weaponRangeInTiles, combatantToken);
          let bestCost = MAX_DIST;

          for (const tileInRange of tilesInRange) {
            const costTile = movementCosts.get(tileInRange.key)
            if (costTile === undefined) {
              continue;
            }
            if (costTile.distance < bestCost) {
              bestCost = costTile.distance;
            }
          }

          const colorIndex = Math.min(Math.ceil(diagonalDistance(bestCost) / tilesMovedPerAction), colorByActions.length-1);
          let color = colorByActions[colorIndex];

          const tokenOverlay = new PIXI.Graphics();
          tokenOverlay.lineStyle(potentialTargetLineWidth, color)
          tokenOverlay.drawCircle(
            combatantToken.hitArea.width/2,
            combatantToken.hitArea.height/2,
            Math.pow(Math.pow(combatantToken.hitArea.width/2, 2) + Math.pow(combatantToken.hitArea.height/2, 2), .5)
          );
          combatantToken.addChild(tokenOverlay);
          this.overlays.tokenOverlays.push(tokenOverlay);
        }
      }
    }
  }

  drawAll() {
    const movementCosts = this.calculateMovementCosts();
    const targetRangeMap = this.calculateTargetRangeMap();

    this.initializePersistentVariables();
    this.drawCosts(movementCosts, targetRangeMap);
    if (game.user.targets.size === 0) {
      if (Settings.isShowTurnOrder()) {
        this.drawTurnOrder();
      }

      if (Settings.isShowPotentialTargets()) {
        this.drawPotentialTargets(movementCosts);
      }
    }

    if (Settings.isShowWeaponRange()) {
      this.drawWeaponRange();
    }

    if (Settings.isShowWalls()) {
      this.drawWalls();
    }

    // noinspection JSUnresolvedVariable
    if (Settings.isShowDifficultTerrain() && canvas.terrain) {
      try {
        // noinspection JSUnresolvedVariable
        canvas.terrain.visible = true;
      } catch {
        // Ignore
      }
    }
  }

  // noinspection JSUnusedLocalSymbols
  dragHandler(dragging) {
    this.fullRefresh();
  }

  // noinspection JSUnusedLocalSymbols
  altKeyHandler(event, state) {
    this.fullRefresh();
  }

  fullRefresh() {
    this.clearAll();

    if (!Settings.isActive()) {
      return;
    }

    let showOverlay = false;
    const currentToken = getCurrentToken();
    if (currentToken) {
      let hotkeys = false;
      if (keyboard.isDown("Alt") || mouse.isLeftDrag()) {
        hotkeys = true;
      }

      const visibilitySetting = currentToken.inCombat ? Settings.getICVisibility() : Settings.getOOCVisibility();
      if (visibilitySetting === Settings.overlayVisibility.ALWAYS) {
        showOverlay = true;
      } else if (visibilitySetting === Settings.overlayVisibility.HOTKEYS && hotkeys) {
        showOverlay = true;
      }
    }

    if (showOverlay) {
      this.drawAll();
    } else if (this.justActivated) {
      uiNotificationsInfo(game.i18n.localize(`${MODULE_ID}.activated-not-visible`));
    }
    this.justActivated = false;
  }

  // partialRefresh() {
  //   this.fullRefresh();  // TODO Make this more efficient
  // }

  renderApplicationHook() {
    this.fullRefresh();
  }

  targetTokenHook() {
    this.newTarget = true;
    this.fullRefresh();
  }

  canvasInitHook() {
    this.clearAll();
    TokenInfo.resetMap();
  }

  updateWallHook() {
    this.fullRefresh();
  }

  registerHooks() {
    this.hookIDs.renderApplication = Hooks.on("renderApplication", () => this.renderApplicationHook());
    this.hookIDs.targetToken = Hooks.on("targetToken", () => this.targetTokenHook());
    this.hookIDs.canvasInit = Hooks.on("canvasInit", () => this.canvasInitHook());
    this.hookIDs.updateWall = Hooks.on("updateWall", () => this.updateWallHook());
  }

  unregisterHooks() {
    Hooks.off("renderApplication", this.hookIDs.renderApplication);
    Hooks.off("targetToken", this.hookIDs.targetToken);
    Hooks.off("canvasInit", this.hookIDs.canvasInit);
    this.hookIDs.renderApplication = undefined;
    this.hookIDs.targetToken = undefined;
    this.hookIDs.sceneChange = undefined;
  }

  clearAll() {
    this.overlays.distanceTexts?.forEach(t => {safeDestroy(t)});
    this.overlays.turnOrderTexts?.forEach(t => {safeDestroy(t)});
    this.overlays.tokenOverlays?.forEach(o => {safeDestroy(o)});
    safeDestroy(this.overlays.distanceOverlay);
    safeDestroy(this.overlays.pathOverlay);
    safeDestroy(this.overlays.potentialTargetOverlay);
    safeDestroy(this.overlays.wallsOverlay);

    this.overlays.distanceTexts = [];
    this.overlays.tokenOverlays = [];
    this.overlays.distanceOverlay = undefined;
    this.overlays.pathOverlay = undefined;
    this.overlays.turnOrderTexts = [];
    this.overlays.potentialTargetOverlay = undefined;
    this.overlays.wallsOverlay = undefined;

    if (Settings.isShowDifficultTerrain()) {
      try {
        // noinspection JSUnresolvedVariable
        canvas.terrain.visible = false;
      } catch {
        // Ignore
      }
    }
  }

  initializePersistentVariables() {
    this.overlays.distanceTexts = [];
    this.overlays.turnOrderTexts = [];
    this.overlays.tokenOverlays = [];

    this.overlays.distanceOverlay = new PIXI.Graphics();
    this.overlays.pathOverlay = new PIXI.Graphics();
    this.overlays.potentialTargetOverlay = new PIXI.Graphics();
    this.overlays.wallsOverlay = new PIXI.Graphics();
  }

  drawWeaponRange() {
    debugLog("drawWeaponRange");
    const currentToken = getCurrentToken();
    if (!currentToken.inCombat) {
      return;
    }

    const range = TokenInfo.current.weaponRange;

    const style = Object.assign({}, weaponRangeStyle);
    style.fontSize = style.fontSize * (canvasGridSize() / BASE_GRID_SIZE);

    const text = new PIXI.Text(`» ${range}`, style);
    text.position.x = currentToken.hitArea.width - text.width - TEXT_MARGIN;
    text.position.y = currentToken.hitArea.height - text.height - TEXT_MARGIN;
    currentToken.addChild(text);
    this.overlays.turnOrderTexts.push(text);
  }

  drawTurnOrder() {
    const style = Object.assign({}, turnOrderStyle);
    style.fontSize = style.fontSize * (canvasGridSize() / BASE_GRID_SIZE);

    const currentTokenId = getCurrentToken().id;
    for (const combat of game.combats) {
      const currentCombatant = combat.combatants.find(c => c.token.id === currentTokenId);
      if (!currentCombatant) {
        continue;
      }

      const sortedCombatants = combat.setupTurns()
      let seenCurrent = false;

      const head = [];
      const tail = [];

      for (const combatant of sortedCombatants) {
        const combatantTokenId = combatant.token.id
        if (!seenCurrent && combatantTokenId === currentTokenId) {
          seenCurrent = true;
        }

        if (!seenCurrent) {
          tail.push(combatant);
        } else {
          head.push(combatant);
        }
      }

      let turnOrder = 0;
      for (const combatant of head.concat(tail)) {
        if (!combatant.defeated) {
          const combatantTokenId = combatant.token.id
          const combatantToken = canvasTokensGet(combatantTokenId);

          if (turnOrder > 0 && combatantToken.visible) {
            const text = new PIXI.Text(turnOrder, style);
            text.position.x = combatantToken.hitArea.width - text.width - TEXT_MARGIN;
            text.position.y = combatantToken.hitArea.height - text.height - TEXT_MARGIN;
            combatantToken.addChild(text);
            this.overlays.turnOrderTexts.push(text);
          }
          turnOrder++
        }
      }
    }
  }

  drawCosts(movementCostMap, targetRangeMap) {
    const rangeMap = buildRangeMap(targetRangeMap);
    const idealTileMap = calculateIdealTileMap(movementCostMap, targetRangeMap, rangeMap);
    let showOnlyTargetPath = targetRangeMap.size > 0;
    if (showOnlyTargetPath && idealTileMap.size === 0) {
      if (this.newTarget) {
        this.newTarget = false;
        uiNotificationsWarn(game.i18n.localize(`${MODULE_ID}.no-good-tiles`));
        showOnlyTargetPath = false;
      }
    }

    const tilesMovedPerAction = TokenInfo.current.speed / FEET_PER_TILE;
    this.overlays.distanceTexts = [];
    this.overlays.pathOverlay.lineStyle(pathLineWidth, pathLineColor);

    for (const tile of movementCostMap.values()) {
      let drawTile = false;
      if (!showOnlyTargetPath || idealTileMap.has(tile.key)) {
        drawTile = true;
      } else {
        for (const idealTile of idealTileMap.values()) {
          if (tile.upstreamOf(idealTile)) {
            drawTile = true;
            break;
          }
        }
      }
      if (drawTile) {
        if (globalThis.combatRangeOverlay.showNumericMovementCost) {
          const style = Object.assign({}, movementCostStyle);
          style.fontSize = style.fontSize * (canvasGridSize() / BASE_GRID_SIZE);

          const label = globalThis.combatRangeOverlay.roundNumericMovementCost ? diagonalDistance(tile.distance) : tile.distance;
          const text = new PIXI.Text(label, style);
          const pt = tile.pt;
          text.position.x = pt.x;
          text.position.y = pt.y;
          this.overlays.distanceTexts.push(text);
        }

        if (globalThis.combatRangeOverlay.showPathLines) {
          let tileCenter = tile.centerPt;
          if (tile.upstreams !== undefined) {
            for (const upstream of tile.upstreams) {
              let upstreamCenter = upstream.centerPt;
              this.overlays.pathOverlay.moveTo(tileCenter.x, tileCenter.y);
              this.overlays.pathOverlay.lineTo(upstreamCenter.x, upstreamCenter.y);
            }
          }
        }

        // Color tile based on number of actions to reach it
        const colorIndex = Math.min(Math.ceil(diagonalDistance(tile.distance) / tilesMovedPerAction), colorByActions.length-1);
        let color = colorByActions[colorIndex];
        let cornerPt = tile.pt;
        if (idealTileMap.has(tile.key)) {
          this.overlays.distanceOverlay.lineStyle(highlightLineWidth, highlightLineColor);
        } else {
          this.overlays.distanceOverlay.lineStyle(0, 0);
        }
        this.overlays.distanceOverlay.beginFill(color, Settings.getMovementAlpha());
        this.overlays.distanceOverlay.drawRect(cornerPt.x, cornerPt.y, canvasGridSize(), canvasGridSize());
        this.overlays.distanceOverlay.endFill();
      }
    }

    canvas.drawings.addChild(this.overlays.distanceOverlay);
    canvas.drawings.addChild(this.overlays.pathOverlay);

    for (const text of this.overlays.distanceTexts) {
      canvas.drawings.addChild(text);
    }
  }

  drawWalls() {
    this.overlays.wallsOverlay.lineStyle(wallLineWidth, wallLineColor);
    for (const quadtree of canvas.walls.quadtree.nodes) {
      for (const obj of quadtree.objects) {
        const wall = obj.t;
        if (wall.data.door || !wall.data.move) {
          continue;
        }
        const c = wall.data.c;
        this.overlays.wallsOverlay.moveTo(c[0], c[1]);
        this.overlays.wallsOverlay.lineTo(c[2], c[3]);
      }
    }
    canvas.drawings.addChild(this.overlays.wallsOverlay);
  }
}

function buildRangeMap(targetMap) {
  const rangeMap = new Map();
  for (const tileSet of targetMap.values()) {
    for (const tile of tileSet) {
      const tileKey = tile.key;
      let count = rangeMap.get(tileKey) ?? 0;
      count++;
      rangeMap.set(tileKey, count);
    }
  }
  return rangeMap;
}

function calculateIdealTileMap(movementTileMap, targetMap, rangeMap) {
  const idealTileMap = new Map();
  for (const tile of movementTileMap.values()) {
    if (rangeMap.get(tile.key) === targetMap.size) { // Every target is reachable from here
      idealTileMap.set(tile.key, tile);
    }
  }
  return idealTileMap;
}

function calculateTilesInRange(rangeInTiles, targetToken) {
  const tokenInfo = TokenInfo.getById(targetToken.id);
  const targetTile = GridTile.fromPixels(tokenInfo.location.x, tokenInfo.location.y);
  const tileSet = new Set();
  const targetGridX = targetTile.gx;
  const targetGridY = targetTile.gy;
  const targetGridHeight = Math.floor(targetToken.hitArea.height / canvasGridSize());
  const targetGridWidth = Math.floor(targetToken.hitArea.width / canvasGridSize());

  // Loop over X and Y deltas, computing distance for only a single quadrant
  for(let gridXDelta = 0; gridXDelta <= rangeInTiles; gridXDelta++) {
    for(let gridYDelta = 0; gridYDelta <= rangeInTiles; gridYDelta++) {
      if (gridXDelta === 0 && gridYDelta === 0) {
        continue;
      }

      const shotDistance = calculateGridDistance({x: 0, y: 0}, {x: gridXDelta, y: gridYDelta});
      if (shotDistance < rangeInTiles + FUDGE) { // We're within range
        // We need to test visibility for all 4 quadrants
        // Use sets so we don't have to explicitly test for "on the same row/column as"
        const gridXSet = new Set();
        const gridYSet = new Set();
        gridXSet.add(targetGridX + gridXDelta + targetGridWidth - 1);
        gridXSet.add(targetGridX - gridXDelta);
        gridYSet.add(targetGridY + gridYDelta + targetGridHeight - 1);
        gridYSet.add(targetGridY - gridYDelta);
        for (const testGridX of gridXSet) {
          for (const testGridY of gridYSet) {
            const testTile = new GridTile(testGridX, testGridY);
            //const testTilePoint = testTile.pt;

            let clearShot = checkTileToTokenVisibility(testTile, targetToken);
            if (clearShot) {
              tileSet.add(testTile);
            }
          }
        }
      }
    }
  }
  return tileSet;
}

// Abstract this because IntelliJ complains that canvas.walls.checkCollision isn't accessible and we don't want to annotate it everywhere
function checkCollision(ray, opts) {
  // noinspection JSUnresolvedFunction
  return canvas.walls.checkCollision(ray, opts);
}

// Copied straight from foundry.js (_sortCombatants)
/*
function combatantComparator(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
    if ( ci !== 0 ) return ci;
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
    let cn = an.localeCompare(bn);
    if ( cn !== 0 ) return cn;
    return a.tokenId - b.tokenId;
}*/

function checkTileToTokenVisibility(tile, token) {
  const t = Math.min(token.h, token.w) / 4;
  const offsets = t > 0 ? [[0, 0],[-t,0],[t,0],[0,-t],[0,t],[-t,-t],[-t,t],[t,t],[t,-t]] : [[0,0]];
  const points = offsets.map(o => new PIXI.Point(token.center.x + o[0], token.center.y + o[1]));
  const tileCenterPt = tile.centerPt

  for (const point of points) {
    const ray = new Ray(tileCenterPt, point);
    if (!checkCollision(ray, {blockMovement: false, blockSenses: true, mode: 'any'})) {
      return true;
    }
  }

  return false;
}