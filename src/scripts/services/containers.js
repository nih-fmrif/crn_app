import auth from './auth/index';

import Bottle from 'bottlejs';
const di = Bottle();

di.service('auth', auth);

export default di.container;