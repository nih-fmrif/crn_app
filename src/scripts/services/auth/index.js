import config from '../../../../config';
import google from './google';
import globus from './globus';
import Common from './common';
import errors from './errors';

export default function(logger) {
  const common = Common(logger);

  const authProvider = {
    google,
    globus
  }[config.auth.type](common, logger);

  return Object.freeze({
    errors,
    ...common,
    ...authProvider
  });
}