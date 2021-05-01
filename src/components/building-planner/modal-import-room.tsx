import * as React from 'react';
import * as Constants from '../common/constants';
import {screepsWorlds, cacheUtil, CacheKey} from '../common/utils';
import {Row, Col, Input, Label, FormFeedback, Modal, ModalHeader, ModalBody, ModalFooter} from 'reactstrap';
import Select, {OptionTypeBase} from 'react-select';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faArrowCircleDown} from '@fortawesome/free-solid-svg-icons';

export class ModalImportRoomForm extends React.Component<ModalImportRoomFormProps> {
    state: Readonly<{
        room: FieldValidation;
        world: FieldValidation;
        shard: FieldValidation;
        showStructures: boolean;
        submitCalled: boolean;
        modal: boolean;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            room: {
                value: props.room,
                validateOnChange: false,
                valid: true
            },
            world: {
                value: props.world,
                validateOnChange: false,
                valid: true
            },
            shard: {
                value: props.shard,
                validateOnChange: false,
                valid: true
            },
            showStructures: true,
            submitCalled: false,
            modal: false
        };
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleCheckboxChange(e: any) {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.setState({[e.target.name]: value});
        this.props.planner.setState({[e.target.name]: value});
    }

    handleTextBlur(e: any, validationFunc: Function) {
        const field: 'room' | 'world' | 'shard' = e.target.name;
        const types = {
            room: CacheKey.Room,
            world: CacheKey.World,
            shard: CacheKey.Shard
        };
        const value = e.target.value;

        if (this.state[field].validateOnChange === false &&
            this.state.submitCalled === false) {
            this.setState({
                [field]: {
                    value: value,
                    validateOnChange: true,
                    valid: validationFunc(value)
                }
            });
            this.props.planner.setState({[field]: value});
            cacheUtil.set(types[field], value);
        }
    }

    handleTextChange(field: 'room' | 'world' | 'shard', value: string, validationFunc: Function) {
        const types = {
            room: CacheKey.Room,
            world: CacheKey.World,
            shard: CacheKey.Shard
        };

        console.log('selected:', field, ':', value);

        this.setState({
            [field]: {
                value: value,
                valid: (this.state[field].validateOnChange ? validationFunc(value) : true)
            }
        });
        this.props.planner.setState({[field]: value});
        cacheUtil.set(types[field], value);

        if (field === 'world') {
            // Changing world select option will select the first shard drop-down option
            const firstOption = this.props.worlds[value].shards[0];
            this.setState({
                shard: {
                    value: firstOption,
                    valid: this.validateShard(value)
                }
            });
            this.props.planner.setState({shard: firstOption});
            cacheUtil.set(CacheKey.Shard, firstOption);
        }
    }

    validateRoom(room: string): boolean {
        if (typeof room !== 'string') return false;
        if (room.length < 4) return false;

        const regexRoom = new RegExp('^([WE]{1})([0-9]{1,2})([NS]{1})([0-9]{1,2})$');
        return room.match(regexRoom) !== null;
    }

    validateWorld(world: string): boolean {
        if (typeof world !== 'string') return false;
        if (world.length < 1) return false;

        return true;
    }

    validateShard(shard: string): boolean {
        if (typeof shard !== 'string') return false;
        if (shard.length < 1) return false;

        return true;
    }
    
