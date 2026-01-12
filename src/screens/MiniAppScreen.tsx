import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RemoteLoader } from '../federation/RemoteLoader';
import { useAuth } from '../auth/AuthContext';
import { miniAppLifecycleManager } from '../federation/MiniAppLifecycleManager';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'MiniApp'>;

export const MiniAppScreen: React.FC<Props> = ({ route }) => {
  const { appName } = route.params;
  const { userToken, userInfo } = useAuth();

  // Notify lifecycle manager when screen gains/loses focus
  useFocusEffect(
    React.useCallback(() => {
      miniAppLifecycleManager.onMiniAppFocus(appName);
      
      return () => {
        miniAppLifecycleManager.onMiniAppBlur(appName);
      };
    }, [appName])
  );

  // Memoize props for stability
  const miniAppUserInfo = React.useMemo(() => ({
    id: userInfo?.id || '',
    name: userInfo?.name || '',
    role: userInfo?.role || 'guest',
    permissions: userInfo?.permissions || [],
  }), [userInfo]);

  // Create lifecycle callbacks
  const lifecycleCallbacks = React.useMemo(() => ({
    onFocus: () => console.log(`[${appName}] Focus callback`),
    onBlur: () => console.log(`[${appName}] Blur callback`),
    onBackground: () => console.log(`[${appName}] Background callback`),
    onForeground: () => console.log(`[${appName}] Foreground callback`),
  }), [appName]);

  return (
    <RemoteLoader
      appName={appName}
      userToken={userToken || ''}
      userInfo={miniAppUserInfo}
      theme="light"
      language="vi"
      {...lifecycleCallbacks}
    />
  );
};
