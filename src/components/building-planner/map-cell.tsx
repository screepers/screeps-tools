import * as React from 'react';
import {TERRAIN_MASK_SWAMP, TERRAIN_MASK_WALL} from '../common/constants';

export class MapCell extends React.Component<MapCellProps> {
    state: Readonly<{
        hover: boolean;
        structure: string | null;
        road: {
            middle: boolean;
            top: boolean;
            top_right: boolean;
            right: boolean;
            bottom_right: boolean;
            bottom: boolean;
            bottom_left: boolean;
            left: boolean;
            top_left: boolean;
        };
        rampart: boolean;
        source: boolean;
        mineral: string | null;
        text: string;
        textSize: number;
    }>;

    constructor(props: MapCellProps) {
        super(props);

        this.state = {
            hover: false,
            structure: this.props.structure,
            road: {
                middle: this.props.road.middle,
                top: this.props.road.top,
                top_right: this.props.road.top_right,
                right: this.props.road.right,
                bottom_right: this.props.road.bottom_right,
                bottom: this.props.road.bottom,
                bottom_left: this.props.road.bottom_left,
                left: this.props.road.left,
                top_left: this.props.road.top_left,
            },
            rampart: this.props.rampart,
            source: this.props.source,
            mineral: this.props.mineral,
            text: this.props.text,
            textSize: this.props.textSize,
        };
    }

    componentWillReceiveProps(newProps: MapCellProps) {
        this.setState({
            structure: newProps.structure,
            road: newProps.road,
            rampart: newProps.rampart,
            source: newProps.source,
            mineral: newProps.mineral,
            text: newProps.text,
            textSize: newProps.textSize,
        });
    }

    getCellContent() {
        let content = [];

        switch (this.state.structure) {
            case 'spawn':
            case 'extension':
            case 'link':
            case 'constructedWall':
            case 'tower':
            case 'observer':
            case 'powerSpawn':
            case 'extractor':
            case 'terminal':
            case 'lab':
            case 'container':
            case 'nuker':
            case 'storage':
            case 'factory':
            case 'controller':
            case 'source':
                let path = `assets/structures/${this.state.structure}.png`;
                content.push(<img src={path} />);
        }

        if (this.state.source) {
            content.push(<img src="assets/resources/source.png" />);
        }

        switch (this.state.mineral) {
            case 'X':
            case 'Z':
            case 'L':
            case 'K':
            case 'U':
            case 'O':
            case 'H':
                let path = `assets/resources/${this.state.mineral}.png`;
                content.push(<img src={path} />);
        }

        if (this.state.road.middle) {
            content.push(<svg height="2%" width="100%">
                <circle cx="50%" cy="50%" r="1" fill="#6b6b6b" />
            </svg>);
        }
        if (this.state.road.top_left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.top) {
            content.push(<svg height="2%" width="100%">
                <line x1="50%" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.top_right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="0" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="50%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom_right) {
            content.push(<svg height="2%" width="100%">
                <line x1="100%" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom) {
            content.push(<svg height="2%" width="100%">
                <line x1="50%" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.bottom_left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="100%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }
        if (this.state.road.left) {
            content.push(<svg height="2%" width="100%">
                <line x1="0" y1="50%" x2="50%" y2="50%" stroke="#6b6b6b" strokeWidth={2} />
            </svg>);
        }

        if (this.state.text) {
            content.push(<div className="cell-text" style={{fontSize: this.state.textSize}}>{this.state.text}</div>);
        }

        return (content.length ? content : ' ');
    }

    className() {
        let className = '';

        if (this.state.hover) {
            className += 'hover ';
        }

        if (this.state.structure) {
            className += this.state.structure + ' ';
        }

        if (this.state.road.middle) {
            className += 'road ';
        }

        if (this.state.rampart) {
            className += 'rampart ';
        }

        if (this.state.source) {
            className += 'source ';
        }

        if (this.state.mineral) {
            className += this.state.mineral + ' ';
        }

        if (this.props.terrain & TERRAIN_MASK_WALL) {
            return className + 'cell wall';
        } else if (this.props.terrain & TERRAIN_MASK_SWAMP) {
            return className + 'cell swamp';
        } else {
            return className + 'cell plain';
        }
    }

    mouseEnter(e: any) {
        // update this.state.x and this.state.y
        this.setState({hover: true});
        this.props.planner.setState({
            x: parseInt(e.currentTarget.dataset.x),
            y: parseInt(e.currentTarget.dataset.y)
        });
        // handle click and drag
        if (e.buttons == 1) {
            this.onClick(e);
            this.setState({hover: false});
        } else if (e.buttons == 2) {
            this.onContextMenu(e);
            this.setState({hover: false});
        }
    }

    mouseLeave(e: any) {
        this.setState({hover: false});
    }

    onClick(e: any) {
        if (e.shiftKey) {
            // shift+left-click should do the same as right-click - removing structures
            this.onContextMenu(e);
        } else {
            e.preventDefault();

            this.props.planner.paintCell(this.props.x, this.props.y);
        }
    }

    onContextMenu(e: any) {
        e.preventDefault();

        if (this.state.structure !== '' || this.state.road || this.state.rampart || this.state.mineral || this.state.source) {
            this.props.planner.removeStructure(this.props.x, this.props.y, this.state.structure);
            this.props.planner.removeStructure(this.props.x, this.props.y, 'rampart');
            this.props.planner.removeStructure(this.props.x, this.props.y, 'road');
            this.props.planner.removeResource(this.props.x, this.props.y);

            this.setState({structure: '', road: false, rampart: false});
        }
    }

    onWheel(e: any) {
        if (e.shiftKey) {
            const decrease = (e.deltaY > 0);
            this.props.planner.changeScale(false, decrease);
        }
    }

    render() {
        return (
            <div className="tile">
                <div className={this.className()}
                    onMouseEnter={this.mouseEnter.bind(this)}
                    onMouseLeave={this.mouseLeave.bind(this)}
                    onClick={this.onClick.bind(this)}
                    onContextMenu={this.onContextMenu.bind(this)}
                    onWheel={this.onWheel.bind(this)}
                    data-x={this.props.x}
                    data-y={this.props.y}>
                    {this.getCellContent()}
                </div>
            </div>
        );
    }
}
