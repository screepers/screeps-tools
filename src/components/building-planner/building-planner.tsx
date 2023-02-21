import * as React from 'react';
import * as LZString from 'lz-string';
import {
    CONTROLLER_STRUCTURES, OBSTACLE_COST,
    RESOURCES, ROOM_SIZE,
    STRUCTURES,
    TERRAIN_CODES,
    TERRAIN_MASK_WALL,
    TERRAIN_NAMES, UNREACHABLE_COST
} from '../../screeps/constants';
import {MapCell} from './map-cell';
import {ModalJson} from './modal-json';
import {ModalReset} from './modal-reset';
import {ModalSettings} from './modal-settings';
import {ModalImportRoomForm} from './modal-import-room';
import {Col, Container, Navbar, Row, Toast, ToastBody} from 'reactstrap';
import Select, {OptionTypeBase} from 'react-select';
import {towerDPS} from '../../screeps/utils';
import {apiURL} from '../../screeps/api';
import {SCREEPS_WORLDS} from './constants';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faHighlighter, faLink, faTowerObservation} from '@fortawesome/free-solid-svg-icons';
import {floodFill} from '../../algorithms/floodFill';
import {XYSet} from '../../coordinates/XY';
import {KeyedSet} from '../../data-structures/KeyedSet';
import {cDistanceTransform, obstacles2baseDistanceTransformMatrix} from '../../algorithms/distanceTransform';

const NO_ANALYSIS = 0;
const TOWER_DAMAGE_ANALYSIS = 1;
const FLOOD_FIELD_ANALYSIS = 2;
const DISTANCE_TRANSFORM_ANALYSIS = 3;

const STATE_LOCAL_STORAGE_KEY = 'buildingPlannerStateV2';

const NOT_SAVED_STATE_KEYS = ['x', 'y', 'worlds', 'analysisResult', 'toastMessage'];

const BUILDING_PLANNER_DEFAULTS = {
    RCL: 8,
    ROOM: '',
    SHARD: '',
    WORLD: 'mmo',
};

const SCALE_MIN: number = 1.0;
const SCALE_MAX: number = 4.0;
const SCALE_STEP: number = 0.1;

export class BuildingPlanner extends React.Component {
    state: Readonly<{
        room: string;
        world: string;
        shard: string;
        terrain: CellMap;
        brush: string;
        rcl: number;
        structures: { [structure: string]: XY[] };
        sources: XY[];
        minerals: { mineralType: string, x: number; y: number }[];
        settings: BuildingPlannerSettings;
        scale: number;
        showExtraTools: boolean;
        selectingCells: boolean;
        selectedCells: CellMap;
        toastMessage: string;
        x: number;
        y: number;
        worlds: { [worldName: string]: { shards: string[] } };
        analysisMode: number;
        analysisResult: CellMap;
    }>;

    constructor(props: any) {
        super(props);
        this.state = this.getInitialState();
        this.setStateAndRefresh(this.state, true, true);
    }

    componentDidMount() {
        document.getElementById('room-map-container')?.addEventListener('wheel', this.onWheel.bind(this), {passive: false});

        this.loadShards();

        let params = location.href.split('?')[1];
        let searchParams = new URLSearchParams(params);

        if (searchParams.get('share')) {
            const json = LZString.decompressFromEncodedURIComponent(searchParams.get('share')!);
            if (json) {
                this.importJson(JSON.parse(json));
            }
            // Removing the share part to not wipe the state after refresh
            window.history.pushState({}, document.title, `${location.origin}${location.pathname}${location.hash}`);
        }
    }

    getInitialState(reset?: boolean) {
        let terrain: CellMap = {};

        for (let y = 0; y < 50; y++) {
            terrain[y] = {};
            for (let x = 0; x < 50; x++) {
                terrain[y][x] = 0;
            }
        }

        const state = {
            room: BUILDING_PLANNER_DEFAULTS.ROOM,
            world: BUILDING_PLANNER_DEFAULTS.WORLD,
            shard: BUILDING_PLANNER_DEFAULTS.SHARD,
            terrain: terrain,
            brush: 'spawn',
            rcl: BUILDING_PLANNER_DEFAULTS.RCL,
            structures: {},
            sources: [],
            minerals: [],
            settings: {
                showStatsOverlay: true,
                allowBorderStructure: false,
                cellTextFontSize: 6,
            },
            scale: 1.5,
            showExtraTools: false,
            selectingCells: false,
            selectedCells: {},
            toastMessage: '',
            x: 0,
            y: 0,
            worlds: {
                mmo: {
                    shards: []
                },
                season: {
                    shards: []
                }
            },
            analysisMode: NO_ANALYSIS,
            analysisResult: {},
        };

        const storedState = localStorage.getItem(STATE_LOCAL_STORAGE_KEY);
        if (storedState !== null) {
            try {
                const parsedState = JSON.parse(storedState);
                Object.assign(state.settings, parsedState.settings);
                delete parsedState.settings;
                if (!reset) {
                    Object.assign(state, parsedState);
                }
            } catch (e) {
                console.error('There was an error while loading the saved state.');
                console.error(e);
            }
        }

        return state;
    }

