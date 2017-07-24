/* global gapi */
import config from '../../../../config';

export default function(common, logger) {

  const {
    accessTokenExpired,
    assertUser,
    getStoredAccessToken,
    hasToken,
    saveOauth,
    saveUser,
  } = common;

  let authInstance = null;
  const getAccessToken = getAccessTokenQueue();

  return Object.freeze({
    fetchUser,
    getAccessToken,
    init,
    signIn,
    signOut,
  });

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
    if (!authInstance) {
      throw new Error('Google seems not to be initialized.');
    }
    const oAuth = await authInstance.currentUser.get().reloadAuthResponse();
    return saveOauth(oAuth);
  }

  async function signIn() {
    if (!authInstance) {
      throw new Error('Google seems not to be initialized.');
    }

    await authInstance.signIn({
      prompt: 'select_account'
    });

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

  async function signOut() {
    await authInstance.signOut();
    saveOauth({});
    saveUser({});
  }
}