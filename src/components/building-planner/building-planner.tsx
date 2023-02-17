import * as React from 'react';
import * as LZString from 'lz-string';
import * as Constants from '../common/constants';
import {RESOURCES, TERRAIN_CODES, TERRAIN_MASK_WALL} from '../common/constants';
import {MapCell} from './map-cell';
import {ModalJson} from './modal-json';
import {ModalReset} from './modal-reset';
import {ModalSettings} from './modal-settings';
import {ModalImportRoomForm} from './modal-import-room';
import {Col, Container, Navbar, Row} from 'reactstrap';
import Select, {OptionTypeBase} from 'react-select';
import {apiURL, screepsWorlds, towerDPS} from '../common/utils';
import {TowerDamageButton} from './tower-damage-button';

export class BuildingPlanner extends React.Component {
    state: Readonly<{
        room: string;
        world: string;
        shard: string;
        terrain: CellMap;
        x: number;
        y: number;
        worlds: { [worldName: string]: { shards: string[] } };
        brush: string;
        rcl: number;
        structures: { [structure: string]: { x: number; y: number; }[] };
        sources: { x: number; y: number; }[];
        minerals: { mineralType: string, x: number; y: number }[];
        settings: {
            showStatsOverlay: boolean;
            allowBorderStructure: boolean;
        };
        scale: number;
        scaleMin: number;
        scaleMax: number;
        scaleStep: number;
        showTowerDamage: boolean;
        towerDamage: CellMap;
    }>;

    constructor(props: any) {
        super(props);
        this.state = this.getInitialState();
    }

    componentDidMount() {
        this.loadShards();

        let params = location.href.split('?')[1];
        let searchParams = new URLSearchParams(params);

        if (searchParams.get('share')) {
            let json = LZString.decompressFromEncodedURIComponent(searchParams.get('share')!);
            if (json) {
                this.loadJson(JSON.parse(json));
            }
        }
    }

    getInitialState() {
        let terrain: CellMap = {};

        for (let y = 0; y < 50; y++) {
            terrain[y] = {};
            for (let x = 0; x < 50; x++) {
                terrain[y][x] = 0;
            }
        }

        return {
            room: Constants.PLANNER.ROOM,
            world: Constants.PLANNER.WORLD,
            shard: Constants.PLANNER.SHARD,
            terrain: terrain,
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
            brush: 'spawn',
            rcl: Constants.PLANNER.RCL,
            structures: {},
            sources: [],
            minerals: [],
            settings: {
                showStatsOverlay: true,
                allowBorderStructure: false,
            },
            scale: 1.5,
            scaleMin: 1.0,
            scaleMax: 4.0,
            scaleStep: 0.1,
            showTowerDamage: false,
            towerDamage: {},
        };
    }

    resetState() {
        this.setState(this.getInitialState());
        this.loadShards();
    }

    loadShards() {
        const component = this;
        for (const world in screepsWorlds) {
            fetch(`${apiURL(world)}/api/game/shards/info`).then((response) => {
                response.json().then((data: any) => {
                    if (!data || Object.keys(data).length === 0) {
                        return;
                    }
                    const shards: string[] = [];
                    data.shards.forEach((shard: { name: string }) => {
                        shards.push(shard.name);
                    });
                    component.setState({
                        worlds: {
                            ...this.state.worlds,
                            [world]: {
                                shards: shards
                            }
                        }
                    });
                });
            });
        }
    }

