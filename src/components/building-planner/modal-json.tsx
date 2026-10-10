import * as React from 'react';
import {Col, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from 'reactstrap';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faFileCode} from '@fortawesome/free-solid-svg-icons';

// Removing module.exports = and the semicolon in case it was copied from JS.
function jsonTextForParse(raw: string): string {
    const trimmed = raw.trim();
    const assignment = /^module\.exports\s*=\s*/.exec(trimmed);
    if (assignment) {
        let text = trimmed.slice(assignment[0].length).trim();
        if (text.endsWith(';')) {
            text = text.slice(0, -1).trim();
        }
        return text;
    }
    if (trimmed.endsWith(';')) {
        return raw.replace(/;\s*$/, '');
    }
    return raw;
}

function describeParseError(text: string, error: SyntaxError): string {
    if (/line \d+ column \d+/.test(error.message)) {
        return error.message;
    }
    const position = /position (\d+)/.exec(error.message);
    const index = position ? Number(position[1]) : (error.message.startsWith('Unexpected end of JSON input') ? text.length : null);
    if (index === null || Number.isNaN(index)) {
        return error.message;
    }
    const line = text.slice(0, index).split('\n').length;
    const lineStart = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
    const column = index - lineStart + 1;
    return `${error.message} (line ${line}, column ${column})`;
}

export class ModalJson extends React.Component<ModalProps> {
    state: Readonly<{
        modal: boolean;
        format: boolean;
        roomFeatures: boolean;
        draft: string | null;
        error: string | null;
    }>;

    constructor(props: any) {
        super(props);
        this.state = {
            modal: false,
            format: true,
            roomFeatures: false,
            draft: null,
            error: null,
        };
    }

    displayJson() {
        const data = this.props.planner.exportBlueprint(this.state.roomFeatures);
        return this.state.format
            ? JSON.stringify(data, null, 2)
                .replace(/{\n\s+"x": ([0-9]{1,4}),\n\s+"y": ([0-9]{1,4})\n\s+}/g, '{"x":$1,"y":$2}')
            : JSON.stringify(data);
    }

    onJsonChange(e: any) {
        const value = e.target.value as string;
        const text = jsonTextForParse(value);
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch (error) {
            const message = error instanceof SyntaxError ? describeParseError(text, error) : 'Invalid JSON';
            this.setState({draft: value, error: message});
            return;
        }
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            this.setState({draft: value, error: 'Blueprint JSON must be an object'});
            return;
        }
        try {
            this.props.planner.importBlueprint(parsed);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Could not import this blueprint';
            this.setState({draft: value, error: message});
            return;
        }
        this.setState({draft: null, error: null});
    }

    toggleModal() {
        this.setState({
            modal: !this.state.modal,
            draft: null,
            error: null,
        });
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
                                <p>
                                    Room in <a href="https://github.com/screepers/screeps-tools/blob/master/src/typings.d.ts"><code>EncodedBlueprint</code></a> format
                                    can be exported/imported by copying/pasting the JSON below or through the share link.
                                </p>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Input type="textarea" wrap="soft"
                                       value={this.state.modal ? (this.state.draft ?? this.displayJson()) : ''}
                                       id="json-data"
                                       invalid={this.state.error != null}
                                       onChange={(e) => this.onJsonChange(e)}/>
                                {this.state.error && <FormFeedback className="d-block">{this.state.error}</FormFeedback>}
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <Label className="room-features">
                                    <Input type="checkbox" name="room-features" checked={this.state.roomFeatures}
                                           onChange={(e) => this.toggleRoomFeatures(e)}/>
                                    Include terrain, controller, sources and mineral
                                </Label>
                                <Label className="format-json">
                                    <Input type="checkbox" name="format-json" checked={this.state.format}
                                           onChange={(e) => this.toggleFormatting(e)}/>
                                    Format JSON
                                </Label>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <button className="btn btn-primary" type="button" id="share-link"
                                onClick={() => this.props.planner.copyShareLink(this.state.roomFeatures)}>
                            Copy share Link to clipboard
                        </button>
                    </ModalFooter>
                </Modal>
            </div>
        );
    }
}
