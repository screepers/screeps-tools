import * as React from 'react';
import {Container, Row, Col, Input} from 'reactstrap';

export class CreepDesigner extends React.Component{
    state: Readonly <{
        unitCount: number;
        tickTime: number;
        body: {[part: string]: number};
        boost: {[part: string]: string | null};
        controller: number;
        structures: {[structureType: string]: number};
    }>;
    
    constructor(props: any) {
        super(props);
        
        this.state = {
            unitCount: 1,
            tickTime: 3,
            body: {
                move: 0,
                work: 0,
                attack: 0,
                ranged_attack: 0,
                tough: 0,
                heal: 0,
                claim: 0,
                carry: 0
            },
            boost: {
                move: null,
                work: null,
                attack: null,
                ranged_attack: null,
                tough: null,
                heal: null,
                claim: null,
                carry: null
            },
            controller: 8,
            structures: {
                spawn: 3,
                extension: 60
            }
        };
        
        if (!props.api) {
            let params = location.href.split('?')[1];
            let searchParams = new URLSearchParams(params);
            
            if (searchParams.get('share')) {
                let body = searchParams.get('share')!;
                let creepBody = this.state.body;
                let i = 0;
                body.split('-').forEach(count => {
                    creepBody[Object.keys(BODYPARTS)[i]] = parseInt(count);
                    i += 1;
                });
                
                this.setState({body: creepBody});
            }
        }
    }
    
    setBodyPart(e: any, part: string) {
        let old_value = parseInt(e.target.defaultValue) || 0;
        let new_value = parseInt(e.target.value) || 0;

        let dir = new_value > old_value;
        let count = Math.abs(old_value - new_value);
        
        if (dir) {
            this.addBodyPart(part, count);
        } else {
            this.removeBodyPart(part, count);
        }

        e.target.defaultValue = this.state.body[part];
    }
    
    removeBodyPart(part: string, count: number) {
        let body = this.state.body;
        
        if (body[part]) {
            body[part] -= count;
            if (body[part] < 0) {
                body[part] = 0;
            }
        }
        
        this.setState({body: body});
    }
    
    addBodyPart(part: string, count: number) {
        let body = this.state.body;
        
        if (this.countParts() < 50) {
            let max = (50 - this.countParts());
            if (this.countParts() + count > 50) {
                count = max;
            }

            if (body[part]) {
                body[part] += count;
            } else {
                body[part] = count;
            }
        }
        
        this.setState({body: body});
    }
    
    partCost(part: string) {
        let cost = 0;
        let component = this;
        
        if (part && BODYPART_COST[part]) {
            cost = (component.state.body[part] * BODYPART_COST[part]);
        }
        
        return cost;
    }
    
    totalCost() {
        let cost = 0;
        let component = this;
        
        Object.keys(BODYPARTS).forEach(part => {
            cost += (component.state.body[part] * BODYPART_COST[part]);
        })
        
        return cost;
    }

    totalCostWithBoosting(timeMultiplier: number = 1) {
        let cost = this.totalCost();

        for (let part of Object.keys(BODYPARTS)) {
            if (BOOSTS[part] !== undefined) {
                let boostType = this.state.boost[part];
                if (boostType !== null) {
                    cost += (this.state.body[part] * LAB_BOOST_ENERGY);
                }
            }
        }
        return cost * timeMultiplier;
    }

    mineralCost(part: string, timeMultiplier: number = 1) {
        if (BOOSTS[part] !== undefined) {
            let boostType = this.state.boost[part];
            if (boostType !== null) {
                return (this.state.body[part] * LAB_BOOST_MINERAL) * timeMultiplier;
            }
        }
        return 0;
    }
    
    countParts() {
        let count = 0;
        let component = this;
        
        Object.keys(BODYPARTS).forEach(part => {
            count += component.state.body[part];
        })
        
        return count;
    }
    
    body() {
        let body = '[';
        
        Object.keys(BODYPARTS).forEach(part => {
            for (let i = 0; i < this.state.body[part]; i++) {
                body += BODYPARTS[part] + ',';
            }
        })
        
        return body.slice(0, -1) + ']';
    }
    
