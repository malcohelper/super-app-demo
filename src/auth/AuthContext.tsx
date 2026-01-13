import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isTokenExpired } from "./tokenUtils";
import * as authApi from "./authApi";
import * as userApi from "./userApi";

export interface UserInfo {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
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
  fetchProfile: () => Promise<void>;
  updateProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOKEN: "@super_app_token",
  TOKEN_TIMESTAMP: "@super_app_token_timestamp",
  USER_INFO: "@super_app_user_info",
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Load saved auth state on mount
  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const [savedToken, savedTimestamp, savedUserInfo] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN_TIMESTAMP),
        AsyncStorage.getItem(STORAGE_KEYS.USER_INFO),
      ]);

      if (savedToken && savedTimestamp && savedUserInfo) {
        const timestamp = parseInt(savedTimestamp, 10);

        // Check if token is expired based on timestamp
        if (!isTokenExpired(timestamp)) {
          const parsedUser = JSON.parse(savedUserInfo);

          // Migration: ensure permissions field exists
          if (!parsedUser.permissions) {
            parsedUser.permissions = [];
            // Save the migrated user info
            await AsyncStorage.setItem(
              STORAGE_KEYS.USER_INFO,
              JSON.stringify(parsedUser)
            );
          }

          setUserToken(savedToken);
          setUserInfo(parsedUser);
          setIsAuthenticated(true);
        } else {
          // Token expired, clear storage
          await clearAuthState();
        }
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (token: string, user: UserInfo) => {
    try {
      const timestamp = Date.now().toString();
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        AsyncStorage.setItem(STORAGE_KEYS.TOKEN_TIMESTAMP, timestamp),
        AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user)),
      ]);
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  };

  const clearAuthState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_TIMESTAMP),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_INFO),
      ]);
    } catch (error) {
      console.error("Failed to clear auth state:", error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      const user: UserInfo = {
        uid: response.uid,
        email: response.email,
        displayName: response.displayName,
        role: response.role,
        permissions: response.permissions ?? [],
      };

      await saveAuthState(response.token, user);
      setUserToken(response.token);
      setUserInfo(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("[AuthContext] Login failed:", error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authApi.signup(email, password, name);

      const user: UserInfo = {
        uid: response.uid,
        email: response.email,
        displayName: response.displayName,
        role: response.role,
        permissions: response.permissions || [],
      };

      await saveAuthState(response.token, user);
      setUserToken(response.token);
      setUserInfo(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("[AuthContext] Register failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await clearAuthState();
    setUserToken(null);
    setUserInfo(null);
    setIsAuthenticated(false);
  };

  const fetchProfile = async () => {
    if (!userToken) {
      throw new Error("No token available");
    }

    try {
      const profile = await userApi.getProfile(userToken);
      const user: UserInfo = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        role: profile.role,
        permissions: profile.permissions ?? [],
      };

      setUserInfo(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    } catch (error) {
      console.error("[AuthContext] Fetch profile failed:", error);
      throw error;
    }
  };

  const updateProfile = async (displayName?: string, photoURL?: string) => {
    if (!userToken) {
      throw new Error("No token available");
    }

    try {
      const updatedProfile = await userApi.updateProfile(userToken, {
        displayName,
        photoURL,
      });

      const user: UserInfo = {
        uid: updatedProfile.uid,
        email: updatedProfile.email,
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        role: updatedProfile.role,
        permissions: updatedProfile.permissions ?? [],
      };

      setUserInfo(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    } catch (error) {
      console.error("[AuthContext] Update profile failed:", error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!userToken) {
      throw new Error("No token available");
    }

    try {
      await userApi.deleteAccount(userToken);
      await logout();
    } catch (error) {
      console.error("[AuthContext] Delete account failed:", error);
      throw error;
    }
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
        fetchProfile,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
