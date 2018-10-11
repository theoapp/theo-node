FROM node:8-alpine

EXPOSE 9100


RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV
COPY package.json /usr/src/app/
COPY package-lock.json /usr/src/app/
RUN npm install --no-optional
COPY . /usr/src/app
RUN npm run build

CMD [ "npm", "start" ]
