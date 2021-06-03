import {getCurrentToken} from "./utility.js";
import {MODULE_NAME, SETTING_IS_ACTIVE} from "./constants.js";
import {keyboard} from "./keyboard.js";

const WEAPON_RANGES = [5, 10, 30, 60, 120];

/*
// Main choices
const WEAPON_RANGE = 60;
const actionsToShow = 2;
const showDifficultTerrain = false;
const showNumericMovementCost = false;
const showPathLines = false;
const showPotentialTargets = true;
const showTurnOrder = true;
const showWalls = false;
const roundNumericMovementCost = true;
const enableHooks = true;

// Colors
const colorByActions = [0xffffff, 0x00ff00, 0xffff00, 0xff0000, 0x800080]; // white, green, yellow, red, purple
const highlightLineColor = 0xffffff; // white
const pathLineColor = 0x0000ff; // blue
const wallLineColor = 0x40e0d0; // turquise
const movementAlpha = 0.15; // 0 is completely transparent, 1 is completely opaque

// Line widths
const wallLineWidth = 3;
const pathLineWidth = 1;
const highlightLineWidth = 3;
const potentialTargetLineWidth = 3;

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
  fontSize: 40,
  fill: 0xffffff, // white
  stroke: 0x000000, // black
  strokeThickness: 6
};

////////////////////////
//// Main program //////
////////////////////////
// Don't mess with these
const MAX_DIST = 999;
const FEET_PER_TILE = 5;
const FUDGE = .1; // floating point fudge

class GridTile {
  constructor(gx, gy) {
    this.gx = gx;
    this.gy = gy;
    this.distance = MAX_DIST;
    this.visited = false;
    this.upstreams = undefined;
    this._upstreamCache = undefined;
  }

  get centerPt() {
    const pixels = canvas.grid.grid.getPixelsFromGridPosition(this.gx, this.gy);
    return { x: pixels[0]+canvas.grid.size/2, y: pixels[1]+canvas.grid.size/2 };
  }

  get pt() {
    const pixels = canvas.grid.grid.getPixelsFromGridPosition(this.gx, this.gy);
    return { x: pixels[0], y: pixels[1] };
  }

  get key() {
    return `${this.gx}-${this.gy}`;
  }

  get cost() {
    return canvas.terrain.cost({x: this.gy, y: this.gx});
  }

  get allUpstreams() {
    if (this._upstreamCache === undefined) {
      this._upstreamCache = new Map();
      if (this.upstreams !== undefined) {
        for (const upstream of this.upstreams) {
          this._upstreamCache.set(upstream.key, upstream);
          for (const upstream2 of upstream.allUpstreams.values()) {
            this._upstreamCache.set(upstream2.key, upstream2);
          }
        }
      }
    }
    return this._upstreamCache;
  }

  static fromPixels(x, y) {
    const [gx, gy] = canvas.grid.grid.getGridPositionFromPixels(x, y);
    return new GridTile(gx, gy);
  }

  upstreamOf(tile) {
    return tile.allUpstreams.has(this.key);
  }

  isDiagonal(neighbor) {
    return this.gx !== neighbor.gx && this.gy !== neighbor.gy;
  }
}

class MovementPlanner {
  constructor({weaponRange= 30}) {
    this.weaponRange = weaponRange;
    this.overlays = {};
    this.hookIDs = {};
    this.currentToken = getCurrentToken();
    this.tokenTile = GridTile.fromPixels(this.currentToken.x, this.currentToken.y);
    this.warned = false;
  }

  static toggle({weaponRange = 30}) {
    if (getCurrentToken() === undefined) {
      ui.notifications.warn("Trying to toggle movement planner, but no current token is available; aborting");
      return;
    }

    if (!globalThis.movementPlanner.instance) {
      globalThis.movementPlanner.instance = new MovementPlanner({weaponRange: weaponRange});
      globalThis.movementPlanner.instance.drawAll();
      globalThis.movementPlanner.instance.registerHooks();
    } else {
      globalThis.movementPlanner.instance.clearAll();
      globalThis.movementPlanner.instance.unregisterHooks();
      globalThis.movementPlanner.instance = null;
      globalThis.movementPlanner = undefined;
    }
  }

  getSpeed() {
    const actor = this.currentToken !== undefined ? this.currentToken.actor : game.user.character;
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

  // Use Dijkstra's shortest path algorithm
  calculateMovementCosts() {
    if (this.tileMap) {
      return this.tileMap;
    }

    const tilesPerAction = this.getSpeed() / FEET_PER_TILE;
    const maxTiles = tilesPerAction * actionsToShow;

    this.tokenTile.distance = 0;

    // Keep a map of grid coordinate -> GridTile
    this.tileMap = new Map();
    this.tileMap.set(this.tokenTile.key, this.tokenTile);

    const toVisit = new Set();
    toVisit.add(this.tokenTile);

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
        if (this.tileMap.has(neighbor.key)) {
          neighbor = this.tileMap.get(neighbor.key);
        } else {
          this.tileMap.set(neighbor.key, neighbor);
        }

        if (neighbor.visited) {
          continue;
        }

        const ray = new Ray(neighbor.centerPt, current.centerPt);
        if (checkCollision(ray, {blockMovement: true, blockSenses: false, mode: 'any'})) {
          // Blocked, do nothing
        } else {
          let newDistance = current.distance + neighbor.cost;
          if (current.isDiagonal(neighbor)) { // diagonals
            newDistance += .5;
          }

          if (Math.floor(newDistance+FUDGE) > maxTiles) {
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

    this.tileMap = new Map([...this.tileMap].filter(kv => kv[1].distance !== MAX_DIST));
    return this.tileMap;
  }

  calculateTargetRangeMap() {
    const targetMap = new Map();
    const weaponRangeInTiles = this.weaponRange / FEET_PER_TILE;

    for (const targetToken of game.user.targets) {
      targetMap.set(targetToken.id, calculateTilesInRange(weaponRangeInTiles, targetToken));
    }
    return targetMap;
  }

  drawPotentialTargets(movementCosts) {
    if (game.combat === null) {
      return;
    }

    const tilesMovedPerAction = this.getSpeed() / FEET_PER_TILE;
    const weaponRangeInTiles = this.weaponRange / FEET_PER_TILE;
    const myDisposition = getCombatantTokenDisposition(this.currentToken);

    for (const combatant of game.combat.combatants) {
      const combatantToken = getCombatantToken(combatant);
      if (getCombatantTokenDisposition(combatantToken) !== myDisposition) {
        if (combatantToken.visible) {
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

          const colorIndex = Math.min(Math.ceil(Math.floor(bestCost + FUDGE) / tilesMovedPerAction), colorByActions.length-1);
          let color = colorByActions[colorIndex];

          this.overlays.potentialTargetOverlay.lineStyle(potentialTargetLineWidth, color)
          this.overlays.potentialTargetOverlay.drawCircle(
            combatantToken.x + combatantToken.hitArea.width/2,
            combatantToken.y + combatantToken.hitArea.height/2,
            Math.pow(Math.pow(combatantToken.hitArea.width/2, 2) + Math.pow(combatantToken.hitArea.height/2, 2), .5)
          );
        }
      }
    }
    canvas.drawings.addChild(this.overlays.potentialTargetOverlay);
  }

  drawAll() {
    const movementCosts = this.calculateMovementCosts();
    const targetRangeMap = this.calculateTargetRangeMap();

    this.initializePersistentVariables();
    this.drawCosts(movementCosts, targetRangeMap);
    if (game.user.targets.size === 0) {
      if (showTurnOrder) {
        this.drawTurnOrder();
      }

      if (showPotentialTargets) {
        this.drawPotentialTargets(movementCosts);
      }
    }

    if (showWalls) {
      this.drawWalls();
    }

    if (showDifficultTerrain) {
      canvas.terrain.visible = true;
    }
  }

  renderApplicationHook() {
    this.clearAll();
    this.drawAll();
  }

  targetTokenHook() {
    this.clearAll();
    this.drawAll();
  }

  canvasInitHook() {
    globalThis.movementPlanner.instance.clearAll();
    globalThis.movementPlanner.instance.unregisterHooks();
    globalThis.movementPlanner.instance = null;
    globalThis.movementPlanner = undefined;
  }

  registerHooks() {
    if (enableHooks) {
      this.hookIDs.renderApplication = Hooks.on("renderApplication", () => this.renderApplicationHook());
      this.hookIDs.targetToken = Hooks.on("targetToken", () => this.targetTokenHook());
    }
    this.hookIDs.canvasInit = Hooks.on("canvasInit", () => this.canvasInitHook());
  }

  unregisterHooks() {
    if (enableHooks) {
      Hooks.off("renderApplication", this.hookIDs.renderApplication);
      Hooks.off("targetToken", this.hookIDs.targetToken);
      this.hookIDs.renderApplication = undefined;
      this.hookIDs.targetToken = undefined;
    }
    Hooks.off("canvasInit", this.hookIDs.canvasInit);
    this.hookIDs.sceneChange = undefined;
  }

  clearAll() {
    this.overlays.distanceTexts?.forEach(t => {safeDestroy(t)});
    this.overlays.turnOrderTexts?.forEach(t => {safeDestroy(t)});
    safeDestroy(this.overlays.distanceOverlay);
    safeDestroy(this.overlays.pathOverlay);
    safeDestroy(this.overlays.potentialTargetOverlay);
    safeDestroy(this.overlays.wallsOverlay);

    this.overlays.distanceTexts = [];
    this.overlays.distanceOverlay = undefined;
    this.overlays.pathOverlay = undefined;
    this.overlays.turnOrderTexts = [];
    this.overlays.potentialTargetOverlay = undefined;
    this.overlays.wallsOverlay = undefined;

    if (showDifficultTerrain) {
      canvas.terrain.visible = false;
    }
  }

  initializePersistentVariables() {
    this.overlays.distanceTexts = [];
    this.overlays.turnOrderTexts = [];

    this.overlays.distanceOverlay = new PIXI.Graphics();
    this.overlays.pathOverlay = new PIXI.Graphics();
    this.overlays.potentialTargetOverlay = new PIXI.Graphics();
    this.overlays.wallsOverlay = new PIXI.Graphics();
  }

  drawTurnOrder() {
    const currentTokenId = this.currentToken.id;
    if (game.combat === null) {
      return;
    }
    const sortedCombatants = game.combat.combatants.sort(combatantComparator)
    let seenCurrent = false;
    let turnOrder = 0;
    let i=0;
    let j=0;

    while(i < sortedCombatants.length) {
      if (j++ > sortedCombatants.length * 3) {
        if (!this.warned) {
          ui.notifications.warn("Current token doesn't seem to be part of encounter");
          this.warned = true;
        }
        return;
      }

      const combatant = sortedCombatants[i];
      const combatantTokenId = combatant.token._id
      // noinspection JSUnresolvedFunction
      const combatantToken = canvas.tokens.get(combatantTokenId);
      if (!seenCurrent && combatantTokenId === currentTokenId) {
        seenCurrent = true;
      }
      if (!seenCurrent) {
        sortedCombatants.push(sortedCombatants.shift()); // Move first element to last element
      } else {
        if (turnOrder > 0 && combatantToken.visible) {
          const text = new PIXI.Text(turnOrder, turnOrderStyle);
          text.position.x = combatantToken.x + combatantToken.hitArea.width / 2 - text.width / 2;
          text.position.y = combatantToken.y + combatantToken.hitArea.height / 2 - text.height / 2;
          this.overlays.turnOrderTexts.push(text);
        }
        turnOrder++
        i++;
      }
    }

    for (const text of this.overlays.turnOrderTexts) {
      canvas.tokens.addChild(text);
    }
  }

  drawCosts(movementCostMap, targetRangeMap) {
    const rangeMap = buildRangeMap(targetRangeMap);
    const idealTileMap = calculateIdealTileMap(movementCostMap, targetRangeMap, rangeMap);
    if (targetRangeMap.size > 0 && idealTileMap.size === 0) {
      ui.notifications.warn("No tiles are within movement range AND attack range")
      return;
    }

    const tilesMovedPerAction = this.getSpeed() / FEET_PER_TILE;
    this.overlays.distanceTexts = [];
    this.overlays.pathOverlay.lineStyle(pathLineWidth, pathLineColor);

    for (const tile of movementCostMap.values()) {
      let drawTile = false;
      if (targetRangeMap.size === 0 || idealTileMap.has(tile.key)) {
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
        if (showNumericMovementCost) {
          const label = roundNumericMovementCost ? Math.floor(tile.distance + FUDGE) : tile.distance;
          const text = new PIXI.Text(label, movementCostStyle);
          const pt = tile.pt;
          text.position.x = pt.x;
          text.position.y = pt.y;
          this.overlays.distanceTexts.push(text);
        }

        if (showPathLines) {
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
        const colorIndex = Math.min(Math.ceil(Math.floor(tile.distance + FUDGE) / tilesMovedPerAction), colorByActions.length-1);
        let color = colorByActions[colorIndex];
        let cornerPt = tile.pt;
        if (idealTileMap.has(tile.key)) {
          this.overlays.distanceOverlay.lineStyle(highlightLineWidth, highlightLineColor);
        } else {
          this.overlays.distanceOverlay.lineStyle(0, 0);
        }
        this.overlays.distanceOverlay.beginFill(color, movementAlpha);
        this.overlays.distanceOverlay.drawRect(cornerPt.x, cornerPt.y, canvas.grid.size, canvas.grid.size);
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

function safeDestroy(thing) {
    try {
      thing.destroy();
    } catch (error) {
      // Ignore
    }
  }

function getCurrentToken() {
  // noinspection JSUnresolvedVariable
  if (typeof(token) !== "undefined") {
    // noinspection JSUnresolvedVariable
    return token;
  } else {
    // noinspection JSUnresolvedVariable
    if (canvas.tokens.controlled.length > 0) {
      // noinspection JSUnresolvedVariable
      return canvas.tokens.controlled[0];
    } else {
      const activeTokens = game.user?.character?.getActiveTokens();
      if (activeTokens) {
        return activeTokens[0];
      } else {
        return undefined;
      }
    }
  }
}

function calculateGridDistance(pt1, pt2) {
  const dx = Math.abs(pt1.x - pt2.x)
  const dy = Math.abs(pt1.y - pt2.y);
  return Math.abs(dx - dy) + Math.floor(Math.min(dx, dy) * 3 / 2);
}



// Abstract this because IntelliJ complains that canvas.walls.checkCollision isn't accessible and we don't want to annotate it everywhere
function checkCollision(ray, opts) {
  // noinspection JSUnresolvedFunction
  return canvas.walls.checkCollision(ray, opts);
}

function calculateTilesInRange(rangeInTiles, targetToken) {
  const targetTile = GridTile.fromPixels(targetToken.x, targetToken.y);
  const tileSet = new Set();
  const targetGridX = targetTile.gx;
  const targetGridY = targetTile.gy;
  const targetGridHeight = Math.floor(targetToken.hitArea.height / canvas.grid.size);
  const targetGridWidth = Math.floor(targetToken.hitArea.width / canvas.grid.size);

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

// For some reason the combatant just has the Token's data structure, not the Token object
function getCombatantToken(combatant) {
  // noinspection JSUnresolvedFunction
  return canvas.tokens.get(combatant.tokenId);
}

// Abstract this to avoid Idea's warnings
function getCombatantTokenDisposition(combatantToken) {
  // noinspection JSUnresolvedVariable
  return combatantToken.data.disposition;
}



// Copied straight from foundry.js (_sortCombatants)
function combatantComparator(a, b) {
    const ia = Number.isNumeric(a.initiative) ? a.initiative : -9999;
    const ib = Number.isNumeric(b.initiative) ? b.initiative : -9999;
    let ci = ib - ia;
    if ( ci !== 0 ) return ci;
    let [an, bn] = [a.token?.name || "", b.token?.name || ""];
    let cn = an.localeCompare(bn);
    if ( cn !== 0 ) return cn;
    return a.tokenId - b.tokenId;
}

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

if (typeof (globalThis.movementPlanner) === "undefined") {
  globalThis.movementPlanner = {MovementPlanner, instance: null};
}

globalThis.movementPlanner.MovementPlanner.toggle({weaponRange: WEAPON_RANGE});
*/