    shareLink() {
        let counts: number[] = [];
        
        Object.keys(BODYPARTS).forEach(part => {
            counts.push(this.state.body[part]);
        });
        
        return "/creep-designer/?share=" + counts.join('-');
    }
    
    creepLifespan() {
        if (this.state.body.claim > 0) {
            return CREEP_CLAIM_LIFE_TIME;
        } else {
            return CREEP_LIFE_TIME;
        }
    }

    ticksPerHour() {
        // 60 seconds * 60 minutes (1 hour) = 3600 seconds
        return Math.floor(3600 / this.state.tickTime);
    }

    ticksPerDay() {
        // 60 seconds * 60 minutes * 24 hours (1 day) = 86400 seconds
        return Math.floor(86400 / this.state.tickTime);
    }
    
    requiredRCL() {
        let rclRequired = 8;
        let cost = this.totalCost();
        Object.keys(RCL_ENERGY).reverse().forEach(rcl => {
            if (cost <= RCL_ENERGY[parseInt(rcl)]) {
                rclRequired = parseInt(rcl);
            }
        });
        
        return rclRequired;
    }
    
    import(e: any) {
        let data = e.target.value;
        let body = this.state.body;
        
        Object.keys(BODYPARTS).forEach(part => {
            body[part] = (data.match(new RegExp(BODYPARTS[part], 'g')) || []).length
        });
        
        if (!e.noState) {
            this.setState({body: body});
        }
    }

    boostOptions(part: string) {
        let options: React.ReactFragment[] = [];
        if (BOOSTS[part] !== undefined) {
            options.push(<option value="">-</option>);
            for (let resource of Object.keys(BOOSTS[part])) {
                options.push(<option value={resource}>{resource}</option>);
            }
        }
        return options;
    }

    handleBoostChange(e: any, part: string) {
        let boost = this.state.boost;
        let resource = e.target.value && e.target.value || null;
        boost[part] = resource;

        this.setState({boost: boost});
    }

    getCreepActions() {
        let actions: string[] = [];

        if (this.state.body.move > 0) {
            actions.push('move', 'pull');
        }
        if (this.state.body.carry > 0) {
            actions.push('drop', 'pickup', 'transfer', 'withdraw');
        }
        if (this.state.body.work > 0) {
            actions.push('harvest', 'dismantle');
        }
        if (this.state.body.work > 0 && this.state.body.carry > 0) {
            actions.push('build', 'repair', 'upgradeController');
        }
        if (this.state.body.attack > 0) {
            actions.push('attack');
        }
        if (this.state.body.heal > 0) {
            actions.push('heal', 'rangedHeal');
        }
        if (this.state.body.ranged_attack > 0) {
            actions.push('rangedAttack', 'rangedMassAttack');
        }
        if (this.state.body.claim > 0) {
            actions.push('reserveController', 'claimController', 'attackController', 'generateSafeMode');
        }
        return actions;
    }

    getActionValue(part: string, action: string, useUnitMultiplier: boolean, partMultiplier: number, timeMultiplier: number = 1) {
        let partCount = this.state.body[part];
        let returnValue = (partCount * partMultiplier);
        if (timeMultiplier !== 1) {
            returnValue *= timeMultiplier;
        }
        if (useUnitMultiplier) {
            returnValue *= this.state.unitCount;
        }

        if (BOOSTS[part] !== undefined) {
            let boostType = this.state.boost[part];
            if (boostType !== null && BOOSTS[part][boostType][action] !== undefined) {
                returnValue *= BOOSTS[part][boostType][action];
            }
        }

        return returnValue;
    }
    
    getActionValueFormatted(part: string, action: string, useUnitMultiplier: boolean, partMultiplier: number, timeMultiplier: number = 1) {
        return this.formatNumber(this.getActionValue(part, action, useUnitMultiplier, partMultiplier, timeMultiplier), 2);
    }

    walkTime(move: number, carry: number, terrainFactor: number, full: boolean = false) {
        if (move > 0) {
            let moveBoost = 1;
            let boostType = this.state.boost['move'];
            if (boostType !== null && BOOSTS['move'][boostType]['fatigue'] !== undefined) {
                moveBoost = BOOSTS['move'][boostType]['fatigue'];
            }

            let W = this.countParts() - move - (full ? 0 : carry);
            let M = move * moveBoost;
            var speed = Math.ceil(terrainFactor * W / M);
            return Math.max(1, speed);
        }
        return 0;
    }

