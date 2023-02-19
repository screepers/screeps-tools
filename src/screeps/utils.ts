import {TOWER_FALLOFF, TOWER_FALLOFF_RANGE, TOWER_OPTIMAL_RANGE, TOWER_POWER_ATTACK} from './constants';

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