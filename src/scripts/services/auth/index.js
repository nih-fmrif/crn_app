import config from '../../../../config';
import google from './google';
import globus from './globus';

export default function() {
  return Object.freeze({
    google,
    globus
  }[config.auth.type]);
}