    formatNumber(num: number, digits: number) {
        const minimumToFormat = 10E3;
        const units = [
            { value: 1, symbol: '' },
            { value: 1E3, symbol: 'K' },
            { value: 1E6, symbol: 'M' },
            { value: 1E9, symbol: 'G' },
            { value: 1E12, symbol: 'T' },
            { value: 1E15, symbol: 'P' },
            { value: 1E18, symbol: 'E' }
        ];
        let i;
        if (num < minimumToFormat) {
            i = 0;
        } else {
            for (i = units.length - 1; i > 0; i--) {
                if (num >= units[i].value) {
                    break;
                }
            }
        }
        let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        return (num / units[i].value).toFixed(digits).replace(rx, "$1") + units[i].symbol;
    }

    changeTickTime(e: any) {
        let amount = e.target.value;

        if (!amount || amount.match(/^\d{1,}(\.\d{0,4})?$/)) {
            if (amount < 0.1) {
                amount = 0.1;
            }
            this.setState({tickTime: amount });
        }
    }

    changeControllerLevel(e: any) {
        const rcl = e.target.value;
        let structures = this.state.structures;
        
        for (let type of Object.keys(CONTROLLER_STRUCTURES)) {
            structures[type] = CONTROLLER_STRUCTURES[type][rcl];
        }

        this.setState({controller: rcl, structures: structures});
    }