    saveState() {
        const state = Object.assign({}, this.state) as { [key: string]: any };

        for (const key of NOT_SAVED_STATE_KEYS) {
            delete state[key];
        }

        localStorage.setItem(STATE_LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    resetState() {
        this.setStateAndRefresh(this.getInitialState(true));
        this.loadShards();
    }

    fetchFromAPI(path: string, world: string, handler: (data: any) => void) {
        const url = `${apiURL(world)}${path}`;
        fetch(url).then((response) => {
            response.json().then((data: any) => {
                if (data.error) {
                    this.showToast(`Error: ${data.error}.`)
                } else {
                    handler(data)
                }
            }).catch((e) => {
                this.showToast(`Invalid JSON fetched from API at ${url}.`)
                console.error(e);
            });
        }).catch((e) => {
            this.showToast(`Failed to fetch data from API at ${url}.`)
            console.error(e);
        });
    }

    loadShards() {
        for (const world in SCREEPS_WORLDS) {
            this.fetchFromAPI(`/api/game/shards/info`, world, (data) => {
                if (!data || Object.keys(data).length === 0) {
                    return;
                }
                const shards: string[] = [];
                data.shards.forEach((shard: { name: string }) => {
                    shards.push(shard.name);
                });
                this.setState({
                    worlds: {
                        ...this.state.worlds,
                        [world]: {
                            shards: shards
                        }
                    }
                });
            });
        }
    }

    exportJson(includeRoomFeatures = false) {
        let buildings: { [structure: string]: XY[] } = {};
        let roomFeatures: { [name: string]: XY[] } = {};

        let json = {
            name: this.state.room,
            shard: this.state.shard,
            rcl: this.state.rcl,
            buildings: buildings
        };
        const keepStructures = Object.keys(CONTROLLER_STRUCTURES).filter((name) => name !== "controller");

        Object.keys(this.state.structures).forEach((structure) => {
            if (this.state.structures[structure].length > 0) {
                if (keepStructures.indexOf(structure) > -1) {
                    if (!buildings[structure]) {
                        buildings[structure] = this.state.structures[structure];
                    }
                } else {
                    if (!roomFeatures[structure]) {
                        roomFeatures[structure] = this.state.structures[structure];
                    }
                }
            }
        });

        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                const terrain = this.state.terrain[y][x];
                if (terrain & 3) {
                    const terrainName = terrain & 1 ? 'wall' : 'swamp';
                    if (!roomFeatures[terrainName]) {
                        roomFeatures[terrainName] = [];
                    }
                    roomFeatures[terrainName].push({x, y});
                }
            }
        }

        if (this.state.sources && this.state.sources.length > 0) {
            roomFeatures.source = this.state.sources;
        }

        for (const {mineralType, x, y} of this.state.minerals) {
            if (roomFeatures[mineralType] === undefined) {
                roomFeatures[mineralType] = [];
            }
            roomFeatures[mineralType].push({x, y});
        }

        const result = includeRoomFeatures ? {...json, roomFeatures} : json;

        console.log('Exported JSON:')
        console.log(json);

        return result;
    }

