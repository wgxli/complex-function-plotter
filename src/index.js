import 'babel-polyfill';

import React from 'react';
import {render} from 'react-snapshot';

import './index.css';

import App from './App';
import {unregister} from './registerServiceWorker';


render(<App />, document.getElementById('root'));
//registerServiceWorker();
unregister();
