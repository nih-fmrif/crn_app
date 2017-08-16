// dependencies ----------------------------------------------------

import React from 'react';
import di from '../services/containers';
const authService = di.auth;

// require auth ----------------------------------------------------

var requireAuth = (Component, role = 'user') => {
  return class Authenticated extends React.Component {
    static willTransitionTo(transition) {
      return authService.isSignedIn().then(signedIn => {
        if (!signedIn || (role === 'admin' && !authService.isRoot())) {
          transition.redirect('front-page', {});
        }
      });
    }
    render () {
      return <Component />;
    }
  };
};

export default requireAuth;