import {KeyedSet} from '../data-structures/keyed-set';
import {roomRect} from './rect';
import {ROOM_SIZE} from '../screeps/constants';

export function XYSet(...args: XY[]) {
    const result = new KeyedSet<XY>((xy) => encXY(xy));
    args.forEach((xy) => result.add(xy));
    return result;
}

/**
 * Chebyshev distance between two points with the same room. Optimized for the same room.
 */
export function xyCDist(pos1: XY, pos2: XY) {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

export function forEachXYAround(pos: XY, f: (near: XY) => void, aroundBoundingRect?: Rect) {
    aroundBoundingRect = aroundBoundingRect ?? roomRect();

    for (let dy = -1; dy <= 1; ++dy) {
        for (let dx = -1; dx <= 1; ++dx) {
            const x = pos.x + dx;
            const y = pos.y + dy;
            if ((dx !== 0 || dy !== 0) &&
                x >= aroundBoundingRect.topLeft.x && x <= aroundBoundingRect.bottomRight.x &&
                y >= aroundBoundingRect.topLeft.y && y <= aroundBoundingRect.bottomRight.y) {
                f({x, y});
            }
        }
    }
}

/**
 * Encode XY as a number (0-2499).
 */
export function encXY(xy: XY): number {
    return xy.x + ROOM_SIZE * xy.y;
}