// TODO: config service
import config from '../../../../config';
import queryString from 'query-string';
import axios from 'axios';
import humanparser from 'humanparser';

/**
 * Globus (globus.org) authentication provider implementation
 *
 * @param common - Common helpers
 * @param logger - Logger service
 * @returns {Object}
 */
export default function (common, logger) {

  /**
   * Helpers from the Common library, used by all auth provider implementation
   */
  const {
    accessTokenExpired,
    assertUser,
    getAuthProp,
    getStoredAccessToken,
    getStoredRefreshToken,
    hasToken,
    saveAuthProp,
    saveOauth,
    saveUser,
    signOut,
  } = common;

  /**
   * Create a getAccessToken function
   */
  const getAccessToken = getAccessTokenQueue();

  /**
   * Exposed methods
   */
  return Object.freeze({
    getAccessToken,
    handleAuthCallback,
    init,
    signIn
  });

  /**
   * After getting access token, server fetches the user and sends back to client
   * along with the tokens. Client the stores it in localStorage.
   *
   * TODO: call auth callback before any rendering, so none of the user space scripts can access access token
   * @returns {Promise.<void>}
   */
  async function handleAuthCallback() {
    const url = queryString.parse(window.location.search);
    if (url && url.globusOauth && url.globusUser) {
      try {
        const oAuth = JSON.parse(url.globusOauth);
        oAuth.expires = Date.now() + oAuth.expires_in;
        saveOauth(oAuth);

        const user = getUserFromGlobusUser(JSON.parse(url.globusUser));
        saveUser(user);

      } catch(err) {
        logger.error('Unknown authentication error.', err);
      }
      saveAuthProp('signin_finished', true);
    }
  }

  /**
   * Try to get a valid access token
   *
   * @returns {Promise.<*>}
   */
  async function init() {
    return getAccessToken();
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
   * Calls CRN api with refresh_token and the current access_token to get a new access token
   *
   * @returns {Promise.<void>}
   */
  async function refreshToken() {
    if (hasToken()) {
      try {
        const accessToken = getStoredAccessToken();
        const refreshToken = getStoredRefreshToken();
        const oAuth = await axios.post(config.auth.globus.refreshTokenUri, {
          accessToken,
          refreshToken
        }).then(res => res.data);
        oAuth.expires = Date.now() + oAuth.expires_in;
        saveOauth(oAuth);
      } catch (err) {
        logger.error('Refreshing token failed.', err);
      }
    }
  }

  /**
   * Opens a new window, and starts Code Access Grant type
   * OAuth authentication flow.
   *
   * @returns {Promise.<void>}
   */
  async function signIn() {
    logger.info('Signin start.');
    saveAuthProp('signin_finished', false);
    await authInNewWindow();
    await refreshToken();
    try {
      await assertUser();
    } catch (err) {
      logger.error('Cannot verify user.', err);
      await signOut();
      throw err;
    }
  }

  /**
   * Calls CRN server to redirect to OAuth provider with the right parameters
   *
   * @returns {Promise.<void>}
   */
  async function authInNewWindow() {
    const authWindow = window.open(config.auth.globus.authUri);
    await waitUntilInitialized();
    authWindow.close();
  }

  /**
   * @returns {Promise}
   */
  function waitUntilInitialized() {
    return new Promise(isInitialized);
  }

  /**
   * Will call resolve parameter once a localStorage variable appears
   *
   * TODO: Limit for checkin?
   * @param resolve
   * @param reject
   */
  function isInitialized(resolve, reject) {
    if (getAuthProp('signin_finished', false) === true) {
      logger.debug('Signin finished.');
      resolve();
    } else {
      logger.debug('Signin not yet finished.');
      setTimeout(() => isInitialized(resolve, reject), 500);
    }
  }

  /**
   * Translates the user information from Globus OAuth to a
   *
   * @param globusUser
   * @returns {{_id: string, firstname: string, lastname: string, email: string}}
   */
  function getUserFromGlobusUser(globusUser) {
    const name = humanparser.parseName(globusUser.name);
    return {
      _id:        String(globusUser.email),
      firstname:  String(name.firstName),
      lastname:   name.middleName ? name.middleName + ' ' + name.lastName : String(name.lastName),
      email:      String(globusUser.email)
    };
  }
}