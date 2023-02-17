import {
    PROXY_SERVER_URL,
    TOWER_FALLOFF,
    TOWER_FALLOFF_RANGE,
    TOWER_OPTIMAL_RANGE,
    TOWER_POWER_ATTACK
} from './constants';

export const screepsWorlds: {[key: string]: string} = {
    mmo: 'MMO',
    season: 'Season',
};

export function apiURL(world: string) {
    return PROXY_SERVER_URL + (world === 'mmo' ? '' : '/' + world);
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