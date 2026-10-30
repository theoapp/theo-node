#!/usr/bin/env bash

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

test_mariadb_redis_core_cluster_multi_instances() {
  print_test_header mariadb_redis_core_cluster_multiinstances
  docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster-multiinstances.yml up -d --wait
  docker run --network theotests_default --rm --link theo \
    -e "CORE_TOKEN=${CORE_TOKEN}" \
    -e "THEO_URL=http://theo:9100" \
    theo-tester npm run test:multiinstances
  RETVAL=$?
  if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-mariadb-redis-core-cluster-multiinstances FAILED"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster-multiinstances.yml logs theo
  fi
  docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster-multiinstances.yml down --volumes
  if [[ ${RETVAL} -gt 0 ]]; then
    exit ${RETVAL}
  fi
}

test_mariadb_redis_core_cluster_multi_instances
