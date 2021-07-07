// dependencies ----------------------------------------------------------------------

import React           from 'react';
import Reflux          from 'reflux';
import actions         from './upload.actions';
import './upload.file.store';
import fileStore       from './upload.file.actions';
import notifications   from '../notification/notification.actions';
import scitran         from '../utils/scitran';
import upload          from './upload';
import validate        from 'bids-validator';
import datasetsActions from '../dashboard/dashboard.datasets.actions';
import datasetActions  from '../dataset/dataset.actions';
import favico          from 'favico.js';
import bowser          from 'bowser';
import di              from '../services/containers';
const authService = di.auth;

let favicon = new favico();

// store setup -----------------------------------------------------------------------

let UploadStore = Reflux.createStore({

    listenables: actions,

    init: function () {
        // Reset Favico incase timeout or issues
        favicon.reset();
        this.setInitialState();
    },

    getInitialState: function () {
        return this.data;
    },

// state data ------------------------------------------------------------------------

    data: {},

    update: function (data, callback) {
        for (let prop in data) {this.data[prop] = data[prop];}
        this.trigger(this.data, callback);
    },

    /**
     * Set Initial State
     *
     * Sets the state to the data object defined
     * inside the function. Also takes a diffs object
     * which will set the state to the initial state
     * with any differences passed.
     */
    setInitialState: function (diffs, callback) {
        let data = {
            activeKey: 1,
            changeName: false,
            dirName: '',
            disabledTab: false,
            errors: [],
            nameError: null,
            progress: {total: 0, completed: 0, currentFiles: [], status: ''},
            projectId: '',
            refs: {},
            resuming: false,
            selectedName: '',
            showModal: false,
            showSelect: true,
            showRename: false,
            renameEnabled: true,
            showRenameInput: true,
            showIssues: false,
            showResume: false,
            showProgress: false,
            showSuccess: false,
            uploadStatus: 'not-started',
            warnings: []
        };
        for (let prop in diffs) {data[prop] = diffs[prop];}
        this.update(data, callback);
    },

// actions ---------------------------------------------------------------------------

    /**
     * Toggle Modal
     */
    toggleModal () {
        if (!bowser.chrome && !bowser.chromium) {
            let chromeMessage = (
                <span>This is a Google Chrome only feature. <a href="http://www.google.com/chrome/">Please consider using Chrome as your browser</a>.</span>
            );
            notifications.createAlert({
                type: 'Error',
                message: chromeMessage
            });
        }else{
            if (this.data.uploadStatus === 'uploading') {
                this.update({showModal: !this.data.showModal});
            } else {
                this.setInitialState({showModal: !this.data.showModal});
            }
        }
    },

    /**
     * On Change
     *
     * On file select this adds files to the state
     * and starts validation.
     */
    onChange (selectedFiles) {
        let dirName = selectedFiles.tree[0].name,
            nameError = null;
        if (dirName.length > 32) {
            nameError = 'Names must be 32 characters or less';
        }
        fileStore.setFiles(selectedFiles);
        this.setInitialState({
            refs: this.data.refs,
            dirName: dirName,
            nameError: nameError,
            uploadStatus: 'files-selected',
            showModal: true,
            showRename: true,
            activeKey: 2
        });
    },

    /**
     * On Resume
     *
     * A file select on change handler for resuming
     * incomplete uploads.
     */
    onResume (selectedFiles, originalName) {
        let dirName = selectedFiles.tree[0].name,
            renameEnabled = true,
            activeKey, callback;
        if (dirName !== originalName) {
            activeKey = 2;
        } else {
            activeKey = 3;
            renameEnabled = false;
            callback = () => {
                if (this.data.uploadStatus == 'files-selected') {
                    this.validate(selectedFiles.list);
                }
            };
        }
        fileStore.setFiles(selectedFiles);
        this.setInitialState({
            refs: this.data.refs,
            dirName: originalName,
            uploadStatus: 'files-selected',
            showRename: true,
            showModal: true,
            selectedName: dirName,
            renameEnabled: renameEnabled,
            showRenameInput: false,
            activeKey: activeKey,
            resuming: true
        }, callback);
    },

    /**
     * Validate
     *
     * Takes a filelist, runs BIDS validation checks
     * against it, and sets any errors to the state.
     * Takes an optional boolean parameter representing
     * whether this is already known as a resume.
     */
    validate () {
        this.update({uploadStatus: 'validating', showIssues: true, activeKey: 3});
        fileStore.getFiles('list', (list) => {
            validate.BIDS(list, {}, (issues, summary) => {

                if (issues === 'Invalid') {
                    this.update({errors: 'Invalid'});
                }

                let errors   = issues.errors   ? issues.errors   : [];
                let warnings = issues.warnings ? issues.warnings : [];

                this.update({
                    errors: errors,
                    warnings: warnings,
                    summary: summary,
                    uploadStatus: 'validated'
                });

                if (errors.length === 0 && warnings.length === 0) {
                    this.checkExists();
                }
            });
        });
    },

    /**
     * Check Exists
     *
     * Takes a filelist and a boolean representing
     * whether this is a resumed upload. If it isn't
     * it check for existing dataset with the same name
     * and group.
     */
    checkExists () {
        fileStore.getFiles('list', (fileList) => {

            if (this.data.uploadStatus === 'dataset-exists') {
                this.upload(fileList);
                return;
            }

            let self = this;
            let userId = authService.getSignedInUserId();
            if (!this.data.resuming) {
                scitran.getProjects({}, function (projects) {
                    let existingProjectId;
                    for (let project of projects) {
                        if (project.label === self.data.dirName && project.group === userId) {
                            existingProjectId = project._id;
                            break;
                        }
                    }

                    if (existingProjectId) {
                        self.update({uploadStatus: 'dataset-exists', showResume: true, activeKey: 4});
                    } else {
                        self.upload(fileList);
                    }
                });
            } else {
                self.upload(fileList);
            }
        });
    },

    /**
     * Resume
     *
     * Loads the current filetree and calls upload. Allows
     * for calling upload when dataset tree data is not ready
     * at hand such as the resume question in the upload modal.
     */
    resumeUpload () {
        fileStore.getFiles('list', (fileList) => {this.upload(fileList);});
    },

    /**
     * Upload
     *
     * Uploads currently selected and triggers
     * a progress event every time a file or folder
     * finishes.
     */
    upload (fileList) {

        this.update({
            uploadStatus: 'uploading',
            showModal: false,
            showProgress: true,
            disabledTab: true,
            activeKey: 5
        });

        let datasetsUpdated = false;
        let validation = {
            errors: this.data.errors,
            warnings: this.data.warnings
        };

        window.onbeforeunload = () => {
            return 'You are currently uploading files. Leaving this site will cancel the upload process.';
        };
        let uploadingFavicon = document.getElementById('favicon_upload');
        favicon.image(uploadingFavicon); // set new favicon image

        upload.upload(authService.getSignedInUserId(), this.data.dirName, fileList, {validation, summary: this.data.summary}, (progress, projectId) => {
            projectId = projectId ? projectId : this.data.projectId;
            this.update({progress, uploading: true, projectId});
            if (!datasetsUpdated && progress.completed > 0) {datasetsActions.getDatasets(); datasetsUpdated = true;}
            if (progress.total === progress.completed) {
                scitran.removeTag('projects', projectId, 'incomplete', () => {
                    datasetActions.updateStatus(projectId, {incomplete: false});
                    this.uploadComplete(projectId);
                });
            }
        }, () => {
            this.uploadError();
        });
    },

    /**
     * Upload Complete
     *
     * Resets the componenent state to its
     * initial state. And creates an upload
     * complete alert.
     */
    uploadComplete (projectId) {
        let message = <span><a href={'/datasets/' + projectId}>{this.data.dirName}</a> has been added and saved to your dashboard.</span>;
        let fileSelect = this.data.refs.fileSelect;
        if (fileSelect) {fileSelect.value = null;} // clear file input

        // reset favicon
        favicon.reset();
        // refresh my datasets
        datasetsActions.getDatasets();
        // refresh current datset
        datasetActions.reloadDataset(projectId);

        notifications.createAlert({
            type: 'Success',
            message: message
        });
        this.setInitialState();
        window.onbeforeunload = function() {};
    },

    /**
     * Upload Error
     *
     */
    uploadError () {
        let fileSelect = this.data.refs.fileSelect;
        if (fileSelect) {fileSelect.value = null;} // clear file input

        // reset favicon
        favicon.reset();
        // refresh my datasets
        datasetsActions.getDatasets();
        // refresh current datset
        datasetActions.reloadDataset(this.data.projectId);

        notifications.createAlert({
            type: 'Error',
            message: <span>There was an error uploading your dataset. Please refresh the page and try again. If the issue persists, contact the site <a  href="mailto:nimhdsst@mail.nih.gov?subject=Upload%20Error" target="_blank" rel="noopener noreferrer">administrator</a>.</span>
        });
        this.setInitialState();
        window.onbeforeunload = function() {};
    },

    /**
     * Update Directory Name
     *
     * Sets the directory name to the passed value.
     */
    updateDirName(value) {
        let error = this.data.nameError;
        if (value.length > 32) {
            error = 'Names must be 32 characters or less.';
        } else if (value.length === 0 || /^\s+$/.test(value)) {
            error = 'Dataset must have a name.';
        } else {
            error = null;
        }

        this.update({
            dirName: value,
            showResume: false,
            nameError: error
        });
    },

    /**
     * Select Tab
     *
     * Sets the state to open the selected tab
     * in the upload menu.
     */
    selectTab(activeKey) {
        if (activeKey) {
            this.update({activeKey});
        }
    },

    /**
     * Set Refs
     *
     * Takes a react refs and store them.
     */
    setRefs(refs) {
        this.update({refs});
    }

});

export default UploadStore;