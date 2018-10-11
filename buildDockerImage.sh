#!/bin/bash
DOCKER_IMAGE=theoapp/theo

DOCKER_TAG=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

rm -rf build node_modules
docker run --rm -v $PWD:/usr/local/src -w /usr/local/src node:8-alpine sh -c 'npm i -g npm && npm i --no-optional && npm run build' 

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .
docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
