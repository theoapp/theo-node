#!/bin/bash
set -e
set -x

# Multi-arch build with docker buildx.
#
# - DOCKER_PLATFORMS: comma separated list of platforms (default linux/amd64,linux/arm64).
# - BUILDX_BUILDER: buildx builder to use (default: the current one, see `docker buildx ls`).
#   Building for several platforms needs either a docker-container builder or the docker driver with the
#   containerd image store (Docker Desktop default). Platforms other than the native one need QEMU/binfmt.
#
# With "push" the multi-arch image is pushed straight to the registry. Without it the image is loaded into the local
# docker: if the local image store can't hold multi-arch images, only the native platform is built.

if [ -z "$DOCKER_IMAGE" ]; then
  DOCKER_IMAGE=theoapp/theo
fi

if [ -z "$DOCKER_TAG" ]; then
  DOCKER_TAG=$(npm run -s ver)
fi

if [ -z "$DOCKER_PLATFORMS" ]; then
  DOCKER_PLATFORMS=linux/amd64,linux/arm64
fi

# Variants drop dependencies from package*.json (the local node_modules is left alone) and `git restore` them after the
# build: refuse to run on uncommitted changes, that would be lost, and restore them even when a build fails.
if ! git diff --quiet HEAD -- package.json package-lock.json; then
  echo "package.json / package-lock.json have uncommitted changes: commit or stash them first"
  exit 1
fi
trap 'git restore package.json package-lock.json' EXIT

is_valid_tag () {
  if [[ "$DOCKER_TAG" =~ ^[0-9]*\.[0-9]*\.[0-9]* ]]; then
    return 0
  else
    return 1
  fi
}

is_latest_tag () {
  LATEST_GIT_TAG=$(git tag | grep -E '^[0-9]*\.[0-9]*\.[0-9]*$' | sort --version-sort | tail -n 1)
  if [ "$LATEST_GIT_TAG" = "$DOCKER_TAG" ]; then
    return 0
  else
    return 1
  fi
}

can_load_multi_platform () {
  docker info --format '{{.DriverStatus}}' | grep -q 'io.containerd.snapshotter'
}

# $1: tag, $2: "push" to push, $3...: extra tags (e.g. latest)
docker_build () {
  local TAGS=()
  local TAG
  for TAG in "$1" "${@:3}"; do
    TAGS+=(-t "${DOCKER_IMAGE}:${TAG}")
  done

  local PLATFORMS=${DOCKER_PLATFORMS}
  local OUTPUT=--load
  if [ "$2" = "push" ]; then
    if is_valid_tag; then
      OUTPUT=--push
    else
      echo "Don't push. Invalid tag"
    fi
  fi
  if [ "$OUTPUT" = "--load" ] && [[ "$PLATFORMS" == *,* ]] && ! can_load_multi_platform; then
    PLATFORMS=$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')
    echo "Local image store can't hold multi-arch images: building only ${PLATFORMS}"
  fi

  docker buildx build --platform "${PLATFORMS}" "${TAGS[@]}" ${OUTPUT} .
}

build_full () {
  TAG_NAME=${DOCKER_TAG}

  if is_latest_tag; then
    docker_build "${TAG_NAME}" "$1" latest
  else
    docker_build "${TAG_NAME}" "$1"
  fi
}

build_sqlite () {
  TAG_NAME=${DOCKER_TAG}-sqlite

  npm uninstall --package-lock-only mysql2 redis memcached pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_sqlite_redis () {
  TAG_NAME=${DOCKER_TAG}-sqlite-redis

  npm uninstall --package-lock-only mysql2 memcached pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json
}

build_sqlite_memcached () {

  TAG_NAME=${DOCKER_TAG}-sqlite-memcached

  npm uninstall --package-lock-only mysql2 redis pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_mysql () {

  TAG_NAME=${DOCKER_TAG}-mysql

  npm uninstall --package-lock-only sqlite3 redis memcached pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_mysql_redis () {
  TAG_NAME=${DOCKER_TAG}-mysql-redis

  npm uninstall --package-lock-only sqlite3 memcached pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_mysql_memcached () {
  TAG_NAME=${DOCKER_TAG}-mysql-memcached

  npm uninstall --package-lock-only sqlite3 redis pg
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_postgres () {

  TAG_NAME=${DOCKER_TAG}-postgres

  npm uninstall --package-lock-only mysql2 sqlite3 redis memcached
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

build_postgres_redis () {
  TAG_NAME=${DOCKER_TAG}-postgres-redis

  npm uninstall --package-lock-only mysql2 sqlite3 memcached
  docker_build "${TAG_NAME}" "$1"

  git restore package.json package-lock.json

}

if [ "$1" = "all" ]; then

  build_sqlite "$2"
  build_sqlite_redis "$2"
  build_sqlite_memcached "$2"

  build_mysql "$2"
  build_mysql_redis "$2"
  build_mysql_memcached "$2"

  build_postgres "$2"
  build_postgres_redis "$2"

  build_full "$2"

else
   build_${1} "$2"
fi
