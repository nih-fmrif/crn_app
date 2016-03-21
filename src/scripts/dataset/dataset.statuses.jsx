// dependencies -------------------------------------------------------

import React   from 'react';
import Reflux  from 'reflux';
import Status  from '../common/partials/status.jsx';
import UploadStore   from '../upload/upload.store.js';

let Statuses = React.createClass({

	mixins: [Reflux.connect(UploadStore)],

// life cycle events --------------------------------------------------

	getDefaultProps() {
	    return {
	        actionable: false
	    };
	},

	render() {
		let dataset = this.props.dataset;
		let uploading = dataset._id === this.state.projectId;

		let publicStatus     = <Status type='public' />;
		let incompleteStatus = <Status type='incomplete' dataset={dataset} actionable={this.props.actionable} />;
		let sharedWithStatus = <Status type='shared' />;
		let inProgress       = <Status type='inProgress' />;
		let invalid          = <Status type='invalid' />;

		return (
			<span className="clearfix status-wrap">
				{dataset && dataset.status && dataset.public ? publicStatus : null}
				{dataset && dataset.status && dataset.status.uploadIncomplete && !uploading ? incompleteStatus : null}
				{dataset && dataset.status && dataset.status.shared ? sharedWithStatus : null}
				{dataset && uploading ? inProgress : null}
				{dataset && dataset.status && dataset.status.invalid ? invalid : null}
			</span>
    	);
	},

// custom methods -----------------------------------------------------

});

export default Statuses;