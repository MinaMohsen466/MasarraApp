/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { initSecureStorage } from './src/utils/secureStorage';
import Geolocation from '@react-native-community/geolocation';

// Initialize secure keychain proxy for AsyncStorage userToken
initSecureStorage();

// Configure Geolocation - automatically request auth on iOS
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
});

AppRegistry.registerComponent(appName, () => App);


