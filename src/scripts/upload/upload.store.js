// dependencies ----------------------------------------------------------------------

import Reflux   from 'reflux';
import Actions  from './upload.actions.js';
import scitran  from '../utils/scitran';
import files    from '../utils/files';
import validate from 'bids-validator';

// store setup -----------------------------------------------------------------------

let UploadStore = Reflux.createStore({

	listenables: Actions,

	init: function () {
		this.setInitialState();
	},

	getInitialState: function () {
		return this.data;
	},

// state data ------------------------------------------------------------------------

	data: {},

	update: function (data) {
		for (let prop in data) {this.data[prop] = data[prop];}
		this.trigger(this.data);
	},

	/**
	 * Set Initial State
	 *
	 * Sets the state to the data object defined
	 * inside the function. Also takes a diffs object
	 * which will set the state to the initial state
	 * with any differences passed.
	 */
	setInitialState: function (diffs) {
		let data = {
			tree: [],
			list: {},
			errors: [],
			warnings: [],
			dirName: '',
			alert: false,
			status: 'not-started', // files-selected || validating || uploading
			progress: {total: 0, completed: 0, currentFiles: []},
		};
		for (let prop in diffs) {data[prop] = diffs[prop];}
		this.update(data);
	},

// actions ---------------------------------------------------------------------------

	/**
	 * On Change
	 *
	 * On file select this adds files to the state
	 * and starts validation.
	 */
	onChange (selectedFiles) {
		this.setInitialState({
			tree: selectedFiles.tree,
			list: selectedFiles.list,
			dirName: selectedFiles.tree[0].name,
			status: 'validating'
		});
		this.validate(selectedFiles);
	},

	/**
	 * Validate
	 *
	 * Takes a filelist, runs BIDS validation checks
	 * against it, and sets any errors to the state.
	 */
	validate (selectedFiles) {
		let self = this;

        validate.BIDS(selectedFiles.list, function (errors, warnings) {
        	
        	if (errors === 'Invalid') {
        		self.update({errors: 'Invalid'});
        	}

        	errors   = errors   ? errors   : [];
        	warnings = warnings ? warnings : [];

			self.update({
				errors: errors,
				warnings: warnings,
				status: 'files-selected'
			});



			// if (errors.length === 0 && warnings.length === 0) {
			// 	self.upload(selectedFiles.tree);
			// 	self.update({uploading: true});
			// }
        });
	},

	/**
	 * Upload
	 *
	 * Uploads currently selected and triggers
	 * a progress event every time a file or folder
	 * finishes.
	 */
	upload (fileTree) {
		// rename dirName before upload
		fileTree[0].name = this.data.dirName;
		
		let self = this;
		let count = files.countTree(fileTree);

		this.update({status: 'uploading'});

		scitran.upload(fileTree, count, function (progress) {
			self.update({progress: progress, uploading: true});
			window.onbeforeunload = function() {return "You are currently uploading files. Leaving this site will cancel the upload process.";};
			if (progress.total === progress.completed) {
				self.uploadComplete();
			}
		});
	},

	/**
	 * Upload Complete
	 *
	 * Resets the componenent state to its
	 * initial state. And creates an upload
	 * complete alert.
	 */
	uploadComplete () {
		this.setInitialState({alert: true});
		window.onbeforeunload = function() {};
	},


	/**
	 * Close Alert
	 *
	 */
	closeAlert () {
		this.update({alert: false});
	},

	/**
	 * Update Directory Name
	 *
	 * Sets the directory name to the passed value.
	 */
	updateDirName(value) {
		this.update({dirName: value});
	},

});

export default UploadStore;