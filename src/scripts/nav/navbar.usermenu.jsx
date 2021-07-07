// dependencies ------------------------------------------------------------------

import React            from 'react';
import Actions          from '../user/user.actions.js';
import uploadStore      from '../upload/upload.store.js';
import {DropdownButton} from 'react-bootstrap';

// component setup ---------------------------------------------------------------

let Usermenu = React.createClass({

    propTypes: {
        profile: React.PropTypes.object
    },

// life cycle methods ------------------------------------------------------------

    render() {

        let profile = this.props.profile;
        if (!profile) {return false;}

        const username = profile.firstname + ' ' + profile.lastname;
        const thumbnail = profile.avatar || null;

        let gear = (<i className="fa fa-gear" />);

        return (
            <ul className="clearfix user-wrap">
                <img src={thumbnail} alt={username} className="user-img-thumb" />
                <DropdownButton id="user-menu" title={gear}>
                    <li role="presentation" className="dropdown-header">Hello <br/>{username}</li>
                    <li role="separator" className="divider"></li>
                    <li><a onClick={this._signOut} className="btn-submit-other">Sign Out</a></li>
                </DropdownButton>
            </ul>
        );
    },

// custom methods ----------------------------------------------------------------

    _signOut: function () {
        Actions.signOut(uploadStore.data.uploadStatus);
    }

});

export default Usermenu;