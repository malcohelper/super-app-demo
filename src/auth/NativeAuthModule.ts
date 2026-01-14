import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { UserInfo } from './AuthContext';

/**
 * Native Auth Module Interface
 * 
 * TypeScript interface for the native AuthModule
 */
interface NativeAuthModuleType {
  // Authentication methods
  login(email: string, password: string): Promise<UserInfo>;
  signup(email: string, password: string, displayName?: string): Promise<UserInfo>;
  logout(): Promise<void>;
  
  // Storage methods
  saveAuthState(token: string, userInfo: UserInfo): Promise<void>;
  loadAuthState(): Promise<AuthStateData | null>;
  clearAuthState(): Promise<void>;
  
  // Read-only methods for Mini Apps
  getAuthState(): Promise<AuthStateData>;
  hasToken(): Promise<boolean>;
  getTokenTimestamp(): Promise<number | null>;
}

export interface AuthStateData {
  token?: string;
  userInfo?: UserInfo;
  timestamp?: number;
  isAuthenticated: boolean;
}

// Get native module
const { AuthModule } = NativeModules;

if (!AuthModule) {
  console.warn('[NativeAuthModule] AuthModule not found. Auth features may not work correctly.');
}

// Create event emitter for auth state changes
const authEventEmitter = AuthModule ? new NativeEventEmitter(AuthModule) : null;

/**
 * Native Auth Module
 * 
 * Provides TypeScript-safe interface to native authentication module
 */
export const NativeAuthModule: NativeAuthModuleType = {
  /**
   * Login with email and password
   * Calls backend API and saves to Keychain automatically
   */
  async login(email: string, password: string): Promise<UserInfo> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.login(email, password);
  },

  /**
   * Signup with email, password, and optional display name
   * Calls backend API and saves to Keychain automatically
   */
  async signup(email: string, password: string, displayName?: string): Promise<UserInfo> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.signup(email, password, displayName || null);
  },

  /**
   * Logout - clear all auth data from Keychain
   */
  async logout(): Promise<void> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.logout();
  },

  /**
   * Save authentication state to Keychain
   */
  async saveAuthState(token: string, userInfo: UserInfo): Promise<void> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.saveAuthState(token, userInfo);
  },

  /**
   * Load authentication state from Keychain
   */
  async loadAuthState(): Promise<AuthStateData | null> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    const result = await AuthModule.loadAuthState();
    return result || null;
  },

  /**
   * Clear authentication state from Keychain
   */
  async clearAuthState(): Promise<void> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.clearAuthState();
  },

  /**
   * Get current authentication state (read-only)
   */
  async getAuthState(): Promise<AuthStateData> {
    if (!AuthModule) {
      throw new Error('AuthModule not available');
    }
    
    return AuthModule.getAuthState();
  },

  /**
   * Check if token exists in Keychain
   */
  async hasToken(): Promise<boolean> {
    if (!AuthModule) {
      return false;
    }
    
    return AuthModule.hasToken();
  },

  /**
   * Get token timestamp for expiration check
   */
  async getTokenTimestamp(): Promise<number | null> {
    if (!AuthModule) {
      return null;
    }
    
    const timestamp = await AuthModule.getTokenTimestamp();
    return timestamp || null;
  },
};

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChanged(
  callback: (authState: AuthStateData) => void
): () => void {
  if (!authEventEmitter) {
    console.warn('[NativeAuthModule] Event emitter not available');
    return () => {};
  }

  const subscription = authEventEmitter.addListener(
    'auth_state_changed',
    callback
  );

  return () => subscription.remove();
}

export default NativeAuthModule;
