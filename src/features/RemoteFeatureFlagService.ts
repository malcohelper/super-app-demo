import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FEATURE_FLAGS, FeatureFlags } from '../features/featureFlags.config';

/**
 * Remote Feature Flag Service
 * Fetches feature flags from remote config service with fallback to local config
 */

const STORAGE_KEY = '@super_app_remote_flags';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface RemoteFlagResponse {
  flags: Partial<FeatureFlags>;
  timestamp: number;
}

export class RemoteFeatureFlagService {
  private remoteEndpoint: string;
  private cachedFlags: Partial<FeatureFlags> | null = null;
  private lastFetchTime: number = 0;

  constructor(remoteEndpoint: string = 'https://api.superapp.com/feature-flags') {
    this.remoteEndpoint = remoteEndpoint;
  }

  /**
   * Fetch feature flags from remote config
   */
  async fetchRemoteFlags(): Promise<FeatureFlags> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cachedFlags && (now - this.lastFetchTime) < CACHE_DURATION_MS) {
        console.log('[RemoteFeatureFlags] Using cached flags');
        return { ...DEFAULT_FEATURE_FLAGS, ...this.cachedFlags };
      }

      // Try to load from AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: RemoteFlagResponse = JSON.parse(stored);
        if ((now - parsed.timestamp) < CACHE_DURATION_MS) {
          this.cachedFlags = parsed.flags;
          this.lastFetchTime = parsed.timestamp;
          console.log('[RemoteFeatureFlags] Using stored flags');
          return { ...DEFAULT_FEATURE_FLAGS, ...parsed.flags };
        }
      }

      // Fetch from remote
      console.log('[RemoteFeatureFlags] Fetching from remote...');
      const response = await fetch(this.remoteEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const remoteFlags: Partial<FeatureFlags> = await response.json();

      // Cache the flags
      this.cachedFlags = remoteFlags;
      this.lastFetchTime = now;

      // Store in AsyncStorage
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          flags: remoteFlags,
          timestamp: now,
        })
      );

      console.log('[RemoteFeatureFlags] Fetched and cached remote flags');
      return { ...DEFAULT_FEATURE_FLAGS, ...remoteFlags };
    } catch (error) {
      console.error('[RemoteFeatureFlags] Error fetching remote flags:', error);
      console.log('[RemoteFeatureFlags] Falling back to default flags');
      
      // Fallback to default flags
      return DEFAULT_FEATURE_FLAGS;
    }
  }

  /**
   * Clear cached flags
   */
  async clearCache(): Promise<void> {
    this.cachedFlags = null;
    this.lastFetchTime = 0;
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log('[RemoteFeatureFlags] Cache cleared');
  }

  /**
   * Manually refresh flags
   */
  async refresh(): Promise<FeatureFlags> {
    await this.clearCache();
    return this.fetchRemoteFlags();
  }
}

export const remoteFeatureFlagService = new RemoteFeatureFlagService();
