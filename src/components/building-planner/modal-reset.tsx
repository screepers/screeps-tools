import * as React from 'react';
import {Modal, ModalHeader, ModalBody, ModalFooter} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTrashAlt} from '@fortawesome/free-solid-svg-icons';

export class ModalReset extends React.Component<ModalProps> {
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
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Reset">
                    <FontAwesomeIcon icon={faTrashAlt} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="reset-map">
                    <ModalHeader toggle={() => this.toggleModal()}>Reset Confirmation</ModalHeader>
                    <ModalBody>
                        <p>Are you sure you want to reset the map and start over?</p>
                    </ModalBody>
                    <ModalFooter>
                        <button type="submit" form="load-room" className="btn btn-primary" onMouseDown={() => this.resetMap()}>
                            Yes, reset the map
                        </button>
                        <button className="btn btn-secondary" onClick={() => this.toggleModal()}>Cancel</button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}