import * as React from 'react';
import { faTowerObservation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export class TowerDamageButton extends React.Component<PlannerProps> {
    state: Readonly<{ on: boolean }>;

    constructor(props: any) {
        super(props);

        this.state = {
            on: false
        };
    }

    toggle() {
        this.props.planner.setShowTowerDamage(!this.state.on);
        this.setState({on: !this.state.on});
    }

    render() {
        return (
            <div>
                <button className="btn btn-secondary" onClick={() => this.toggle()} title="Toggle tower damage">
                    <FontAwesomeIcon icon={faTowerObservation} color={this.state.on ? 'green' : 'white'} />
                </button>
            </div>
        );
    }
}