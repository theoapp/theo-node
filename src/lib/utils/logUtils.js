// Copyright 2019 AuthKeys srl
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

let logger;

const defaultLogger = function(type, date, msg) {
  console.log('[ %s ][ %s ] %s', type, date, msg);
};

export const initLogger = function(level = false, logfn = undefined) {
  if (typeof level === 'function') {
    logfn = level;
    level = false;
  }
  if (!logfn) {
    logger = defaultLogger;
  } else {
    logger = logfn;
  }
  const LOG_LEVEL_D = level || process.env.LOG_LEVEL || 'INFO';
  switch (LOG_LEVEL_D.toUpperCase()) {
    case DEBUG:
      LOG_LEVEL = LEVELS.DEBUG + LEVELS.INFO + LEVELS.WARN + LEVELS.ERROR;
      break;
    case INFO:
      LOG_LEVEL = LEVELS.INFO + LEVELS.WARN + LEVELS.ERROR;
      break;
    case WARN:
      LOG_LEVEL = LEVELS.WARN + LEVELS.ERROR;
      break;
    case ERROR:
      LOG_LEVEL = LEVELS.ERROR;
      break;
  }
};

export const common_log = function(type, message, args) {
  if (LEVELS[type] > LOG_LEVEL) {
    return;
  }
  const msg = util.format.apply(null, [message, ...args]);
  if (!logger) {
    logger = defaultLogger;
  }
  logger(type + (type.length < ERROR.length ? ' ' : ''), new Date().toISOString(), msg);
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
