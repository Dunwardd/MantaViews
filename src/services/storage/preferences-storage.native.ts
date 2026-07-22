import 'expo-sqlite/localStorage/install';

export const preferencesStorage = {
  getItem(key: string) {
    return globalThis.localStorage?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    globalThis.localStorage?.setItem(key, value);
  },
};
