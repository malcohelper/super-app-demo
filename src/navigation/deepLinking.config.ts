/**
 * Deep Linking Configuration
 * Defines URL schemes and navigation paths for the Super App
 */

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/**
 * Deep linking configuration for React Navigation
 */
export const linkingConfig: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'superapp://',
    'https://superapp.com',
    'https://*.superapp.com',
  ],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      
      // Main app screens
      Home: 'home',
      MiniApp: {
        path: 'mini-app/:appName',
        parse: {
          appName: (appName: string) => appName,
        },
      },
    },
  },
};

/**
 * Handle deep link when app is not authenticated
 * Store the deep link and redirect after login
 */
export class DeepLinkHandler {
  private pendingDeepLink: string | null = null;

  setPendingDeepLink(url: string) {
    this.pendingDeepLink = url;
  }

  getPendingDeepLink(): string | null {
    return this.pendingDeepLink;
  }

  clearPendingDeepLink() {
    this.pendingDeepLink = null;
  }

  hasPendingDeepLink(): boolean {
    return this.pendingDeepLink !== null;
  }
}

export const deepLinkHandler = new DeepLinkHandler();
