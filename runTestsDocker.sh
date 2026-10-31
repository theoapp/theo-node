#!/usr/bin/env bash

print_test_header () {
    echo
    echo "  #####  "
    echo "$1"
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
    docker compose -p theotests -f docker-compose/docker-compose-test.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_audit () {
    # sqlite
    print_test_header "sqlite audit"
    docker compose -p theotests -f docker-compose/docker-compose-test-audit.yml up -d --wait
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
    docker compose -p theotests -f docker-compose/docker-compose-test-audit.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_signed () {
    # sqlite + REQUIRE_SIGNED_KEY
    print_test_header "sqlite + REQUIRE_SIGNED_KEY"
    docker compose -p theotests -f docker-compose/docker-compose-test-signed.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api:signed
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-signed.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-signed FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_inmemory () {
    # sqlite + inmemory
    print_test_header "sqlite + inmemory"
    docker compose -p theotests -f docker-compose/docker-compose-test-inmemory.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        -e "THEO_USE_CACHE=1" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-inmemory.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-inmemory FAILED"
        exit ${RETVAL}
    fi
}

test_sqlite_memcached () {
    # sqlite + memcached
    print_test_header "sqlite + memcached"
    docker compose -p theotests -f docker-compose/docker-compose-test-memcached.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        -e "THEO_USE_CACHE=1" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-memcached.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-memcached FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb () {
    # mariadb
    print_test_header mariadb
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb_redis () {
    # mariadb + redis
    print_test_header "mariadb + redis"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        -e "THEO_USE_CACHE=1" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs theo | tail -n 20
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis FAILED"
        exit ${RETVAL}
    fi
}

test_mysql () {
    # mysql
    print_test_header "mysql"
    docker compose -p theotests -f docker-compose/docker-compose-test-mysql.yml up -d db --wait
    docker compose -p theotests -f docker-compose/docker-compose-test-mysql.yml \
        exec -T db mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
        -e "create database ${MYSQL_DATABASE}; create user ${MYSQL_USER}@'%' identified by '${MYSQL_PASSWORD}'; grant all on ${MYSQL_DATABASE}.* to  ${MYSQL_USER}@'%';"
    docker compose -p theotests -f docker-compose/docker-compose-test-mysql.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs theo | tail -n 20
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-mysql.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mysql FAILED"
        exit ${RETVAL}
    fi
}

test_mariadb_redis_core_noassignee () {
    # mariadb + redis CORE
    print_test_header "mariadb + redis CORE no assignee"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        -e "THEO_URL=http://theo:9100" \
        theo-tester npm run test:core:noassignee
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down --volumes
        echo "ERR docker-compose-test-mariadb-redis-core FAILED"
        exit ${RETVAL}
    fi

    print_test_header "mariadb + redis CORE no assignee AFTER RESTART"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml restart theo
    wait_healthy theo
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        theo-tester npm run test:core:restart:noassignee
    RETVAL=$?
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis-core restart FAILED "
        exit ${RETVAL}
    fi
}

test_mariadb_redis_core () {
    # mariadb + redis CORE
    print_test_header "mariadb + redis CORE"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        -e "THEO_URL=http://theo:9100" \
        theo-tester npm run test:core
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down --volumes
        echo "ERR docker-compose-test-mariadb-redis-core FAILED"
        exit ${RETVAL}
    fi

    print_test_header "mariadb + redis CORE AFTER RESTART"
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml restart theo
    wait_healthy theo
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        theo-tester npm run test:core:restart
    RETVAL=$?
    docker compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-mariadb-redis-core restart FAILED "
        exit ${RETVAL}
    fi
}

test_postgres () {
    # postgres
    print_test_header postgres
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs --tail 30 theo
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-postgres FAILED"
        exit ${RETVAL}
    fi
}

test_postgres_redis () {
    # postgres + redis
    print_test_header "postgres + redis"
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
        -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
        -e "THEO_USE_CACHE=1" \
        theo-tester npm run test:api
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker logs theo | tail -n 20
    fi
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-postgres-redis FAILED"
        exit ${RETVAL}
    fi
}

test_postgres_redis_core () {
    # postgres + redis CORE
    print_test_header "postgres + redis CORE"
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core.yml up -d --wait
    docker run --network theotests_default --rm --link theo \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        -e "THEO_URL=http://theo:9100" \
        theo-tester npm run test:core
    RETVAL=$?
    if [[ ${RETVAL} -gt 0 ]]; then
        docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core.yml down --volumes
        echo "ERR docker-compose-test-postgres-redis-core FAILED"
        exit ${RETVAL}
    fi

    print_test_header "postgres + redis CORE AFTER RESTART"
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core.yml restart theo
    wait_healthy theo
    docker run --network theotests_default --rm --link theo \
        -e "THEO_URL=http://theo:9100" \
        -e "CORE_TOKEN=${CORE_TOKEN}" \
        theo-tester npm run test:core:restart
    RETVAL=$?
    docker compose -p theotests -f docker-compose/docker-compose-test-postgres-redis-core.yml down --volumes
    if [[ ${RETVAL} -gt 0 ]]; then
        echo "ERR docker-compose-test-postgres-redis-core restart FAILED "
        exit ${RETVAL}
    fi
}

if [[ "$1" = "" ]]; then
    test_standalone
    test_sqlite
    test_sqlite_audit
    test_sqlite_signed
    test_sqlite_inmemory
    test_sqlite_memcached
    test_mariadb
    test_mariadb_redis
    test_mysql
    test_mariadb_redis_core
    test_postgres
    test_postgres_redis
    test_postgres_redis_core
else
    test_${1}
fi
