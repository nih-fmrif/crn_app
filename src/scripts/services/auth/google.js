/* global gapi */
// TODO: config service
import config from '../../../../config';

/**
 * Google authentication provider implementation
 *
 * @param common - Common helpers
 * @param logger - Logger service
 * @returns {Object}
 */
export default function(common, logger) {

  /**
   * Helpers from the Common library, used by all auth provider implementation
   */
  const {
    accessTokenExpired,
    assertUser,
    getStoredAccessToken,
    hasToken,
    saveOauth,
    saveUser,
    saveCrnProfile
  } = common;

  /**
   * Google auth instance
   */
  let authInstance = null;

  /**
   * Create a getAccessToken function
   */
  const getAccessToken = getAccessTokenQueue();

  /**
   * Exposed methods
   */
  return Object.freeze({
    fetchUser,
    getAccessToken,
    init,
    signIn,
    signOut,
  });

  /**
   * Call global gapi instance to initialize Google session.
   * Saves authInstance for further usage.
   *
   * @returns {Promise}
   */
  async function init() {
    return new Promise((resolve, reject) => {
      try {
        gapi.load('auth2', () => {
          gapi.client.load('plus', 'v1').then(() => {
            gapi.auth2.init({
              client_id: config.auth.google.clientId,
              scopes: config.auth.google.scopes
            }).then((googleAuthInstance) => {
              authInstance = googleAuthInstance;
              resolve();
            });
          });
        });
      } catch(error) {
        reject(error);
      }
    });
  }

  /**
   * A factory that returns a function, that has an inner state,
   * and if there is an ongoing request to refresh access token,
   * return the promise of that request.
   *
   * @returns {function()}
   */
  function getAccessTokenQueue() {
    let refreshRequest = null;
    return async () => {
      if (hasToken()) {
        if (accessTokenExpired()) {
          if (refreshRequest !== null) {
            return refreshRequest;
          }
          refreshRequest = refreshToken();
          await refreshRequest;
          refreshRequest = null;
        }
        return getStoredAccessToken();
      } else {
        return null;
      }
    };
  }

  /**
   * @returns {Promise.<*>}
   */
  async function refreshToken() {
    if (!authInstance) {
      throw new Error('Google seems not to be initialized.');
    }
    const oAuth = await authInstance.currentUser.get().reloadAuthResponse();
    return saveOauth(oAuth);
  }

  /**
   * Initiate Google OAutch signin process
   *
   * @returns {Promise.<void>}
   */
  async function signIn() {
    if (!authInstance) {
      throw new Error('Google seems not to be initialized.');
    }

    await authInstance.signIn({
      prompt: 'select_account'
    });

    // Try out our new refresh token
    await refreshToken();

    try {

      // Fetch and save the user with the access token
      const user = await fetchUser();
      saveUser(user);

      // Be sure that the user exists in CRN database
      await assertUser();

    } catch (err) {
      logger.error('Cannot verify user.', err);
      await signOut();
      throw err;
    }
  }

  /**
   * Fetch authenticated form Google
   *
   * @returns {Promise.{_id: string, firstname: string, lastname: string, email: string}}
   */
  async function fetchUser() {
    const user = await authInstance.currentUser.get();
    const basicProfile = await user.getBasicProfile();

    logger.debug('Google profile fetched: ', basicProfile);

    if (basicProfile) {
      return {
        _id:                basicProfile.getEmail(),
        email:              basicProfile.getEmail(),
        firstname:          basicProfile.getGivenName(),
        lastname:           basicProfile.getFamilyName()
      };
    } else {
      return {};
    }
  }

  /**
   * @returns {Promise.<void>}
   */
  async function signOut() {
    await authInstance.signOut();
    saveOauth({});
    saveUser({});
    saveCrnProfile({});
  }
}