    capitalize(type: string) {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    getEnergyCapacity(type: string) {
        if (type == 'spawn') {
            return SPAWN_ENERGY_CAPACITY;
        } else if (type == 'extension') {
            return EXTENSION_ENERGY_CAPACITY[this.state.controller];
        }
        return 0;
    }
    
    setStructure(e: any, type: string) {
        let old_value = parseInt(e.target.defaultValue) || 0;
        let new_value = parseInt(e.target.value) || 0;

        let dir = new_value > old_value;
        let count = Math.abs(old_value - new_value);
        
        if (dir) {
            this.addStructure(type, count);
        } else {
            this.removeStructure(type, count);
        }

        e.target.defaultValue = this.state.structures[type];
    }
    
    removeStructure(type: string, count: number) {
        let structures = this.state.structures;
        
        if (structures[type]) {
            structures[type] -= count;
            if (structures[type] < 0) {
                structures[type] = 0;
            }
        }
        
        this.setState({structures: structures});
    }
    
    addStructure(type: string, count: number) {
        let structures = this.state.structures;
        
        if (structures[type]) {
            structures[type] += count;
        } else {
            structures[type] = count;
        }

        let max = CONTROLLER_STRUCTURES[type][this.state.controller];
        if (max !== undefined && structures[type] > max) {
            structures[type] = max;
        }
        
        this.setState({structures: structures});
    }
    
    structureSum(type: string) {
        return (this.state.structures[type] * this.getEnergyCapacity(type));
    }

    totalEnergyCapacity() {
        let energySum = 0;
        for (let type of Object.keys(CONTROLLER_STRUCTURES)) {
            energySum += this.structureSum(type);
        }
        return energySum;
    }
    
    totalEnergyBalance() {
        return (this.totalEnergyCapacity() - this.totalCost());
    }

    changeUnitCount(e: any) {
        let unitCount = e.target.value.replace(/\D/,'');
        if (unitCount < 1) {
            unitCount = 1;
        } else if (unitCount > 100) {
            unitCount = 100;
        }
        this.setState({unitCount: unitCount});
    }

    getCreepHP(useUnitMultiplier: boolean = false) {
        let hp = 100 * this.countParts();
        if (useUnitMultiplier) {
            hp *= this.state.unitCount;
        }
        return hp;
    }

    getCreepDR(useUnitMultiplier: boolean = false) {
        const boost = this.state.boost.tough;
        if (boost === null) {
            return 0;
        }

        let resist = (100 * this.state.body.tough) / BOOSTS.tough[boost].damage;
        if (useUnitMultiplier) {
            resist *= this.state.unitCount;
        }
        return resist;
    }
    
    labelPerTick(val: string) {
        let append = ' per tick';
        if (this.state.unitCount > 1) {
            append = ` per tick for ${this.state.unitCount} creeps`;
        }
        return <span title={val + append}>{val}<small> /T</small></span>;
    }

    labelCreepLife(val: string, incLifespan: boolean = true) {
        let append = ' total for 1 creep';
        if (incLifespan) {
            append += ` lifespan (${this.creepLifespan()} ticks)`;
        }
        return <span title={val + append}>{val}<small> /1</small></span>;
    }

    labelUnitsLife(val: string, incLifespan: boolean = true) {
        let append = ' total for 1 creep';
        if (this.state.unitCount > 1) {
            append = ` total for ${this.state.unitCount} creeps`;
        }
        if (incLifespan) {
            append += ` lifespan (${this.creepLifespan()} ticks)`;
        }
        return <span title={val + append}>{val}<small> /{this.state.unitCount}</small></span>;
    }

    labelPerHour(val: string) {
        let append = ` total per hour for 1 creep (${this.state.tickTime} sec/tick)`;
        if (this.state.unitCount > 1) {
            append = ` total per hour for ${this.state.unitCount} creeps (${this.state.tickTime} sec/tick)`;
        }
        return <span title={val + append}>{val}<small> /H</small></span>;
    }

    labelPerDay(val: string) {
        let append = ` total per day for 1 creep (${this.state.tickTime} sec/tick)`;
        if (this.state.unitCount > 1) {
            append = ` total per day for ${this.state.unitCount} creeps (${this.state.tickTime} sec/tick)`;
        }
        return <span title={val + append}>{val}<small> /D</small></span>;
    }

    labelWalkTime(val: number, type: string) {
        let tickLabel = 'tick';
        if (val > 1) {
            tickLabel = val.toLocaleString() + ' ticks';
        }
        let tileLabel = 'on ' + type + ' tiles';
        if (type == 'road') {
            tileLabel = 'on ' + type + 's';
        }
        if (type == 'swamp') {
            tileLabel = 'in ' + type + 's';
        }
        let title = `move every ${tickLabel} ${tileLabel}`;
        return <span title={title}>{type}={val}</span>;
    }

    labelCreepHealth(useUnitMultiplier: boolean = false) {
        let label: React.ReactFragment[] = [];

        let creepHP = Math.floor(this.getCreepHP(useUnitMultiplier));
        label.push(<span>{this.formatNumber(creepHP, 2)}</span>);

        let units = 1;
        let append = ' hit points for 1 unit';
        if (useUnitMultiplier && this.state.unitCount > 1) {
            append = ` total hit points for ${this.state.unitCount} units`;
            units = this.state.unitCount;
        }

        if (this.state.body.tough > 0) {
            let creepDR = Math.floor(this.getCreepDR(useUnitMultiplier));
            if (creepDR > 0) {
                let labelDR = ' (+' + this.formatNumber(creepDR, 2) + ' resist)';
                label.push(<small>{labelDR}</small>);
                append += labelDR;
            }
        }
        
        return <span title={this.formatNumber(creepHP, 2) + append}>{label}<small> /{units}</small></span>;
    }
    
    render() {
        return (
            <Container className="creep-designer" fluid={true}>
                <Row>
                    <Col lg={6}>
                        <div className="panel">
                            <table className="body">
                                <thead>
                                    <tr>
                                        <th>Part/Struct</th>
                                        <th>Energy</th>
                                        <th style={{width: '124px'}}>Count</th>
                                        <th>Boost</th>
                                        <th>Sum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(BODYPARTS).map(part => {
                                        return (
                                            <tr key={part} className={this.state.body[part] > 0 ? 'active' : ''}>
                                                <td className="part">{BODYPART_NAMES[part]}</td>
                                                <td className="price">{BODYPART_COST[part]}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" tabIndex={-1} onClick={() => this.removeBodyPart(part, 5)}>--</button>
                                                    <Input type="number" className="count" value={this.state.body[part] ? this.state.body[part] : ''} onChange={(e) => this.setBodyPart(e, part)} />
                                                    <button className="btn btn-secondary btn-sm" tabIndex={-1} onClick={() => this.addBodyPart(part, 5)}>++</button>
                                                </td>
                                                <td className="text-center">
                                                    {BOOSTS[part] !== undefined && <Input type="select" className="boost" onChange={(e) => this.handleBoostChange(e, part)}>
                                                        {this.boostOptions(part)}
                                                    </Input>}
                                                </td>
                                                <td className="sum">{this.partCost(part) ? this.partCost(part) : '0'}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td><label htmlFor="input-units">Unit Count:</label></td>
                                        <td>
                                            <Input type="number" id="input-units" className="unitCount" value={this.state.unitCount} pattern="[0-9]*" onChange={(e) => this.changeUnitCount(e)} />
                                        </td>
                                        <td className="parts-sum"><b>{this.countParts() + (this.state.unitCount > 1 ? ' (' + this.state.unitCount * this.countParts() + ')' : '')}</b></td>
                                        <td className="sum">Cost:</td>
                                        <td className={'sum total' + (this.totalCost() > this.totalEnergyCapacity() && ' alert')}>{this.totalCost()}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5}><hr /></td>
                                    </tr>
                                    {Object.keys(CONTROLLER_STRUCTURES).map(type => {
                                        return (
                                            <tr key={type} className={this.state.structures[type] > 0 ? 'active' : ''}>
                                                <td className="part">{this.capitalize(type)}</td>
                                                <td className="price">{this.getEnergyCapacity(type)}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" tabIndex={-1} onClick={() => this.removeStructure(type, 5)}>--</button>
                                                    <Input type="number" className="count" value={this.state.structures[type] ? this.state.structures[type] : ''} onChange={(e) => this.setStructure(e, type)} />
                                                    {type !== 'spawn' && <button className="btn btn-secondary btn-sm" tabIndex={-1} onClick={() => this.addStructure(type, 5)}>++</button>}
                                                </td>
                                                <td></td>
                                                <td className="sum">{this.structureSum(type) ? this.structureSum(type) : '0'}</td>
                                            </tr>
                                        );
                                    })}
                                    <tr>
                                        <td><label htmlFor="select-rcl">Controller Level:</label></td>
                                        <td>
                                            <Input type="select" id="select-rcl" className="controller" value={this.state.controller} onChange={(e) => this.changeControllerLevel(e)}>
                                                {[...Array(9).keys()].map(level => {
                                                    return (
                                                        <option value={level}>{level}</option>
                                                    );
                                                })}
                                            </Input>
                                        </td>
                                        <td></td>
                                        <td className="sum">Remaining:</td>
                                        <td className={'sum total' + (this.totalEnergyBalance() < 0 && ' alert')}>{this.totalEnergyBalance()}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5}><hr /></td>
                                    </tr>
                                    <tr>
                                        <td><label htmlFor="input-ticks">Tick Duration:</label></td>
                                        <td colSpan={4}><Input type="number" id="input-ticks" className="tickTime" step="0.1" value={this.state.tickTime} onChange={(e) => this.changeTickTime(e)} /> (sec)</td>
                                    </tr>
                                </tbody>
                            </table>
                            <Creep body={this.state.body} />
                        </div>
                    </Col>
                    <Col lg={6}>
                        {this.countParts() > 0 && <div className="panel">
                            <table className="stats">
                                <tbody>
                                <tr className="light">
                                    <td>Health</td>
                                    {this.state.unitCount <= 1 &&
                                        <td colSpan={4} className="text-center">{this.labelCreepHealth()}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td colSpan={2} className="text-center">{this.labelCreepHealth()}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td colSpan={2} className="text-center">{this.labelCreepHealth(true)}</td>
                                    }
                                </tr>
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Dismantle</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'dismantle', true, 50))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'dismantle', true, 50, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'dismantle', true, 50, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'dismantle', true, 50, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Harvest energy</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'harvest', true, 2))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'harvest', true, 2, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'harvest', true, 2, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'harvest', true, 2, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Ticks to drain source</td>
                                    <td colSpan={4} className="text-center">{this.labelCreepLife(Math.ceil(3000 / this.getActionValue('work', 'harvest', false, 2)).toLocaleString(), false)}</td>
                                </tr>}
                                {/* this.state.body.work > 0 && <tr className="work">
                                    <td>Harvest mineral/deposit</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'harvest', true, 1))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'harvest', true, 1, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'harvest', true, 1, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'harvest', true, 1, this.ticksPerDay()))}</td>
                                </tr> */}
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Upgrade controller</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'upgradeController', true, 1))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'upgradeController', true, 1, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'upgradeController', true, 1, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'upgradeController', true, 1, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Build</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'build', true, 5))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'build', true, 5, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'build', true, 5, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'build', true, 5, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.attack > 0 && <tr className="attack">
                                    <td>Attack</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('attack', 'attack', true, 30))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('attack', 'attack', true, 30, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('attack', 'attack', true, 30, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('attack', 'attack', true, 30, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.ranged_attack > 0 && <tr className="ranged_attack">
                                    <td>Ranged attack</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('ranged_attack', 'rangedAttack', true, 10))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('ranged_attack', 'rangedAttack', true, 10, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('ranged_attack', 'rangedAttack', true, 10, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('ranged_attack', 'rangedAttack', true, 10, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.ranged_attack > 0 && <tr className="ranged_attack">
                                    <td>Mass attack 1</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 10))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 10, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 10, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 10, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.ranged_attack > 0 && <tr className="ranged_attack">
                                    <td>Mass attack 2</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 4))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 4, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 4, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 4, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.ranged_attack > 0 && <tr className="ranged_attack">
                                    <td>Mass attack 3</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 1))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 1, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 1, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('ranged_attack', 'rangedMassAttack', true, 1, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.heal > 0 && <tr className="heal">
                                    <td>Heal</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('heal', 'heal', true, 12))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('heal', 'heal', true, 12, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('heal', 'heal', true, 12, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('heal', 'heal', true, 12, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.heal > 0 && <tr className="heal">
                                    <td>Ranged heal</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('heal', 'rangedHeal', true, 4))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('heal', 'rangedHeal', true, 4, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('heal', 'rangedHeal', true, 4, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('heal', 'rangedHeal', true, 4, this.ticksPerDay()))}</td>
                                </tr>}
                                {this.state.body.carry > 0 && <tr className="light">
                                    <td>Carry capacity</td>
                                    {this.state.unitCount <= 1 &&
                                        <td colSpan={4} className="text-center">{this.labelCreepLife(this.getActionValueFormatted('carry', 'capacity', false, 50), false)}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td colSpan={2} className="text-center">{this.labelCreepLife(this.getActionValueFormatted('carry', 'capacity', false, 50), false)}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td colSpan={2} className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('carry', 'capacity', false, (50 * this.state.unitCount)), false)}</td>
                                    }
                                </tr>}
                                {this.state.body.move > 0 && <tr className="move">
                                    <td>Move{this.state.body.carry > 0 && ' (empty)'}</td>
                                    <td colSpan={4} className="text-center">
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 1), 'plain')}</span>
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 0.5), 'road')}</span>
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 5), 'swamp')}</span>
                                    </td>
                                </tr>}
                                {this.state.body.move > 0 && this.state.body.carry > 0 && <tr className="move">
                                    <td>Move (full)</td>
                                    <td colSpan={4} className="text-center">
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 1, true), 'plain')}</span>
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 0.5, true), 'road')}</span>
                                        <span className="spaced">{this.labelWalkTime(this.walkTime(this.state.body.move, this.state.body.carry, 5, true), 'swamp')}</span>
                                    </td>
                                </tr>}
                                <tr className="dark">
                                    <td>Energy cost</td>
                                    {this.state.unitCount <= 1 &&
                                        <td colSpan={2} className="text-center">{this.labelCreepLife(this.formatNumber(this.totalCostWithBoosting(), 2), false)}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td className="text-center">{this.labelCreepLife(this.formatNumber(this.totalCostWithBoosting(), 2), false)}</td>
                                    }
                                    {this.state.unitCount > 1 &&
                                        <td className="text-center">{this.labelUnitsLife(this.formatNumber(this.totalCostWithBoosting(this.state.unitCount), 2), false)}</td>
                                    }
                                    <td className="text-center">{this.labelPerHour(this.formatNumber(this.totalCostWithBoosting(this.state.unitCount * (this.ticksPerHour() / this.creepLifespan())), 2))}</td>
                                    <td className="text-center">{this.labelPerDay(this.formatNumber(this.totalCostWithBoosting(this.state.unitCount * (this.ticksPerDay() / this.creepLifespan())), 2))}</td>
                                </tr>
                                {Object.keys(BODYPARTS).map(part => {
                                    if (BOOSTS[part] !== undefined && this.state.boost[part] !== null && this.state.body[part] > 0) {
                                        return (
                                            <tr className="dark">
                                                <td>{this.state.boost[part]}</td>
                                                {this.state.unitCount <= 1 &&
                                                    <td colSpan={2} className="text-center">{this.labelCreepLife(this.formatNumber(this.mineralCost(part), 2))}</td>
                                                }
                                                {this.state.unitCount > 1 &&
                                                    <td className="text-center">{this.labelCreepLife(this.formatNumber(this.mineralCost(part), 2))}</td>
                                                }
                                                {this.state.unitCount > 1 &&
                                                    <td className="text-center">{this.labelUnitsLife(this.formatNumber(this.mineralCost(part, this.state.unitCount), 2))}</td>
                                                }
                                                <td className="text-center">{this.labelPerHour(this.formatNumber(this.mineralCost(part, this.state.unitCount * (this.ticksPerHour() / this.creepLifespan())), 2))}</td>
                                                <td className="text-center">{this.labelPerDay(this.formatNumber(this.mineralCost(part, this.state.unitCount * (this.ticksPerDay() / this.creepLifespan())), 2))}</td>
                                            </tr>
                                        );
                                    }
                                })}
                                </tbody>
                            </table>
                            <br/>
                            <h5>Creep Actions</h5>
                            <div className="actions-list">
                                {this.getCreepActions().map(action => {
                                    return (
                                        <ul className="creep-action">
                                            <li>{action}</li>
                                        </ul>
                                    );
                                })}
                            </div>
                            <Input type="textarea" className="creep-body" value={this.body()} onChange={(e) => this.import(e)} />
                            <a href={this.shareLink()}>Shareable Link</a>
                        </div>}
                    </Col>
                </Row>
            </Container>
        );
    }
}

