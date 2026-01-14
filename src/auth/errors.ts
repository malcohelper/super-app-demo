/**
 * Auth Error Types
 * 
 * Error codes and types from native auth module
 */

export enum AuthErrorCode {
  // Native errors
  INVALID_URL = 'INVALID_URL',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Module errors
  LOGIN_ERROR = 'LOGIN_ERROR',
  SIGNUP_ERROR = 'SIGNUP_ERROR',
  LOGOUT_ERROR = 'LOGOUT_ERROR',
  
  // Storage errors
  SAVE_ERROR = 'SAVE_ERROR',
  LOAD_ERROR = 'LOAD_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  
  // State errors
  GET_STATE_ERROR = 'GET_STATE_ERROR',
  CHECK_ERROR = 'CHECK_ERROR',
  TIMESTAMP_ERROR = 'TIMESTAMP_ERROR',
}

export interface AuthError extends Error {
  code: AuthErrorCode | string;
  message: string;
  nativeError?: any;
}

/**
 * Create typed auth error
 */
export function createAuthError(
  code: AuthErrorCode | string,
  message: string,
  nativeError?: any
): AuthError {
  const error = new Error(message) as AuthError;
  error.code = code;
  error.nativeError = nativeError;
  return error;
}

/**
 * Check if error is auth error
 */
export function isAuthError(error: any): error is AuthError {
  return error && typeof error.code === 'string';
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error: any): string {
  if (isAuthError(error)) {
    switch (error.code) {
      case AuthErrorCode.INVALID_URL:
        return 'Invalid API configuration';
      case AuthErrorCode.INVALID_RESPONSE:
        return 'Server returned invalid response';
      case AuthErrorCode.API_ERROR:
        return error.message || 'Authentication failed';
      case AuthErrorCode.NETWORK_ERROR:
        return 'Network connection error. Please check your internet.';
      case AuthErrorCode.LOGIN_ERROR:
        return error.message || 'Login failed. Please try again.';
      case AuthErrorCode.SIGNUP_ERROR:
        return error.message || 'Signup failed. Please try again.';
      default:
        return error.message || 'An error occurred';
    }
  }
  
  return error?.message || 'An unexpected error occurred';
}

export default {
  AuthErrorCode,
  createAuthError,
  isAuthError,
  getAuthErrorMessage,
};
