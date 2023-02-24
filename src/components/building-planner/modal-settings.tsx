import * as React from 'react';
import {Row, Col, Label, Input, Modal, ModalHeader, ModalBody} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog} from '@fortawesome/free-solid-svg-icons';

export class ModalSettings extends React.Component<ModalSettingsProps> {
    state: Readonly<{
        modal: boolean;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            modal: false
        };
    }

    toggleModal() {
        this.setState({modal: !this.state.modal});
    }

    handleValueChange(e: any) {
        const field: 'showStatsOverlay' | 'allowBorderStructure' | 'cellTextFontSize' = e.target.name;
        const value = e.target.type === 'checkbox' ? e.target.checked : (e.target.type === 'number' ? parseInt(e.target.value) : e.target.value);
        this.setState({[field]: value});
        this.props.planner.setState({[field]: value});

        this.props.planner.setSettings({
            ...this.props.settings,
            [field]: value
        });
    }

    render() {
        return (
            <div id="building-planner-settings">
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Settings">
                    <FontAwesomeIcon icon={faCog} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="settings">
                    <ModalHeader toggle={() => this.toggleModal()}>Settings</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs={6}>
                                <Label>
                                    <Input type="checkbox" name="showStatsOverlay" checked={this.props.settings.showStatsOverlay} onChange={(e) => this.handleValueChange(e)} />
                                    Display Stats Overlay
                                </Label>
                            </Col>
                            <Col xs={6}>
                                <Label>
                                    <Input type="checkbox" name="allowBorderStructure" checked={this.props.settings.allowBorderStructure} onChange={(e) => this.handleValueChange(e)} />
                                    Allow Border Structures
                                </Label>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Label for="cellTextFontSize">
                                    Cell Text Font Size
                                </Label>
                                <Input type="number" name="cellTextFontSize" id="cellTextFontSize" value={this.props.settings.cellTextFontSize} onChange={(e) => this.handleValueChange(e)} />
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}