const Creep = ({body}: {body: {[part: string]: number}}) => (
    <svg width="200" height="200">
        {/* TOUGH */}
        <circle cx={100} cy={100} r={65} fill="#525252" opacity={body.tough > 0 ? body.tough / 50 : 0 } />
        
        <circle cx={100} cy={100} r={60} fill="#222" />
        
        {/* RANGED_ATTACK */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.claim + body.ranged_attack + body.attack + body.heal + body.work),
            bodyPartCountToDeg(body.claim + body.ranged_attack + body.attack + body.heal + body.work),
            65
            )} fill="#5d7fb2" transform="rotate(-90 100 100)" />
        
        {/* ATTACK */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.claim + body.attack + body.heal + body.work),
            bodyPartCountToDeg(body.claim + body.attack + body.heal + body.work),
            65
            )} fill="#f93842" transform="rotate(-90 100 100)" />
        
        {/* HEAL */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.claim + body.heal + body.work),
            bodyPartCountToDeg(body.claim + body.heal + body.work),
            65
            )} fill="#65fd62" transform="rotate(-90 100 100)" />
        
        {/* WORK */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.claim + body.work),
            bodyPartCountToDeg(body.claim + body.work),
            65
            )} fill="#ffe56d" transform="rotate(-90 100 100)" />
        
        {/* CLAIM */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.claim),
            bodyPartCountToDeg(body.claim),
            65
            )} fill="#b99cfb" transform="rotate(-90 100 100)" />
        
        {/* MOVE */}
        <path d={bodyPartWedge(100,
            100,
            0 - bodyPartCountToDeg(body.move),
            bodyPartCountToDeg(body.move),
            65)} fill="#a9b7c6" transform="rotate(90 100 100)" />
        
        <circle cx={100} cy={100} r={50} fill="#555" />
        <circle cx={100} cy={100} r={body.carry} fill="#ffe56d" />
    </svg>
);

