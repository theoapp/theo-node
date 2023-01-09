import { AsyncLocalStorage } from 'async_hooks';

const useInstances = process.env.MULTI_INSTANCES === '1';

const asyncLocalStorage = new AsyncLocalStorage();

export const DEFAULT_INSTANCE_NAME = 'theo';
export function getAsyncLocalStorage() {
  return asyncLocalStorage;
}

export function isMultiInstances() {
  return useInstances;
}

export function getInstance() {
  if (useInstances) {
    const store = asyncLocalStorage.getStore();
    if (store && store.instance) {
      return store.instance;
    }
  }
  return DEFAULT_INSTANCE_NAME;
}
