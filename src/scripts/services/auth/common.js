import crn from '../../utils/crn';
import errors from './errors';

/**
 * Auth service, common methods
 * Each authentication provider implementation can override these methods (like inheritance)
 * For details, see index.js
 *
 * @param logger - Logger service
 * @returns {Object} exposed methods
 */
export default function(logger) {

  return Object.freeze({
    accessTokenExpired,
    assertUser,
    getAuthProp,
    getStoredAccessToken,
    getStoredRefreshToken,
    getCrnProfile,
    handleAuthCallback,
    hasToken,
    isRoot,
    isSignedIn,
    saveAuthProp,
    saveOauth,
    saveUser,
    signOut,
    verifyUser
  });

  /**
   * The default implementation of handling a auth callback
   * is to do nothing with it. Each authentication provider should
   * have it's own implementation that relies on this functionality.
   *
   * @returns {null}
   */
  function handleAuthCallback() {
    return null;
  }

  /**
   * Verify user against CRN server
   *
   * Doesn't have parameters, because crn.verifyUser calls utils/request.js to use
   * the actual credentials for the request.
   *
   * TODO: create CRN service that has a dependency of request service that depends on auth service
   *
   * @returns {Promise}
   */
  function verifyUser() {
    return new Promise((resolve, reject) => {
      crn.verifyUser((err, res) => {
        if (res.body.code === 403) {
          reject({ type: errors.SIGNIN_UNKNOWN_USER});
        } else if (!res.body._id) {
          reject({ type: errors.SIGNIN_UNKNOWN_ERROR});
        } else {
          saveCrnProfile(res.body);
          resolve(res.body);
        }
      });
    });
  }

  /**
   * Create user at CRN server
   *
   * Will use stored access_toke to try fetching user on server side. Fails if the access token is invalid.
   *
   * @returns {Promise}
   */
  function createUser() {
    return new Promise((resolve, reject) => {
      crn.createUser(getUser(), (err, res) => {
        if (res.body.code === 403) {
          reject({ type: errors.SIGNIN_BLOCKED_USER });
        } else {
          saveCrnProfile(res.body);
          resolve(res.body);
        }
      });
    });
  }

  /**
   * If the user doesn't exist, create it in CRN db.
   *
   * @returns {Promise.<void>}
   */
  async function assertUser() {
    try {
      await verifyUser();
    } catch(error) {
      switch (error.type) {
        case errors.SIGNIN_UNKNOWN_USER:
          await createUser();
          await verifyUser();
          break;
        default:
          throw error;
      }
    }
  }

  /**
   * Check if the user is signed in and be sure that has valid tokens.
   *
   * @returns {Promise.<boolean>}
   */
  async function isSignedIn() {
    if (hasToken()) {
      try {
        await assertUser();
        logger.info('User verified.');
        return true;
      } catch(err) {
        logger.error('Cannot verify user.', err);
        await signOut();
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * A common method to simply delete client side stored tokens.
   * Each auth provider implementation (globus, google) should have it's own implementation
   **/
  function signOut() {
    saveOauth({});
    saveUser({});
    saveCrnProfile({});
  }

  /**
   * @returns {boolean}
   */
  function hasToken() {
    return !!(getStoredAccessToken());
  }

  /**
   * @returns {boolean}
   */
  function isRoot() {
    const user = getUser();
    return !!(user.root);
  }

  /**
   * @returns {boolean}
   */
  function accessTokenExpired() {
    return getAccessTokenExpires() < Date.now();
  }

  /**
   * @returns {Number}
   */
  function getAccessTokenExpires() {
    return parseInt(getOauth().expires);
  }

  /**
   * @returns {string}
   */
  function getStoredAccessToken() {
    return String(getOauth().access_token);
  }

  /**
   * @returns {string}
   */
  function getStoredRefreshToken() {
    return String(getOauth().refresh_token);
  }

  /**
   * Get oauth related storage object from localStorage
   * @returns {*}
   */
  function getOauth() {
    return getAuthProp('oauth');
  }

  /**
   * @param data
   * @returns {*}
   */
  function saveOauth(data) {
    logger.debug('saveOauth', data);
    return saveAuthProp('oauth', data);
  }

  /**
   * The User object is the unmodified object that the auth provider gives back.
   * It differs from the crnProfile which is the user object that CRN server stores.
   * @returns {*}
   */
  function getUser() {
    return getAuthProp('user');
  }

  /**
   * @param user
   * @returns {*}
   */
  function saveUser(user) {
    logger.debug('saveUser', user);
    return saveAuthProp('user', user);
  }

  /**
   * The user object that CRN server stores for the user.
   * @returns {*}
   */
  function getCrnProfile() {
    return getAuthProp('crn');
  }

  /**
   * @param profile
   * @returns {*}
   */
  function saveCrnProfile(profile) {
    logger.debug('saveCrnProfile', profile);
    return saveAuthProp('crn', profile);
  }

  /**
   * @param key
   * @param _default
   * @returns {*|{}}
   */
  function getAuthProp(key, _default = {}) {
    return getAuthObject()[key] || _default;
  }

  /**
   * @param key
   * @param data
   * @returns {*}
   */
  function saveAuthProp(key, data) {
    return saveAuthObject({
      ...getAuthObject(),
      [key]: data
    });
  }

  /**
   * @returns {*|{}}
   */
  function getAuthObject() {
    try {
      return JSON.parse(window.localStorage.auth);
    } catch (err) {
      return {};
    }
  }

  /**
   * @param auth
   */
  function saveAuthObject(auth) {
    window.localStorage.auth = JSON.stringify(auth);
  }
}