    loadJson(json: any) {
        const component = this;

        if (json.shard && json.name) {
            let world = 'mmo';
            if (json.world && json.world === 'season') {
                world = 'season';
            }
            fetch(`${apiURL(world)}/api/game/room-terrain?shard=${json.shard}&room=${json.name}&encoded=1`).then((response) => {
                response.json().then((data: any) => {
                    let terrain = data.terrain[0].terrain;
                    let terrainMap: CellMap = {};
                    for (let y = 0; y < 50; y++) {
                        terrainMap[y] = {};
                        for (let x = 0; x < 50; x++) {
                            terrainMap[y][x] = terrain.charAt(y * 50 + x);
                        }
                    }

                    component.setState({terrain: terrainMap});
                });
            });
        } else if (json.roomFeatures) {
            const terrain: CellMap = {};

            for (let y = 0; y < 50; y++) {
                terrain[y] = {};
                for (let x = 0; x < 50; x++) {
                    terrain[y][x] = 0;
                }
            }

            Object.entries(TERRAIN_CODES).forEach(([name, code]) => {
                if (json.roomFeatures[name] !== undefined) {
                    json.roomFeatures[name].pos.forEach(({x, y}: { x: number; y: number }) => {
                        terrain[y][x] = code;
                    });
                }
            });

            let sources: { x: number, y: number }[] = [];
            if (json.roomFeatures.source !== undefined) {
                sources = json.roomFeatures.source.pos;
            }

            const minerals: { mineralType: string, x: number, y: number }[] = [];
            Object.keys(RESOURCES).forEach((name) => {
                if (name !== "source") {
                    if (json.roomFeatures[name] !== undefined) {
                        json.roomFeatures[name].pos.forEach(({x, y}: { x: number, y: number }) => {
                            minerals.push({
                                mineralType: name,
                                x,
                                y
                            });
                        });
                    }
                }
            });

            this.setState({terrain, sources, minerals});
        }

        let structures: {
            [structure: string]: Array<{
                x: number;
                y: number;
            }>
        } = {};

        Object.keys(json.buildings).forEach((structure) => {
            structures[structure] = json.buildings[structure].pos;
        });

        component.setState({
            room: json.name ?? Constants.PLANNER.ROOM,
            world: json.world ?? Constants.PLANNER.WORLD,
            shard: json.shard ?? Constants.PLANNER.SHARD,
            rcl: typeof (json.rcl) === 'number'
                ? Math.max(1, Math.min(8, json.rcl))
                : Constants.PLANNER.RCL,
            structures
        });
    }

    paintCell(x: number, y: number) {
        const terrain = Constants.TERRAIN_CODES[this.state.brush];
        if (terrain !== undefined) {
            const prevTerrain = this.state.terrain[y][x];
            if (prevTerrain === terrain) {
                return false;
            }

            this.setState({
                terrain: {
                    ...this.state.terrain,
                    [y]: {
                         ...this.state.terrain[y],
                        [x]: terrain
                    }
                }
            }, () => this.refreshTowerDamage());
            return true;
        }

        if (Constants.RESOURCES[this.state.brush] !== undefined) {
            if (this.state.brush === "source") {
                if (!this.hasSource(x, y)) {
                    this.removeResource(x, y);
                    this.setState({sources: [...this.state.sources, {x, y}]});
                    return true;
                } else {
                    return false;
                }
            } else {
                if (this.getMineral(x, y) !== this.state.brush) {
                    this.removeResource(x, y);
                    this.setState({minerals: [...this.state.minerals, {mineralType: this.state.brush, x, y}]});
                    return true;
                } else {
                    return true;
                }
            }
        }

        let structures = this.state.structures;
        let added = false;

        let allowed = false;
        if (this.state.settings.allowBorderStructure || (x > 0 && x < 49 && y > 0 && y < 49)) {
            allowed = true;
        }

        if (allowed && Constants.CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]) {
            if (!structures[this.state.brush]) {
                structures[this.state.brush] = [];
            }

            if (structures[this.state.brush].length < Constants.CONTROLLER_STRUCTURES[this.state.brush][this.state.rcl]) {
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
            this.setState({structures: structures}, () => this.refreshTowerDamage());
        }
        return added;
    }

    removeStructure(x: number, y: number, structure: string | null) {
        let structures = this.state.structures;

        if (structure && structures[structure]) {
            structures[structure] = structures[structure].filter(pos => {
                return !(pos.x === x && pos.y === y);
            });

            this.setState({structures}, () => this.refreshTowerDamage());
        }
    }

