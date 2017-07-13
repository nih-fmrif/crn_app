import queryString  from 'query-string';

export default function () {
  return Object.freeze({
    handleAuthCallback
  });
}

function handleAuthCallback() {
  const url = queryString.parse(window.location.search);
  if (url.globusOauth) {
    window.localStorage.auth.oauth = url.globusOauth;
  }
}
