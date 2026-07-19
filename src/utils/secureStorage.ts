import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'userToken';
const SERVICE_NAME = 'com.masarra.usertoken';

const USER_DATA_KEY = 'userData';
const USER_DATA_SERVICE = 'com.masarra.userdata';

// Cache references to the original AsyncStorage methods to prevent infinite recursion loops
const originalGetItem = AsyncStorage.getItem.bind(AsyncStorage);
const originalSetItem = AsyncStorage.setItem.bind(AsyncStorage);
const originalRemoveItem = AsyncStorage.removeItem.bind(AsyncStorage);

/**
 * Save user data securely using Keychain
 */
export const setSecureUserData = async (
  userDataJson: string,
): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword('userData', userDataJson, {
      service: USER_DATA_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await originalRemoveItem(USER_DATA_KEY);
    return true;
  } catch {
    // Keychain secure user data storage failed, falling back to AsyncStorage
    try {
      await originalSetItem(USER_DATA_KEY, userDataJson);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Retrieve user data securely
 */
export const getSecureUserData = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: USER_DATA_SERVICE,
    });
    if (credentials) {
      return credentials.password;
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (
      errorMsg.includes('permanently invalidated') ||
      errorMsg.includes('Key permanently invalidated')
    ) {
      try {
        await Keychain.resetGenericPassword({ service: USER_DATA_SERVICE });
      } catch {}
    }
  }

  try {
    return await originalGetItem(USER_DATA_KEY);
  } catch {
    return null;
  }
};

/**
 * Remove user data securely
 */
export const removeSecureUserData = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({
      service: USER_DATA_SERVICE,
    });
    await originalRemoveItem(USER_DATA_KEY);
    return true;
  } catch {
    try {
      await originalRemoveItem(USER_DATA_KEY);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Save token securely using Keychain/Keystore
 * Falls back to AsyncStorage if Keychain fails
 */
export const setSecureToken = async (token: string): Promise<boolean> => {
  try {
    await Keychain.setGenericPassword('userToken', token, {
      service: SERVICE_NAME,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    // Clean up standard plain-text AsyncStorage to prevent leakage
    await originalRemoveItem(TOKEN_KEY);
    return true;
  } catch {
    // Keychain secure storage failed, falling back to AsyncStorage
    try {
      await originalSetItem(TOKEN_KEY, token);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Retrieve token securely
 * Attempts Keychain first, falls back to AsyncStorage
 */
export const getSecureToken = async (): Promise<string | null> => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: SERVICE_NAME,
    });
    if (credentials) {
      return credentials.password;
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Self-healing: if the Android Keystore key is permanently invalidated, reset it to allow clean regeneration
    if (
      errorMsg.includes('permanently invalidated') ||
      errorMsg.includes('Key permanently invalidated')
    ) {
      try {
        await Keychain.resetGenericPassword({ service: SERVICE_NAME });
      } catch {}
    }
  }

  // Fallback check
  try {
    return await originalGetItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Remove token securely from both Keychain and AsyncStorage
 */
export const removeSecureToken = async (): Promise<boolean> => {
  try {
    await Keychain.resetGenericPassword({
      service: SERVICE_NAME,
    });
    await originalRemoveItem(TOKEN_KEY);
    return true;
  } catch {
    try {
      await originalRemoveItem(TOKEN_KEY);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Globally intercept AsyncStorage methods to route 'userToken' and 'userData' transparently to Keychain.
 * This guarantees backwards compatibility with all files reading/writing 'userToken' directly
 * without requiring refactoring across dozens of source files.
 */
export const initSecureStorage = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AsyncStorage.getItem = async (key: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      return await getSecureToken();
    }
    if (key === USER_DATA_KEY) {
      return await getSecureUserData();
    }
    return await originalGetItem(key, ...args);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AsyncStorage.setItem = async (key: string, value: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      const success = await setSecureToken(value);
      return success ? undefined : undefined;
    }
    if (key === USER_DATA_KEY) {
      const success = await setSecureUserData(value);
      return success ? undefined : undefined;
    }
    return await originalSetItem(key, value, ...args);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AsyncStorage.removeItem = async (key: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      const success = await removeSecureToken();
      return success ? undefined : undefined;
    }
    if (key === USER_DATA_KEY) {
      const success = await removeSecureUserData();
      return success ? undefined : undefined;
    }
    return await originalRemoveItem(key, ...args);
  };
};