    importJson(json: any) {
        console.log('Imported JSON:')
        console.log(json);

        if (json.roomFeatures || !json.shard || !json.name) {
            const terrain: CellMap = {};

            for (let y = 0; y < 50; y++) {
                terrain[y] = {};
                for (let x = 0; x < 50; x++) {
                    terrain[y][x] = 0;
                }
            }

            Object.entries(TERRAIN_CODES).forEach(([name, code]) => {
                if (json.roomFeatures[name] !== undefined) {
                    json.roomFeatures[name].forEach(({x, y}: { x: number; y: number }) => {
                        terrain[y][x] = code;
                    });
                }
            });

            let sources: { x: number, y: number }[] = [];
            if (json.roomFeatures.source !== undefined) {
                sources = json.roomFeatures.source;
            }

            const minerals: { mineralType: string, x: number, y: number }[] = [];
            Object.keys(RESOURCES).forEach((name) => {
                if (name !== 'source') {
                    if (json.roomFeatures[name] !== undefined) {
                        json.roomFeatures[name].forEach(({x, y}: { x: number, y: number }) => {
                            minerals.push({
                                mineralType: name,
                                x,
                                y
                            });
                        });
                    }
                }
            });

            let structures: {
                [structure: string]: XY[]
            } = {};

            Object.keys(json.buildings).forEach((structure) => {
                structures[structure] = json.buildings[structure];
            });

            this.setStateAndRefresh({
                room: json.name ?? BUILDING_PLANNER_DEFAULTS.ROOM,
                world: json.world ?? BUILDING_PLANNER_DEFAULTS.WORLD,
                shard: json.shard ?? BUILDING_PLANNER_DEFAULTS.SHARD,
                rcl: typeof (json.rcl) === 'number'
                    ? Math.max(1, Math.min(8, json.rcl))
                    : BUILDING_PLANNER_DEFAULTS.RCL,
                terrain,
                sources,
                minerals,
                structures,
                selectedCells: {},
            });
        } else if (json.shard && json.name) {
            let world = 'mmo';
            if (json.world && json.world === 'season') {
                world = 'season';
            }
            this.fetchFromAPI(`/api/game/room-terrain?shard=${json.shard}&room=${json.name}&encoded=1`, world, (terrainData) => {
                console.log('Imported terrain JSON:')
                console.log(terrainData);

                let encodedTerrain = terrainData.terrain[0].terrain;
                let terrain: CellMap = {};
                for (let y = 0; y < 50; y++) {
                    terrain[y] = {};
                    for (let x = 0; x < 50; x++) {
                        terrain[y][x] = parseInt(encodedTerrain.charAt(y * 50 + x));
                    }
                }

                this.fetchFromAPI(`/api/game/room-objects?shard=${json.shard}&room=${json.name}`, world, (data) => {
                    console.log('Imported structures JSON:')
                    console.log(data);

                    const sources: XY[] = [];
                    const minerals: { mineralType: string, x: number; y: number }[] = [];
                    let structures: {[structure: string]: XY[]} = {};

                    let keepStructures = ['controller'];
                    if (!json.buildings) {
                        keepStructures.push(...Object.keys(CONTROLLER_STRUCTURES));
                    } else {
                        structures = json.buildings;
                    }
                    for (let o of data.objects) {
                        if (o.type == 'source') {
                            sources.push({
                                x: o.x,
                                y: o.y
                            });
                        } else if (o.type == 'mineral') {
                            minerals.push({
                                mineralType: o.mineralType,
                                x: o.x,
                                y: o.y
                            });
                        } else {
                            if (keepStructures.indexOf(o.type) > -1) {
                                if (!structures[o.type]) {
                                    structures[o.type] = [];
                                }
                                structures[o.type].push({
                                    x: o.x,
                                    y: o.y
                                });
                            }
                        }
                    }

                    this.setStateAndRefresh({
                        world: json.world,
                        shard: json.shard,
                        room: json.name,
                        terrain,
                        structures,
                        sources,
                        minerals,
                        selectedCells: {},
                    });
                });
            });
        }
    }

