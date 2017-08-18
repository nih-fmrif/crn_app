// dependencies -------------------------------------------------------

import React       from 'react';
import packageJson from '../../../../package.json';


let Footer = React.createClass({

// life cycle events --------------------------------------------------

    render () {

        return (
            <span>
            <footer>
                <div className="row">
                    <div className="col-xs-12 col-md-4 version">
                        <span><a target="_blank" rel="noopener noreferrer" href="https://github.com/poldracklab/crn_deploy" title="OpenNeuro on Github">OpenNeuro Beta v.{packageJson.version}</a></span>
                    </div>
{/*
                    <div className="col-xs-12 col-md-4 footer-menu">
                        <ul>
                            <li>About</li>
                            <li>Privacy</li>
                            <li>Terms</li>
                        </ul>
                    </div>
                    <div className="col-xs-12 col-md-4 copy">
                        <span>&copy; 2016 Stanford Center for Reproducible Neuroscience</span>
                    </div>
*/}
                </div>
            </footer>
            </span>
        );
    }
});

export default Footer;
