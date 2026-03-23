export enum StorageKeys {
  RESOLUTION = 'mymong.resolution',
  VSYNC = 'mymong.vsync',
}

// TODO
export const Storage = {
  get<T>(key: StorageKeys): T | null {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  set(key: StorageKeys, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key: StorageKeys): void {
    localStorage.removeItem(key);
  },
};