    handleSubmit(e: any) {
        e.preventDefault();
        this.toggleModal();

        const parent = this.props.planner;
        const room = this.state.room.value;
        const world = this.state.world.value;
        const shard = this.state.shard.value;
        const includeStructs = this.state.showStructures;

        const validation = [
            {
                field: 'room',
                value: room,
                validationFunc: this.validateRoom
            },
            {
                field: 'world',
                value: world,
                validationFunc: this.validateWorld
            },
            {
                field: 'shard',
                value: shard,
                validationFunc: this.validateShard
            }
        ];

        for (let props of validation) {
            let valid = props.validationFunc(props.value);
            this.setState({
                [props.field]: {
                    value: props.value,
                    valid: valid,
                    validateOnChange: !valid
                }
            });
            if (!valid) {
                return;
            }
        }

        fetch(`/api/terrain/${world}/${shard}/${room}`).then((response) => {
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
                parent.setState({
                    terrain: terrainMap,
                    room: room, 
                    world: world, 
                    shard: shard
                });
                cacheUtil.set(CacheKey.Terrain, terrainMap);
                cacheUtil.set(CacheKey.Room, room);
                cacheUtil.set(CacheKey.World, world);
                cacheUtil.set(CacheKey.Shard, shard);
            });
        });

        fetch(`/api/objects/${world}/${shard}/${room}`).then((response) => {
            response.json().then((data: any) => {
                let sources: {x: number, y: number}[] = [];
                let mineral: {[mineralType: string]: {x: number, y: number}} = {};
                let structures: {[structure: string]: {x: number, y: number}[]} = {};

                let keepStructures = ['controller'];
                if (includeStructs) {
                    keepStructures.push(...Object.keys(Constants.CONTROLLER_STRUCTURES));
                }
                for (let o of data.objects) {
                    if (o.type == 'source') {
                        sources.push({
                            x: o.x,
                            y: o.y
                        });
                    } else if (o.type == 'mineral') {
                        mineral[o.mineralType] = {
                            x: o.x,
                            y: o.y
                        };
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
                parent.setState({
                    structures: structures,
                    sources: sources,
                    mineral: mineral
                });
                cacheUtil.set(CacheKey.Structures, structures);
                cacheUtil.set(CacheKey.Sources, sources);
                cacheUtil.set(CacheKey.Mineral, mineral);
            });
        });
    }

    getSelectedWorld() {
        const world = this.state.world.value;
        if (!world) {
            return null;
        }
        const selected: OptionTypeBase = {
            value: world,
            label: screepsWorlds[world]
        };
        return selected;
    }

    getWorldOptions() {
        const options: OptionTypeBase[] = [];
        
        Object.keys(this.props.worlds).map(world => {
            let props: OptionTypeBase = {
                value: world,
                label: screepsWorlds[world]
            };
            options.push(props);
        });
        return options;
    }

    getSelectedShard() {
        const shard = this.state.shard.value;
        if (!shard) {
            return null;
        }
        const selected: OptionTypeBase = {
            value: shard,
            label: shard
        };
        return selected;
    }

    getShardOptions() {
        const world = this.props.worlds[this.state.world.value];
        if (!world) {
            return [];
        }
        const options: OptionTypeBase[] = [];
        
        world.shards.map(shard => {
            let props: OptionTypeBase = {
                value: shard,
                label: shard
            };
            options.push(props);
        });
        return options;
    }

    toggleModal() {
        this.setState({modal: !this.state.modal});
    }
    
    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Import Room">
                    <FontAwesomeIcon icon={faArrowCircleDown} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="import-room">
                    <ModalHeader toggle={() => this.toggleModal()}>Import Room</ModalHeader>
                    <ModalBody>
                        <form id="load-room" className="load-room" onSubmit={this.handleSubmit}>
                            <Row>
                                <Col xs={6}>
                                    <Label for="worldName">World</Label>
                                    {Object.keys(this.props.worlds).length === 0 &&
                                        <div className="loading">Loading</div>
                                    }
                                    {Object.keys(this.props.worlds).length > 0 &&
                                        <Select
                                            defaultValue={this.props.world}
                                            value={this.getSelectedWorld()}
                                            options={this.getWorldOptions()}
                                            onChange={(selected) => this.handleTextChange('world', selected.value, this.validateWorld)}
                                            className="select-world"
                                            classNamePrefix="select"
                                        />
                                    }
                                    <FormFeedback>Invalid world selection</FormFeedback>
                                </Col>
                                <Col xs={6}>
                                    <Label for="shardName">Shard</Label>
                                    {!this.state.world.valid &&
                                        <div className="loading">Loading</div>
                                    }
                                    {this.state.world.valid &&
                                        <Select
                                            defaultValue={this.props.shard}
                                            value={this.getSelectedShard()}
                                            options={this.getShardOptions()}
                                            onChange={(selected) => this.handleTextChange('shard', selected.value, this.validateShard)}
                                            className="select-shard"
                                            classNamePrefix="select"
                                        />
                                    }
                                    <FormFeedback>Invalid shard selection</FormFeedback>
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={6}>
                                    <Label for="roomName">Room</Label>
                                    <Input type="text" id="roomName" name="room" value={this.state.room.value} invalid={!this.state.room.valid} onBlur={(e) => this.handleTextBlur(e, this.validateRoom)} onChange={(e) => this.handleTextChange('room', e.target.value, this.validateRoom)} />
                                    <FormFeedback>Invalid room name</FormFeedback>
                                </Col>
                                <Col xs={6}>
                                    <Label className="show-structures">
                                        <Input type="checkbox" name="showStructures" checked={this.state.showStructures} onChange={(e) => this.handleCheckboxChange(e)} />
                                        Include Structures
                                    </Label>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    
                                </Col>
                            </Row>
                        </form>
                    </ModalBody>
                    <ModalFooter>
                        <button type="submit" form="load-room" className="btn btn-primary" onMouseDown={() => this.setState({submitCalled: true})}>
                            Import Room
                        </button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}
