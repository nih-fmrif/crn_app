[![CircleCI](https://circleci.com/gh/nih-fmrif/crn_app/tree/dsst.svg?style=shield&circle-token=a40c36f841be97a9545e0b7e50cb6e9a9187e173)](https://circleci.com/gh/nih-fmrif/crn_app/tree/dsst)

[![CircleCI](https://circleci.com/gh/nih-fmrif/crn_app/tree/dev_frontend.svg?style=shield&circle-token=a40c36f841be97a9545e0b7e50cb6e9a9187e173)](https://circleci.com/gh/nih-fmrif/crn_app/tree/dev_frontend)


## Usage

__Requirements:__

Node `v4.4.1 (LTS)`
gulp-cli (`npm install -g gulp-cli`)

__Configure:__

Copy or move `config.example` to `config.js` and replace the values with your own. If you prefer to use environment variables in production you can set the values in config.js equal to process.env.YOUR_VARIABLE_NAME and running gulp build will attempt to replace those based on your current environment.

__Install the dependencies:__

run `npm install`

__Development mode with livereload:__

run `gulp`

__When you are done, create a production ready version of the JS bundle:__

run `gulp build`


__To run the linting command:__

run `npm run lint path/to/file`

__To run the scss linting command:__

install `gem install scss_lint`

run `scss-lint path/to/file`
