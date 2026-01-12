import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_FEATURE_FLAGS, FeatureFlags } from './featureFlags.config';

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isFeatureEnabled: (featureName: keyof FeatureFlags) => boolean;
  enableFeature: (featureName: keyof FeatureFlags) => void;
  disableFeature: (featureName: keyof FeatureFlags) => void;
  setFlags: (flags: Partial<FeatureFlags>) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlagsState] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);

  const isFeatureEnabled = (featureName: keyof FeatureFlags): boolean => {
    return flags[featureName] === true;
  };

  const enableFeature = (featureName: keyof FeatureFlags) => {
    setFlagsState(prev => ({ ...prev, [featureName]: true }));
  };

  const disableFeature = (featureName: keyof FeatureFlags) => {
    setFlagsState(prev => ({ ...prev, [featureName]: false }));
  };

  const setFlags = (newFlags: Partial<FeatureFlags>) => {
    setFlagsState(prev => ({ ...prev, ...newFlags }));
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isFeatureEnabled,
        enableFeature,
        disableFeature,
        setFlags,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
