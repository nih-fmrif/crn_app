FROM node:6.11

# accept 'branch' build argument
ARG branch

# setup app directory
WORKDIR /srv/crn-app

# install web app
ADD . /srv/crn-app
RUN npm install

# It's required to rebuild before running, because evironment variables can modify compiled code
CMD npm run start-prod