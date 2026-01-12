/**
 * Remote Mini App Configuration
 * Maps Mini App names to their CDN endpoints for dev and production
 */

export interface RemoteConfig {
  dev: string;
  prod: string;
  requiredPermissions?: string[];
  requiredRole?: 'admin' | 'user' | 'guest';
  featureFlag?: string;
}

export interface RemotesConfig {
  [key: string]: RemoteConfig;
}

export const REMOTES: RemotesConfig = {
  miniAppA: {
    dev: 'http://localhost:9001/miniAppA.container.bundle',
    prod: 'https://cdn.superapp.com/mini-apps/app-a/latest/miniAppA.container.bundle',
    requiredPermissions: ['miniapp.access.basic'],
    featureFlag: 'MINI_APP_A',
  },
  miniAppB: {
    dev: 'http://localhost:9002/miniAppB.container.bundle',
    prod: 'https://cdn.superapp.com/mini-apps/app-b/latest/miniAppB.container.bundle',
    requiredPermissions: ['miniapp.access.basic'],
    featureFlag: 'MINI_APP_B',
  },
  UserManagementApp: {
    dev: 'http://127.0.0.1:8082/userManagement.container.bundle',
    prod: 'https://malcohelper.github.io/super-app-bundles/UserManagementApp/ios/userManagement.container.bundle',
    requiredPermissions: ['user.read'],
    featureFlag: 'MINI_APP_USER_MANAGEMENT',
  },
};

export const getMiniAppUrl = (appName: string, isDev: boolean): string => {
  const config = REMOTES[appName];
  if (!config) {
    throw new Error(`Mini App "${appName}" not found in remotes configuration`);
  }
  return isDev ? config.dev : config.prod;
};
