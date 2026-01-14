/**
 * Auth Module Public API
 * 
 * Exports for HostApp and Mini Apps
 */

// Context
export { AuthProvider, useAuth } from './AuthContext';
export type { UserInfo, AuthContextType } from './AuthContext';

// Native Module (for advanced usage)
export { NativeAuthModule, onAuthStateChanged } from './NativeAuthModule';
export type { AuthStateData } from './NativeAuthModule';

// Error handling
export {
  AuthErrorCode,
  createAuthError,
  isAuthError,
  getAuthErrorMessage,
} from './errors';
export type { AuthError } from './errors';

// Token utilities
export { isTokenExpired } from './tokenUtils';

// User API
export * as userApi from './userApi';
export type { UserProfile, UpdateProfileData } from './userApi';
