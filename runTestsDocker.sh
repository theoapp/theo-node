#!/usr/bin/env bash

WAIT_FOR_DB_SEC=10
if [ "$TRAVIS" = "true" ]; then
  WAIT_FOR_DB_SEC=40
fi

print_test_header () {
    echo
    echo "  #####  "
    echo $1
    echo "  #####  "
    echo
}

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

source ./docker-compose/test_env

test_standalone () {
    print_test_header Standalone
    docker run --rm --name theo-tester theo-tester npm run test:standalone
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR test:standalone FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite () {
    # sqlite
    print_test_header sqlite
    docker-compose -p theotests -f docker-compose/docker-compose-test.yml up -d
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_audit () {
    # sqlite
    print_test_header "sqlite audit"
    docker-compose -p theotests -f docker-compose/docker-compose-test-audit.yml up -d
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN_AUDIT}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    else
        docker logs --tail 20 theo
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-audit.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_signed () {
    # sqlite + REQUIRE_SIGNED_KEY
    print_test_header "sqlite + REQUIRE_SIGNED_KEY"
    docker-compose -p theotests -f docker-compose/docker-compose-test-signed.yml up -d
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api:signed
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-signed.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-signed FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_memcached () {
    # sqlite + memcached
    print_test_header "sqlite + memcached"
    docker-compose -p theotests -f docker-compose/docker-compose-test-memcached.yml up -d
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-memcached.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-memcached FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb () {
    # mariadb
    print_test_header mariadb
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml up -d
    echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
    sleep $WAIT_FOR_DB_SEC
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb_redis () {
    # mariadb + redis
    print_test_header "mariadb + redis"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis.yml up -d
    echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
    sleep $WAIT_FOR_DB_SEC
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs theo | tail -n 20
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis FAILED"
        exit ${RETVAL}
    fi
}

test_mysql () {
    # mysql
    print_test_header "mysql"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml up -d
    echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
    # On travis it takes a lot to start...
    sleep 30
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml \
        exec -T db mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
        -e "create database ${MYSQL_DATABASE}; create user ${MYSQL_USER}@'%' identified by '${MYSQL_PASSWORD}'; grant all on ${MYSQL_DATABASE}.* to  ${MYSQL_USER}@'%';"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml restart theo
    sleep $WAIT_FOR_DB_SEC
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs theo | tail -n 20
    fi
    docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mysql FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb_redis_core_noassignee () {
    # mariadb + redis CORE
    print_test_header "mariadb + redis CORE no assignee"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml up -d
    echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
    sleep $WAIT_FOR_DB_SEC
    docker run --network theotests_default --rm --link theo \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        -e "THEO_URL=http://theo:9100" \
        theo-tester npm run test:core:noassignee
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down
        echo "ERR docker-compose-test-mariadb-redis-core FAILED"
        exit ${RETVAL}
    fi

    print_test_header "mariadb + redis CORE no assignee AFTER RESTART"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml restart theo
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        theo-tester npm run test:core:restart:noassignee
    RETVAL=$?
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis-core restart FAILED "
        exit ${RETVAL}
    fi
}

test_mariadb_redis_core () {
    # mariadb + redis CORE
    print_test_header "mariadb + redis CORE"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml up -d
    echo ${WAIT_FOR_DB_SEC}s Waiting for db to start..
    sleep $WAIT_FOR_DB_SEC
    docker run --network theotests_default --rm --link theo \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        -e "THEO_URL=http://theo:9100" \
        theo-tester npm run test:core
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down
        echo "ERR docker-compose-test-mariadb-redis-core FAILED"
        exit ${RETVAL}
    fi

    print_test_header "mariadb + redis CORE AFTER RESTART"
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml restart theo
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        theo-tester npm run test:core:restart
    RETVAL=$?
    docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis-core restart FAILED "
        exit ${RETVAL}
    fi
}

if [[ "$1" = "" ]]; then
    test_standalone
    test_sqlite
    test_sqlite_audit
    test_sqlite_signed
    test_sqlite_memcached
    test_mariadb
    test_mariadb_redis
    test_mysql
    test_mariadb_redis_core
else
    test_${1}
fi
