import * as React from 'react';
import {Row, Col, Label, Input, Modal, ModalHeader, ModalBody} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog} from '@fortawesome/free-solid-svg-icons';
import {cacheUtil, CacheKey} from '../common/utils';

export class ModalSettings extends React.Component<ModalProps> {
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

    handleCheckboxChange(e: any) {
        const field: 'showStatsOverlay' | 'allowBorderStructure' = e.target.name;
        const types = {
            showStatsOverlay: CacheKey.ShowStats,
            allowBorderStructure: CacheKey.AllowBorder,
        };
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.setState({[field]: value});
        this.props.planner.setState({[field]: value});

        this.props.planner.setState({
            settings: {
                ...this.props.planner.state.settings,
                [field]: value
            }
        });
        cacheUtil.set(types[field], value);
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Settings">
                    <FontAwesomeIcon icon={faCog} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="settings">
                    <ModalHeader toggle={() => this.toggleModal()}>Settings</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs={6}>
                                <Label>
                                    <Input type="checkbox" name="showStatsOverlay" checked={this.props.planner.state.settings.showStatsOverlay} onChange={(e) => this.handleCheckboxChange(e)} />
                                    Display Stats Overlay
                                </Label>
                            </Col>
                            <Col xs={6}>
                                <Label>
                                    <Input type="checkbox" name="allowBorderStructure" checked={this.props.planner.state.settings.allowBorderStructure} onChange={(e) => this.handleCheckboxChange(e)} />
                                    Allow Border Structures
                                </Label>
                            </Col>
                        </Row>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}