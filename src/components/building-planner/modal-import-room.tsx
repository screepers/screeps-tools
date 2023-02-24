import * as React from 'react';
import {Row, Col, Input, Label, FormFeedback, Modal, ModalHeader, ModalBody, ModalFooter} from 'reactstrap';
import Select, {OptionTypeBase} from 'react-select';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faDownload} from '@fortawesome/free-solid-svg-icons';
import {SCREEPS_WORLDS} from '../../screeps/constants';

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
        const value = e.target.value;

        if (!this.state[field].validateOnChange && !this.state.submitCalled) {
            this.setState({
                [field]: {
                    value: value,
                    validateOnChange: true,
                    valid: validationFunc(value)
                }
            });
        }
    }

    handleTextChange(field: 'room' | 'world' | 'shard', value: string, validationFunc: Function) {
        this.setState({
            [field]: {
                value: value,
                valid: (this.state[field].validateOnChange ? validationFunc(value) : true)
            }
        });

        if (field === 'world') {
            // Changing world select option will select the first shard drop-down option
            const firstOption = this.props.worlds[value]!.shards[0];
            this.setState({
                shard: {
                    value: firstOption,
                    valid: this.validateShard(value)
                }
            });
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

        const name = this.state.room.value;
        const world = this.state.world.value;
        const shard = this.state.shard.value;
        const includeStructures = this.state.showStructures;

        const validation = [
            {
                field: 'room',
                value: name,
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

        const importedData: any = {
            world,
            shard,
            name,
        };

        if (!includeStructures) {
            importedData.buildings = {};
        }

        this.props.planner.importBlueprint(importedData);
    }

    getSelectedWorld() {
        const world = this.state.world.value;
        if (!world) {
            return null;
        }
        const selected: OptionTypeBase = {
            value: world,
            label: SCREEPS_WORLDS[world]
        };
        return selected;
    }

    getWorldOptions() {
        const options: OptionTypeBase[] = [];
        
        Object.keys(this.props.worlds).map(world => {
            let props: OptionTypeBase = {
                value: world,
                label: SCREEPS_WORLDS[world]
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
                    <FontAwesomeIcon icon={faDownload} />
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
