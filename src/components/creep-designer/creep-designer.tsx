import * as React from 'react';
import {Container, Row, Col, Input} from 'reactstrap';
import {Creep} from './creep';
import {
    BODYPART_COST,
    CONTROLLER_STRUCTURES, CREEP_CLAIM_LIFE_TIME,
    CREEP_LIFE_TIME, EXTENSION_ENERGY_CAPACITY,
    LAB_BOOST_ENERGY,
    LAB_BOOST_MINERAL, SPAWN_ENERGY_CAPACITY
} from '../../screeps/game-constants';
import {BODYPART_NAMES, BODYPARTS, BOOSTS, RCL_ENERGY} from '../../screeps/constants';
import {forIn} from '../../js-utils';

export class CreepDesigner extends React.Component{
    state: Readonly <{
        unitCount: number;
        tickTime: number;
        body: Record<BodyPartConstant, number>;
        boost: Record<BodyPartConstant, string | null>;
        controller: number;
        structures: {[structureType: string]: number};
    }>;
    energyStructures: string[];
    
    constructor(props: any) {
        super(props);

        this.energyStructures = ['spawn', 'extension'];

        const cachedBody = {
            move: 0,
            work: 0,
            attack: 0,
            ranged_attack: 0,
            tough: 0,
            heal: 0,
            claim: 0,
            carry: 0
        };

        const cachedBoost = {
            move: null,
            work: null,
            attack: null,
            ranged_attack: null,
            tough: null,
            heal: null,
            claim: null,
            carry: null
        };
        
        this.state = {
            unitCount: 1,
            tickTime: 3,
            body: {
                move: cachedBody.move,
                work: cachedBody.work,
                attack: cachedBody.attack,
                ranged_attack: cachedBody.ranged_attack,
                tough: cachedBody.tough,
                heal: cachedBody.heal,
                claim: cachedBody.claim,
                carry: cachedBody.carry
            },
            boost: {
                move: cachedBoost.move,
                work: cachedBoost.work,
                attack: cachedBoost.attack,
                ranged_attack: cachedBoost.ranged_attack,
                tough: cachedBoost.tough,
                heal: cachedBoost.heal,
                claim: cachedBoost.claim,
                carry: cachedBoost.carry
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
                    const part = (Object.keys(BODYPARTS)[i]!) as BodyPartConstant;
                    creepBody[part] = parseInt(count);
                    i += 1;
                });
                
                this.setState({body: creepBody});
            }
        }
    }
    
    setBodyPart(e: any, part: BodyPartConstant) {
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
    
    removeBodyPart(part: BodyPartConstant, count: number) {
        let body = this.state.body;
        
        if (body[part]) {
            body[part] -= count;
            if (body[part] < 0) {
                body[part] = 0;
            }
        }
        
        this.setState({body: body});
    }
    
    addBodyPart(part: BodyPartConstant, count: number) {
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
    
    partCost(part: BodyPartConstant) {
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
        
        forIn(BODYPARTS, (part) => {
            cost += (component.state.body[part] * BODYPART_COST[part]);
        });
        
        return cost;
    }

    totalCostWithBoosting(timeMultiplier: number = 1) {
        let cost = this.totalCost();

        forIn(BODYPARTS, (part) => {
            if (BOOSTS[part] !== undefined) {
                let boostType = this.state.boost[part];
                if (boostType !== null) {
                    cost += (this.state.body[part] * LAB_BOOST_ENERGY);
                }
            }
        });
        return cost * timeMultiplier;
    }

    mineralCost(part: BodyPartConstant, timeMultiplier: number = 1) {
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
        
        forIn(BODYPARTS, (part) => {
            count += component.state.body[part];
        });
        
        return count;
    }
    
    body() {
        let body = '';
        
        forIn(BODYPARTS, (part) => {
            for (let i = 0; i < this.state.body[part]; i++) {
                body += BODYPARTS[part] + ',';
            }
        });
        
        return '[' + body.slice(0, -1) + ']';
    }
    
    shareLink() {
        let counts: number[] = [];
        
        forIn(BODYPARTS, (part) => {
            counts.push(this.state.body[part]);
        });
        
        const data = counts.join('-');
        return `?share=${data}${location.hash}`
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
            if (cost <= RCL_ENERGY[parseInt(rcl)]!) {
                rclRequired = parseInt(rcl);
            }
        });
        
        return rclRequired;
    }
    
    import(e: any) {
        let data = e.target.value;
        let body = this.state.body;
        
        forIn(BODYPARTS, (part) => {
            body[part] = (data.match(new RegExp(BODYPARTS[part], 'g')) || []).length
        });
        
        if (!e.noState) {
            this.setState({body: body});
        }
    }

    boostOptions(part: BodyPartConstant) {
        let options: React.ReactFragment[] = [];
        const partBoosts = BOOSTS[part];
        if (partBoosts !== undefined) {
            options.push(<option value="">-</option>);
            for (let resource of Object.keys(partBoosts)) {
                options.push(<option value={resource}>{resource}</option>);
            }
        }
        return options;
    }

    handleBoostChange(e: any, part: BodyPartConstant) {
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

    getActionValue(part: BodyPartConstant, action: string, useUnitMultiplier: boolean, partMultiplier: number, timeMultiplier: number = 1) {
        let partCount = this.state.body[part];
        let returnValue = (partCount * partMultiplier);
        if (timeMultiplier !== 1) {
            returnValue *= timeMultiplier;
        }
        if (useUnitMultiplier) {
            returnValue *= this.state.unitCount;
        }

        const partBoosts = BOOSTS[part];
        if (partBoosts !== undefined) {
            let boostType = this.state.boost[part];
            if (boostType !== null && partBoosts[boostType]![action] !== undefined) {
                returnValue *= partBoosts[boostType]![action]!;
            }
        }

        return returnValue;
    }
    
    getActionValueFormatted(part: BodyPartConstant, action: string, useUnitMultiplier: boolean, partMultiplier: number, timeMultiplier: number = 1) {
        return this.formatNumber(this.getActionValue(part, action, useUnitMultiplier, partMultiplier, timeMultiplier), 2);
    }

    walkTime(move: number, carry: number, terrainFactor: number, full: boolean = false) {
        if (move > 0) {
            let moveBoost = 1;
            let boostType = this.state.boost['move'];
            if (boostType !== null && BOOSTS['move']![boostType]!['fatigue'] !== undefined) {
                moveBoost = BOOSTS['move']![boostType]!['fatigue']!;
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
                if (num >= units[i]!.value) {
                    break;
                }
            }
        }
        let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        return (num / units[i]!.value).toFixed(digits).replace(rx, "$1") + units[i]!.symbol;
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
        
        for (let type of this.energyStructures) {
            structures[type] = CONTROLLER_STRUCTURES[type]![rcl]!;
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
            return EXTENSION_ENERGY_CAPACITY[this.state.controller]!;
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
            if (structures[type]! < 0) {
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

        let max = CONTROLLER_STRUCTURES[type]![this.state.controller];
        if (max !== undefined && structures[type]! > max) {
            structures[type] = max;
        }
        
        this.setState({structures: structures});
    }
    
    structureSum(type: string) {
        return (this.state.structures[type]! * this.getEnergyCapacity(type));
    }

    totalEnergyCapacity() {
        let energySum = 0;
        for (let type of this.energyStructures) {
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

        let resist = (100 * this.state.body.tough) / BOOSTS.tough![boost]!.damage!;
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
        return <span title={val + append}>{val}</span>;
    }

    labelUnitsLife(val: string, incLifespan: boolean = true) {
        let append = ' total for 1 creep';
        if (this.state.unitCount > 1) {
            append = ` total for ${this.state.unitCount} creeps`;
        }
        if (incLifespan) {
            append += ` lifespan (${this.creepLifespan()} ticks)`;
        }
        let subUnits = <></>;
        if (this.state.unitCount > 1) {
            subUnits = <small> /{this.state.unitCount}</small>;
        }
        return <span title={val + append}>{val}{subUnits}</span>;
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
        
        let subUnits = <></>;
        if (units > 1) {
            subUnits = <small> /{units}</small>;
        }

        return <span title={this.formatNumber(creepHP, 2) + append}>{label}{subUnits}</span>;
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
                                    {Object.keys(BODYPARTS).map((partName) => {
                                        const part = partName as BodyPartConstant;
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
                                    {this.energyStructures.map(type => {
                                        return (
                                            <tr key={type} className={this.state.structures[type]! > 0 ? 'active' : ''}>
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
                                        <td colSpan={4}>
                                            <Input type="number" id="input-ticks" className="tickTime" step="0.1" value={this.state.tickTime} onChange={(e) => this.changeTickTime(e)} /> (sec)
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5}><hr /></td>
                                    </tr>
                                    <tr>
                                        <td><label htmlFor="creep-body">Body Profile</label></td>
                                        <td colSpan={4}>
                                            <Input type="textarea" id="creep-body" className="creep-body" value={this.body()} onChange={(e) => this.import(e)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td></td>
                                        <td colSpan={4}>
                                            <a href={this.shareLink()}>Share Link</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
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
                                {this.state.body.work > 0 && <tr className="work">
                                    <td>Repair</td>
                                    <td className="text-center">{this.labelPerTick(this.getActionValueFormatted('work', 'repair', true, 100))}</td>
                                    <td className="text-center">{this.labelUnitsLife(this.getActionValueFormatted('work', 'repair', true, 100, this.creepLifespan()))}</td>
                                    <td className="text-center">{this.labelPerHour(this.getActionValueFormatted('work', 'repair', true, 100, this.ticksPerHour()))}</td>
                                    <td className="text-center">{this.labelPerDay(this.getActionValueFormatted('work', 'repair', true, 100, this.ticksPerDay()))}</td>
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
                                {Object.keys(BODYPARTS).map((partName) => {
                                    const part = partName as BodyPartConstant;
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
                                    } else {
                                        return undefined;
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
                            <Creep body={this.state.body} />
                        </div>}
                    </Col>
                </Row>
            </Container>
        );
    }
}