    paintCell(x: number, y: number) {
        if (this.state.selectingCells) {
            const selectedCells: CellMap = {
                ...this.state.selectedCells,
                [y]: {
                    ...this.state.selectedCells[y]
                }
            };
            if (!selectedCells[y][x]) {
                selectedCells[y][x] = 1;
                this.setStateAndRefresh({selectedCells});
            }
            return;
        }

        const terrain = TERRAIN_CODES[this.state.brush];
        if (terrain !== undefined) {
            const prevTerrain = this.state.terrain[y][x];
            if (prevTerrain === terrain) {
                return;
            }

            this.setStateAndRefresh({
                terrain: {
                    ...this.state.terrain,
                    [y]: {
                        ...this.state.terrain[y],
                        [x]: terrain
                    }
                }
            });
            return;
        }

        if (RESOURCES[this.state.brush] !== undefined) {
            if (this.state.brush === "source") {
                if (!this.hasSource(x, y)) {
                    this.removeResource(x, y);
                    this.setStateAndRefresh({
                        sources: [...this.state.sources, {x, y}]
                    });
                }
            } else {
                if (this.getMineral(x, y) !== this.state.brush) {
                    this.removeResource(x, y);
                    this.setStateAndRefresh({
                        minerals: [...this.state.minerals, {mineralType: this.state.brush, x, y}]
                    });
                }
            }
            return;
        }

        let structures = this.state.structures;
        let added = false;

        let allowed = false;
        if (this.state.settings.allowBorderStructure || (x > 0 && x < 49 && y > 0 && y < 49)) {
            allowed = true;
        }

        if (allowed && CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]) {
            if (!structures[this.state.brush]) {
                structures[this.state.brush] = [];
            }

            if (structures[this.state.brush].length < CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]) {
                let foundAtPos = false;

                // remove existing structures at this position except ramparts
                if (this.state.brush != 'rampart') {
                    for (let type in structures) {
                        if (type == 'rampart') {
                            continue;
                        }
                        if ((this.state.brush == 'container' && type == 'road') ||
                            (this.state.brush == 'road' && type == 'container')) {
                            continue;
                        }

                        foundAtPos = structures[type].filter(pos => {
                            return pos.x === x && pos.y === y;
                        }).length > 0;

                        if (foundAtPos) {
                            this.removeStructure(x, y, type);
                        }
                    }
                }

                if (structures[this.state.brush].length > 0) {
                    foundAtPos = structures[this.state.brush].filter(pos => {
                        return pos.x === x && pos.y === y;
                    }).length > 0;
                }

                if (!foundAtPos) {
                    structures[this.state.brush].push({
                        x: x,
                        y: y
                    });
                    added = true;
                }
            }
        }

        if (added) {
            this.setStateAndRefresh({structures: structures});
        }
        return added;
    }

    clearCell(x: number, y: number) {
        if (this.state.selectingCells) {
            const selectedCells: CellMap = {
                ...this.state.selectedCells,
                [y]: {
                    ...this.state.selectedCells[y]
                }
            };
            if (selectedCells[y][x]) {
                delete selectedCells[y][x];
                this.setStateAndRefresh({selectedCells});
            }
        } else {
            let structures = {
                ...this.state.structures
            };

            for (let structure in this.state.structures) {
                structures[structure] = structures[structure].filter(({x: xx, y: yy}) => x !== xx || y !== yy);
            }

            const sources = this.state.sources.filter(({x: xx, y: yy}) => x !== xx || y !== yy);

            const minerals = this.state.minerals.filter(({x: xx, y: yy}) => x !== xx || y !== yy);

            this.setStateAndRefresh({structures, sources, minerals})
        }
    }

    removeStructure(x: number, y: number, structure: string | null) {
        let structures = this.state.structures;

        if (structure && structures[structure]) {
            structures[structure] = structures[structure].filter(pos => {
                return !(pos.x === x && pos.y === y);
            });

            this.setStateAndRefresh({structures});
        }
    }

    // Should be removed and usages replaced with further modified clearCell with filter parameters
    removeResource(x: number, y: number) {
        const withoutXYSource = this.state.sources.filter(({x: sourceX, y: sourceY}) =>
            x !== sourceX || y !== sourceY);
        if (withoutXYSource.length !== this.state.sources.length) {
            this.setStateAndRefresh({sources: withoutXYSource});
        }

        const withoutXYMineral = this.state.minerals.filter(({x: mineralX, y: mineralY}) =>
            x !== mineralX || y !== mineralY);
        if (withoutXYMineral.length !== this.state.minerals.length) {
            this.setStateAndRefresh({minerals: withoutXYMineral});
        }
    }

    getRoadProps(x: number, y: number) {
        let roadProps = {
            middle: false,
            top: false,
            top_right: false,
            right: false,
            bottom_right: false,
            bottom: false,
            bottom_left: false,
            left: false,
            top_left: false
        };
        if (this.isRoad(x, y)) {
            roadProps.middle = true;
            for (let rx of [-1, 0, 1]) {
                for (let ry of [-1, 0, 1]) {
                    if (rx === 0 && ry === 0) continue;
                    if (this.isRoad(x + rx, y + ry)) {
                        if (rx === -1 && ry === -1) {
                            roadProps.top_left = true;
                        } else if (rx === 0 && ry === -1) {
                            roadProps.top = true;
                        } else if (rx === 1 && ry === -1) {
                            roadProps.top_right = true;
                        } else if (rx === 1 && ry === 0) {
                            roadProps.right = true;
                        } else if (rx === 1 && ry === 1) {
                            roadProps.bottom_right = true;
                        } else if (rx === 0 && ry === 1) {
                            roadProps.bottom = true;
                        } else if (rx === -1 && ry === 1) {
                            roadProps.bottom_left = true;
                        } else if (rx === -1 && ry === 0) {
                            roadProps.left = true;
                        }
                    }
                }
            }
        }
        return roadProps;
    }

    getStructure(x: number, y: number): string | null {
        let structure = null;
        Object.keys(this.state.structures).forEach((structureName) => {
            if (structureName != 'road' && structureName != 'rampart') {
                this.state.structures[structureName].forEach((pos) => {
                    if (pos.x === x && pos.y === y) {
                        structure = structureName;
                    }
                });
            }
        });
        return structure;
    }

    isRoad(x: number, y: number) {
        let road = false;
        if (this.state.structures.road) {
            this.state.structures.road.forEach((pos) => {
                if (pos.x === x && pos.y === y) {
                    road = true;
                }
            });
        }
        return road;
    }

    isRampart(x: number, y: number) {
        let rampart = false;
        if (this.state.structures.rampart) {
            this.state.structures.rampart.forEach((pos) => {
                if (pos.x === x && pos.y === y) {
                    rampart = true;
                }
            });
        }
        return rampart;
    }

    hasSource(x: number, y: number): boolean {
        return this.state.sources.some(({x: sourceX, y: sourceY}) => sourceX === x && sourceY === y);
    }

    getMineral(x: number, y: number): string | null {
        for (const {x: mineralX, y: mineralY, mineralType} of this.state.minerals) {
            if (mineralX === x && mineralY === y) {
                return mineralType;
            }
        }
        return null;
    }

    isSelected(x: number, y: number): boolean {
        return this.state.selectedCells[y] !== undefined && !!this.state.selectedCells[y][x];
    }

    getSelectedBrush() {
        if (!this.state.brush) {
            return null;
        }
        let label;
        if (STRUCTURES[this.state.brush] !== undefined) {
            label = this.getStructureBrushLabel(this.state.brush);
        } else if (TERRAIN_NAMES[this.state.brush] !== undefined) {
            label = this.getTerrainBrushLabel(this.state.brush)
        } else {
            label = this.getResourceBrushLabel(this.state.brush);
        }
        const selected: OptionTypeBase = {
            value: this.state.brush,
            label
        };
        return selected;
    }

    getBrushes() {
        const options: OptionTypeBase[] = [];
        Object.keys(STRUCTURES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getStructureBrushLabel(key)
            };
            if (this.getStructureDisabled(key)) {
                props.isDisabled = true;
            }
            options.push(props);
        });
        Object.keys(TERRAIN_NAMES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getTerrainBrushLabel(key)
            };
            options.push(props);
        });
        Object.keys(RESOURCES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getResourceBrushLabel(key)
            };
            options.push(props);
        });
        return options;
    }

    getStructureDisabled(key: string) {
        const total = CONTROLLER_STRUCTURES[key][this.state.rcl];
        if (total === 0) {
            return true;
        }
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        return placed >= total;
    }

    getTerrainBrushLabel(key: string) {
        const terrainName = TERRAIN_NAMES[key];
        const placed = Object.values(this.state.terrain).reduce((acc, terrainRow) =>
            acc + Object.values(terrainRow).filter((terrain) => terrain === key).length, 0);
        return (
            <div>
                <img src={`assets/terrains/${key}.png`} alt={terrainName}/>{' '}
                {terrainName}
                <span className="right">{placed}</span>
            </div>
        );
    }

    getResourceBrushLabel(key: string) {
        const resource = RESOURCES[key];
        let placed;
        if (resource === "source") {
            placed = this.state.sources.length;
        } else {
            placed = this.state.minerals.filter(({mineralType}) => mineralType === key).length;
        }
        return (
            <div>
                <img src={`assets/resources/${key}.png`} alt={resource}/>{' '}
                {resource}
                <span className="right">{placed}</span>
            </div>
        );
    }

    getStructureBrushLabel(key: string) {
        const structure = STRUCTURES[key];
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        const total = CONTROLLER_STRUCTURES[key][this.state.rcl];
        return (
            <div>
                <img src={`assets/structures/${key}.png`} alt={structure}/>{' '}
                {structure}
                <span className="right">{placed}/{total}</span>
            </div>
        );
    }

    getRCLOptions() {
        const options: OptionTypeBase[] = [];
        const roomLevels = Array.from(Array(8), (_, x) => ++x);
        roomLevels.map(key => {
            options.push({
                value: key,
                label: `RCL ${key}`
            });
        });
        return options;
    }

    setBrush(brush: string) {
        this.setStateAndRefresh({brush: brush});
    }

    setRCL(rcl: number) {
        this.setStateAndRefresh({rcl: rcl});

        if (CONTROLLER_STRUCTURES[this.state.brush][rcl] === 0) {
            this.setStateAndRefresh({brush: null});
        }
    }

    getSelectedRCL(): OptionTypeBase {
        return {
            value: this.state.rcl,
            label: `RCL ${this.state.rcl}`
        };
    }

    getSelectTheme(theme: any) {
        return {
            ...theme,
            colors: {
                ...theme.colors,
                primary: '#2684ff',
                primary25: '#555',
                primary50: '#555',
                neutral0: '#333',
                neutral80: '#efefef',
            }
        };
    }

    convertToFixed(numberOrString: number | string) {
        return parseFloat(numberOrString.toString()).toFixed(1);
    }

    changeScale(e: any, decrease: boolean = false) {
        let scale;
        if (e) {
            // element onChange
            scale = e.target.valueAsNumber;
        } else {
            // map-cell onWheel
            const change = decrease ? -SCALE_STEP : SCALE_STEP;
            scale = this.state.scale + change;
        }

        const fixedScale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, scale));
        if (fixedScale !== this.state.scale) {
            this.setStateAndRefresh({scale: fixedScale});
        }
    }

    towerDamage(state: typeof this.state): CellMap {
        const towerPos = state.structures['tower'] ?? [];

        const towerDamage: CellMap = {};
        for (let y = 0; y < 50; y++) {
            towerDamage[y] = {};
            for (let x = 0; x < 50; x++) {
                // Show nothing on walls that do not have tunnels
                if (state.terrain[y][x] & TERRAIN_MASK_WALL) {
                    if (state.structures['road']) {
                        if (!state.structures['road'].some(({x: xx, y: yy}) => xx === x && yy === y)) {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }

                towerDamage[y][x] = 0;

                for (const {x: tx, y: ty} of towerPos) {
                    towerDamage[y][x] += towerDPS(Math.max(Math.abs(tx - x), Math.abs(ty - y)));
                }
            }
        }

        return towerDamage;
    }

    obstacles(state: typeof this.state, ignoreStructures?: boolean): KeyedSet<XY> {
        const result = XYSet();
        for (let y = 0; y < ROOM_SIZE; y++) {
            for (let x = 0; x < ROOM_SIZE; x++) {
                if (state.terrain[y] && state.terrain[y][x] === TERRAIN_MASK_WALL) {
                    result.add({x, y});
                }
            }
        }
        if (!ignoreStructures) {
            Object.entries(state.structures).forEach(([structureType, pos]: [string, XY[]]) => {
                if (structureType !== 'road' && structureType !== 'rampart' && structureType !== 'container') {
                    pos.forEach((xy: XY) => result.add(xy));
                }
            });
        }
        return result;
    }

    selectedCells(state: typeof this.state): XY[] {
        const selectedCells: XY[] = [];
        for (let y = 0; y < ROOM_SIZE; y++) {
            for (let x = 0; x < ROOM_SIZE; x++) {
                if (state.selectedCells[y] && state.selectedCells[y][x]) {
                    selectedCells.push({x, y});
                }
            }
        }
        return selectedCells;
    }

    floodFill(state: typeof this.state): CellMap {
        const ff = floodFill(this.obstacles(state), this.selectedCells(state));
        const result: CellMap = {};
        for (let y = 0; y < ROOM_SIZE; y++) {
            for (let x = 0; x < ROOM_SIZE; x++) {
                if (ff.get(x, y) !== OBSTACLE_COST && ff.get(x, y) !== UNREACHABLE_COST) {
                    result[y] = result[y] ?? {};
                    result[y][x] = ff.get(x, y);
                }
            }
        }
        return result;
    }

    distanceTransform(state: typeof this.state): CellMap {
        const matrix = obstacles2baseDistanceTransformMatrix(this.obstacles(state, true));
        const dt = cDistanceTransform(matrix);
        const result: CellMap = {};
        for (let y = 0; y < ROOM_SIZE; y++) {
            result[y] = {};
            for (let x = 0; x < ROOM_SIZE; x++) {
                result[y][x] = dt.get(x, y);
            }
        }
        return result;
    }

    setStateAndRefresh(state: any, skipSave?: boolean, directSave?: boolean) {
        let completeState = {
            ...this.state,
            ...state
        }

        let recalculatedState = {
            ...state
        };

        if (completeState.analysisMode === TOWER_DAMAGE_ANALYSIS) {
            recalculatedState.analysisResult = this.towerDamage(completeState);
        } else if (completeState.analysisMode === FLOOD_FIELD_ANALYSIS) {
            recalculatedState.analysisResult = this.floodFill(completeState);
        } else if (completeState.analysisMode === DISTANCE_TRANSFORM_ANALYSIS) {
            recalculatedState.analysisResult = this.distanceTransform(completeState);
        }

        if (directSave) {
            this.state = recalculatedState;
        } else {
            this.setState(recalculatedState, () => {
                if (!skipSave) {
                    this.saveState();
                }
            });
        }
    }

    showToast(message: string) {
        this.setState({toastMessage: message}, () => {
            setTimeout(() => {
                this.setState({toastMessage: ''});
            }, 5000);
        })
    }

    copyShareLink(includeRoomFeatures: boolean) {
        const jsonString = JSON.stringify(this.exportJson(includeRoomFeatures));
        const compressedData = LZString.compressToEncodedURIComponent(jsonString);
        const link = `${location.origin}${location.pathname}?share=${compressedData}${location.hash}`
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('Share link copied to the clipboard.');
        });
    }

    setSettings(settings: BuildingPlannerSettings) {
        this.setStateAndRefresh({settings});
    }

    toggleExtraTools() {
        this.setStateAndRefresh({showExtraTools: !this.state.showExtraTools});
    }

    toggleCellSelection() {
        this.setStateAndRefresh({selectingCells: !this.state.selectingCells});
    }

    setAnalysisMode(mode: number) {
        this.setStateAndRefresh({
            analysisMode: this.state.analysisMode === mode ? NO_ANALYSIS : mode
        });
    }

    getCellText(x: number, y: number): string {
        if (this.state.analysisMode === NO_ANALYSIS || this.state.analysisResult[y] === undefined || this.state.analysisResult[y][x] === undefined) {
            return '';
        } else {
            return this.state.analysisResult[y][x].toString();
        }
    }

    onWheel(e: any) {
        if (e.shiftKey) {
            const decrease = (e.deltaY > 0);
            this.changeScale(false, decrease);
            e.preventDefault();
        }
    }

    render() {
        const scaleStr = this.state.scale.toFixed(1);
        const marginLeft = Math.max(0, (window.innerWidth - 800 * this.state.scale) / 2).toFixed(1);
        return (
            <div className="building-planner">
                <Navbar fluid className="controls" sticky="top">
                    <Container>
                        <Row className="justify-content-center">
                            <Col xs={{size: 'auto', order: 2}} sm={{order: 2}} md={{order: 1}}>
                                <Select
                                    defaultValue={this.state.brush}
                                    value={this.getSelectedBrush()}
                                    options={this.getBrushes()}
                                    theme={theme => this.getSelectTheme(theme)}
                                    onChange={(selected) => this.setBrush(selected.value)}
                                    className="select-structure"
                                    classNamePrefix="select"
                                    maxMenuHeight={window.innerHeight - 115}
                                />
                                <Select
                                    defaultValue={this.state.brush}
                                    value={this.getSelectedRCL()}
                                    options={this.getRCLOptions()}
                                    theme={theme => this.getSelectTheme(theme)}
                                    onChange={(selected) => this.setRCL(selected.value)}
                                    className="select-rcl"
                                    classNamePrefix="select"
                                    maxMenuHeight={window.innerHeight - 115}
                                />
                            </Col>
                            <Col xs={{size: 'auto', order: 1}} sm={{order: 1}} md={{order: 2}}>
                                <ModalImportRoomForm
                                    planner={this}
                                    room={this.state.room}
                                    shard={this.state.shard}
                                    world={this.state.world}
                                    worlds={this.state.worlds}
                                    modal={false}
                                />
                                <ModalJson
                                    planner={this}
                                    modal={false}
                                />
                                <div>
                                    <button className="btn btn-secondary" onClick={() => this.copyShareLink(false)} title="Copy share link to clipboard">
                                        <FontAwesomeIcon icon={faLink}/>
                                    </button>
                                </div>
                                <ModalReset
                                    planner={this}
                                    modal={false}
                                />
                                <ModalSettings
                                    planner={this}
                                    modal={false}
                                />
                                <div>
                                    <div className="zoom-control">
                                        <input
                                            type="range"
                                            name="scale"
                                            id="scale"
                                            min={SCALE_MIN}
                                            max={SCALE_MAX}
                                            step={SCALE_STEP}
                                            value={scaleStr}
                                            title={'Zoom: ' + scaleStr}
                                            onChange={(e) => this.changeScale(e)}
                                        />
                                        <label
                                            htmlFor="zoom"
                                            title={'Zoom: ' + scaleStr}
                                        >
                                            {scaleStr}
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <button className="btn btn-secondary" title="More tools"
                                            style={{color: this.state.showExtraTools ? 'green': 'inherit'}}
                                            onClick={() => this.toggleExtraTools()}>
                                        More
                                    </button>
                                </div>
                                {this.state.settings.showStatsOverlay && <div className="stats-overlay">
                                    {this.state.room && <span>{this.state.shard.replace('shard', 'S')} {this.state.room}</span>}
                                    <span className="coordinate">X: {this.state.x}</span>
                                    <span className="coordinate">Y: {this.state.y}</span>
                                </div>}
                            </Col>
                        </Row>
                        {this.state.showExtraTools && <Row className="justify-content-center">
                            <Col xs={{size: 'auto'}}>
                                <div>
                                    <button className="btn btn-secondary" onClick={() => this.toggleCellSelection()}
                                            title="Toggle cell selection">
                                        <FontAwesomeIcon icon={faHighlighter}
                                                         color={this.state.selectingCells ? 'green' : 'inherit'}/>
                                    </button>
                                </div>
                                <div>
                                    <button className="btn btn-secondary" onClick={() => this.setAnalysisMode(TOWER_DAMAGE_ANALYSIS)}
                                            title="Toggle tower damage">
                                        <FontAwesomeIcon icon={faTowerObservation}
                                                         color={this.state.analysisMode === TOWER_DAMAGE_ANALYSIS ? 'green' : 'inherit'}/>
                                    </button>
                                </div>
                                <div>
                                    <button className="btn btn-secondary" onClick={() => this.setAnalysisMode(FLOOD_FIELD_ANALYSIS)}
                                            title="Flood field from selected">
                                        <span style={{color: this.state.analysisMode === FLOOD_FIELD_ANALYSIS ? 'green' : 'inherit'}}>
                                            FF
                                        </span>
                                    </button>
                                </div>
                                <div>
                                    <button className="btn btn-secondary" onClick={() => this.setAnalysisMode(DISTANCE_TRANSFORM_ANALYSIS)}
                                            title="Distance transform in Chebyshev metric">
                                        <span style={{color: this.state.analysisMode === DISTANCE_TRANSFORM_ANALYSIS ? 'green' : 'inherit'}}>
                                            DT
                                        </span>
                                    </button>
                                </div>
                            </Col>
                        </Row>}
                    </Container>
                </Navbar>
                <div id="room-map-container">
                    <div id="building-planner-instructions">
                        LMB to place<br/>
                        Shift+Scroll to zoom<br/>
                        Shift+LMB to remove<br/>
                        RMB to remove
                    </div>
                    <div id="room-map"
                         style={{transform: 'scale(' + this.state.scale + ')', marginLeft: marginLeft + 'px'}}>
                        {[...Array(50)].map((yval, y: number) => {
                            return [...Array(50)].map((xval, x: number) =>
                                <MapCell
                                    x={x}
                                    y={y}
                                    planner={this}
                                    terrain={this.state.terrain[y][x]}
                                    structure={this.getStructure(x, y)}
                                    road={this.getRoadProps(x, y)}
                                    rampart={this.isRampart(x, y)}
                                    source={this.hasSource(x, y)}
                                    mineral={this.getMineral(x, y)}
                                    selected={this.isSelected(x, y)}
                                    key={'mc-' + x + '-' + y}
                                    text={this.getCellText(x, y)}
                                    textSize={this.state.settings.cellTextFontSize}
                                />
                            )
                        })}
                    </div>
                </div>
                {this.state.toastMessage && <div className="fixed-top p-3" style={{zIndex: 2000}}>
                    <Toast className="p-2 bg-light">
                        <ToastBody>
                            {this.state.toastMessage}
                        </ToastBody>
                    </Toast>
                </div>}
            </div>
        );
    }
}
