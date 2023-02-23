export const RCL_ENERGY: {[level: number]: number} = {
    1: 300,
    2: 550,
    3: 800,
    4: 1300,
    5: 1800,
    6: 2300,
    7: 5600,
    8: 12900
};

export const BODYPART_NAMES: {[part: string]: string} = {
    tough: "Tough",
    move: "Move",
    work: "Work",
    carry: "Carry",
    attack: "Attack",
    ranged_attack: "Ranged Attack",
    heal: "Heal",
    claim: "Claim"
};

export const BOOSTS: {[part: string]: {[resource: string]: {[method: string]: number}}} = {
    work: {
        UO: {
            harvest: 3
        },
        UHO2: {
            harvest: 5
        },
        XUHO2: {
            harvest: 7
        },
        LH: {
            build: 1.5,
            repair: 1.5
        },
        LH2O: {
            build: 1.8,
            repair: 1.8
        },
        XLH2O: {
            build: 2,
            repair: 2
        },
        ZH: {
            dismantle: 2
        },
        ZH2O: {
            dismantle: 3
        },
        XZH2O: {
            dismantle: 4
        },
        GH: {
            upgradeController: 1.5
        },
        GH2O: {
            upgradeController: 1.8
        },
        XGH2O: {
            upgradeController: 2
        }
    },
    attack: {
        UH: {
            attack: 2
        },
        UH2O: {
            attack: 3
        },
        XUH2O: {
            attack: 4
        }
    },
    ranged_attack: {
        KO: {
            rangedAttack: 2,
            rangedMassAttack: 2
        },
        KHO2: {
            rangedAttack: 3,
            rangedMassAttack: 3
        },
        XKHO2: {
            rangedAttack: 4,
            rangedMassAttack: 4
        }
    },
    heal: {
        LO: {
            heal: 2,
            rangedHeal: 2
        },
        LHO2: {
            heal: 3,
            rangedHeal: 3
        },
        XLHO2: {
            heal: 4,
            rangedHeal: 4
        }
    },
    carry: {
        KH: {
            capacity: 2
        },
        KH2O: {
            capacity: 3
        },
        XKH2O: {
            capacity: 4
        }
    },
    move: {
        ZO: {
            fatigue: 2
        },
        ZHO2: {
            fatigue: 3
        },
        XZHO2: {
            fatigue: 4
        }
    },
    tough: {
        GO: {
            damage: .7
        },
        GHO2: {
            damage: .5
        },
        XGHO2: {
            damage: .3
        }
    }
};

export const TERRAIN_NAMES: {[terrain: string]: string} = {
    plain: "Plain",
    wall: "Wall",
    swamp: "Swamp"
};

export const TERRAIN_CODES: {[terrain: string]: number} = {
    plain: 0,
    wall: TERRAIN_MASK_WALL,
    swamp: TERRAIN_MASK_SWAMP
};

export const RESOURCES: {[name: string]: string} = {
    source: "Source",
    H: "Mineral H",
    O: "Mineral O",
    U: "Mineral U",
    K: "Mineral K",
    L: "Mineral L",
    Z: "Mineral Z",
    X: "Mineral X"
}

export const STRUCTURES: {[structure: string]: string} = {
    spawn: "Spawn",
    container: "Container",
    extension: "Extension",
    tower: "Tower",
    storage: "Storage",
    link: "Link",
    terminal: "Terminal",
    extractor: "Extractor",
    lab: "Lab",
    factory: "Factory",
    observer: "Observer",
    powerSpawn: "Power Spawn",
    nuker: "Nuker",
    rampart: "Rampart",
    constructedWall: "Wall",
    road: "Road",
    controller: "Controller",
};

export const OBSTACLE_COST = 255;
export const UNREACHABLE_COST = 254;
export const MOVE_COSTS = [1, OBSTACLE_COST, 5];

export const ROOM_SIZE = 50;