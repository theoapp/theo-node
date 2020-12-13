#!/bin/bash
set -e
set -x

DOCKER_IMAGE=theoapp/theo

dir_path=$(dirname $0)
DOCKER_TAG=$(${dir_path}/getVersion.sh)

docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .

if [ "$1" = "push" ]; then
    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
fi

LATEST_TAG=$(git tag | sort --version-sort | tail -n 1)

if [ "$LATEST_TAG" = "$DOCKER_TAG" ]; then
  docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest
  if [ "$1" = "push" ]; then
    docker push ${DOCKER_IMAGE}:latest
  fi
fi