import {KeyedMap} from '../data-structures/KeyedMap';
import {KeyedSet} from '../data-structures/KeyedSet';
import {Rect, roomRect} from './Rect';
import {ROOM_SIZE} from '../screeps/constants';

export interface XY {
    x: number,
    y: number
}

export function xyInfinity() {
    return {x: Infinity, y: Infinity};
}

export function forEachXY(f: (xy: XY) => void) {
    for (let y = 0; y < ROOM_SIZE; ++y) {
        for (let x = 0; x < ROOM_SIZE; ++x) {
            f({x, y});
        }
    }
}

export function addXY(xy1: XY, xy2: XY): XY {
    return {
        x: xy1.x + xy2.x,
        y: xy1.y + xy2.y
    };
}

export function mulXY(xy: XY, c: number): XY {
    return {
        x: c * xy.x,
        y: c * xy.y
    };
}

export function isInRoom({x, y}: XY): boolean {
    return 0 <= x && x < ROOM_SIZE && 0 <= y && y < ROOM_SIZE;
}

export function XYSet(...args: XY[]) {
    const result = new KeyedSet<XY>((xy) => encXY(xy));
    args.forEach((xy) => result.add(xy));
    return result;
}

export function XYMap<V>() {
    return new KeyedMap<XY, V>((xy) => encXY(xy));
}

/**
 * Chebyshev distance between two points with the same room. Optimized for the same room.
 */
export function xyCDist(pos1: XY, pos2: XY) {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
}

export function minXYCDist<T1 extends XY, T2 extends XY>(start: T1, targets: T2[]): number {
    return targets.reduce((acc, p) => Math.min(acc, xyCDist(start, p)), Infinity);
}

export function xyWithMinCDist<T extends XY>(start: T, targets: T[]): T[] {
    const minDist = targets.reduce((acc, p) => Math.min(acc, xyCDist(start, p)), Infinity);
    return targets.filter((p) => xyCDist(start, p) === minDist);
}

export function xyAround(xy: XY): XY[] {
    const res: XY[] = [];
    for (let dy = -1; dy <= 1; ++dy) {
        for (let dx = -1; dx <= 1; ++dx) {
            const x = xy.x + dx;
            const y = xy.y + dy;
            if ((dx !== 0 || dy !== 0) && x >= 0 && x < ROOM_SIZE && y >= 0 && y < ROOM_SIZE) {
                res.push({x, y});
            }
        }
    }
    return res;
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

/**
 * Decode a number (0-2499) into XY.
 */
export function decXY(xy: number | string): XY {
    if (typeof xy === 'string') {
        xy = parseInt(xy, 10);
    }
    const x = xy % ROOM_SIZE;
    return {
        x,
        y: (xy - x) / ROOM_SIZE
    };
}

export function xyToString({x, y}: XY): string {
    return `(${x},${y})`;
}

export function boundingRect(xys: IterableIterator<XY> | XY[]): Rect {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const {x, y} of xys) {
        if (x < minX) {
            minX = x;
        }

        if (x > maxX) {
            maxX = x;
        }

        if (y < minY) {
            minY = y;
        }

        if (y > maxY) {
            maxY = y;
        }
    }

    return {
        topLeft: {
            x: minX,
            y: minY
        },
        bottomRight: {
            x: maxX,
            y: maxY
        }
    };
}

/**
 * Maximum width and height of a rectangle with topLeft in a given coordinate that contains given point.
 */
export function maxStripes(usedXY: KeyedSet<XY>): { maxWidth: KeyedMap<XY, number>, maxHeight: KeyedMap<XY, number> } {
    const bounding = boundingRect(usedXY.values());
    const maxWidth = XYMap<number>();
    for (let y = bounding.bottomRight.y; y >= bounding.topLeft.y; --y) {
        let width = 0;
        for (let x = bounding.bottomRight.x; x >= bounding.topLeft.x; --x) {
            if (usedXY.has({x, y})) {
                width += 1;
                maxWidth.set({x, y}, width);
            } else {
                width = 0;
            }
        }
    }

    const maxHeight = XYMap<number>();
    for (let x = bounding.bottomRight.x; x >= bounding.topLeft.x; --x) {
        let height = 0;
        for (let y = bounding.bottomRight.y; y >= bounding.topLeft.y; --y) {
            if (usedXY.has({x, y})) {
                height += 1;
                maxHeight.set({x, y}, height);
            } else {
                height = 0;
            }
        }
    }

    return {
        maxWidth,
        maxHeight
    };
}

/**
 * Lexicographical comparison of two XY, first Y then X axis.
 */
export function lexicographicalXYCompare(xy1: XY, xy2: XY): number {
    return encXY(xy1) - encXY(xy2);
}
