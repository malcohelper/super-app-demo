import { Alert, Platform } from 'react-native';
import type { NativeCapabilities } from './types';

/**
 * Native Bridge for Mini Apps
 * Provides access to native capabilities without direct native module access
 */

export const native: NativeCapabilities = {
  camera: {
    takePicture: async () => {
      // Mock implementation - replace with actual native module
      console.log('[Native] takePicture called');
      Alert.alert('Camera', 'Take picture functionality');
      return 'file://path/to/picture.jpg';
    },
    pickImage: async () => {
      // Mock implementation - replace with actual native module
      console.log('[Native] pickImage called');
      Alert.alert('Camera', 'Pick image functionality');
      return 'file://path/to/image.jpg';
    },
  },

  location: {
    getCurrentPosition: async () => {
      // Mock implementation - replace with actual native module
      console.log('[Native] getCurrentPosition called');
      return {
        lat: 10.762622,
        lng: 106.660172,
      };
    },
  },

  storage: {
    getItem: async (key: string) => {
      // Mock implementation - replace with AsyncStorage or MMKV
      console.log(`[Native] getItem: ${key}`);
      return null;
    },
    setItem: async (key: string, value: string) => {
      // Mock implementation - replace with AsyncStorage or MMKV
      console.log(`[Native] setItem: ${key} = ${value}`);
    },
    removeItem: async (key: string) => {
      // Mock implementation - replace with AsyncStorage or MMKV
      console.log(`[Native] removeItem: ${key}`);
    },
  },

  permissions: {
    request: async (permission: string) => {
      // Mock implementation - replace with react-native-permissions
      console.log(`[Native] request permission: ${permission}`);
      return true;
    },
    check: async (permission: string) => {
      // Mock implementation - replace with react-native-permissions
      console.log(`[Native] check permission: ${permission}`);
      return true;
    },
  },
};
