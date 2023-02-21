import {XY} from '../coordinates/XY';
import {KeyedSet} from '../data-structures/KeyedSet';
import {Matrix, RWMatrix} from '../data-structures/Matrix';
import {ROOM_SIZE} from '../screeps/constants';

export function obstacles2baseDistanceTransformMatrix(obstacles: KeyedSet<XY>, minExitDist?: number,
                                                      width?: number, height?: number): Matrix {
    minExitDist = minExitDist ?? 0;
    width = width ?? ROOM_SIZE;
    height = height ?? ROOM_SIZE;

    const matrix = new Matrix(Uint8Array, width, height);

    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const obstacleOrBorder =
                obstacles.has({x, y}) ||
                x < minExitDist || y < minExitDist ||
                x > width - 1 - minExitDist || y > height - 1 - minExitDist;
            matrix.set(x, y, obstacleOrBorder ? 0 : ROOM_SIZE);
        }
    }

    return matrix;
}

/**
 * CostMatrix with Chebyshev distance from the nearest wall or exit.
 * Modifies the matrix.
 */
export function cDistanceTransform(matrix: RWMatrix) {
    mDistanceTransform(matrix);

    distanceTransform1DPass(matrix, 1, 1);
    distanceTransform1DPass(matrix, 1, -1);
    distanceTransform1DPass(matrix, -1, 1);
    distanceTransform1DPass(matrix, -1, -1);

    return matrix;
}

/**
 * CostMatrix with Manhattan distance from the nearest wall or exit.
 * Modifies the matrix.
 */
export function mDistanceTransform(matrix: RWMatrix) {
    distanceTransform1DPass(matrix, 1, 0);
    distanceTransform1DPass(matrix, -1, 0);
    distanceTransform1DPass(matrix, 0, 1);
    distanceTransform1DPass(matrix, 0, -1);
}

/**
 * Single-dimensional distance transform in a single direction.
 * Combining it with others works because minimal path from an obstacle to target point in a metric with
 * finite movement directions consists of up to two segments and either it does not matter if one direction
 * is taken first and the other later, or it matters because of an obstacle on the way that is closer to the target
 * and the distance should have been computed from it.
 */
export function distanceTransform1DPass(matrix: RWMatrix, dx: number, dy: number) {
    if (dx === 0) {
        const start = dy > 0 ? 0 : matrix.height - 1;
        const end = dy > 0 ? matrix.height : -1;
        for (let x = matrix.width - 1; x !== -1; --x) {
            // We start "after" a border, so prev has distance 0.
            let prev = 0;
            for (let y = start; y !== end; y += dy) {
                const c = Math.min(prev + 1, matrix.get(x, y));
                matrix.set(x, y, c);
                prev = c;
            }
        }
    } else if (dy === 0) {
        const start = dx > 0 ? 0 : matrix.width - 1;
        const end = dx > 0 ? matrix.width : -1;
        for (let y = matrix.height - 1; y !== -1; --y) {
            // We start "after" a border, so prev has distance 0.
            let prev = 0;
            for (let x = start; x !== end; x += dx) {
                const c = Math.min(prev + 1, matrix.get(x, y));
                matrix.set(x, y, c);
                prev = c;
            }
        }
    } else {
        const start = dx > 0 ? 0 : matrix.width - 1;
        const end = dx > 0 ? matrix.width : -1;
        const midEnd = dy > 0 ? matrix.height : -1;
        for (let yy = 0; yy !== matrix.height; ++yy) {
            // We start "after" a border, so prev has distance 0.
            let prev = 0;
            let y = yy;
            let x = start;

            for (; y !== midEnd; y += dy) {
                const c = Math.min(prev + 1, matrix.get(x, y));
                matrix.set(x, y, c);
                prev = c;
                x += dx;
            }

            prev = 0;
            y = (y + matrix.height) % matrix.height;

            for (; x !== end; x += dx) {
                const c = Math.min(prev + 1, matrix.get(x, y));
                matrix.set(x, y, c);
                prev = c;
                y += dy;
            }
        }
    }
}
