// dependencies -------------------------------------------------------

import React         from 'react';
import Reflux        from 'reflux';
import {Link}        from 'react-router';
//import FrontPageTabs from './front-page-tabs.jsx';
import userStore     from '../user/user.store.js';
import Spinner       from '../common/partials/spinner.jsx';
import Footer        from '../common/partials/footer.jsx';
//import Pipelines     from './front-page.pipelines.jsx';
import FPActions     from './front-page.actions.js';
import config        from '../../../config';
import di from '../services/containers';
const authService = di.auth;

//silence lint errors while allowing somewhat simpler merges with upstream
//var _ = FrontPageTabs;
//var _ = Pipelines;

// component setup ----------------------------------------------------

let FrontPage = React.createClass({

    mixins: [Reflux.connect(userStore)],

    statics: {
        willTransitionTo(transition) {
            if (authService.hasToken()) {
                transition.redirect('dashboard');
            }
        }
    },

// life cycle events --------------------------------------------------

    componentWillMount() {
        FPActions.reset();
    },

    render () {

        return (
            <span>
                <div className="intro">
                    <div className="container">
                        <div className="intro-inner fade-in clearfix">
                            <div className="clearfix welcome-block">
                                <img src="./assets/nido.png" alt="NIMH Intramural Data-sharing with OpenNeuro" />
{/*
                                <div className="logo-layers">
                                    <img className="logo-layer-users" src="./assets/logo_users.png" alt="OpenNeuro Logo" />
                                    <img className="logo-layer-cube" src="./assets/logo_cube.png" alt="OpenNeuro Logo" />
                                    <img className="logo-layer-app" src="./assets/logo_app.png" alt="OpenNeuro Logo" />
                                    <img className="logo-layer-data" src="./assets/logo_data.png" alt="OpenNeuro Logo" />
                                </div>
                                <div className="logo-text">Open<span className="logo-end">Neuro</span></div>
*/}
                                <h1>NIMH Intramural Data-sharing with OpenNeuro</h1>
                                <div className="sign-in-block fade-in">
                                    {this._error(this.state.signinError, this.state.loading)}
                                    {this._signinForm(this.state.loading)}
                                    <Spinner text="Signing in..." active={this.state.loading} />
                                </div>
                                <div className="browse-publicly">
                                    <Link to="publicDashboard"><span>Browse Public Datasets</span></Link>
                                </div>
                                This is a U.S. Government computer system, which may be accessed and used only for authorized Government business by authorized personnel. Unauthorized access or use of this computer system may subject violators to criminal, civil, and/or administrative action. All information on this computer system may be intercepted, recorded, read, copied, and disclosed by and to authorized personnel for official purposes, including criminal investigations. Such information includes sensitive data encrypted to comply with confidentiality and privacy requirements. Access or use of this computer system by any person, whether authorized or unauthorized, constitutes consent to these terms. There is no right of privacy in this system.
                            </div>
                        </div>
                    </div>
                </div>
                {this._moreInfo()}
                <Footer />
            </span>
        );
    },

// custom methods -------------------------------------------------------

    _signinForm(loadingState){
        if (!loadingState) {
            return(
                <span>
                  {config.auth.type === 'google' && <button className="btn-admin" onClick={userStore.signIn} ><i className="fa fa-google" /> Sign in with Google</button>}
                  {config.auth.type === 'globus' && <button className="btn-admin" onClick={userStore.signIn} ><i className="globus-icon-fp" /> Sign in with Globus</button>}
                </span>
            );
        }
    },

    _error(signinError, loadingState) {
        if (signinError && !loadingState) {
            return <div className="alert alert-danger">{this.state.signinError}</div>;
        }
    },

// template functions ----------------------------------------------------

    _moreInfo(){
        return (
            <div className="more-info">
                <div className="container">
{/*
                    <span className="openneuro-more">
                        <div className="col-xs-12">
                            <div className="logo-text">Open<span className="logo-end">Neuro</span></div>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                <p>A free and open platform for analyzing and sharing neuroimaging data</p>
                            </div>
                            <div className="col-sm-6">
                                <p>View more information about<br/>
                                <a target="_blank" href="http://reproducibility.stanford.edu/">Stanford Center for Reproducible Neuroscience</a></p>
                            </div>
                        </div>
                    </span>
                    <span className="bids-more">
                        <div className="col-xs-12">
                            <h3>Brain Imaging Data Structure (BIDS) </h3>
                        </div>
                        <div className="row">
                            <div className="col-sm-6">
                                    <p>A Validator for the Brain Imaging Data Structure<br/>
                                        Read more about the <a target="_blank" href="http://bids.neuroimaging.io/">BIDS specifications</a></p>
                                </div>
                                <div className="col-sm-6">
                                <p>Want to contribute to BIDS?<br/>
                                    Visit the <a target="_blank" href="https://groups.google.com/forum/#!forum/bids-discussion">Google discussion group</a> to contribute.</p>
                            </div>
                        </div>
                    </span>
*/}
                    <div className="support-more">
                            <h4 className="sr-only">Support for NIDO provided by</h4>
                            <div className="support-more-row">
                                <div className="support-more-col">
                                    <a target="_blank" rel="noopener noreferrer" href="https://cmn.nimh.nih.gov/" title="Data Science and Sharing Team">
                                        <img src="./assets/data-science-and-sharing-team.png" alt="Data Science and Sharing Team"/>
                                    </a>
                                </div>
                                <div className="support-more-col">
                                    <a target="_blank" rel="noopener noreferrer" href="https://www.fmrif.nimh.nih.gov/" title="FMRIF">
                                        <img src="./assets/fmrif.png" alt="Functional Magnetic Resonance Facility"/>
                                    </a>
                                </div>
                                <div className="support-more-col">
                                    <a target="_blank" rel="noopener noreferrer" href="https://www.nimh.nih.gov/labs-at-nimh/index.shtml" title="NIH">
                                        <img src="./assets/nih-nimh.png" alt="National Institute of Mental Health"/>
                                    </a>
                                </div>
                                <div className="support-more-col dhhs-icon">
                                    <a target="_blank" rel="noopener noreferrer" href="https://www.hhs.gov/" title="HHS">
                                        <img src="./assets/dhhs.png" alt="Department of Health and Human Services"/>
                                    </a>
                                </div>
                            </div>
                    </div>
                </div>
            </div>
        );
    }

});

export default FrontPage;
