import * as React from 'react';
import {Container, Row, Col, Card, Button, CardTitle, CardText, Alert} from 'reactstrap';
import {Link} from 'react-router-dom';

export const Index = () => (
    <Container className="index">
        <Row>
            <Col sm={6}>
                <Card body inverse style={{ backgroundColor: '#222', borderColor: '#1e1e1e' }}>
                    <CardTitle>Building Planner</CardTitle>
                    <CardText>Plan your next room layout with the Building Planner for Screeps.</CardText>
                    <Link to='/building-planner'><Button>Plan Room</Button></Link>
                </Card>
            </Col>
            <Col sm={6}>
                <Card body inverse style={{ backgroundColor: '#222', borderColor: '#1e1e1e' }}>
                    <CardTitle>Creep Designer</CardTitle>
                    <CardText>Evaluate the potential of your creeps with the Creep Designer.</CardText>
                    <Link to='/creep-designer'><Button>Design Creep</Button></Link>
                </Card>
            </Col>
        </Row>
        <Row>
            <Col sm={12}>
                <br />
                <Alert color="success">
                    <h4 className="alert-heading">Beta Notice</h4>
                    <p>The <Link to='/building-planner'>Building Planner</Link> is undergoing design changes and the back end has been rewritten in python using <a href="https://github.com/admon84/new-screeps-tools/blob/main/main.py" target="_blank">Flask</a> and <a href="https://github.com/screepers/python-screeps/pull/29/files" target="_blank">ScreepsAPI</a>.</p>
                </Alert>
            </Col>
        </Row>
    </Container>
);