Hooks.on("ready", function() {
  console.log("This code runs once core initialization is ready and game data is available.");
});

let movementPlannerTool;

Hooks.once("init", () => {
  game.settings.register(MODULE_NAME, SETTING_IS_ACTIVE, {
    name: "movement-planner.is-active",
    hint: "movement-planner.is-active-hint",
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });

  window.movementPlanner = {
    active: game.settings.get(MODULE_NAME, SETTING_IS_ACTIVE)
  };
})

const MOVEMENT_PLANNER_BUTTON = "movementPlannerButton";

function _submitDialog(i, html) {
  console.log("_submitDialog", i, html);
}

function _movementPlannerClick(toggled, controls) {
  if (keyboard.isDown("Shift")) {  // Pop quick settings
    let token = getCurrentToken();
    if (!token) {
      ui.notifications.warn("Can't open quick settings without a selected token");
    } else {
      // Assume we want to activate if the user is opening the dialog
      movementPlanner.active = true;

      let buttons = Object.fromEntries(WEAPON_RANGES.map((i) => [i, {label: i, callback: (html) => _submitDialog(i, html)}]));

      let d = new Dialog({
        title: "Movement Planner Quick Settings",
        content: "<p>Weapon Range:</p>",
        buttons
      }, {id: "movementPlannerDialog"});
      d.render(true);
    }

    controls.find(group => group.name === "token").tools.find(t => t.name === MOVEMENT_PLANNER_BUTTON).active = movementPlanner.active
  } else {
    movementPlanner.active = toggled;

    if (toggled) {  // Enabling

    } else {  // Disabling

    }
  }
}

Hooks.on('getSceneControlButtons', (controls) => {
  if (!movementPlannerTool) {
    movementPlannerTool = {
      name: MOVEMENT_PLANNER_BUTTON,
      title: "movement-planner.controlButton",
      icon: "fas fa-people-arrows",
      toggle: true,
      active: movementPlanner?.active,
      onClick: (toggled) => _movementPlannerClick(toggled, controls),
      visible: true,  // TODO: Figure out how to disable this from Settings
    }
  }

  const tokenControls = controls.find(group => group.name === "token").tools
  tokenControls.push(movementPlannerTool);
});
