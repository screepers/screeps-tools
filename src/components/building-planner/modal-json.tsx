import * as React from 'react';
import * as LZString from 'lz-string';
import * as Constants from '../common/constants';
import {Col, Label, Input, Modal, ModalHeader, ModalBody, Row} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileCode} from '@fortawesome/free-solid-svg-icons';

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
        let buildings: {[structure: string]: {pos: Array<{x: number, y: number}>}} = {};
        let roomFeatures: {[name: string]: {pos: Array<{x: number, y: number}>}} = {};

        const parent = this.props.planner;
        let json = {
            name: parent.state.room,
            shard: parent.state.shard,
            rcl: parent.state.rcl,
            buildings: buildings
        };
        const keepStructures = Object.keys(Constants.CONTROLLER_STRUCTURES);

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

        if (parent.state.mineral) {
            for (const [mineralType, xy] of Object.entries(parent.state.mineral)) {
                roomFeatures[mineralType] = {
                    pos: [xy]
                };
            }
        }

        return this.state.roomFeatures ? {...json, roomFeatures} : json;
    }

    displayJson = () => this.state.format
        ? JSON.stringify(this.createJson(), null, 2)
            .replace(/{\n\s+"x": ([0-9]{1,4}),\n\s+"y": ([0-9]{1,4})\n\s+}/g, '{"x":$1,"y":$2}')
        : JSON.stringify(this.createJson());

    import(e: any) {
        let json = JSON.parse(e.target.value);
        this.props.planner.loadJson(json);
    }

    shareableLink() {
        let jsonString = JSON.stringify(this.createJson());
        return "/building-planner/?share=" + LZString.compressToEncodedURIComponent(jsonString);
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
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Json Output">
                    <FontAwesomeIcon icon={faFileCode} />
                </button>
                <Modal size="lg" isOpen={this.state.modal} toggle={() => this.toggleModal()} className="import-room">
                    <ModalHeader toggle={() => this.toggleModal()}>Json Output</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs={12}>
                                <Input type="textarea" wrap="soft" value={this.displayJson()} id="json-data" onChange={(e) => this.import(e)} />
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={4}>
                                <a href={this.shareableLink()} id="share-link">Share Link</a>
                            </Col>
                            <Col xs={8}>
                                <Label className="room-features">
                                    <Input type="checkbox" name="room-features" checked={this.state.roomFeatures} onChange={(e) => this.toggleRoomFeatures(e)} />
                                    Include room features (terrain, controller, ...)
                                </Label>
                                <Label className="format-json">
                                    <Input type="checkbox" name="format-json" checked={this.state.format} onChange={(e) => this.toggleFormatting(e)} />
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
