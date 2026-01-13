/**
 * Host SDK Type Definitions
 * Contract between Host App and Mini Apps
 */

export interface MiniAppProps {
  userToken: string;
  userInfo: {
    id: string;
    name: string;
    role: "admin" | "user" | "guest";
    permissions: string[];
  };
  theme: "light" | "dark";
  language: "vi" | "en";
  // Lifecycle callbacks
  onFocus?: () => void;
  onBlur?: () => void;
  onBackground?: () => void;
  onForeground?: () => void;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface NavigationHelpers {
  goBack: () => void;
  navigateToMiniApp: (appName: string, params?: any) => void;
  navigateToHost: (screen: string, params?: any) => void;
}

export interface NativeCapabilities {
  camera: {
    takePicture: () => Promise<string>;
    pickImage: () => Promise<string>;
  };
  location: {
    getCurrentPosition: () => Promise<{ lat: number; lng: number }>;
  };
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  };
  permissions: {
    request: (permission: string) => Promise<boolean>;
    check: (permission: string) => Promise<boolean>;
  };
}
