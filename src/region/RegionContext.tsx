import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectRegion, REGION_CONFIGS, isFeatureEnabledInRegion, isMiniAppEnabledInRegion } from './regionConfig';
import type { Region } from './regionConfig';

interface RegionContextType {
  currentRegion: Region;
  setRegion: (region: Region) => void;
  isFeatureEnabledInRegion: (feature: string) => boolean;
  isMiniAppEnabledInRegion: (miniAppName: string) => boolean;
  getRegionConfig: () => typeof REGION_CONFIGS[Region];
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export const RegionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentRegion, setCurrentRegion] = useState<Region>('global');

  // Auto-detect region on mount
  useEffect(() => {
    const detectedRegion = detectRegion();
    setCurrentRegion(detectedRegion);
    console.log('[RegionContext] Detected region:', detectedRegion);
  }, []);

  const setRegion = (region: Region) => {
    setCurrentRegion(region);
    console.log('[RegionContext] Switched to region:', region);
  };

  const checkFeatureEnabled = (feature: string): boolean => {
    return isFeatureEnabledInRegion(currentRegion, feature);
  };

  const checkMiniAppEnabled = (miniAppName: string): boolean => {
    return isMiniAppEnabledInRegion(currentRegion, miniAppName);
  };

  const getRegionConfig = () => {
    return REGION_CONFIGS[currentRegion];
  };

  return (
    <RegionContext.Provider
      value={{
        currentRegion,
        setRegion,
        isFeatureEnabledInRegion: checkFeatureEnabled,
        isMiniAppEnabledInRegion: checkMiniAppEnabled,
        getRegionConfig,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
