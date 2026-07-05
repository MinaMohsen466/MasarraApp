import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const TOKEN_KEY = 'userToken';
const SERVICE_NAME = 'com.masarra.usertoken';

// Cache references to the original AsyncStorage methods to prevent infinite recursion loops
const originalGetItem = AsyncStorage.getItem.bind(AsyncStorage);
const originalSetItem = AsyncStorage.setItem.bind(AsyncStorage);
const originalRemoveItem = AsyncStorage.removeItem.bind(AsyncStorage);

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
  } catch (error) {
    console.warn('Keychain secure storage failed, falling back to AsyncStorage:', error);
    try {
      await originalSetItem(TOKEN_KEY, token);
      return true;
    } catch (fsError) {
      console.error('AsyncStorage fallback failed:', fsError);
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
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.warn('Reading from Keychain failed, checking AsyncStorage fallback:', errorMsg);
    
    // Self-healing: if the Android Keystore key is permanently invalidated, reset it to allow clean regeneration
    if (errorMsg.includes('permanently invalidated') || errorMsg.includes('Key permanently invalidated')) {
      try {
        await Keychain.resetGenericPassword({ service: SERVICE_NAME });
        console.log('🔒 Android Keystore healed: Invalidated key has been reset.');
      } catch (resetErr) {}
    }
  }

  // Fallback check
  try {
    return await originalGetItem(TOKEN_KEY);
  } catch (fsError) {
    console.error('AsyncStorage read failed:', fsError);
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
  } catch (error) {
    console.error('Error resetting secure token:', error);
    try {
      await originalRemoveItem(TOKEN_KEY);
      return true;
    } catch (fsError) {
      return false;
    }
  }
};

/**
 * Globally intercept AsyncStorage methods to route 'userToken' transparently to Keychain.
 * This guarantees backwards compatibility with all files reading/writing 'userToken' directly
 * without requiring refactoring across dozens of source files.
 */
export const initSecureStorage = () => {
  AsyncStorage.getItem = async (key: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      return await getSecureToken();
    }
    return await originalGetItem(key, ...args);
  };

  AsyncStorage.setItem = async (key: string, value: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      const success = await setSecureToken(value);
      return success ? undefined : undefined;
    }
    return await originalSetItem(key, value, ...args);
  };

  AsyncStorage.removeItem = async (key: string, ...args: any[]) => {
    if (key === TOKEN_KEY) {
      const success = await removeSecureToken();
      return success ? undefined : undefined;
    }
    return await originalRemoveItem(key, ...args);
  };

  console.log('🔒 Secure Storage transparent proxy initialized.');
};
