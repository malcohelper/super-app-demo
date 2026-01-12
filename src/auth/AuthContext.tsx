import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDummyToken, generateUserId, isTokenExpired } from './tokenUtils';
import { tokenRefreshService } from './TokenRefreshService';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  permissions: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userToken: string | null;
  userInfo: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: '@super_app_token',
  USER_INFO: '@super_app_user_info',
};

/**
 * Get default permissions for a role
 */
const getRolePermissions = (role: 'admin' | 'user' | 'guest'): string[] => {
  switch (role) {
    case 'admin':
      return [
        'user.create',
        'user.read',
        'user.update',
        'user.delete',
        'miniapp.access.all',
        'analytics.view',
      ];
    case 'user':
      return [
        'user.read',
        'miniapp.access.basic',
      ];
    case 'guest':
      return [];
    default:
      return [];
  }
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Load saved auth state on mount
  useEffect(() => {
    loadAuthState();
    
    // Cleanup token refresh service on unmount
    return () => {
      tokenRefreshService.stop();
    };
  }, []);

  // Start token refresh service when authenticated
  useEffect(() => {
    if (isAuthenticated && userToken) {
      tokenRefreshService.start(
        (newToken) => {
          // Token refreshed successfully
          setUserToken(newToken);
          console.log('[AuthContext] Token auto-refreshed');
        },
        () => {
          // Token refresh failed, logout user
          console.log('[AuthContext] Token refresh failed, logging out');
          logout();
        }
      );
    } else {
      tokenRefreshService.stop();
    }
  }, [isAuthenticated, userToken]);

  const loadAuthState = async () => {
    try {
      const [savedToken, savedUserInfo] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
      ]);

      if (savedToken && savedUserInfo) {
        // Check if token is expired
        if (!isTokenExpired(savedToken)) {
          setUserToken(savedToken);
          setUserInfo(JSON.parse(savedUserInfo));
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          await clearAuthState();
        }
      }
    } catch (error) {
      console.error('Failed to load auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (token: string, user: UserInfo) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error('Failed to save auth state:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
      ]);
    } catch (error) {
      console.error('Failed to clear auth state:', error);
    }
  };

  const login = async (email: string, password: string) => {
    // Dummy login - accepts any credentials
    // Simulate API delay
    await new Promise<void>(resolve => setTimeout(resolve, 500));

    const userId = generateUserId();
    // Assign role based on email (demo logic)
    const role = email.includes('admin') ? 'admin' : 'user';
    const permissions = getRolePermissions(role);
    
    const token = generateDummyToken(userId, email, 'Demo User', role, permissions);
    const user: UserInfo = {
      id: userId,
      name: 'Demo User',
      email,
      role,
      permissions,
    };

    await saveAuthState(token, user);
    setUserToken(token);
    setUserInfo(user);
    setIsAuthenticated(true);
  };

  const register = async (name: string, email: string, password: string) => {
    // Dummy register - creates user with provided info
    // Simulate API delay
    await new Promise<void>(resolve => setTimeout(resolve, 500));

    const userId = generateUserId();
    // New users get 'user' role by default
    const role = 'user' as const;
    const permissions = getRolePermissions(role);
    
    const token = generateDummyToken(userId, email, name, role, permissions);
    const user: UserInfo = {
      id: userId,
      name,
      email,
      role,
      permissions,
    };

    await saveAuthState(token, user);
    setUserToken(token);
    setUserInfo(user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await clearAuthState();
    setUserToken(null);
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userToken,
        userInfo,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
