import * as React from 'react';
import * as LZString from 'lz-string';
import {Col, Input, Label, Modal, ModalBody, ModalHeader, Row} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileCode} from '@fortawesome/free-solid-svg-icons';
import {CONTROLLER_STRUCTURES} from '../../screeps/constants';

export class ModalJson extends React.Component<ModalProps> {
    state: Readonly<{
        modal: boolean;
        format: boolean;
        roomFeatures: boolean;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            modal: false,
            format: true,
            roomFeatures: false,
        };
    }

    createJson() {
        let buildings: { [structure: string]: { pos: Array<{ x: number, y: number }> } } = {};
        let roomFeatures: { [name: string]: { pos: Array<{ x: number, y: number }> } } = {};

        const parent = this.props.planner;
        let json = {
            name: parent.state.room,
            shard: parent.state.shard,
            rcl: parent.state.rcl,
            buildings: buildings
        };
        const keepStructures = Object.keys(CONTROLLER_STRUCTURES).filter((name) => name !== "controller");

        Object.keys(parent.state.structures).forEach((structure) => {
            if (parent.state.structures[structure].length > 0) {
                if (keepStructures.indexOf(structure) > -1) {
                    if (!buildings[structure]) {
                        buildings[structure] = {
                            pos: parent.state.structures[structure]
                        };
                    }
                } else {
                    if (!roomFeatures[structure]) {
                        roomFeatures[structure] = {
                            pos: parent.state.structures[structure]
                        };
                    }
                }
            }
        });

        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                const terrain = parent.state.terrain[y][x];
                if (terrain & 3) {
                    const terrainName = terrain & 1 ? "wall" : "swamp";
                    if (!roomFeatures[terrainName]) {
                        roomFeatures[terrainName] = {pos: []};
                    }
                    roomFeatures[terrainName].pos.push({x, y});
                }
            }
        }

        if (parent.state.sources && parent.state.sources.length > 0) {
            roomFeatures.source = {
                pos: parent.state.sources
            }
        }

        for (const {mineralType, x, y} of parent.state.minerals) {
            if (roomFeatures[mineralType] === undefined) {
                roomFeatures[mineralType] = {
                    pos: []
                };
            }
            roomFeatures[mineralType].pos.push({x, y});
        }

        return this.state.roomFeatures ? {...json, roomFeatures} : json;
    }

    displayJson = () => this.state.format
        ? JSON.stringify(this.createJson(), null, 2)
            .replace(/{\n\s+"x": ([0-9]{1,4}),\n\s+"y": ([0-9]{1,4})\n\s+}/g, '{"x":$1,"y":$2}')
        : JSON.stringify(this.createJson());

    import(e: any) {
        const rx = /^(module\.exports *= *)?(\{.*}) *;?$/gm;
        const json = rx.exec(e.target.value.replaceAll('\n', ' ').trim());
        const parsed = JSON.parse(json![2]);
        this.props.planner.loadJson(parsed);
    }

    shareLink() {
        const jsonString = JSON.stringify(this.createJson());
        const compressedData = LZString.compressToEncodedURIComponent(jsonString);
        return `?share=${compressedData}${location.hash}`
    }

    toggleModal() {
        this.setState({modal: !this.state.modal});
    }

    toggleRoomFeatures(e: any) {
        this.setState({roomFeatures: e.target.checked});
    }

    toggleFormatting(e: any) {
        this.setState({format: e.target.checked});
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Json Input/Output">
                    <FontAwesomeIcon icon={faFileCode}/>
                </button>
                <Modal size="lg" isOpen={this.state.modal} toggle={() => this.toggleModal()} className="import-room">
                    <ModalHeader toggle={() => this.toggleModal()}>Json Input/Output</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs={12}>
                                <Input type="textarea" wrap="soft" value={this.displayJson()} id="json-data"
                                       onChange={(e) => this.import(e)}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={4}>
                                <a href={this.shareLink()} id="share-link">Share Link</a>
                            </Col>
                            <Col xs={8}>
                                <Label className="room-features">
                                    <Input type="checkbox" name="room-features" checked={this.state.roomFeatures}
                                           onChange={(e) => this.toggleRoomFeatures(e)}/>
                                    Include room features (terrain, controller, ...)
                                </Label>
                                <Label className="format-json">
                                    <Input type="checkbox" name="format-json" checked={this.state.format}
                                           onChange={(e) => this.toggleFormatting(e)}/>
                                    Format JSON
                                </Label>
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}
