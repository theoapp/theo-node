#!/bin/bash
DOCKER_IMAGE=theoapp/theo

DOCKER_TAG=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .

if [ "$1" = "push" ]; then
    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
fi
