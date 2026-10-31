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

# wait until the container healthcheck reports healthy
wait_healthy() {
  for i in $(seq 1 90); do
    if [[ "$(docker inspect -f '{{.State.Health.Status}}' $1 2>/dev/null)" == "healthy" ]]; then
      return 0
    fi
    sleep 1
  done
  echo "ERR $1 is not healthy"
  return 1
}

test_sqlite_upgrade() {
  docker volume create theo-sqlite-test
  docker run --rm --name theo-sqlite-test -d -v theo-sqlite-test:/data -e DB_STORAGE=/data/theo.db $THEO_INITIAL_IMAGE
  echo "Wait 5 s.."
  sleep 5
  docker stop theo-sqlite-test
  # old images ran as root,
  docker run --rm -v theo-sqlite-test:/data $THEO_INITIAL_IMAGE sh -c 'chmod 777 /data && chmod 666 /data/theo.db'
  docker run --rm --name theo-sqlite-test -d -v theo-sqlite-test:/data -e DB_STORAGE=/data/theo.db theo:test
  wait_healthy theo-sqlite-test
  docker stop theo-sqlite-test
  docker run --rm --name theo-sqlite-test -v theo-sqlite-test:/data -e DB_STORAGE=/data/theo.db theo-tester \
    npm run test:upgrade:sqlite
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR sqlite upgrade FAILED"
  fi
  docker volume rm theo-sqlite-test
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mysql_upgrade() {
  # start mysql
  echo "Starting mysql-server"
  docker network create theo-test
  docker run --network theo-test --rm --name theo-mysql-db -d \
    -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
    --health-cmd "mysqladmin ping -h 127.0.0.1 -u root -p${MYSQL_ROOT_PASSWORD}" \
    --health-interval 1s \
    ${MYSQLSERVER_IMAGE} \
    mysqld --host-cache-size=0 --skip-name-resolve --mysql-native-password=ON
  wait_healthy theo-mysql-db
  docker exec theo-mysql-db mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
      -e "create database ${MYSQL_DATABASE}; create user ${MYSQL_USER}@'%' identified with mysql_native_password by '${MYSQL_PASSWORD}'; grant all on ${MYSQL_DATABASE}.* to  ${MYSQL_USER}@'%';"
  # start theo old
  echo "Starting ${THEO_INITIAL_IMAGE}"
  docker run --network theo-test --rm -d --name theo-mysql-test \
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
  docker run  --network theo-test --rm -d \
    --name theo-mysql-test \
    -e DB_ENGINE=mysql  \
    -e DB_HOST=theo-mysql-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    theo:test
  wait_healthy theo-mysql-test
  docker stop theo-mysql-test
  docker run --rm --network theo-test \
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
  docker network rm theo-test
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mariadb_upgrade() {
  # start mariadb
  docker network create theo-test
  echo "Starting mariadb-server"
  docker run --network theo-test --rm --name theo-mariadb-db -d \
    -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
    -e MYSQL_USER=${MYSQL_USER}  \
    -e MYSQL_PASSWORD=${MYSQL_PASSWORD}  \
    -e MYSQL_DATABASE=${MYSQL_DATABASE}  \
    --health-cmd "healthcheck.sh --connect --innodb_initialized" \
    --health-interval 1s \
    ${MARIADB_IMAGE}
  wait_healthy theo-mariadb-db
  # start theo old
  echo "Starting ${THEO_INITIAL_IMAGE}"
  docker run --network theo-test --rm -d --name theo-mariadb-test \
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
  docker run  --rm -d  --network theo-test \
    --name theo-mariadb-test \
    -e DB_ENGINE=mariadb  \
    -e DB_HOST=theo-mariadb-db  \
    -e DB_USER=${MYSQL_USER}  \
    -e DB_PASSWORD=${MYSQL_PASSWORD}  \
    -e DB_NAME=${MYSQL_DATABASE}  \
    theo:test
  wait_healthy theo-mariadb-test
  docker stop theo-mariadb-test
  docker run --rm --network theo-test \
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
  docker network rm theo-test
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_sqlite_upgrade

test_mariadb_upgrade

test_mysql_upgrade
