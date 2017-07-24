// dependencies ----------------------------------------------------------------------

import Reflux           from 'reflux';
import actions          from './user.actions.js';
import scitran          from '../utils/scitran';
import router           from '../utils/router-container';
import notifications    from '../notification/notification.actions';
import dashboardActions from '../dashboard/dashboard.datasets.actions';
import datasetActions   from '../dataset/dataset.actions';
import upload           from '../upload/upload.actions';

import di               from '../services/containers';
const auth = di.auth;
const logger = di.logger;

// store setup -----------------------------------------------------------------------

let UserStore = Reflux.createStore({

    listenables: actions,

    async init() {
      logger.debug('Start initialization.');
      this.update(this.getInitialState());

      try {
        await auth.init();
        logger.debug('Auth initialized.');

        if (await auth.isSignedIn()) {
          logger.info('Signed in.');
          const token = await auth.getAccessToken();
          const profile = auth.getCrnProfile();
          logger.debug(token, profile);

          this.update({
            token,
            profile
          });
        } else {
          logger.info('Not signed in.');
        }
      } catch(error) {
        logger.error(error);
      }

    },

// data ------------------------------------------------------------------------------

    data: {},

    /*
    * token, profile
    * */
    update(data) {
        this.data = {
          ...this.data,
          ...data
        };
        this.trigger(this.data);
    },

    getInitialState() {
        return {
            token: null,
            profile: null,
            loading: false,
            signinError: '',
            showUploadModal: false
        };
    },

// Auth Actions ----------------------------------------------------------------------

    /**
     * Signin
     *
     * Initiates the google OAuth2 sign in flow. Creates a new
     * user if the user doesn't already exist.
     */
    async signIn(options = { transition: true }) {
        logger.info('Starting sign in process.');

        const { transition } = options;

        try {
          await auth.signIn(options);

          const token = auth.getStoredAccessToken();
          const profile = auth.getCrnProfile();

          this.update({
            loading: false,
            token,
            profile
          });

          if (transition) {
            router.transitionTo('dashboard');
          } else {
            datasetActions.reloadDataset();
            dashboardActions.getDatasets(true);
          }

          logger.info('Sign in finished.');

        } catch(error) {

          logger.error('Error happened while signing in', error);

          switch (error.type) {
            case auth.errors.SIGNIN_BLOCKED_USER:
              this.handleSigninError(transition, `<span>This user account has been blocked. If you believe this is by mistake please contact the <a href="mailto:nimhdsst@mail.nih.gov?subject=Center%20for%20Reproducible%20Neuroscience%20Blocked%20User" target="_blank">site administrator</a>.</span>`);
              break;
            case auth.errors.SIGNIN_UNKNOWN_ERROR:
              this.handleSigninError(transition, 'We are currently experiencing issues. Please try again later.');
              break;
            default:
              break;
          }

          this.clearAuth();
        }
    },

    handleSigninError(transition, message) {
      if (!transition) {
        notifications.createAlert({type: 'Error', message});
      } else {
        this.update({
          loading: false,
          signinError: message
        });
      }
    },

    /**
     * Sign Out
     *
     * Signs the user out by destroying the current
     * OAuth2 session.
     */
    async signOut(uploadStatus) {
        let signout = true;
        if (uploadStatus === 'uploading') {
            signout = confirm('You are currently uploading files. Signing out of this site will cancel the upload process. Are you sure you want to sign out?');
        }
        if (signout) {
            await auth.signOut();
            this.clearAuth();
            upload.setInitialState();
            router.transitionTo('front-page');
        }
    },

    /**
     * Clear Authentication
     *
     * Clears all user related data from memory and
     * browser storage.
     */
    clearAuth() {
        this.update({
          loading: false,
          token: null,
          profile: null
        });
    },

// Actions ---------------------------------------------------------------------------

    /**
     * Get Preferences
     *
     * Calls back with the current user's preferences.
     */
    getPreferences(callback) {
        callback(this.data.scitran.preferences);
    },

    /**
     * Update Preferences
     */
    updatePreferences(preferences, callback) {
        let scitranUser = this.data.scitran;
        scitranUser.preferences = scitranUser.preferences ? scitranUser.preferences : {};
        for (let key in preferences) {
            scitranUser.preferences[key] = preferences[key];
        }
        scitran.updateUser(this.data.scitran._id, {preferences: preferences}, (err, res) => {
            this.update({scitran: scitranUser});
            if (callback) {callback(err, res);}
        });
    }

});

export default UserStore;
