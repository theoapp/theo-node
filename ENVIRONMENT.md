
## Environment variables

| ENV                             |    type | default | required |    notes |
| ------------------------------- | ------- | ------- | -------- | -------- |
| ADDRESS                         |  string |         |          |          |
| ADDRESSES                       |  string |         |          |          |
| ADMIN_TOKEN                     |  string |         |          |          |
| ADMIN_TOKENS                    |  string |         |          |          |
| CACHE_ENABLED                   |  string |         |          |          |
| CACHE_OPTIONS                   |  string |         |          |          |
| CACHE_URI                       |  string |         |          |          |
| CLIENT_TOKENS                   |  string |         |          |          |
| CLUSTER_MODE                    | boolean |   false |          |          |
| CORE_TOKEN                      |  string |         |          |          |
| DATA_PATH                       |  string |         |          |          |
| DB_CLUSTER                      |  string |         |          |          |
| DB_CONNECTION_LIMIT             |  string |         |          |          |
| DB_CONN_MAX_RETRY               |  string |         |          |          |
| DB_ENGINE                       |  string |         |          |          |
| DB_HOST                         |  string |         |          |          |
| DB_NAME                         |  string |         |          |          |
| DB_NOPOOL                       | boolean |   false |          |          |
| DB_PASSWORD                     |  string |         |          |          |
| DB_PASSWORD_FILE                |  string |         |          |          |
| DB_PORT                         |  string |         |          |          |
| DB_QUEUE_LIMIT                  |  string |         |          |          |
| DB_SSL_CA                       |  string |         |          |          |
| DB_STORAGE                      |  string |         |          |          |
| DB_USER                         |  string |         |          |          |
| DEBUG_AUTH                      | boolean |   false |          |          |
| HOSTNAME                        |  string |         |          |          |
| HTTP_PORT                       |  string |         |          |          |
| LOAD_PLUGINS                    |  string |         |          |          |
| LOG_AUDIT_CONSOLE               | boolean |   false |          |          |
| LOG_AUDIT_TOKEN                 |  string |         |          |          |
| LOG_AUDIT_URL                   |  string |         |          |          |
| LOG_AUTH_KEYS_TOKEN             |  string |         |          |          |
| LOG_AUTH_KEYS_URL               |  string |         |          |          |
| LOG_LEVEL                       |  string |         |          |          |
| MODE                            |  string |         |          |          |
| MULTI_INSTANCES                 | boolean |   false |          |          |
| PORT                            |  string |         |          |          |
| REDIS_CONNECTION_RETRY_INTERVAL |  string |         |          |          |
| REDIS_MAX_CONNECTION_RETRIES    |  string |         |          |          |
| REQUIRE_SIGNED_KEY              | boolean |   false |          |          |
| SETTINGS_FILE                   |  string |         |          |          |
| SKIP_UPDATECHECK                | boolean |   false |          |          |
| TRUST_PROXY                     | boolean |   false |          |          |
| TRUST_PROXY_LIST                |  string |         |          |          |

## @fluidware-it/express-microservice@0.6.2

| ENV                             |     type |                        default | required |                                               notes |
| ------------------------------- | -------- | ------------------------------ | -------- | --------------------------------------------------- |
| APP_${appName}_ROLES            | string[] |                                |          |                          roles to assign to appName |
| APP_KEY_${appName}              |   string |                                |          |                        pre shared token for appName |
| FW_APP_DEFAULT_ROLES            | string[] |                          admin |          |                                                     |
| FW_MS_ADDRESS                   |   string |                                |          |                                                     |
| FW_MS_ADDRESSES                 | string[] |                                |          |                                                     |
| FW_MS_CERT                      |   string |                                |          |     full cert for https (wins over FW_MS_CERT_FILE) |
| FW_MS_CERT_FILE                 |   string |                                |          |         path to file containing full cert for https |
| FW_MS_FORWARD_UNKNOWN_BEARER    |  boolean |                          false |          | forward unknown bearer token to the next middleware |
| FW_MS_HOSTNAME                  |   string |                     _function_ |          |                               default to hostname() |
| FW_MS_JWT_PUBLIC_KEY            |   string |                                |          |                                                     |
| FW_MS_KEY                       |   string |                                |          |       full key for https (wins over FW_MS_KEY_FILE) |
| FW_MS_KEY_FILE                  |   string |                                |          |          path to file containing full key for https |
| FW_MS_LOG_404                   |  boolean |                          false |          |                                                     |
| FW_MS_MAX_UPLOAD_SIZE           |   string |                          128kb |          |                                                     |
| FW_MS_OPENAPI_CONTROLLERS_PATH  |   string |                                |          |                                                     |
| FW_MS_OPENAPI_SPEC_FILE         |   string |                                |          |                                                     |
| FW_MS_OPENAPI_VALIDATE_RESPONSE |  boolean |                           true |          |                                                     |
| FW_MS_PORT                      |  integer |                           8080 |          |                                                     |
| FW_MS_PRE_SHARED_TOKEN_PREFIX   |   string |                                |          |                                                     |
| FW_MS_TRUST_PROXY               |   string | loopback,linklocal,uniquelocal |          |                                                     |

## @fluidware-it/saddlebag@0.3.0

| ENV                          |     type |                 default | required |    notes |
| ---------------------------- | -------- | ----------------------- | -------- | -------- |
| FW_LOGGER_ISO_TIMESTAMP      |  boolean |                   false |          |          |
| FW_LOGGER_LEVEL              |   string |                    info |          |          |
| FW_LOGGER_NAME               |   string |              _function_ |          |          |
| FW_LOGGER_REDACT_KEYS        | string[] |                         |          |          |
| FW_LOGGER_SEVERITY_AS_STRING |  boolean |                   false |          |          |
| npm_package_name             |   string | @fluidware-it/saddlebag |          |          |
