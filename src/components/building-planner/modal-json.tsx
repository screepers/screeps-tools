import * as React from 'react';
import {Input, Modal, ModalHeader, ModalBody} from 'reactstrap';
import * as LZString from 'lz-string';
import * as Constants from '../common/constants';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faShareAlt} from '@fortawesome/free-solid-svg-icons';

export class ModalJson extends React.Component<ModalJsonProps> {
    state: Readonly<{
        modal: boolean;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            modal: false
        };
    }

    createJson() {
        let buildings: {[structure: string]: {pos: Array<{x: number, y: number}>}} = {};

        const parent = this.props.planner;
        let json = {
            name: parent.state.room,
            world: parent.state.world,
            shard: parent.state.shard,
            rcl: parent.state.rcl,
            buildings: buildings
        };
        const keepStructures = Object.keys(Constants.CONTROLLER_STRUCTURES);

        Object.keys(parent.state.structures).forEach((structure) => {
            if (keepStructures.indexOf(structure) > -1 && !json.buildings[structure]) {
                json.buildings[structure] = {
                    pos: parent.state.structures[structure]
                };
            }
        });

        return JSON.stringify(json);
    }

    import(e: any) {
        let json = JSON.parse(e.target.value);
        this.props.planner.loadJson(json);
    }

    shareableLink() {
        let string = LZString.compressToEncodedURIComponent(this.createJson());
        return "/building-planner/?share=" + string;
    }

    toggleModal() {
        this.setState({modal: !this.state.modal});
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggleModal()} title="Share Results">
                    <FontAwesomeIcon icon={faShareAlt} />
                </button>
                <Modal isOpen={this.state.modal} toggle={() => this.toggleModal()} className="import-room">
                    <ModalHeader toggle={() => this.toggleModal()}>Share Results</ModalHeader>
                    <ModalBody>
                        <Input type="textarea" value={this.createJson()} id="json-data" onChange={(e) => this.import(e)} />
                        <a href={this.shareableLink()} id="share-link">Share Link</a>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}