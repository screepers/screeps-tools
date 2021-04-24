import * as React from 'react';
import {Container, Row, Col, Label, Input, Modal, ModalHeader, ModalBody} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faCog} from '@fortawesome/free-solid-svg-icons';

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
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.setState({[e.target.name]: value});
        this.props.planner.setState({[e.target.name]: value});

        this.props.planner.setState({
            settings: {
                ...this.props.planner.state.settings,
                [e.target.name]: value
            }
        });
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
                        <Container>
                            <Row>
                                <Col xs={6}>
                                    <Label className="show-structures">
                                        <Input type="checkbox" name="showStats" checked={this.props.planner.state.settings.showStats} onChange={(e) => this.handleCheckboxChange(e)} />
                                        Display Stats Overlay
                                    </Label>
                                </Col>
                                <Col xs={6}>

                                </Col>
                            </Row>
                        </Container>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}