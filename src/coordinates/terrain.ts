import {ROOM_SIZE} from '../screeps/constants';
import {TERRAIN_MASK_SWAMP, TERRAIN_MASK_WALL} from '../screeps/game-constants';

export function decodeTerrain(encodedTerrain: string): CellMap {
    let terrain: CellMap = {};
    for (let y = 0; y < 50; y++) {
        terrain[y] = {};
        for (let x = 0; x < 50; x++) {
            terrain[y]![x] = parseInt(encodedTerrain.charAt(y * 50 + x));
        }
    }
    return terrain;
}

export function reencodeTerrain(terrain: EncodedBlueprint['terrain']): string {
    const result = new Array(ROOM_SIZE * ROOM_SIZE);
    result.fill(0);
    for (const {x, y} of terrain?.wall ?? []) {
        result[y * ROOM_SIZE + x] = TERRAIN_MASK_WALL.toString();
    }
    for (const {x, y} of terrain?.swamp ?? []) {
        result[y * ROOM_SIZE + x] = TERRAIN_MASK_SWAMP.toString();
    }
    return result.join('');
}