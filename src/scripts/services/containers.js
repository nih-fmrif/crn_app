import auth from './auth';
import logger from './logger';
import Bottle from 'bottlejs';
const di = Bottle();

/*
* Services with dependency injection
* */

di.service('logger', logger);
di.service('auth', auth, 'logger');

export default di.container;