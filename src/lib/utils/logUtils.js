import util from 'util';

export const DEBUG = 'DEBUG';
export const INFO = 'INFO';
export const WARN = 'WARN';
export const ERROR = 'ERROR';

const LEVELS = {
  DEBUG: 8,
  INFO: 4,
  WARN: 2,
  ERROR: 1
};

let LOG_LEVEL;

export const initLogger = function() {
  const LOG_LEVEL_D = process.env.LOG_LEVEL || 'INFO';
  switch (LOG_LEVEL_D) {
    case DEBUG:
      LOG_LEVEL = LEVELS.DEBUG + LEVELS.INFO + LEVELS.WARN + LEVELS.ERROR;
      break;
    case INFO:
      LOG_LEVEL = 7;
      break;
    case WARN:
      LOG_LEVEL = 3;
      break;
    case ERROR:
      LOG_LEVEL = 1;
      break;
    default:
      LOG_LEVEL = 1;
      break;
  }
};

export const common_log = function(type, message, args) {
  if (!(LEVELS[type] & LOG_LEVEL)) {
    return;
  }
  const msg = util.format.apply(null, [message, ...args]);
  let logger;
  switch (type) {
    case DEBUG:
      logger = console.log;
      break;
    case INFO:
      logger = console.log;
      break;
    case WARN:
      logger = console.error;
      break;
    case ERROR:
      logger = console.error;
      break;
    default:
      logger = console.log;
  }
  logger('[ %s ][ %s ] %s', type + (type.length < ERROR.length ? ' ' : ''), new Date().toISOString(), msg);
};

export const common_debug = function(message, ...args) {
  common_log(DEBUG, message, args);
};

export const common_info = function(message, ...args) {
  common_log(INFO, message, args);
};

export const common_warn = function(message, ...args) {
  common_log(WARN, message, args);
};

export const common_error = function(message, ...args) {
  common_log(ERROR, message, args);
};
