# theo-node

Theo is an AuthorizedKeys manager: sshd's `AuthorizedKeysCommand` asks theo for the public keys of a `user@host`.
It also offers an admin REST API for accounts, keys, groups and permissions. Node >= 24, ES modules transpiled with babel
(`src` -> `build`), Apache-2.0.

## Layout

- `src/index.js`: entry point. It imports `./appenv` (dotenv) **first**, then `./const`, then everything else.
- `src/const.js`: the **only** place that reads the environment. Every value comes from `EnvParse` (saddlebag) and is read
  once, when the module is imported.
- `src/theoserver.js`: `TheoServer` extends `Microservice` from `@fluidware-it/express-microservice` (express 5).
  - The server sets up its own middlewares: ALS instance store, `authMiddleware`, `auditMiddleware`, and db open/close
    per request.
  - It then mounts `useOpenapiValidatorMiddleware(api/openapi-spec/openapi.yaml, src/controllers, true)`, which also
    validates responses.
  - `forwardUnknownBearer: true` is required, so that theo's tokens reach `authMiddleware`.
- `api/openapi-spec/openapi.yaml`: OpenAPI 3.0.3 spec. It is also the router. Every operation has
  `x-eov-operation-handler: <Controller>` and an `operationId` that equals the exported function name.
- `src/controllers/*Controller.js`: one controller per context (Main, Tokens, AuthorizedKeys, Permissions, Accounts,
  Groups, ImpExp). There is no express router any more (`src/routes` was removed).
- `src/lib/helpers`: business logic. `AdminHelper` re-exports `admins/*`.
- `src/lib/managers`: SQL per entity.
- `src/lib/rdbms`: drivers for sqlite, mariadb/mysql and postgres. They hold `dbVersion` (currently 18) and the upgrade
  steps. Data migrations live in `src/migrations`.
- `src/lib/cache`: inmemory, memcached and redis.
- `src/settingsInitiator.js`: builds the settings from the env and from an optional `SETTINGS_FILE`. These cover tokens,
  db, cache and port (`PORT`, then the deprecated `HTTP_PORT`, then the settings file, then 9100).

## Code conventions

- **Environment**: `no-process-env` is an eslint error. Add the variable to `src/const.js` with `EnvParse`.
  - Use `EnvParse.envBool(KEY, false)` for flags (CLUSTER_MODE, MULTI_INSTANCES, REQUIRE_SIGNED_KEY, TRUST_PROXY, ...).
    Values are 1/0, true/false, yes/no or on/off; an empty or unknown value throws at startup.
  - Use `EnvParse.envString(KEY, default)` when there is a default, and `envStringOptional` otherwise.
- **Logging**: `no-console` is an eslint error. Use `getLogger()` from `@fluidware-it/saddlebag` (pino).
  - Call it at log time, not once per module, so a request uses its child logger.
  - pino drops extra args. Pass errors first (`getLogger().error(err, 'msg')`), messages as
    `{ error_message: e.message }`, and values with the `%s` / `%d` placeholders.
  - `LOG_LEVEL` sets the level in `index.js`; otherwise saddlebag's `FW_LOGGER_LEVEL` applies.
- **Controllers**:
  - Start each handler with `checkAuth` / `checkAdminAuth` / `checkCoreAuth` (in `AuthMiddleware`), which throw
    `HTTPError(401)`.
  - Answer errors with `sendError(res, err)` from `lib/utils/responseUtils`. It uses `err.t_code` (helpers and managers
    set it) or `err.status` (`HTTPError`).
  - `sendDone(res, done)` gives the historical `201 {status:201}` / `500 Unknown error` answer.
- **Spec / validator gotchas**:
  - Don't use `nullable` without `type`: Ajv refuses to compile the whole spec, and every request returns 500.
  - Use `anyOf`, not `oneOf`, for integer|string ids: a numeric path param matches both branches once coerced.
  - Don't put an enum on the `Accept` header (clients send `*/*`).
  - Query params that can contain `+/=` need `allowReserved: true`.
- **Ids**: an account `{id}` can also be its email, and a group `{id}` can also be its name.
- **Multi instances** (`MULTI_INSTANCES=1`, requires `CORE_TOKEN`): the instance is the request `Host`. Every table has
  an `instance` column, and tokens are stored as `md5(instance:token)`.
- **Postgres**: BIGINT columns are parsed as numbers in `PostgresClient`. The API must return numbers on every db.
- Style: prettier through eslint (single quotes, printWidth 120, no trailing comma, `arrowParens: avoid`). Fix with
  `npx eslint --fix src`. Don't use a global `npx prettier`: it isn't the project's version or config.
- New files keep the Apache license header used by the other files.

## Commands

```bash
npm run lint            # eslint src (tests are not linted)
npm run build           # babel src -> build
npm run test:standalone # unit tests, no server needed
./runTestsAll.sh        # full suite in docker: sqlite/mariadb/mysql/postgres, redis/memcached, core, cluster, upgrade, multi-instances
./runTestsDocker.sh postgres_redis   # a single stage (test_<name> in runTestsDocker.sh)
```

- `runTestsAll.sh` uses `set -e`, so it stops at the first failing stage. To finish the run, launch the remaining
  scripts with `skip_build`: `runTestsCluster.sh`, `runTestsUpgrade.sh` and `runTestsMultiInstances.sh`.
- The docker image has to ship `api/openapi-spec`, both in the `Dockerfile` and in the `.dockerignore` whitelist.
- REST tests (`tests/testRest*`, `testSigned*`, `testCore*`, `testMultiInstances`) need a running server.
  They read `THEO_URL`, `ADMIN_TOKEN`, `CLIENT_TOKENS` and `CORE_TOKEN`. To run them locally:
  - start `npx babel-node src/index.js` with `MODE=test`, `DB_ENGINE=sqlite` and throwaway tokens;
  - the server loads the project's `.env` through dotenv, and dotenv does not override variables already set, so set
    explicitly every variable `.env` could inject (e.g. an empty `CORE_TOKEN`, `CLUSTER_MODE=0`). Otherwise the server
    may start in core mode and ignore `ADMIN_TOKEN`;
  - `testMultiInstances` fails on a single node ("failed to see all replicas"): it needs the docker cluster.

## Git

- Work happens on feature branches; the main branch is `master`.
- Commit messages: a `scope: summary` subject in lowercase, a blank line, then a body that explains the why.
  Keep unrelated changes in separate commits (e.g. a test fix apart from the feature).
