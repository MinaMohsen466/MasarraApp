/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { setSecureToken } from './secureStorage';
import { API_BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  config: {
    input: RequestInfo | URL;
    init: RequestInit | undefined;
  };
}> = [];

// Callback interfaces to update state in AuthContext
type OnTokenRefreshed = (newToken: string, user: any) => void;
type OnLogoutRequired = () => void;

let onTokenRefreshedCallback: OnTokenRefreshed | null = null;
let onLogoutRequiredCallback: OnLogoutRequired | null = null;

export const registerAuthCallbacks = (
  onTokenRefreshed: OnTokenRefreshed,
  onLogoutRequired: OnLogoutRequired,
) => {
  onTokenRefreshedCallback = onTokenRefreshed;
  onLogoutRequiredCallback = onLogoutRequired;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      // Update Authorization header with the new token
      const headers = new Headers(prom.config.init?.headers || {});
      headers.set('Authorization', `Bearer ${token}`);
      if (prom.config.init) {
        prom.config.init.headers = headers;
      }
      globalThis
        .fetch(prom.config.input as any, prom.config.init)
        .then(res => prom.resolve(res))
        .catch(err => prom.reject(err));
    }
  });
  failedQueue = [];
};

export const initApiInterceptor = () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (
    input: any,
    init?: RequestInit,
  ): Promise<Response> => {
    // 1. Convert input to string to check URL
    const urlString =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as any).url || '';

    // Only intercept requests going to our backend API
    const isApiRequest = urlString.startsWith(API_BASE_URL);
    const isRefreshRequest = urlString.includes('/auth/refresh');
    const isLoginRequest = urlString.includes('/auth/login');
    const isSignupRequest = urlString.includes('/auth/signup');

    if (
      !isApiRequest ||
      isRefreshRequest ||
      isLoginRequest ||
      isSignupRequest
    ) {
      return originalFetch(input, init);
    }

    try {
      const response = await originalFetch(input, init);

      // If unauthorized (401), attempt to refresh token
      if (response.status === 401) {
        console.log(
          '🔄 API Interceptor: Received 401 Unauthorized for:',
          urlString,
        );

        if (isRefreshing) {
          console.log(
            '⏳ API Interceptor: Token refresh already in progress. Queueing request...',
          );
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve,
              reject,
              config: { input, init },
            });
          });
        }

        isRefreshing = true;
        console.log('🔑 API Interceptor: Initiating silent token refresh...');

        try {
          const refreshResponse = await originalFetch(
            `${API_BASE_URL}/auth/refresh`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include httpOnly refresh cookie
            },
          );

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newAccessToken = refreshData.token;
            const userData = refreshData.user;

            console.log('✅ API Interceptor: Token refreshed successfully!');

            // Save new token securely
            await setSecureToken(newAccessToken);
            if (userData) {
              await AsyncStorage.setItem('userData', JSON.stringify(userData));
            }

            // Notify AuthContext to update state
            if (onTokenRefreshedCallback) {
              onTokenRefreshedCallback(newAccessToken, userData);
            }

            isRefreshing = false;
            processQueue(null, newAccessToken);

            // Retry the original request with the new token
            const headers = new Headers(init?.headers || {});
            headers.set('Authorization', `Bearer ${newAccessToken}`);
            const updatedInit = {
              ...init,
              headers,
            };

            return originalFetch(input, updatedInit);
          } else {
            // Refresh response was not OK (refresh token expired)
            console.log(
              '❌ API Interceptor: Refresh token is invalid/expired. Forcing logout...',
            );
            isRefreshing = false;
            processQueue(new Error('Session expired'));

            // Trigger logout in app
            if (onLogoutRequiredCallback) {
              onLogoutRequiredCallback();
            }

            return response; // Return original 401 response
          }
        } catch (refreshError) {
          console.error(
            '❌ API Interceptor: Network error during token refresh:',
            refreshError,
          );
          isRefreshing = false;
          processQueue(refreshError);
          return response;
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
};
