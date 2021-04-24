import * as React from 'react';
import {Container, Row, Col, Card, Button, CardTitle, CardText} from 'reactstrap';
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
    </Container>
);