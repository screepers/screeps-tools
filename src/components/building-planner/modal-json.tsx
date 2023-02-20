import * as React from 'react';
import {Col, Input, Label, Modal, ModalBody, ModalHeader, Row} from 'reactstrap';
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

    displayJson() {
        const data = this.props.planner.exportJson(this.state.roomFeatures);
        return this.state.format
            ? JSON.stringify(data, null, 2)
                .replace(/{\n\s+"x": ([0-9]{1,4}),\n\s+"y": ([0-9]{1,4})\n\s+}/g, '{"x":$1,"y":$2}')
            : JSON.stringify(data);
    }

    importJson(e: any) {
        const rx = /^(module\.exports *= *)?(\{.*}) *;?$/gm;
        const json = rx.exec(e.target.value.replaceAll('\n', ' ').trim());
        const parsed = JSON.parse(json![2]);
        this.props.planner.importJson(parsed);
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
                                <Input type="textarea" wrap="soft" value={this.state.modal ? this.displayJson() : ''} id="json-data"
                                       onChange={(e) => this.importJson(e)}/>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={4}>
                                <button className="btn btn-primary btn-sm" type="button" id="share-link"
                                        onClick={() => this.props.planner.copyShareLink(this.state.roomFeatures)}>
                                    Copy share Link to clipboard
                                </button>
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
