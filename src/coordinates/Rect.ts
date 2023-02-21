import type { XY } from './XY';
import {ROOM_SIZE} from '../screeps/constants';

export interface Rect {
  topLeft: XY,
  bottomRight: XY
}

export function rectWH(rect: Rect) {
  return {
    width: rect.bottomRight.x - rect.topLeft.x + 1,
    height: rect.bottomRight.y - rect.topLeft.y + 1
  };
}

export function roomRect(): Rect {
  return {
    topLeft: { x: 0, y: 0 },
    bottomRight: { x: ROOM_SIZE - 1, y: ROOM_SIZE - 1 }
  };
}

export function inRect(xy: XY, rect: Rect): boolean {
  return rect.topLeft.x <= xy.x && xy.x <= rect.bottomRight.x && rect.topLeft.y <= xy.y && xy.y <= rect.bottomRight.y;
}

export function invalidRect(): Rect {
  return {
    topLeft: {
      x: 1,
      y: 1
    },
    bottomRight: {
      x: 0,
      y: 0
    }
  }
}

export function cBall(center: XY, r: number): Rect {
  return {
    topLeft: {
      x: center.x - r,
      y: center.y - r
    },
    bottomRight: {
      x: center.x + r,
      y: center.y + r
    }
  };
}

export function cropToRoom(rect: Rect): Rect {
  return rectIntersection(rect, roomRect());
}

export function isRectValid(rect: Rect) {
  return rect.topLeft.x <= rect.bottomRight.x && rect.bottomRight.y <= rect.bottomRight.y;
}

export function rectIntersection(rect1: Rect, rect2: Rect) {
  return {
    topLeft: {
      x: Math.max(rect1.topLeft.x, rect2.topLeft.x),
      y: Math.max(rect1.topLeft.y, rect2.topLeft.y)
    },
    bottomRight: {
      x: Math.min(rect1.bottomRight.x, rect2.bottomRight.x),
      y: Math.min(rect1.bottomRight.y, rect2.bottomRight.y)
    }
  };
}

/**
 * Clockwise rectangle boundary (even if degenerated), starting from the top left corner.
 */
export function rectBoundary(rect: Rect): XY[] {
  const result: XY[] = [];

  if (isRectValid(rect)) {
    if (rect.topLeft.x === rect.bottomRight.x) {
      for (let y = rect.topLeft.y; y <= rect.bottomRight.y; ++y) {
        result.push({ x: rect.topLeft.x, y });
      }
    } else if (rect.topLeft.y === rect.bottomRight.y) {
      for (let x = rect.topLeft.x; x <= rect.bottomRight.x; ++x) {
        result.push({ x, y: rect.topLeft.y });
      }
    } else {
      for (let x = rect.topLeft.x; x <= rect.bottomRight.x; ++x) {
        result.push({ x, y: rect.topLeft.y });
      }
      for (let y = rect.topLeft.y + 1; y <= rect.bottomRight.y; ++y) {
        result.push({ x: rect.bottomRight.x, y });
      }
      for (let x = rect.bottomRight.x - 1; x >= rect.topLeft.x; --x) {
        result.push({ x, y: rect.bottomRight.y });
      }
      for (let y = rect.bottomRight.y - 1; y >= rect.topLeft.y + 1; --y) {
        result.push({ x: rect.topLeft.x, y });
      }
    }
  }

  return result;
}

export function forEachXYInRect(rect: Rect, f: (xy: XY) => void) {
  for (let y = rect.topLeft.y; y <= rect.bottomRight.y; ++y) {
    for (let x = rect.topLeft.x; x <= rect.bottomRight.x; ++x) {
      f({ x, y });
    }
  }
}
