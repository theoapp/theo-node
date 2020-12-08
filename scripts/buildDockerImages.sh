#!/bin/bash
set -e
set -x

if [ -z "$DOCKER_IMAGE" ]; then
  DOCKER_IMAGE=theoapp/theo
fi

if [ -z "$DOCKER_TAG" ]; then
  DOCKER_TAG=$(cat package.json \
    | grep version \
    | head -1 \
    | awk -F: '{ print $2 }' \
    | sed 's/[",]//g' \
    | tr -d '[[:space:]]')
fi

is_valid_tag () {
  if [[ "$DOCKER_TAG" =~ ^[0-9]*\.[0-9]*\.[0-9]* ]]; then
    return 0
  else
    return 1
  fi
}

is_latest_tag () {
  LATEST_GIT_TAG=$(git tag | grep ^[0-9]*\.[0-9]*\.[0-9]*$ | sort -V | tail -n 1)
  if [ "$LATEST_GIT_TAG" = "$DOCKER_TAG" ]; then
    return 0
  else
    return 1
  fi
}

docker_build () {
  docker build -t ${DOCKER_IMAGE}:"${1}" .
}

docker_push () {
  is_valid_tag
  RETVAL=$?
  if [ $RETVAL -eq 0 ]; then
    docker push ${DOCKER_IMAGE}:"${1}"
  else
    echo "Don't push. Invalid tag"
  fi
}

build_full () {
  TAG_NAME=${DOCKER_TAG}

  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  is_latest_tag
  RETVAL=$?
  if [ $RETVAL -eq 0 ]; then
    docker_build latest
    if [ "$1" = "push" ]; then
        docker_push "${TAG_NAME}"
    fi
  fi
}

build_sqlite () {
  TAG_NAME=${DOCKER_TAG}-sqlite

  npm uninstall @authkeys/mysql-connman redis memcached
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json

}

build_sqlite_redis () {
  TAG_NAME=${DOCKER_TAG}-sqlite-redis

  npm uninstall @authkeys/mysql-connman memcached
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json
}

build_sqlite_memcached () {

  TAG_NAME=${DOCKER_TAG}-sqlite-memcached

  npm uninstall @authkeys/mysql-connman redis
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json

}

build_mysql () {

  TAG_NAME=${DOCKER_TAG}-mysql

  npm uninstall sqlite3
  npm uninstall redis
  npm uninstall memcached
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json

}

build_mysql_redis () {
  TAG_NAME=${DOCKER_TAG}-mysql-redis

  npm uninstall sqlite3 memcached
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json

}

build_mysql_memcached () {
  TAG_NAME=${DOCKER_TAG}-mysql-memcached

  npm uninstall sqlite3 redis
  docker_build "${TAG_NAME}"

  if [ "$1" = "push" ]; then
      docker_push "${TAG_NAME}"
  fi

  git checkout package.json package-lock.json

}

if [ "$1" = "all" ]; then

  build_sqlite "$2"
  build_sqlite_redis "$2"
  build_sqlite_memcached "$2"

  build_mysql "$2"
  build_mysql_redis "$2"
  build_mysql_memcached "$2"

  build_full "$2"

else
   build_${1} "$2"
fi

if [ "$2" = "push" ]; then
  if [ -n "$MICROBADGE_TOKEN" ]; then
    curl -XPOST https://hooks.microbadger.com/images/theoapp/theo/${MICROBADGE_TOKEN}
  fi
fi
