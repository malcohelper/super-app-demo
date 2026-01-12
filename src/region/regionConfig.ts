/**
 * Region Configuration
 * Manages region-based access control and feature flags
 */

export type Region = 'global' | 'asia' | 'europe' | 'americas';

export interface RegionConfig {
  id: Region;
  name: string;
  enabledFeatures: string[];
  enabledMiniApps: string[];
  locale: string;
  timezone: string;
}

export const REGION_CONFIGS: Record<Region, RegionConfig> = {
  global: {
    id: 'global',
    name: 'Global',
    enabledFeatures: ['all'],
    enabledMiniApps: ['all'],
    locale: 'en-US',
    timezone: 'UTC',
  },
  asia: {
    id: 'asia',
    name: 'Asia Pacific',
    enabledFeatures: ['MINI_APP_USER_MANAGEMENT', 'MINI_APP_A', 'ANALYTICS'],
    enabledMiniApps: ['UserManagementApp', 'miniAppA'],
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh',
  },
  europe: {
    id: 'europe',
    name: 'Europe',
    enabledFeatures: ['MINI_APP_USER_MANAGEMENT', 'MINI_APP_B', 'DARK_MODE'],
    enabledMiniApps: ['UserManagementApp', 'miniAppB'],
    locale: 'en-GB',
    timezone: 'Europe/London',
  },
  americas: {
    id: 'americas',
    name: 'Americas',
    enabledFeatures: ['MINI_APP_A', 'MINI_APP_B', 'BETA_FEATURES'],
    enabledMiniApps: ['miniAppA', 'miniAppB'],
    locale: 'en-US',
    timezone: 'America/New_York',
  },
};

/**
 * Detect user's region based on timezone or IP (simplified for demo)
 */
export const detectRegion = (): Region => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    if (timezone.includes('Asia')) return 'asia';
    if (timezone.includes('Europe')) return 'europe';
    if (timezone.includes('America')) return 'americas';
    
    return 'global';
  } catch (error) {
    console.error('[RegionConfig] Error detecting region:', error);
    return 'global';
  }
};

/**
 * Check if a feature is enabled in a region
 */
export const isFeatureEnabledInRegion = (
  region: Region,
  feature: string
): boolean => {
  const config = REGION_CONFIGS[region];
  if (!config) return false;
  
  if (config.enabledFeatures.includes('all')) return true;
  return config.enabledFeatures.includes(feature);
};

/**
 * Check if a Mini App is enabled in a region
 */
export const isMiniAppEnabledInRegion = (
  region: Region,
  miniAppName: string
): boolean => {
  const config = REGION_CONFIGS[region];
  if (!config) return false;
  
  if (config.enabledMiniApps.includes('all')) return true;
  return config.enabledMiniApps.includes(miniAppName);
};
