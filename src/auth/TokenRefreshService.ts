import AsyncStorage from "@react-native-async-storage/async-storage";
import { isTokenExpired } from "./tokenUtils";

/**
 * Token Refresh Service
 * Handles automatic token refresh before expiration
 *
 * NOTE: This service needs to be updated to work with backend API
 * Currently using dummy implementation
 */

const STORAGE_KEYS = {
  TOKEN: "@super_app_token",
  REFRESH_TOKEN: "@super_app_refresh_token",
  USER_INFO: "@super_app_user_info",
};

// Refresh token 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private onTokenRefreshed?: (token: string) => void;
  private onRefreshFailed?: () => void;

  /**
   * Start monitoring token and auto-refresh
   */
  start(
    onTokenRefreshed: (token: string) => void,
    onRefreshFailed: () => void
  ) {
    this.onTokenRefreshed = onTokenRefreshed;
    this.onRefreshFailed = onRefreshFailed;
    this.scheduleNextRefresh();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Schedule next token refresh check
   */
  private async scheduleNextRefresh() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return;

      const payload = decodeDummyToken(token);
      if (!payload) return;

      const timeUntilExpiry = payload.exp - Date.now();
      const timeUntilRefresh = timeUntilExpiry - REFRESH_THRESHOLD_MS;

      if (timeUntilRefresh > 0) {
        // Schedule refresh before expiration
        this.refreshTimer = setTimeout(() => {
          this.refreshToken();
        }, timeUntilRefresh);
      } else {
        // Token already expired or about to expire, refresh now
        this.refreshToken();
      }
    } catch (error) {
      console.error("[TokenRefreshService] Error scheduling refresh:", error);
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshToken() {
    try {
      console.log("[TokenRefreshService] Refreshing token...");

      const [token, userInfoStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
      ]);

      if (!token || !userInfoStr) {
        throw new Error("No token or user info found");
      }

      const payload = decodeDummyToken(token);
      if (!payload) {
        throw new Error("Invalid token");
      }

      const userInfo = JSON.parse(userInfoStr);

      // Generate new token with same user data
      const newToken = generateDummyToken(
        payload.sub,
        payload.email,
        payload.name,
        payload.role,
        payload.permissions
      );

      // Save new token
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, newToken);

      console.log("[TokenRefreshService] Token refreshed successfully");

      // Notify callback
      if (this.onTokenRefreshed) {
        this.onTokenRefreshed(newToken);
      }

      // Schedule next refresh
      this.scheduleNextRefresh();
    } catch (error) {
      console.error("[TokenRefreshService] Token refresh failed:", error);

      // Notify failure callback
      if (this.onRefreshFailed) {
        this.onRefreshFailed();
      }
    }
  }

  /**
   * Manually trigger token refresh
   */
  async manualRefresh(): Promise<boolean> {
    try {
      await this.refreshToken();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const tokenRefreshService = new TokenRefreshService();
