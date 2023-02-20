import * as React  from 'react';
import {HashRouter, Route, withRouter, Switch, NavLink} from 'react-router-dom';
import {RouteComponentProps} from 'react-router';
import {BuildingPlanner} from './building-planner/building-planner';
import {CreepDesigner} from './creep-designer/creep-designer';
import {ResourcesList} from './resources-list/resources-list';
import {Index} from './index/index';

class AppRouter extends React.Component<RouteComponentProps<{}>> {
    render() {
        return (
            <div className="screeps-tools">
                <div className="header">
                    <NavLink to='/' exact><img src="assets/logo.png" className="logo" /></NavLink>
                    <NavLink to='/building-planner'>Building Planner</NavLink>
                    <NavLink to='/creep-designer'>Creep Designer</NavLink>
                    <NavLink to='/resources'>Resources</NavLink>
                    <a href="https://github.com/screepers/screeps-tools" target="_blank" className="float-right">GitHub</a>
                </div>
                <Switch>
                    <Route path='/' exact component={Index} />
                    <Route path='/building-planner' component={BuildingPlanner} />
                    <Route path='/creep-designer' component={CreepDesigner} />
                    <Route path='/resources' component={ResourcesList} />
                </Switch>
            </div>
        );
    }
}

const WrappedApp = withRouter(AppRouter);

export const App = () => (
    <HashRouter>
        <WrappedApp />
    </HashRouter>
);