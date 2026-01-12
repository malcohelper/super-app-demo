import type { NavigationHelpers } from './types';

/**
 * Navigation Helpers for Mini Apps
 * Allows Mini Apps to navigate without direct access to navigation
 */

let navigationRef: any = null;

export const setNavigationRef = (ref: any) => {
  navigationRef = ref;
};

export const navigation: NavigationHelpers = {
  goBack: () => {
    if (navigationRef?.canGoBack()) {
      navigationRef.goBack();
    } else {
      console.warn('[Navigation] Cannot go back');
    }
  },

  navigateToMiniApp: (appName: string, params?: any) => {
    console.log(`[Navigation] Navigate to Mini App: ${appName}`, params);
    navigationRef?.navigate('MiniApp', { appName, ...params });
  },

  navigateToHost: (screen: string, params?: any) => {
    console.log(`[Navigation] Navigate to Host screen: ${screen}`, params);
    navigationRef?.navigate(screen, params);
  },
};
