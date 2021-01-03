#!/usr/bin/env bash

THEO_INITIAL_IMAGE=theoapp/theo:0.11.0

if ! [[ "$1" == "skip_build" ]]; then
  # Build theo test image
  docker build --target builder -t theo-tester .
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker build FAILED"
    exit ${RETVAL}
  fi

  # Build theo server image
  docker build -t theo:test .
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker build FAILED"
    exit ${RETVAL}
  fi
fi

source ./docker-compose/test_env

test_sqlite_upgrade() {
  mkdir -p tmp.$$
  docker run --rm --name theo-sqlite-test -d -v $PWD/tmp.$$:/data -e DB_STORAGE=/data/theo.db $THEO_INITIAL_IMAGE
  echo "Wait 5 s.."
  sleep 5
  docker stop theo-sqlite-test
  docker run --rm --name theo-sqlite-test -d -v $PWD/tmp.$$:/data -e DB_STORAGE=/data/theo.db theo:test
  sleep 5
  docker stop theo-sqlite-test
  docker run --rm --name theo-sqlite-test -v $PWD/tmp.$$:/data -e DB_STORAGE=/data/theo.db theo-tester \
    npm run test:upgrade:sqlite
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR sqlite upgrade FAILED"
  fi
  rm -rf tmp.$$
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mysql_upgrade() {
  # start mysql
  echo "Starting mysql-server"
  docker run --rm --name theo-mysql-db -d \
    -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
    ${MYSQLSERVER_IMAGE} \
    mysqld --skip-host-cache --skip-name-resolve --default_authentication_plugin=mysql_native_password
  echo "Wait 60 s.."
  sleep 60
  docker exec theo-mysql-db mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
      -e "create database ${MYSQL_DATABASE}; create user ${MYSQL_USER}@'%' identified by '${MYSQL_PASSWORD}'; grant all on ${MYSQL_DATABASE}.* to  ${MYSQL_USER}@'%';"
  # start theo old
  echo "Starting ${THEO_INITIAL_IMAGE}"
  docker run --rm -d --link theo-mysql-db --name theo-mysql-test \
    -e DB_ENGINE=mysql  \
    -e DB_HOST=theo-mysql-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    $THEO_INITIAL_IMAGE
  echo "Wait 10 s.."
  sleep 10
  docker stop theo-mysql-test
  echo "Starting current theo image"
  docker run  --rm -d --link theo-mysql-db \
    --name theo-mysql-test \
    -e DB_ENGINE=mysql  \
    -e DB_HOST=theo-mysql-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    theo:test
  docker stop theo-mysql-test
  docker run --rm --link theo-mysql-db \
    --name theo-mysql-test \
    -e DB_HOST=theo-mysql-db \
    -e DB_USER=${MYSQL_USER} \
    -e DB_PASSWORD=${MYSQL_PASSWORD} \
    -e DB_NAME=${MYSQL_DATABASE} \
    theo-tester \
    npm run test:upgrade:mysql
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR mysql upgrade FAILED"
  fi
  docker stop theo-mysql-db
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mariadb_upgrade() {
  # start mariadb
  echo "Starting mariadb-server"
  docker run --rm --name theo-mariadb-db -d \
    -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
    -e MYSQL_USER=${MYSQL_USER}  \
    -e MYSQL_PASSWORD=${MYSQL_PASSWORD}  \
    -e MYSQL_DATABASE=${MYSQL_DATABASE}  \
    ${MARIADB_IMAGE}
  echo "Wait 60 s.."
  sleep 60
  # start theo old
  echo "Starting ${THEO_INITIAL_IMAGE}"
  docker run --rm -d --link theo-mariadb-db --name theo-mariadb-test \
    -e DB_ENGINE=mariadb  \
    -e DB_HOST=theo-mariadb-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    $THEO_INITIAL_IMAGE
  echo "Wait 10 s.."
  sleep 10
  docker stop theo-mariadb-test
  echo "Starting current theo image"
  docker run  --rm -d --link theo-mariadb-db \
    --name theo-mariadb-test \
    -e DB_ENGINE=mariadb  \
    -e DB_HOST=theo-mariadb-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    theo:test
  docker stop theo-mariadb-test
  docker run --rm --link theo-mariadb-db \
    --name theo-mariadb-test \
    -e DB_HOST=theo-mariadb-db \
    -e DB_USER=${MYSQL_USER} \
    -e DB_PASSWORD=${MYSQL_PASSWORD} \
    -e DB_NAME=${MYSQL_DATABASE} \
    theo-tester \
    npm run test:upgrade:mysql
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR mariadb upgrade FAILED"
  fi
  docker stop theo-mariadb-db
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_sqlite_upgrade

test_mariadb_upgrade

test_mysql_upgrade
