#!/usr/bin/env bash

if ! [[ "$1" = "skip_build" ]]; then
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

docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster.yml up -d
echo Waiting for db to start..
sleep 10
docker run --network theotests_default --rm --link theo \
    -e "CORE_TOKEN=${CORE_TOKEN}" \
    -e "THEO_URL_1=http://theo1:9100" \
    -e "THEO_URL_2=http://theo2:9100" \
    -e "THEO_URL_3=http://theo3:9100" \
    theo-tester npm run test:cluster
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-mariadb-redis-core-cluster FAILED"
fi
docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core-cluster.yml down
exit ${RETVAL}
