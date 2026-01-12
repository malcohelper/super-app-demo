import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Tenant Context
 * Manages multi-tenancy support for the Super App
 */

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  region: string;
  config: {
    theme?: 'light' | 'dark';
    language?: 'vi' | 'en';
    features?: string[];
  };
}

interface TenantContextType {
  currentTenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  isTenantFeatureEnabled: (feature: string) => boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Default tenant for demo
const DEFAULT_TENANT: Tenant = {
  id: 'default',
  name: 'Default Organization',
  domain: 'default.superapp.com',
  region: 'global',
  config: {
    theme: 'light',
    language: 'vi',
    features: ['all'],
  },
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(DEFAULT_TENANT);

  const setTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    console.log('[TenantContext] Switched to tenant:', tenant.name);
  };

  const isTenantFeatureEnabled = (feature: string): boolean => {
    if (!currentTenant) return false;
    
    // If tenant has 'all' features, enable everything
    if (currentTenant.config.features?.includes('all')) {
      return true;
    }
    
    return currentTenant.config.features?.includes(feature) || false;
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setTenant,
        isTenantFeatureEnabled,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
