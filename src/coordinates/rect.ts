import {ROOM_SIZE} from '../screeps/constants';

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