function bodyPartCountToDeg(count: number) {
    return (count * 7.2) / 2;
}

function bodyPartWedge(startX: number, startY: number, startAngle: number, endAngle: number, radius: number) {
    var x1 = startX + radius * Math.cos(Math.PI * startAngle/180);
    var y1 = startY + radius * Math.sin(Math.PI * startAngle/180);
    var x2 = startX + radius * Math.cos(Math.PI * endAngle/180);
    var y2 = startY + radius * Math.sin(Math.PI * endAngle/180);
    
    let largeArc = 0;
    let travel = startAngle - endAngle;
    
    if (travel < -180) {
        largeArc = 1;
    }

    return `M${startX} ${startY} L${x1} ${y1} A${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} z`;
}

/**
 * Screeps Game Constants
 */
const CREEP_LIFE_TIME: number = 1500;
const CREEP_CLAIM_LIFE_TIME: number = 600;
const LAB_BOOST_ENERGY: number = 20;
const LAB_BOOST_MINERAL: number = 30;
const SPAWN_ENERGY_CAPACITY: number = 300;

const EXTENSION_ENERGY_CAPACITY: {[level: number]: number} = {
    0: 50,
    1: 50,
    2: 50,
    3: 50,
    4: 50,
    5: 50,
    6: 50,
    7: 100,
    8: 200
};

