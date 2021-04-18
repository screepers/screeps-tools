import * as React from 'react';
import {Container, Row, Col, Card, Button, CardTitle, CardText} from 'reactstrap';
import {Link} from 'react-router-dom';

export const Index = () => (
    <Container className="index">
        <Row>
            <br/>
            <Col sm={6}>
                <Card body inverse style={{ backgroundColor: '#222', borderColor: '#1e1e1e' }}>
                    <CardTitle>Building Planner</CardTitle>
                    <CardText>The Building planner is a port of Dissi's Building planner into React.</CardText>
                    <Link to='/building-planner'><Button>Plan Room</Button></Link>
                </Card>
            </Col>
            <Col sm={6}>
                <Card body inverse style={{ backgroundColor: '#222', borderColor: '#1e1e1e' }}>
                    <CardTitle>Creep Designer</CardTitle>
                    <CardText>The Creep Designer gives a UI to build creeps and see all their stats.</CardText>
                    <Link to='/creep-designer'><Button>Design Creep</Button></Link>
                </Card>
            </Col>
        </Row>
    </Container>
);