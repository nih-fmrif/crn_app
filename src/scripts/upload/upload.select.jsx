// dependencies -------------------------------------------------------

import React       from 'react';
import FileSelect  from '../common/forms/file-select.jsx';
import Actions     from './upload.actions.js';

let Select = React.createClass({

// life cycle events --------------------------------------------------

    render () {

        return (
            <div>
                <span className="message fade-in">Select a  <a href="http://bids.neuroimaging.io" target="_blank" rel="noopener noreferrer">BIDS dataset</a> to upload</span>
                <FileSelect onClick={this._clearInput} onChange={this._onChange} setRefs={this._setRefs}/>
            </div>
        );
    },

// custom methods -----------------------------------------------------

    _clearInput: () => {Actions.setInitialState({showModal: true});},

    _onChange: Actions.onChange,

    _setRefs: Actions.setRefs

});


export default Select;