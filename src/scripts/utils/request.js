import request     from 'superagent';
import config      from '../../../config';

/**
 * Request
 *
 * A wrapper for the superagent request library.
 * Provides a place for global request settings
 * and response handling.
 */
const Request = {

    get (url, options, callback) {
        handleRequest(url, options, function (url, options) {
            request.get(url)
                .set(options.headers)
                .query(options.query)
                .end(function (err, res) {
                    handleResponse(err, res, callback);
                });
        });
    },

    post (url, options, callback) {
        handleRequest(url, options, function (url, options) {
            request.post(url)
                .set(options.headers)
                .query(options.query)
                .send(options.body)
                .end(function (err, res) {
                    handleResponse(err, res, callback);
                });
        });
    },

    put (url, options, callback) {
        handleRequest(url, options, function (url, options) {
            request.put(url)
                .set(options.headers)
                .query(options.query)
                .send(options.body)
                .end(function (err, res) {
                    handleResponse(err, res, callback);
                });
        });
    },

    del (url, options, callback) {
        handleRequest(url, options, function (url, options) {
            request.del(url)
                .set(options.headers)
                .query(options.query)
                .end(function (err, res) {
                    handleResponse(err, res, callback);
                });
        });
    },

    upload (url, options, callback) {
        handleRequest(url, options, function (url, options) {
            request.post(url)
                .query(options.query)
                .set(options.headers)
                .field('tags', options.fields.tags)
                .attach('file', options.fields.file, options.fields.name)
                .end((err, res) => {
                    handleResponse(err, res, callback);
                });
        });
    }

};

/**
 * Handle Request
 *
 * A generic request handler used to intercept
 * requests before they request out. Ensures
 * access_token isn't expired sets it as the
 * Authorization header.
 *
 * Available options
 *   - headers: An object with keys set to the header name
 *   and values set to the corresponding header value.
 *   - query: An object with keys set to url query parameters
 *   and values set to the corresponding query values.
 *   - body: A http request body.
 *   - auth: A boolean determining whether the access token
 *   should be supplied with the request.
 *   - snapshot: A boolean that will add a 'snapshots' url
 *   param to scitran requests.
 */
async function handleRequest (url, options, callback) {

    // Circular dependency, so load di running time
    // A more permanent solution will be when this request lib would be integrated into auth service
    const di = require('../services/containers').default;
    const auth = di.auth;

    // normalize options to play nice with superagent requests
    options = normalizeOptions(options);

    // add snapshot url param to scitran requests
    if (options.snapshot && url.indexOf(config.scitran.url) > -1) {
        url = config.scitran.url + 'snapshots/' + url.slice(config.scitran.url.length);
    }

    if (options.auth && auth.hasToken() && (url.indexOf(config.scitran.url) > -1 || url.indexOf(config.crn.url) > -1)) {
        const token = await auth.getAccessToken();
        if (await auth.isRoot()) {
            options.query.root = true;
        }
        options.headers.Authorization = token;
        callback(url, options);
    } else {
        callback(url, options);
    }
}

/**
 * Handle Response
 *
 * A generic response handler used to intercept
 * responses before returning them to the main
 * callback.
 */
function handleResponse (err, res, callback) {
    callback(err, res);
}

/**
 * Normalize Options
 *
 * Takes a request options object and
 * normalizes it so requests won't fail.
 */
function normalizeOptions (options) {
    options = options ? options : {};
    if (!options.headers) {options.headers = {};}
    if (!options.query)   {options.query   = {};}
    if (!options.hasOwnProperty('auth')) {options.auth = true;}
    return options;
}

export default Request;