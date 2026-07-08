/**
 * API Service Facade (Entry Point)
 * Re-exports all sub-API modules to keep full backward compatibility
 * with all screens and context providers without changing their imports.
 */

export * from './apiUtils';
export * from './authApi';
export * from './addressApi';
export * from './bookingApi';
export * from './notificationApi';
export * from './serviceApi';
