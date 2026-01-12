import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessMiniApp: (appName: string, requiredPermissions?: string[], requiredRole?: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userInfo } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!userInfo) return false;
    return userInfo.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!userInfo) return false;
    return userInfo.role === role;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userInfo) return false;
    return permissions.some(permission => userInfo.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userInfo) return false;
    return permissions.every(permission => userInfo.permissions.includes(permission));
  };

  const canAccessMiniApp = (
    appName: string,
    requiredPermissions?: string[],
    requiredRole?: string
  ): boolean => {
    if (!userInfo) return false;

    // Admin can access everything
    if (userInfo.role === 'admin') return true;

    // Check role requirement
    if (requiredRole && userInfo.role !== requiredRole) {
      return false;
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0) {
      return hasAllPermissions(requiredPermissions);
    }

    // No specific requirements, allow access
    return true;
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasRole,
        hasAnyPermission,
        hasAllPermissions,
        canAccessMiniApp,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
