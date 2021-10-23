#!/usr/bin/env bash

WAIT_FOR_DB_SEC=20
WAIT_FOR_DBCLUSTER_SEC=90
if [ "$TRAVIS" = "true" ]; then
  WAIT_FOR_DB_SEC=60
  WAIT_FOR_DBCLUSTER_SEC=180
fi

print_test_header () {
    echo
    echo "  #####  "
    echo $1
    echo "  #####  "
    echo
}

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

test_mariadb_redis_core_cluster() {
  print_test_header mariadb_redis_core_cluster
  docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster.yml up -d
  echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
  sleep $WAIT_FOR_DB_SEC
  docker run --network theotests_default --rm --link theo \
    -e "CORE_TOKEN=${CORE_TOKEN}" \
    -e "THEO_URL_1=http://theo1:9100" \
    -e "THEO_URL_2=http://theo2:9100" \
    -e "THEO_URL_3=http://theo3:9100" \
    theo-tester npm run test:cluster
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-mariadb-redis-core-cluster FAILED"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster.yml logs --tail 50 theo1
  fi
  docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster.yml down
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mysql_innodbcluster_redis_core_cluster() {
  print_test_header mysql_innodbcluster_redis_core_cluster
  docker-compose -p theotests -f docker-compose/docker-compose-test-mysql-innodbcluster-redis-core-cluster.yml up -d
  echo Waiting ${WAIT_FOR_DBCLUSTER_SEC}s for db to start..
  sleep $WAIT_FOR_DBCLUSTER_SEC
  docker run --network theotests_default --rm --link theo \
    -e "THEO_HOST=theo1" \
    -e "THEO_PORT=9100" \
    -e "CORE_TOKEN=${CORE_TOKEN}" \
    -e "THEO_URL_1=http://theo1:9100" \
    -e "THEO_URL_2=http://theo2:9100" \
    -e "THEO_URL_3=http://theo3:9100" \
    theo-tester npm run test:cluster
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR test_mysql_innodbcluster_redis_core_cluster FAILED"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql-innodbcluster-redis-core-cluster.yml logs --tail 50 theo1
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql-innodbcluster-redis-core-cluster.yml logs --tail 50 theo2
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql-innodbcluster-redis-core-cluster.yml logs --tail 50 theo3
  fi
  docker-compose -p theotests -f docker-compose/docker-compose-test-mysql-innodbcluster-redis-core-cluster.yml down
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_postgres_redis_core_cluster() {
  print_test_header postgres_redis_core_cluster
  docker-compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core-cluster.yml up -d
  echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
  sleep $WAIT_FOR_DB_SEC
  docker run --network theotests_default --rm --link theo \
    -e "CORE_TOKEN=${CORE_TOKEN}" \
    -e "THEO_URL_1=http://theo1:9100" \
    -e "THEO_URL_2=http://theo2:9100" \
    -e "THEO_URL_3=http://theo3:9100" \
    theo-tester npm run test:cluster
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-postgres-redis-core-cluster FAILED"
    docker-compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core-cluster.yml logs --tail 50 theo1
  fi
  docker-compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core-cluster.yml down
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mariadb_redis_core_cluster

test_mysql_innodbcluster_redis_core_cluster

test_postgres_redis_core_cluster