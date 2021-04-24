import * as React from 'react';
import {MapCell} from './map-cell';
import {ModalJson} from './modal-json';
import {ModalReset} from './modal-reset';
import {ModalSettings} from './modal-settings';
import {ModalImportRoomForm} from './modal-import-room';
import {Container, Row, Col} from 'reactstrap';
import Select, {OptionTypeBase} from 'react-select';
import * as _ from 'lodash';
import * as LZString from 'lz-string';
import * as Constants from '../common/constants';
import {screepsWorlds, cacheUtil, CacheKey} from '../common/utils';

export class BuildingPlanner extends React.Component {
    state: Readonly<{
        room: string;
        world: string;
        shard: string;
        terrain: TerrainMap;
        x: number;
        y: number;
        worlds: {[worldName: string]: {shards: string[]}};
        brush: string;
        brushLabel: React.ReactElement | null;
        rcl: number;
        structures: {[structure: string]: {x: number; y: number;}[]};
        sources: {x: number; y: number;}[];
        mineral: {[mineralType: string]: {x: number; y: number;}};
        settings: {
            showStatsOverlay: boolean;
            allowBorderStructure: boolean;
        };
    }>;

    constructor(props: any) {
        super(props);
        this.state = this.getInitialState();
    }

    getInitialState() {
        let terrain: TerrainMap = {};

        const cachedTerrain = cacheUtil.get(CacheKey.Terrain);

        if (cachedTerrain) {
            terrain = cachedTerrain;
        } else {
            for (let y = 0; y < 50; y++) {
                terrain[y] = {};
                for (let x = 0; x < 50; x++) {
                    terrain[y][x] = 0;
                }
            }
        }

        return {
            room: cacheUtil.get(CacheKey.Room) ?? '',
            world: cacheUtil.get(CacheKey.World) ?? 'mmo',
            shard: cacheUtil.get(CacheKey.Shard) ?? 'shard0',
            terrain: terrain,
            x: 0,
            y: 0,
            worlds: {
                mmo: {
                    shards: []
                }
            },
            brush: cacheUtil.get(CacheKey.Brush) ?? 'spawn',
            brushLabel: null,
            rcl: cacheUtil.get(CacheKey.RCL) ?? 8,
            structures: cacheUtil.get(CacheKey.Structures) ?? {},
            sources: cacheUtil.get(CacheKey.Sources) ?? [],
            mineral: cacheUtil.get(CacheKey.Mineral) ?? {},
            settings: {
                showStatsOverlay: cacheUtil.get(CacheKey.ShowStats) ?? true,
                allowBorderStructure: cacheUtil.get(CacheKey.AllowBorder) ?? false,
            }
        }
    }

