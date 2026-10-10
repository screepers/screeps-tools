import * as React from 'react';
import {HashRouter, NavLink, Route, Routes} from 'react-router-dom';
import {BuildingPlanner} from './building-planner/building-planner';
import {CreepDesigner} from './creep-designer/creep-designer';
import {ResourcesList} from './resources-list/resources-list';
import {Index} from './index/index';

export const App = () => (
    <HashRouter>
        <div className="screeps-tools">
            <div className="header">
                <NavLink to='/' end><img src="assets/logo.png" className="logo" /></NavLink>
                <NavLink to='/building-planner'>Building Planner</NavLink>
                <NavLink to='/creep-designer'>Creep Designer</NavLink>
                <NavLink to='/resources'>Resources</NavLink>
                <a href="https://github.com/screepers/screeps-tools" target="_blank" className="float-end">GitHub</a>
            </div>
            <Routes>
                <Route path='/' element={<Index />} />
                <Route path='/building-planner' element={<BuildingPlanner />} />
                <Route path='/creep-designer' element={<CreepDesigner />} />
                <Route path='/resources' element={<ResourcesList />} />
            </Routes>
        </div>
    </HashRouter>
);
