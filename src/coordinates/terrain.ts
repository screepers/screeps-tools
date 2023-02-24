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

export function encodeTerrain(terrain: CellMap): string {
    let encodedTerrain = '';
    for (let y = 0; y < 50; y++) {
        for (let x = 0; x < 50; x++) {
            const cellTerrainValue = terrain[y] !== undefined && terrain[y]![x] !== undefined ? terrain[y]![x]! : 0;
            encodedTerrain = encodedTerrain + cellTerrainValue.toString();
        }
    }
    return encodedTerrain;
}