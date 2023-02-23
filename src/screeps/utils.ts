import {TOWER_FALLOFF, TOWER_FALLOFF_RANGE, TOWER_OPTIMAL_RANGE, TOWER_POWER_ATTACK} from './game-constants';

/**
 * Throws an exception if condition is false.
 * @param condition The condition that is supposed to evaluate to a true value.
 * @returns The function's argument.
 */
export function assert<T>(condition: T): asserts condition {
    if (!condition) {
        throw new Error('Assertion failed');
    }
}

const towerFalloffPerTile = TOWER_FALLOFF / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);

export function towerEffectiveness(dist: number) {
    if (dist >= TOWER_FALLOFF_RANGE) {
        return 1 - TOWER_FALLOFF;
    } else if (dist <= TOWER_OPTIMAL_RANGE) {
        return 1;
    } else {
        return 1 - (dist - TOWER_OPTIMAL_RANGE) * towerFalloffPerTile;
    }
}

export function towerDPS(dist: number) {
    return Math.round(TOWER_POWER_ATTACK * towerEffectiveness(dist));
}