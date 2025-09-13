const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_EXPIRES: 'session_expires',
  LAST_ACTIVITY: 'last_activity',
} as const;

export const storage = {
  // Auth related
  getAuthToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setAuthToken: (token: string): void => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  removeAuthToken: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // User data
  getUserData: <T = any>(): T | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setUserData: <T = any>(data: T): void => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  },

  removeUserData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Session management
  getSessionExpires: (): number | null => {
    const expires = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRES);
    return expires ? parseInt(expires, 10) : null;
  },

  setSessionExpires: (timestamp: number): void => {
    localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRES, timestamp.toString());
  },

  removeSessionExpires: (): void => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES);
  },

  // Activity tracking
  getLastActivity: (): number | null => {
    const activity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    return activity ? parseInt(activity, 10) : null;
  },

  setLastActivity: (timestamp: number): void => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, timestamp.toString());
    // event 4 cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS.LAST_ACTIVITY,
      newValue: timestamp.toString(),
      url: window.location.href,
      storageArea: localStorage,
    }));
  },

  removeLastActivity: (): void => {
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  },

  clearAuthData: (): void => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.SESSION_EXPIRES);
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
  },

  // Check if session is valid
  isSessionValid: (): boolean => {
    const token = storage.getAuthToken();
    const expires = storage.getSessionExpires();

    if (!token || !expires) return false;

    return Date.now() < expires;
  },
};