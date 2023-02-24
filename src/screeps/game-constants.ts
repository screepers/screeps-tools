// Constants that are present in the official Screeps in-game API.

export const TOWER_FALLOFF = 0.75;
export const TOWER_FALLOFF_RANGE = 20;
export const TOWER_OPTIMAL_RANGE = 5;
export const TOWER_POWER_ATTACK = 600;

export const STRUCTURE_EXTENSION = 'extension';
export const STRUCTURE_RAMPART = 'rampart';
export const STRUCTURE_ROAD = 'road';
export const STRUCTURE_SPAWN = 'spawn';
export const STRUCTURE_LINK = 'link';
export const STRUCTURE_WALL = 'constructedWall';
export const STRUCTURE_KEEPER_LAIR = 'keeperLair';
export const STRUCTURE_CONTROLLER = 'controller';
export const STRUCTURE_STORAGE = 'storage';
export const STRUCTURE_TOWER = 'tower';
export const STRUCTURE_OBSERVER = 'observer';
export const STRUCTURE_POWER_BANK = 'powerBank';
export const STRUCTURE_POWER_SPAWN = 'powerSpawn';
export const STRUCTURE_EXTRACTOR = 'extractor';
export const STRUCTURE_LAB = 'lab';
export const STRUCTURE_TERMINAL = 'terminal';
export const STRUCTURE_CONTAINER = 'container';
export const STRUCTURE_NUKER = 'nuker';
export const STRUCTURE_FACTORY = 'factory';
export const STRUCTURE_INVADER_CORE = 'invaderCore';
export const STRUCTURE_PORTAL = 'portal';

export const TERRAIN_MASK_WALL = 1;
export const TERRAIN_MASK_SWAMP = 2;
export const TERRAIN_MASK_LAVA = 4;

export const CREEP_LIFE_TIME: number = 1500;
export const CREEP_CLAIM_LIFE_TIME: number = 600;
export const LAB_BOOST_ENERGY: number = 20;
export const LAB_BOOST_MINERAL: number = 30;
export const SPAWN_ENERGY_CAPACITY: number = 300;

export const BODYPART_COST: Record<BodyPartConstant, number> = {
    move: 50,
    work: 100,
    attack: 80,
    carry: 50,
    heal: 250,
    ranged_attack: 150,
    tough: 10,
    claim: 600
};

export const EXTENSION_ENERGY_CAPACITY: {[level: number]: number} = {
    0: 50,
    1: 50,
    2: 50,
    3: 50,
    4: 50,
    5: 50,
    6: 50,
    7: 100,
    8: 200
};

export const CONTROLLER_STRUCTURES: {[structure: string]: {[level: number]: number}} = {
    spawn: { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3 },
    extension: { 0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60 },
    link: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2, 6: 3, 7: 4, 8: 6 },
    road: { 0: 2500, 1: 2500, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    constructedWall: { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    rampart: { 1: 0, 2: 2500, 3: 2500, 4: 2500, 5: 2500, 6: 2500, 7: 2500, 8: 2500 },
    storage: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1 },
    tower: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 6 },
    observer: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    powerSpawn: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    extractor: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
    terminal: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1 },
    lab: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 3, 7: 6, 8: 10 },
    container: { 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5 },
    nuker: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 1 },
    factory: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 1, 8: 1 },
};