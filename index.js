/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initSecureStorage } from './src/utils/secureStorage';

// Initialize secure keychain proxy for AsyncStorage userToken
initSecureStorage();

AppRegistry.registerComponent(appName, () => App);

