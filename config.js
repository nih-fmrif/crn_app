/**
 * Configuration
 */
export default {

		/**
		 * Scitran
		 */
		scitran: {
			url: process.env.CRN_SERVER_URL + '/api/'
		},

		/**
		 * CRN
		 */
		crn: {
			url: process.env.CRN_SERVER_URL + '/crn/'
		},

		/**
		 * Authentication
		 */
		auth: {
			type: 'globus',
			globus: {
        authUri: process.env.CRN_SERVER_URL + '/crn/auth/globus',
        refreshTokenUri: process.env.CRN_SERVER_URL + '/crn/auth/globus/refresh',
        scopes: ['urn:globus:auth:scope:transfer.api.globus.org:all', 'openid', 'profile', 'email', 'offline_access']
			},
			google: {
				clientId: process.env.SCITRAN_AUTH_CLIENT_ID,
				scopes: 'email,openid'
			}
		},

		/**
		 * Upload
		 */
		upload: {

			/**
			 * Filenames ignored during upload.
			 */
			blacklist: [
			    '.DS_Store',
			    'Icon\r'
			]
		}
};
