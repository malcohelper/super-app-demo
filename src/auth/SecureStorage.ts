import { NativeAuthModule } from './NativeAuthModule';
import type { UserInfo } from './AuthContext';

/**
 * Secure Storage
 * 
 * Direct wrapper around native Keychain storage.
 * No fallback - Keychain only for maximum security.
 */

export const SecureStorage = {
  /**
   * Save authentication token
   */
  async saveToken(token: string): Promise<void> {
    const userInfo = await this.getUserInfo();
    if (userInfo) {
      await NativeAuthModule.saveAuthState(token, userInfo);
    } else {
      throw new Error('Cannot save token without user info');
    }
  },

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    const authState = await NativeAuthModule.loadAuthState();
    return authState?.token || null;
  },

  /**
   * Get token timestamp
   */
  async getTokenTimestamp(): Promise<number | null> {
    return await NativeAuthModule.getTokenTimestamp();
  },

  /**
   * Save user info
   */
  async saveUserInfo(userInfo: UserInfo): Promise<void> {
    const token = await this.getToken();
    if (token) {
      await NativeAuthModule.saveAuthState(token, userInfo);
    } else {
      throw new Error('Cannot save user info without token');
    }
  },

  /**
   * Get user info
   */
  async getUserInfo(): Promise<UserInfo | null> {
    const authState = await NativeAuthModule.loadAuthState();
    return authState?.userInfo || null;
  },

  /**
   * Save complete auth state (token + user info)
   */
  async saveAuthState(token: string, userInfo: UserInfo): Promise<void> {
    await NativeAuthModule.saveAuthState(token, userInfo);
    console.log('[SecureStorage] ✓ Saved to Keychain');
  },

  /**
   * Clear all auth data
   */
  async clear(): Promise<void> {
    await NativeAuthModule.clearAuthState();
    console.log('[SecureStorage] ✓ Cleared Keychain');
  },
};

export default SecureStorage;
