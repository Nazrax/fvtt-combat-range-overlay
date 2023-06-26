import {MAX_DIST} from "./constants.js"
import {TokenInfo} from "./tokenInfo.js"

export class GridTile {
  constructor(gx, gy, color) {
    this.gx = gx;
    this.gy = gy;
    this.color = color;
    this.distance = MAX_DIST;
    this.visited = false;
    this.upstreams = undefined;
    this._upstreamCache = undefined;
  }

  get centerPt() {
    const pixels = canvas.grid.grid.getPixelsFromGridPosition(this.gx, this.gy);
    // noinspection JSUnresolvedVariable
    return { x: pixels[0] + canvas.grid.size/2, y: pixels[1] + canvas.grid.size/2 };
  }

  get pt() {
    const pixels = canvas.grid.grid.getPixelsFromGridPosition(this.gx, this.gy);
    return { x: pixels[0], y: pixels[1] };
  }

  get key() {
    return `${this.gx}-${this.gy}`;
  }

  get cost() {
    if (TokenInfo.current.isIgnoreDifficultTerrain) {
      return 1;
    } else {
      // noinspection JSUnresolvedVariable
      return canvas.terrain?.cost({x: this.gy, y: this.gx}) ?? 1;
    }
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