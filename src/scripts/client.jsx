// dependencies ---------------------------------------------------------

import React            from 'react';
import ReactDOM         from 'react-dom';
import Router           from 'react-router';
import routes           from './routes.jsx';
import RouterContainer  from './utils/router-container';

import di               from './services/containers';
const auth = di.auth;

auth.handleAuthCallback();

// intialize router -----------------------------------------------------

let router = Router.create({routes: routes, location: Router.HistoryLocation});

RouterContainer.set(router);

Router.run(routes, Router.HistoryLocation, function (Handler) {
    ReactDOM.render(<Handler/>, document.getElementById('main'));
});

