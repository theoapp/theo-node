#!/bin/bash
set -e
set -x

DOCKER_IMAGE=theoapp/theo

DOCKER_TAG=$(npm -s run ver)

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .

if [ "$1" = "push" ]; then
    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
fi

LATEST_TAG=$(git tag | grep -E '^[0-9]*\.[0-9]*\.[0-9]*$' | sort --version-sort | tail -n 1)

if [ "$LATEST_TAG" = "$DOCKER_TAG" ]; then
  docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
  if [ "$1" = "push" ]; then
    docker push ${DOCKER_IMAGE}:latest
  fi
fi