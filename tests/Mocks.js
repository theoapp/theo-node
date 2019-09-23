export const mockDateNow = function() {
  // mock now = 1462361249717ms = 4th May 2016 11:27:29,717
  return 1462361249717;
};

export const mockDateToISOString = function() {
  return '2016-05-04T11:27:29.717Z';
};

export const uuidMock = function() {
  return 'a0812c69-07c1-46ea-95b8-3027698b6f30';
};

class RedisClientMock {
  redisManager;

  constructor(redisManager) {
    this.redisManager = redisManager;
  }

  on(event, cb) {
    if (event === 'message') {
      // eslint-disable-next-line standard/no-callback-literal
      return cb('test_config_messages', 'flush_tokens');
    }
  }

  subscribe(channel) {
    this.redisManager._subscribe(channel);
  }

  publish(channel, message) {
    this.redisManager._publish(channel, message);
  }
}

export class RedisManagerMock {
  channels = {};

  subscribers = {};

  constructor(fail = false) {
    this.fail = fail;
  }

  _publish(channel, message) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }
    this.channels[channel].push(message);
    return true;
  }

  getChannelMessage(channel) {
    return this.channels[channel][0];
  }

  _subscribe(channel) {
    if (!this.subscribers[channel]) {
      this.subscribers[channel] = [];
    }
    this.subscribers[channel].push(true);
    return true;
  }

  open(cb) {
    if (cb) {
      if (this.fail) {
        return cb(new Error('Fake connection error'));
      }
      return cb(null, new RedisClientMock(this));
    }
    return Promise.resolve(new RedisClientMock(this));
  }

  getSubscribers(channel) {
    return this.subscribers[channel].length;
  }
}
