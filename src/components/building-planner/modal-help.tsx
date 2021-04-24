import * as React from 'react';
import {Modal, ModalHeader, ModalBody} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faQuestion} from '@fortawesome/free-solid-svg-icons';

export class ModalHelp extends React.Component<ModalProps> {
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

    resetMap() {
        this.toggleModal();
        this.props.planner.resetState();
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Help">
                    <FontAwesomeIcon icon={faQuestion} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="help-about">
                    <ModalHeader toggle={() => this.toggleModal()}>Screeps Tools - by admon84</ModalHeader>
                    <ModalBody>
                        <h5>Special thanks</h5>
                        <p>A huge thanks goes to <b>Arcath</b> for this project! This project began as a fork of <a href="https://github.com/Arcath/screeps-tools" target="_blank">Arcath/screeps-tools</a> on July 7, 2019.</p>
                        <hr />
                        <h5>Keybinds</h5>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Add structure</td>
                                    <td>&nbsp;</td>
                                    <td>Mouse left click (hold &amp; drag for multi)</td>
                                </tr>
                                <tr>
                                    <td>Remove structure</td>
                                    <td>&nbsp;</td>
                                    <td>Mouse right click (hold &amp; drag for multi)</td>
                                </tr>
                                <tr>
                                    <td>Zoom map in/out</td>
                                    <td>&nbsp;</td>
                                    <td>Shift + scroll mouse wheel</td>
                                </tr>
                            </tbody>
                        </table>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}