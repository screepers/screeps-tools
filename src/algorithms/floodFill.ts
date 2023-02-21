import { cBall, forEachXYInRect, inRect, Rect, rectBoundary, rectWH, roomRect } from '../coordinates/Rect';
import { forEachXYAround, XY, xyCDist, XYSet } from '../coordinates/XY';
import {KeyedSet} from '../data-structures/KeyedSet';
import {Matrix, ReadableMatrix} from '../data-structures/Matrix';
import {OBSTACLE_COST, UNREACHABLE_COST} from '../screeps/constants';

/**
 * A flood fill from one or more positions in the room.
 */
export function floodFill(obstacles: KeyedSet<XY>, start: XY | XY[], slice?: Rect): Matrix {
  if (!Array.isArray(start)) {
    start = [start];
  }

  const actualSlice = slice ?? roomRect();

  const { height, width } = rectWH(actualSlice);
  const result = new Matrix(Uint16Array, width, height);

  if (start.length === 0) {
    result.fill(UNREACHABLE_COST);
    return result;
  }

  let current: XY[] = [];
  let next: XY[] = [];

  // Initialization - setting obstacles on the result matrix.
  for (let y = actualSlice.topLeft.y; y <= actualSlice.bottomRight.y; ++y) {
    for (let x = actualSlice.topLeft.x; x <= actualSlice.bottomRight.x; ++x) {
      const xy = {x, y};
      if (obstacles.has(xy)) {
        result.set(x - actualSlice.topLeft.x, y - actualSlice.topLeft.y, OBSTACLE_COST);
      } else {
        const minStartDist = start.reduce((acc, s) => Math.min(acc, xyCDist(s, xy)), Infinity);
        if (minStartDist === 0) {
          result.set(x - actualSlice.topLeft.x, y - actualSlice.topLeft.y, 0);
        } else if (minStartDist === 1) {
          result.set(x - actualSlice.topLeft.x, y - actualSlice.topLeft.y, 1);
          next.push({ x, y });
        } else {
          result.set(x - actualSlice.topLeft.x, y - actualSlice.topLeft.y, UNREACHABLE_COST);
        }
      }
    }
  }

  obstacles.forEach(({ x, y }) => {
    const sliceX = x - actualSlice.topLeft.x;
    const sliceY = y - actualSlice.topLeft.y;
    if (inRect({ x, y }, actualSlice)) {
      result.set(sliceX, sliceY, OBSTACLE_COST);
    }
  });

  let dist = 2;

  while (next.length) {
    current = next;
    next = [];

    for (let pos = current.pop(); pos; pos = current.pop()) {
      forEachXYAround(pos, (p) => {
        const c = result.get(p.x - actualSlice.topLeft.x, p.y - actualSlice.topLeft.y);
        if (c !== OBSTACLE_COST && c > dist) {
          result.set(p.x - actualSlice.topLeft.x, p.y - actualSlice.topLeft.y, dist);
          next.push(p);
        }
      }, actualSlice);
    }

    dist = Math.min(dist + 1, UNREACHABLE_COST - 1);
  }

  return result;
}

/**
 * Finds all positions in within given slice that have the minimum value in `ffMatrix`. Ordered by decreasing number
 * of minimal neighbors.
 */
export function closestInRect(slice: Rect, ffMatrix: ReadableMatrix, boundaryOnly: boolean, excluded?: KeyedSet<XY>): XY[] {
  let result = XYSet();
  let minValue = UNREACHABLE_COST;

  const f = (xy: XY) => {
    if (excluded === undefined || !excluded.has(xy)) {
      const v = ffMatrix.get(xy.x, xy.y);
      if (v < minValue) {
        minValue = v;
        result = XYSet(xy);
      } else if (v === minValue) {
        result.add(xy);
      }
    }
  };

  if (boundaryOnly) {
    rectBoundary(slice).forEach(f);
  } else {
    forEachXYInRect(slice, f);
  }

  const scoredResult = result.values().map((xy) => ({
    xy,
    score: rectBoundary(cBall(xy, 1)).reduce((acc, xy2) => acc + (result.has(xy2) ? 1 : 0), 0)
  }));

  return scoredResult.sort((xy1, xy2) => xy2.score - xy1.score).map(({ xy }) => xy);
}
