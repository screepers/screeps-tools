import * as React from 'react';
import {Modal, ModalHeader, ModalBody, ModalFooter, Input, Label, Row, Col} from 'reactstrap';
import {simScript} from '../../screeps/sim';

export class ModalSim extends React.Component<ModalProps> {
    state: Readonly<{
        modal: boolean;
        includeStructures: boolean;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            modal: false,
            includeStructures: true
        };
    }

    toggleModal() {
        this.setState({modal: !this.state.modal});
    }

    displayScript() {
        const data = this.props.planner.exportBlueprint(this.state.includeStructures);
        return simScript(data);
    }

    handleCheckboxChange(e: any) {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        this.setState({[e.target.name]: value});
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()}
                        title="Export room to sim">
                    SIM
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()}>
                    <ModalHeader toggle={() => this.toggleModal()}>Exporting Room to Simulation</ModalHeader>
                    <ModalBody>
                        <Row>
                            <Col xs={12}>
                                <p>
                                    To export this room to simulation, log in, go to <a href="https://screeps.com/a/#!/sim/custom">the simulation</a> and
                                    paste the code below in the browser console (F12).
                                    It will replace the terrain and objects in the simulation with the one in this app.
                                </p>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Input type="textarea" wrap="soft" value={this.state.modal ? this.displayScript() : ''}
                                       id="sim-script" />
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Label className="show-structures">
                            <Input type="checkbox" name="includeStructures" checked={this.state.includeStructures} onChange={(e) => this.handleCheckboxChange(e)} />
                            Include Structures
                        </Label>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}