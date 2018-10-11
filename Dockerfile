FROM node:8-alpine

EXPOSE 9100


RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV
ENV NODE_ENV $NODE_ENV

COPY . /usr/src/app

CMD [ "npm", "start" ]
