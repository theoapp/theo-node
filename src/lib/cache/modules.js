import Memcached from './memcached';
import Redis from './redis';

const modules = {
  memcached: Memcached,
  redis: Redis
};

export const getCacheModule = name => {
  return modules[name];
};
