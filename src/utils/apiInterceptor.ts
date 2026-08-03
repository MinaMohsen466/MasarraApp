/* eslint-disable no-console, @typescript-eslint/no-explicit-any */
import { setSecureToken } from './secureStorage';
import { API_BASE_URL } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The pre-patch fetch, captured when the interceptor is installed. Retries must
// go through this rather than globalThis.fetch: a retry that 401s again would
// otherwise re-enter the interceptor and kick off a second refresh cycle.
// Doubles as the "already installed" flag — installing twice would capture the
// patched fetch as the original and recurse forever.
let originalFetch: typeof globalThis.fetch | null = null;

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
      return;
    }
    if (!token) return;

    // Build a fresh init every time. Guarding this on `init` being defined
    // dropped the refreshed Authorization header whenever the caller used the
    // bare `fetch(url)` form, so the retry went out unauthenticated and 401'd
    // straight back.
    const headers = new Headers(prom.config.init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    const retryInit: RequestInit = { ...(prom.config.init || {}), headers };

    const doFetch = originalFetch ?? globalThis.fetch;
    doFetch(prom.config.input as any, retryInit)
      .then(res => prom.resolve(res))
      .catch(err => prom.reject(err));
  });
  failedQueue = [];
};

export const initApiInterceptor = () => {
  if (originalFetch) return;
  originalFetch = globalThis.fetch;
  const baseFetch = originalFetch;

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

    if (!isApiRequest || isRefreshRequest || isLoginRequest || isSignupRequest) {
      return baseFetch(input, init);
    }

    const response = await baseFetch(input, init);

    // Not a 401 — nothing for the interceptor to do.
    if (response.status !== 401) {
      return response;
    }

    if (__DEV__)
      console.log('🔄 API Interceptor: 401 for:', urlString.split('?')[0]);

    if (isRefreshing) {
      if (__DEV__)
        console.log('⏳ API Interceptor: refresh in progress, queueing...');
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: { input, init } });
      });
    }

    isRefreshing = true;
    if (__DEV__)
      console.log('🔑 API Interceptor: initiating silent token refresh...');

    try {
      const refreshResponse = await baseFetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include httpOnly refresh cookie
      });

      if (!refreshResponse.ok) {
        // Refresh token expired or invalid — drop the session.
        if (__DEV__)
          console.log('❌ API Interceptor: refresh rejected, forcing logout...');
        isRefreshing = false;
        processQueue(new Error('Session expired'));

        if (onLogoutRequiredCallback) {
          onLogoutRequiredCallback();
        }

        return response; // Return original 401 response
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.token;
      const userData = refreshData.user;

      if (__DEV__)
        console.log('✅ API Interceptor: token refreshed successfully!');

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
      return baseFetch(input, { ...init, headers });
    } catch (refreshError) {
      console.error(
        '❌ API Interceptor: network error during token refresh:',
        refreshError,
      );
      isRefreshing = false;
      processQueue(refreshError);
      return response;
    }
  };
};
