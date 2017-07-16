import config from '../../../../config';
import queryString from 'query-string';
import axios from 'axios';

export default function (common, logger) {

  const {
    accessTokenExpired,
    assertUser,
    getAuthProp,
    getStoredAccessToken,
    getStoredRefreshToken,
    hasToken,
    saveAuthProp,
    saveOauth,
    signOut,
  } = common;

  const getAccessToken = getAccessTokenQueue();

  return Object.freeze({
    fetchUser,
    getAccessToken,
    handleAuthCallback,
    init,
    signIn
  });

  async function handleAuthCallback() {
    const url = queryString.parse(window.location.search);
    if (url.globusOauth) {
      try {
        const oAuth = JSON.parse(url.globusOauth);
        oAuth.expires = Date.now() + oAuth.expires_in;
        saveOauth(oAuth);
      } catch(err) {
        logger.error('Unknown authentication error.', err);
      }
      saveAuthProp('signin_finished', true);
    }
  }

  async function fetchUser() {
    const authInstance = getAuthInstance();
    const globusUser = await popsicle(authInstance.sign({
      method: 'get',
      url: config.auth.globus.userInfoUri
    })).then(res => JSON.parse(res.body));

    if (globusUser) {
      const {
        preferred_username,
        email,
        name
      } = globusUser;

      return {
        preferred_username,
        email,
        name
      };

    } else {
      return {};
    }
  }

  async function init() {
    return getAccessToken();
  }

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
    } else {
      return false;
    }
  }

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

  async function authInNewWindow() {
    const authWindow = window.open(config.auth.globus.authUri);
    await waitUntilInitialized();
    authWindow.close();
  }

  function waitUntilInitialized() {
    return new Promise(isInitialized);
  }

  function isInitialized(resolve, reject) {
    if (getAuthProp('signin_finished', false) === true) {
      logger.debug('Signin finished.');
      resolve();
    } else {
      logger.debug('Signin not yet finished.');
      setTimeout(() => isInitialized(resolve, reject), 500);
    }
  }
}
