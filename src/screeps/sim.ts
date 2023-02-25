import {reencodeTerrain} from '../coordinates/terrain';
import {forIn} from '../js-utils';

export function simScript(blueprint: EncodedBlueprint): string {
    // The data for each object can be found in sim using this script:
    // angular.element($('section.room')).scope().Room.save();
    const rcl = blueprint.rcl ?? 8;
    const restoredData: Record<'objects' | 'terrain', Record<string, any>[]> = {
        objects: [],
        terrain: [{
            terrain: reencodeTerrain(blueprint.terrain),
            type: 'terrain',
            _id: 'terrain'
        }]
    };
    if (blueprint.controller) {
        restoredData.objects.push({
            type: 'controller',
            x: blueprint.controller.x,
            y: blueprint.controller.y,
            level: rcl,
            progress: 0,
            downgradeTime: 20000,
            user: 'USER',
            _isDisabled: false
        });
    }
    blueprint.sources?.forEach(({x, y}) => {
        restoredData.objects.push({
            type: 'source',
            x,
            y,
            energy: 3000,
            energyCapacity: 3000,
            ticksToRegeneration: 300,
            _isDisabled:false
        });
    });
    if (blueprint.mineral) {
        restoredData.objects.push({
            type: 'mineral',
            x: blueprint.mineral.x,
            y: blueprint.mineral.y,
            mineralType: blueprint.mineral.mineralType,
            mineralAmount: 50000,
            density: 1,
            ticksToRegeneration: null,
            _isDisabled: false
        });
    }
    forIn(blueprint.buildings, (structureType: StructureConstant, xys) => {
        let spawnNumber = 1;
        xys.forEach(({x, y}) => {
            const structureObj: Record<string, any> = {
                type: structureType,
                x,
                y,
                _isDisabled: false
            };
            if (structureType === 'spawn') {
                structureObj.name = `Spawn${spawnNumber}`;
                spawnNumber += 1;
            }
            if (structureType !== 'container' && structureType !== 'constructedWall' && structureType !== 'road') {
                structureObj.user = 'USER';
            }
            switch (structureType) {
                case 'container':
                    structureObj.store = {
                        energy: 1000
                    };
                    structureObj.storeCapacity = 2000;
                    structureObj.hits = 100000;
                    structureObj.maxHits = 250000;
                    structureObj.nextDecayTime = 20;
                    break;

                case 'constructedWall':
                    structureObj.hits = 5000;
                    structureObj.hitsMax = 300000000;
                    break;

                case 'extension':
                    const capacity = rcl === 8 ? 200 : (rcl === 7 ? 100 : 50);
                    structureObj.store = {
                        energy: capacity / 2
                    };
                    structureObj.storeCapacityResource = {
                        energy: capacity
                    };
                    structureObj.hits = 1000;
                    structureObj.off = false;
                    break;

                case 'extractor':
                    structureObj.hits = 500;
                    break;

                case 'factory':
                    structureObj.store = {
                        energy: 0
                    };
                    structureObj.storeCapacity = 0;
                    structureObj.hits = 1000;
                    structureObj.cooldown = 0;
                    structureObj.actionLog = {
                        produce: null
                    };
                    break;

                case 'lab':
                    structureObj.store = {
                        energy: 1000
                    };
                    structureObj.storeCapacityResource = {
                        energy: 2000
                    };
                    structureObj.hits = 500;
                    structureObj.cooldown = 0;
                    structureObj.actionLog = {
                        runReaction: null,
                        reverseReaction: null
                    };
                    break;

                case 'link':
                    structureObj.store = {
                        energy: 400
                    };
                    structureObj.storeCapacityResource = {
                        energy: 800
                    };
                    structureObj.hits = 1000;
                    structureObj.cooldown = 0;
                    structureObj.actionLog = {
                        transferEnergy: null
                    };
                    break;

                case 'nuker':
                    structureObj.hits = 1000;
                    structureObj.store = {
                        energy: 300000,
                        G: 5000
                    };
                    structureObj.storeCapacityResource = {
                        energy: 300000,
                        G: 5000
                    };
                    structureObj.cooldownTime = 20;
                    break;

                case 'observer':
                    structureObj.hits = 500;
                    structureObj.observeRoom = null;
                    break;

                case 'powerSpawn':
                    structureObj.store = {
                        energy: 2500,
                        power: 50
                    };
                    structureObj.storeCapacityResource = {
                        energy: 5000,
                        power: 100
                    };
                    structureObj.hits = 5000;
                    break;

                case 'spawn':
                    structureObj.store = {
                        energy: 300
                    };
                    structureObj.storeCapacityResource = {
                        energy: 300
                    };
                    structureObj.hits = 5000;
                    structureObj.spawning = null;
                    structureObj.off = false;
                    break;

                case 'road':
                    structureObj.hits = 1000;
                    structureObj.maxHits = 5000;
                    structureObj.nextDecayTime = 20;
                    break;

                case 'rampart':
                    structureObj.hits = 5000;
                    structureObj.maxHits = 300000000;
                    structureObj.nextDecayTime = 20;
                    break;

                case 'storage':
                    structureObj.store = {
                        'energy': 500000
                    };
                    structureObj.storeCapacity = 1000000;
                    structureObj.hits = 10000;
                    break;

                case 'terminal':
                    structureObj.store = { energy: 150000 };
                    structureObj.storeCapacity = 300000;
                    structureObj.hits = 3000;
                    break;

                case 'tower':
                    structureObj.store = {
                        energy: 500
                    };
                    structureObj.storeCapacityResource = {
                        energy: 1000
                    };
                    structureObj.hits = 3000;
                    structureObj.actionLog = {
                        attack: null,
                        heal: null,
                        repair: null
                    };
                    break;
            }

            if (structureObj.hitsMax === undefined) {
                structureObj.hitsMax = structureObj.hits;
            }

            restoredData.objects.push(structureObj);
        });
    });
    return `const data = JSON.parse('${JSON.stringify(restoredData)}');\n` +
        `const gameElement = angular.element($('body'));\n` +
        `const userId = gameElement.injector().get("Auth").Me._id;\n` +
        `data.objects.forEach((obj) => { if (obj.user === 'USER') { obj.user = userId } });\n` +
        `const roomScope = angular.element($('section.room')).scope();\n` +
        `roomScope.Room.restoreData = JSON.stringify(data);\n` +
        `roomScope.Room.restore();`;
}