    removeResource(x: number, y: number) {
        const withoutXYSource = this.state.sources.filter(({x: sourceX, y: sourceY}) =>
            x !== sourceX || y !== sourceY);
        if (withoutXYSource.length !== this.state.sources.length) {
            this.setState({sources: withoutXYSource});
        }

        const withoutXYMineral = this.state.minerals.filter(({x: mineralX, y: mineralY}) =>
            x !== mineralX || y !== mineralY);
        if (withoutXYMineral.length !== this.state.minerals.length) {
            this.setState({minerals: withoutXYMineral});
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

    getSelectedBrush() {
        if (!this.state.brush) {
            return null;
        }
        let label;
        if (Constants.STRUCTURES[this.state.brush] !== undefined) {
            label = this.getStructureBrushLabel(this.state.brush);
        } else if (Constants.TERRAIN_NAMES[this.state.brush] !== undefined) {
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
        Object.keys(Constants.STRUCTURES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getStructureBrushLabel(key)
            };
            if (this.getStructureDisabled(key)) {
                props.isDisabled = true;
            }
            options.push(props);
        });
        Object.keys(Constants.TERRAIN_NAMES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getTerrainBrushLabel(key)
            };
            options.push(props);
        });
        Object.keys(Constants.RESOURCES).map(key => {
            let props: OptionTypeBase = {
                value: key,
                label: this.getResourceBrushLabel(key)
            };
            options.push(props);
        });
        return options;
    }

    getStructureDisabled(key: string) {
        const total = Constants.CONTROLLER_STRUCTURES[key][this.state.rcl];
        if (total === 0) {
            return true;
        }
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        return placed >= total;
    }

    getTerrainBrushLabel(key: string) {
        const terrainName = Constants.TERRAIN_NAMES[key];
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
        const resource = Constants.RESOURCES[key];
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
        const structure = Constants.STRUCTURES[key];
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        const total = Constants.CONTROLLER_STRUCTURES[key][this.state.rcl];
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
        this.setState({brush: brush});
    }

    setRCL(rcl: number) {
        this.setState({rcl: rcl});

        if (Constants.CONTROLLER_STRUCTURES[this.state.brush][rcl] === 0) {
            this.setState({brush: null});
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
        let current, change, update;
        if (e) {
            // element onChange
            current = e.target.valueAsNumber;
            update = current;
        } else {
            // map-cell onWheel
            current = this.state.scale;
            change = decrease ? -this.state.scaleStep : this.state.scaleStep;
            update = current + change;
        }

        if (update >= this.state.scaleMin || update < this.state.scaleMax) {
            this.setState({scale: this.convertToFixed(update)});
        }
    }

    setShowTowerDamage(on: boolean) {
        this.setState({showTowerDamage: on});
        if (on) {
            this.refreshTowerDamage();
        }
    }

    refreshTowerDamage() {
        const towerPos = this.state.structures['tower'] ?? [];

        const towerDamage: CellMap = {};
        for (let y = 0; y < 50; y++) {
            towerDamage[y] = {};
            for (let x = 0; x < 50; x++) {
                // Show nothing on walls that do not have tunnels
                if (this.state.terrain[y][x] & TERRAIN_MASK_WALL) {
                    if (this.state.structures['road']) {
                        if (!this.state.structures['road'].some(({x: xx, y: yy}) => xx === x && yy === y)) {
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

        this.setState({towerDamage});
    }

    getCellText(x: number, y: number): string {
        if (this.state.showTowerDamage && this.state.towerDamage[y] !== undefined && this.state.towerDamage[y][x] !== undefined) {
            return this.state.towerDamage[y][x].toString();
        } else {
            return '';
        }
    }

    render() {
        const scaleAsFloat = this.convertToFixed(this.state.scale);
        const marginLeft = this.convertToFixed(Math.max(0, (window.innerWidth - 800 * this.state.scale) / 2));
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
                                <TowerDamageButton
                                    planner={this}
                                />
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
                                            min={this.state.scaleMin}
                                            max={this.state.scaleMax}
                                            step={this.state.scaleStep}
                                            value={this.state.scale}
                                            title={'Zoom: ' + scaleAsFloat}
                                            onChange={(e) => this.changeScale(e)}
                                        />
                                        <label
                                            htmlFor="zoom"
                                            title={'Zoom: ' + scaleAsFloat}
                                        >
                                            {scaleAsFloat}
                                        </label>
                                    </div>
                                </div>
                                {this.state.settings.showStatsOverlay && <div className="stats-overlay">
                                    {this.state.room &&
                                        <span title={this.state.shard ?? ''}>
                                           {this.state.room}
                                       </span>}
                                    <span className="coordinate">X: {this.state.x}</span>
                                    <span className="coordinate">Y: {this.state.y}</span>
                                </div>}
                            </Col>
                        </Row>
                    </Container>
                </Navbar>
                <div className="mapContainer">
                    <div className="map"
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
                                    key={'mc-' + x + '-' + y}
                                    text={this.getCellText(x, y)}
                                />
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }
}