const CONTROLLER_STRUCTURES: {[structureType: string]: {[level: number]: number}} = {
    spawn: {0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 2, 8: 3},
    extension: {0: 0, 1: 0, 2: 5, 3: 10, 4: 20, 5: 30, 6: 40, 7: 50, 8: 60},
};

const RCL_ENERGY: {[level: number]: number} = {
    1: 300,
    2: 550,
    3: 800,
    4: 1300,
    5: 1800,
    6: 2300,
    7: 5600,
    8: 12900
};

const BODYPART_COST: {[part: string]: number} = {
    move: 50,
    work: 100,
    attack: 80,
    carry: 50,
    heal: 250,
    ranged_attack: 150,
    tough: 10,
    claim: 600
};

const BODYPARTS: {[part: string]: string} = {
    tough: "TOUGH",
    move: "MOVE",
    work: "WORK",
    carry: "CARRY",
    attack: "ATTACK",
    ranged_attack: "RANGED_ATTACK",
    heal: "HEAL",
    claim: "CLAIM"
};

const BODYPART_NAMES: {[part: string]: string} = {
    tough: "Tough",
    move: "Move",
    work: "Work",
    carry: "Carry",
    attack: "Attack",
    ranged_attack: "Ranged Attack",
    heal: "Heal",
    claim: "Claim"
};

