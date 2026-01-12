import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Linking } from 'react-native';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { MiniAppScreen } from '../screens/MiniAppScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { setNavigationRef } from '../host-sdk/navigation';
import { useAuth } from '../auth/AuthContext';
import { linkingConfig, deepLinkHandler } from './deepLinking.config';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const navigationRef = React.useRef(null);
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  // Debug: Listen for deep link events
  React.useEffect(() => {
    console.log('🔗 [Deep Link] Setting up listeners...');
    
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 [Deep Link] Received URL:', url);
    });

    // Check initial URL
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('🔗 [Deep Link] Initial URL:', url);
      } else {
        console.log('🔗 [Deep Link] No initial URL');
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle deep links when authentication state changes
  React.useEffect(() => {
    console.log('🔗 [Deep Link] Auth state changed:', { isAuthenticated });
    
    if (isAuthenticated && deepLinkHandler.hasPendingDeepLink()) {
      const pendingUrl = deepLinkHandler.getPendingDeepLink();
      console.log('🔗 [Deep Link] Processing pending URL:', pendingUrl);
      
      if (pendingUrl) {
        // Navigate to pending deep link after authentication
        setTimeout(() => {
          console.log('🔗 [Deep Link] Opening pending URL:', pendingUrl);
          Linking.openURL(pendingUrl);
          deepLinkHandler.clearPendingDeepLink();
        }, 500);
      }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} linking={linkingConfig}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="MiniApp"
              component={MiniAppScreen}
              options={{
                headerShown: true,
                headerBackTitle: 'Back',
                title: 'Mini App',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
