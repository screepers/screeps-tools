import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from './components/router';

import './less/main.less';
import 'bootstrap/dist/css/bootstrap.css';

const rootElement = document.getElementById('app');
if (rootElement) {
    createRoot(rootElement).render(<App />);
}
