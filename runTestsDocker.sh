#!/usr/bin/env bash

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

docker run --name theo-tester theo-tester npm run test:standalone
RETVAL=$?
docker rm theo-tester
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR test:standalone FAILED"
    exit ${RETVAL}
fi

# sqlite
docker-compose -p theotests -f docker-compose/docker-compose-test.yml up -d
docker run --network theotests_default --rm --link theo \
    -e "THEO_URL=http://theo:9100" \
    -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
    -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
    theo-tester npm run test:api
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    docker logs theo | tail -n 30
fi
docker-compose -p theotests -f docker-compose/docker-compose-test.yml down
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test FAILED"
    exit ${RETVAL}
fi

sleep 1

# sqlite + REQUIRE_SIGNED_KEY
docker-compose -p theotests -f docker-compose/docker-compose-test-signed.yml up -d
docker run --network theotests_default --rm --link theo \
    -e "THEO_URL=http://theo:9100" \
    -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
    -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
    theo-tester npm run test:api:signed
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    docker logs theo | tail -n 30
fi
docker-compose -p theotests -f docker-compose/docker-compose-test-signed.yml down
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-signed FAILED"
    exit ${RETVAL}
fi

sleep 1

# sqlite + memcached
docker-compose -p theotests -f docker-compose/docker-compose-test-memcached.yml up -d
docker run --network theotests_default --rm --link theo \
    -e "THEO_URL=http://theo:9100" \
    -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
    -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
    theo-tester npm run test:api
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    docker logs theo | tail -n 30
fi
docker-compose -p theotests -f docker-compose/docker-compose-test-memcached.yml down
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-memcached FAILED"
    exit ${RETVAL}
fi

sleep 1

# mariadb
docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml up -d
echo Waiting for db to start..
sleep 10
docker run --network theotests_default --rm --link theo \
    -e "THEO_URL=http://theo:9100" \
    -e "ADMIN_TOKEN=${ADMIN_TOKEN}" \
    -e "CLIENT_TOKENS=${CLIENT_TOKENS}" \
    theo-tester npm run test:api
RETVAL=$?
if [[ ${RETVAL} -gt 0 ]]; then
    docker logs theo | tail -n 30
fi
docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb.yml down
if [[ ${RETVAL} -gt 0 ]]; then
    echo "ERR docker-compose-test-mariadb FAILED"
    exit ${RETVAL}
fi

sleep 1

# mariadb + redis
docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis.yml up -d
echo Waiting for db to start..
sleep 10
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

sleep 1

# mysql
docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml up -d
echo Waiting for db to start..
# On travis it takes a lot to start...
sleep 60
docker exec -it mysql-server mysql -uroot -p${MYSQL_ROOT_PASSWORD} \
    -e "create database ${MYSQL_DATABASE}; create user ${MYSQL_USER}@'%' identified by '${MYSQL_PASSWORD}'; grant all on ${MYSQL_DATABASE}.* to  ${MYSQL_USER}@'%';"
docker-compose -p theotests -f docker-compose/docker-compose-test-mysql.yml restart theo
sleep 5
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

sleep 1

# mariadb + redis CORE
docker-compose -p theotests -f docker-compose/docker-compose-test-mariadb-redis-core.yml up -d
echo Waiting for db to start..
sleep 10
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