const BOOSTS: {[part: string]: {[resource: string]: {[method: string]: number}}} = {
    work: {
        UO: {
            harvest: 3
        },
        UHO2: {
            harvest: 5
        },
        XUHO2: {
            harvest: 7
        },
        LH: {
            build: 1.5,
            repair: 1.5
        },
        LH2O: {
            build: 1.8,
            repair: 1.8
        },
        XLH2O: {
            build: 2,
            repair: 2
        },
        ZH: {
            dismantle: 2
        },
        ZH2O: {
            dismantle: 3
        },
        XZH2O: {
            dismantle: 4
        },
        GH: {
            upgradeController: 1.5
        },
        GH2O: {
            upgradeController: 1.8
        },
        XGH2O: {
            upgradeController: 2
        }
    },
    attack: {
        UH: {
            attack: 2
        },
        UH2O: {
            attack: 3
        },
        XUH2O: {
            attack: 4
        }
    },
    ranged_attack: {
        KO: {
            rangedAttack: 2,
            rangedMassAttack: 2
        },
        KHO2: {
            rangedAttack: 3,
            rangedMassAttack: 3
        },
        XKHO2: {
            rangedAttack: 4,
            rangedMassAttack: 4
        }
    },
    heal: {
        LO: {
            heal: 2,
            rangedHeal: 2
        },
        LHO2: {
            heal: 3,
            rangedHeal: 3
        },
        XLHO2: {
            heal: 4,
            rangedHeal: 4
        }
    },
    carry: {
        KH: {
            capacity: 2
        },
        KH2O: {
            capacity: 3
        },
        XKH2O: {
            capacity: 4
        }
    },
    move: {
        ZO: {
            fatigue: 2
        },
        ZHO2: {
            fatigue: 3
        },
        XZHO2: {
            fatigue: 4
        }
    },
    tough: {
        GO: {
            damage: .7
        },
        GHO2: {
            damage: .5
        },
        XGHO2: {
            damage: .3
        }
    }
};