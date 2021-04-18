import * as React  from 'react';
import * as ReactDOM  from 'react-dom';
import {App} from './components/router';

import './less/main.less';
import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
    <App />,
    document.getElementById('app')
);