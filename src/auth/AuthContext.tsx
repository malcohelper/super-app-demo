import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { NativeAuthModule } from "./NativeAuthModule";
import { SecureStorage } from "./SecureStorage";
import { isTokenExpired } from "./tokenUtils";
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
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('[AuthContext] Initializing authentication...');
      
      // Load auth state from Keychain (via native module)
      await loadAuthState();
    } catch (error) {
      console.error('[AuthContext] Failed to initialize auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuthState = async () => {
    try {
      // Load from Keychain via native module
      const authState = await NativeAuthModule.loadAuthState();
      
      if (authState?.token && authState?.userInfo && authState?.timestamp) {
        // Check if token is expired
        if (!isTokenExpired(authState.timestamp)) {
          const user = authState.userInfo;
          
          // Ensure permissions field exists
          if (!user.permissions) {
            user.permissions = [];
          }
          
          setUserToken(authState.token);
          setUserInfo(user);
          setIsAuthenticated(true);
          
          console.log('[AuthContext] ✓ Loaded auth state from Keychain');
        } else {
          // Token expired, clear storage
          console.log('[AuthContext] Token expired, clearing auth state');
          await clearAuthState();
        }
      } else {
        console.log('[AuthContext] No auth state found');
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load auth state:', error);
    }
  };

  const saveAuthState = async (token: string, user: UserInfo) => {
    try {
      await SecureStorage.saveAuthState(token, user);
      console.log('[AuthContext] ✓ Saved auth state to Keychain');
    } catch (error) {
      console.error('[AuthContext] Failed to save auth state:', error);
    }
  };

  const clearAuthState = async () => {
    try {
      await SecureStorage.clear();
      console.log('[AuthContext] ✓ Cleared auth state');
    } catch (error) {
      console.error('[AuthContext] Failed to clear auth state:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Logging in via native module...');
      
      // Call native login - it handles API call and Keychain storage
      const user = await NativeAuthModule.login(email, password);
      
      // Get token from Keychain
      const token = await SecureStorage.getToken();
      
      setUserToken(token);
      setUserInfo(user);
      setIsAuthenticated(true);
      
      console.log('[AuthContext] ✓ Login successful');
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing up via native module...');
      
      // Call native signup - it handles API call and Keychain storage
      const user = await NativeAuthModule.signup(email, password, name);
      
      // Get token from Keychain
      const token = await SecureStorage.getToken();
      
      setUserToken(token);
      setUserInfo(user);
      setIsAuthenticated(true);
      
      console.log('[AuthContext] ✓ Signup successful');
    } catch (error) {
      console.error('[AuthContext] Register failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('[AuthContext] Logging out via native module...');
      
      // Call native logout - it clears Keychain
      await NativeAuthModule.logout();
      
      setUserToken(null);
      setUserInfo(null);
      setIsAuthenticated(false);
      
      console.log('[AuthContext] ✓ Logout successful');
    } catch (error) {
      console.error('[AuthContext] Logout failed:', error);
      // Still clear local state even if native logout fails
      await clearAuthState();
      setUserToken(null);
      setUserInfo(null);
      setIsAuthenticated(false);
    }
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
      await SecureStorage.saveUserInfo(user);
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
      await SecureStorage.saveUserInfo(user);
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
