/**
 * Feature Flag Configuration
 * Controls which features and Mini Apps are enabled
 */

export interface FeatureFlags {
  // Mini App Feature Flags
  MINI_APP_USER_MANAGEMENT: boolean;
  MINI_APP_A: boolean;
  MINI_APP_B: boolean;

  // App Features
  DARK_MODE: boolean;
  ANALYTICS: boolean;
  PUSH_NOTIFICATIONS: boolean;
  
  // Experimental Features
  BETA_FEATURES: boolean;
}

/**
 * Default feature flag values
 * These can be overridden by remote config in production
 */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Mini Apps
  MINI_APP_USER_MANAGEMENT: true,
  MINI_APP_A: true,
  MINI_APP_B: true,

  // App Features
  DARK_MODE: true,
  ANALYTICS: true,
  PUSH_NOTIFICATIONS: false,
  
  // Experimental
  BETA_FEATURES: false,
};

/**
 * Map Mini App names to their feature flag keys
 */
export const MINI_APP_FEATURE_FLAGS: Record<string, keyof FeatureFlags> = {
  UserManagementApp: 'MINI_APP_USER_MANAGEMENT',
  miniAppA: 'MINI_APP_A',
  miniAppB: 'MINI_APP_B',
};
