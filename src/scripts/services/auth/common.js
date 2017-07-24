import crn from '../../utils/crn';
import errors from './errors';

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

  function handleAuthCallback() {
    return null;
  }
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
          break;
      }
    }
  }

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

  function signOut() {
    saveOauth({});
    saveUser({});
    saveCrnProfile({});
  }

  function hasToken() {
    return !!(getStoredAccessToken());
  }

  function isRoot() {
    const user = getUser();
    return !!(user.root);
  }

  function accessTokenExpired() {
    return getAccessTokenExpires() < Date.now();
  }

  function getAccessTokenExpires() {
    return getOauth().expires;
  }

  function getStoredAccessToken() {
    return getOauth().access_token;
  }

  function getStoredRefreshToken() {
    return getOauth().refresh_token;
  }

  function getOauth() {
    return getAuthProp('oauth')
  }

  function saveOauth(data) {
    logger.debug('saveOauth', data);
    return saveAuthProp('oauth', data);
  }

  function getUser() {
    return getAuthProp('user')
  }

  function saveUser(user) {
    logger.debug('saveUser', user);
    return saveAuthProp('user', user);
  }

  function getCrnProfile() {
    return getAuthProp('crn');
  }

  function saveCrnProfile(profile) {
    logger.debug('saveCrnProfile', profile);
    return saveAuthProp('crn', profile);
  }

  function getAuthProp(key, def = {}) {
    return getAuthObject()[key] || def;
  }

  function saveAuthProp(key, data) {
    return saveAuthObject({
      ...getAuthObject(),
      [key]: data
    });
  }

  function getAuthObject() {
    try {
      return JSON.parse(window.localStorage.auth);
    } catch (err) {
      return {};
    }
  }

  function saveAuthObject(auth) {
    window.localStorage.auth = JSON.stringify(auth);
  }
}