    resetState() {
        cacheUtil.remove(CacheKey.Terrain);
        cacheUtil.remove(CacheKey.Room);
        cacheUtil.remove(CacheKey.World);
        cacheUtil.remove(CacheKey.Shard);
        cacheUtil.remove(CacheKey.Brush);
        cacheUtil.remove(CacheKey.RCL);
        cacheUtil.remove(CacheKey.Structures);
        cacheUtil.remove(CacheKey.Sources);
        cacheUtil.remove(CacheKey.Mineral);
        this.setState(this.getInitialState());
        this.loadShards();
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

    loadShards() {
        const component = this;
        for (const world in screepsWorlds) {
            fetch(`/api/shards/${world}`).then((response) => {
                response.json().then((data: any) => {
                    if (!data || Object.keys(data).length === 0) {
                        return;
                    }
                    const shards: string[] = [];
                    data.shards.forEach((shard: {name: string}) => {
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
            fetch(`/api/terrain/${world}/${json.shard}/${json.name}`).then((response) => {
                response.json().then((data: any) => {
                    let terrain = data.terrain[0].terrain;
                    let terrainMap: TerrainMap = {};
                    for (var y = 0; y < 50; y++) {
                        terrainMap[y] = {};
                        for (var x = 0; x < 50; x++) {
                            let code = terrain.charAt(y * 50 + x);
                            terrainMap[y][x] = code;
                        }
                    }

                    component.setState({terrain: terrainMap});
                    cacheUtil.set(CacheKey.Terrain, terrainMap);
                });
            });
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
            room: json.name,
            world: json.world,
            shard: json.shard,
            rcl: json.rcl,
            structures: structures
        });
        cacheUtil.set(CacheKey.Room, json.name);
        cacheUtil.set(CacheKey.World, json.world);
        cacheUtil.set(CacheKey.Shard, json.shard);
        cacheUtil.set(CacheKey.RCL, json.rcl);
        cacheUtil.set(CacheKey.Structures, structures);
    }

    addStructure(x: number, y: number) {
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

                        foundAtPos = _.filter(structures[type], (pos) => {
                            return pos.x === x && pos.y === y;
                        }).length > 0;

                        if (foundAtPos) {
                            this.removeStructure(x, y, type);
                        }
                    }
                }

                if (structures[this.state.brush].length > 0) {
                    foundAtPos = _.filter(structures[this.state.brush], (pos) => {
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

        this.setState({structures: structures});
        cacheUtil.set(CacheKey.Structures, structures);
        return added;
    }

    removeStructure(x: number, y: number, structure: string | null) {
        let structures = this.state.structures;

        if (structure == 'controller') {
            // keep these structures, only reimport or reload page can remove them
            return;
        }

        if (structure && structures[structure]) {
            structures[structure] = _.filter(structures[structure], (pos) => {
                return !(pos.x === x && pos.y === y);
            })
        }

        this.setState({structures: structures});
        cacheUtil.set(CacheKey.Structures, structures);
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
        if (this.isRoad(x,y)) {
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

    hasSource(x: number, y: number) {
        let source = false;
        if (this.state.sources) {
            this.state.sources.forEach((pos) => {
                if (pos.x === x && pos.y === y) {
                    source = true;
                }
            });
        }
        return source;
    }

    getMineral(x: number, y: number): string | null {
        const minerals = ['X', 'Z', 'L', 'K', 'U', 'O', 'H'];
        for (let key of minerals) {
            if (this.state.mineral[key]) {
                let mineral = this.state.mineral[key];
                if (mineral.x === x && mineral.y === y) {
                    return key;
                }
            }
        }
        return null;
    }

    getSelectedBrush() {
        if (!this.state.brush) {
            return null;
        }
        const selected: OptionTypeBase = {
            value: this.state.brush,
            label: this.getStructureBrushLabel(this.state.brush)
        };
        return selected;
    }

    getStructureBrushes() {
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
        return options;
    }

    getStructureDisabled(key: string) {
        const total = Constants.CONTROLLER_STRUCTURES[key][this.state.rcl];
        if (total === 0) {
            return true;
        }
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        if (placed === total) {
            return true;
        }
        return false;
    }

    getStructureBrushLabel(key: string) {
        const structure = Constants.STRUCTURES[key];
        const placed = this.state.structures[key] ? this.state.structures[key].length : 0;
        const total = Constants.CONTROLLER_STRUCTURES[key][this.state.rcl];
        return (
            <div>
                <img src={`/static/assets/structures/${key}.png`} />{' '}
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
        cacheUtil.set(CacheKey.Brush, brush);
    }

    setRCL(rcl: number) {
        this.setState({rcl: rcl});
        cacheUtil.set(CacheKey.RCL, rcl);

        if (Constants.CONTROLLER_STRUCTURES[this.state.brush][rcl] === 0) {
            this.setState({brush: null, brushLabel: null});
            cacheUtil.remove(CacheKey.Brush);
        }
    }

    getSelectedRCL(): OptionTypeBase {
        return {
            value: this.state.rcl,
            label: `RCL ${this.state.rcl}`
        };
    }

    render() {        
        return (
            <div className="building-planner">
                <Container className="controls" fluid={true}>
                    <Container>
                        <Row className="justify-content-center">
                            {/* 
                                <button className="burger-menu" onClick={() => this.openOrCloseMenu()}>
                                    <div /><div /><div />
                                </button>
                            */}
                            <Col xs={'auto'}>
                                <Select
                                    defaultValue={this.state.brush}
                                    value={this.getSelectedBrush()}
                                    options={this.getStructureBrushes()}
                                    onChange={(selected) => this.setBrush(selected.value)}
                                    className="select-structure"
                                    classNamePrefix="select"
                                />
                            </Col>
                            <Col xs={'auto'}>
                                <Select
                                    defaultValue={this.state.brush}
                                    value={this.getSelectedRCL()}
                                    options={this.getRCLOptions()}
                                    onChange={(selected) => this.setRCL(selected.value)}
                                    className="select-rcl"
                                    classNamePrefix="select"
                                />
                            </Col>
                            <Col xs={'auto'}>
                                <ModalImportRoomForm
                                    planner={this}
                                    room={this.state.room}
                                    shard={this.state.shard}
                                    world={this.state.world}
                                    worlds={this.state.worlds}
                                    modal={false}
                                />
                            </Col>
                            <Col xs={'auto'}>
                                <ModalJson
                                    planner={this}
                                    modal={false}
                                />
                            </Col>
                            <Col xs={'auto'}>
                                <ModalReset
                                    planner={this}
                                    modal={false}
                                />
                            </Col>
                            <Col xs={'auto'}>
                                <ModalSettings
                                    planner={this}
                                    modal={false}
                                />
                            </Col>
                        </Row>
                    </Container>
                </Container>
                {this.state.settings.showStatsOverlay && <div className="stats-overlay">
                    <table>
                        {this.state.world && <tr>
                            <td>World:</td>
                            <td>{screepsWorlds[this.state.world]}</td>
                        </tr>}
                        {this.state.shard && <tr>
                            <td>Shard:</td>
                            <td>{this.state.shard}</td>
                        </tr>}
                        {this.state.room && <tr>
                            <td>Room:</td>
                            <td>{this.state.room}</td>
                        </tr>}
                        <tr>
                            <td>X:</td>
                            <td>{this.state.x}</td>
                        </tr>
                        <tr>
                            <td>Y:</td>
                            <td>{this.state.y}</td>
                        </tr>
                    </table>
                </div>}
                <div className="map">
                    {[...Array(50)].map((yval, y: number) => {
                        return [...Array(50)].map((xval, x: number) =>
                            <MapCell
                                x={x}
                                y={y}
                                terrain={this.state.terrain[y][x]}
                                parent={this}
                                structure={this.getStructure(x, y)}
                                road={this.getRoadProps(x, y)}
                                rampart={this.isRampart(x, y)}
                                source={this.hasSource(x, y)}
                                mineral={this.getMineral(x, y)}
                                key={'mc-'+ x + '-' + y}
                            />
                        )
                    })}
                </div>
            </div>
        );
    }
}