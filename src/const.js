import { EnvParse } from '@fluidware-it/saddlebag';

// Read once at import: src/index.js imports ./appenv (dotenv) before anything else

export const MODE = EnvParse.envStringOptional('MODE');
export const LOAD_PLUGINS = EnvParse.envStringOptional('LOAD_PLUGINS');
export const LOG_LEVEL = EnvParse.envStringOptional('LOG_LEVEL');

// Server
export const PORT = EnvParse.envStringOptional('PORT');
export const HTTP_PORT = EnvParse.envStringOptional('HTTP_PORT');
export const ADDRESSES = EnvParse.envStringOptional('ADDRESSES');
export const ADDRESS = EnvParse.envStringOptional('ADDRESS');
export const HOSTNAME = EnvParse.envStringOptional('HOSTNAME');
export const TRUST_PROXY = EnvParse.envBool('TRUST_PROXY', false);
export const TRUST_PROXY_LIST = EnvParse.envStringOptional('TRUST_PROXY_LIST');
export const DEBUG_AUTH = EnvParse.envBool('DEBUG_AUTH', false);
export const SKIP_UPDATECHECK = EnvParse.envBool('SKIP_UPDATECHECK', false);

// Modes
export const CLUSTER_MODE = EnvParse.envBool('CLUSTER_MODE', false);
export const MULTI_INSTANCES = EnvParse.envBool('MULTI_INSTANCES', false);
export const REQUIRE_SIGNED_KEY = EnvParse.envBool('REQUIRE_SIGNED_KEY', false);
export const SETTINGS_FILE = EnvParse.envStringOptional('SETTINGS_FILE');

// Tokens
export const CORE_TOKEN = EnvParse.envStringOptional('CORE_TOKEN');
export const ADMIN_TOKEN = EnvParse.envStringOptional('ADMIN_TOKEN');
export const ADMIN_TOKENS = EnvParse.envStringOptional('ADMIN_TOKENS');
export const CLIENT_TOKENS = EnvParse.envStringOptional('CLIENT_TOKENS');

// Db
export const DB_ENGINE = EnvParse.envStringOptional('DB_ENGINE');
export const DB_STORAGE = EnvParse.envStringOptional('DB_STORAGE');
export const DATA_PATH = EnvParse.envStringOptional('DATA_PATH');
export const DB_USER = EnvParse.envStringOptional('DB_USER');
export const DB_PASSWORD = EnvParse.envStringOptional('DB_PASSWORD');
export const DB_HOST = EnvParse.envStringOptional('DB_HOST');
export const DB_NAME = EnvParse.envStringOptional('DB_NAME');
export const DB_PORT = EnvParse.envStringOptional('DB_PORT');
export const DB_CONN_MAX_RETRY = EnvParse.envStringOptional('DB_CONN_MAX_RETRY');
export const DB_PASSWORD_FILE = EnvParse.envStringOptional('DB_PASSWORD_FILE');
export const DB_SSL_CA = EnvParse.envStringOptional('DB_SSL_CA');
export const DB_CLUSTER = EnvParse.envStringOptional('DB_CLUSTER');
export const DB_CONNECTION_LIMIT = EnvParse.envStringOptional('DB_CONNECTION_LIMIT');
export const DB_QUEUE_LIMIT = EnvParse.envStringOptional('DB_QUEUE_LIMIT');
export const DB_NOPOOL = EnvParse.envBool('DB_NOPOOL', false);

// Cache
export const CACHE_ENABLED = EnvParse.envStringOptional('CACHE_ENABLED');
export const CACHE_URI = EnvParse.envStringOptional('CACHE_URI');
export const CACHE_OPTIONS = EnvParse.envStringOptional('CACHE_OPTIONS');
export const REDIS_MAX_CONNECTION_RETRIES = EnvParse.envStringOptional('REDIS_MAX_CONNECTION_RETRIES');
export const REDIS_CONNECTION_RETRY_INTERVAL = EnvParse.envStringOptional('REDIS_CONNECTION_RETRY_INTERVAL');

// Remote logging
export const LOG_AUTH_KEYS_URL = EnvParse.envStringOptional('LOG_AUTH_KEYS_URL');
export const LOG_AUTH_KEYS_TOKEN = EnvParse.envStringOptional('LOG_AUTH_KEYS_TOKEN');
export const LOG_AUDIT_CONSOLE = EnvParse.envBool('LOG_AUDIT_CONSOLE', false);
export const LOG_AUDIT_URL = EnvParse.envStringOptional('LOG_AUDIT_URL');
export const LOG_AUDIT_TOKEN = EnvParse.envStringOptional('LOG_AUDIT_TOKEN');
