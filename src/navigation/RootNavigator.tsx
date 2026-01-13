import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  View,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import type { RootStackParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { MiniAppScreen } from "../screens/MiniAppScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { setNavigationRef } from "../host-sdk/navigation";
import { useAuth } from "../auth/AuthContext";
import { linkingConfig, deepLinkHandler } from "./deepLinking.config";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const navigationRef = React.useRef(null);
  const { isAuthenticated, isLoading } = useAuth();
  const appState = React.useRef(AppState.currentState);
  const [isHomeReady, setIsHomeReady] = React.useState(false);
  const lastProcessedUrl = React.useRef<string | null>(null);
  const isProcessingUrl = React.useRef(false);
  const pendingUrlFromEvent = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, []);

  // Mark Home as ready when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      // Delay to ensure Home screen is mounted
      setTimeout(() => {
        setIsHomeReady(true);
        console.log("🏠 [Navigation] Home screen ready");
      }, 300);
    } else {
      setIsHomeReady(false);
    }
  }, [isAuthenticated]);

  // Handle app state changes (background/foreground)
  React.useEffect(() => {
    let urlFromBackground: string | null = null;

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        console.log(
          "📱 [AppState] Change:",
          appState.current,
          "→",
          nextAppState
        );

        // App going to background - prepare to capture URL
        if (nextAppState.match(/inactive|background/)) {
          urlFromBackground = null;
        }

        // App came to foreground from background
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("📱 [AppState] App came to foreground");

          // Check if there's a pending URL from event listener
          setTimeout(() => {
            if (
              pendingUrlFromEvent.current &&
              pendingUrlFromEvent.current !== lastProcessedUrl.current
            ) {
              console.log(
                "🔗 [Deep Link] Processing pending URL from background:",
                pendingUrlFromEvent.current
              );
              handleDeepLink(pendingUrlFromEvent.current);
              pendingUrlFromEvent.current = null;
            } else {
              console.log("🔗 [Deep Link] No new URL from background");
            }
          }, 100);
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isHomeReady]);

  // Setup Linking listener ONCE - must not re-create
  React.useEffect(() => {
    console.log("🔗 [Deep Link] Setting up persistent listener...");

    const subscription = Linking.addEventListener("url", ({ url }) => {
      console.log("🔗 [Deep Link] Received URL event:", url);

      // Always store URL for processing
      // Don't check isAuthenticated/isHomeReady here - they might be stale
      pendingUrlFromEvent.current = url;
      console.log("🔗 [Deep Link] URL stored, will be processed when ready");
    });

    // Check initial URL (when app is opened from killed state)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("🔗 [Deep Link] Initial URL:", url);
        pendingUrlFromEvent.current = url;
      } else {
        console.log("🔗 [Deep Link] No initial URL");
      }
    });

    return () => {
      subscription.remove();
    };
  }, []); // No dependencies - run once!

  // Process pending URL when ready
  React.useEffect(() => {
    if (isAuthenticated && isHomeReady && pendingUrlFromEvent.current) {
      const url = pendingUrlFromEvent.current;
      if (url !== lastProcessedUrl.current) {
        console.log("🔗 [Deep Link] Processing stored URL:", url);
        handleDeepLink(url);
        pendingUrlFromEvent.current = null;
      }
    }
  }, [isAuthenticated, isHomeReady]);

  // Handle deep link navigation
  const handleDeepLink = (url: string) => {
    // Avoid processing duplicate URLs
    if (lastProcessedUrl.current === url || isProcessingUrl.current) {
      console.log("🔗 [Deep Link] Skipping duplicate/in-progress URL:", url);
      return;
    }

    console.log("🔗 [Deep Link] Handling URL:", url, {
      isAuthenticated,
      isHomeReady,
    });

    // If not authenticated, save pending deep link
    if (!isAuthenticated) {
      console.log("🔗 [Deep Link] Not authenticated, saving pending URL");
      deepLinkHandler.setPendingDeepLink(url);
      lastProcessedUrl.current = url;
      return;
    }

    // Parse URL to extract path
    const parsed = url.replace(/.*?:\/\//g, ""); // Remove scheme
    console.log("🔗 [Deep Link] Parsed path:", parsed);

    // Navigate based on path
    if (navigationRef.current) {
      if (parsed.startsWith("mini-app/")) {
        const appName = parsed.replace("mini-app/", "");
        console.log("🔗 [Deep Link] Target MiniApp:", appName);

        // Check if already on this MiniApp screen
        const currentRoute = (navigationRef.current as any).getCurrentRoute();
        if (
          currentRoute?.name === "MiniApp" &&
          currentRoute?.params?.appName === appName
        ) {
          console.log(
            "🔗 [Deep Link] Already on",
            appName,
            "- skipping navigation"
          );
          lastProcessedUrl.current = url;
          return;
        }

        // Always navigate to Home first, then to MiniApp
        if (!isHomeReady) {
          console.log("🔗 [Deep Link] Home not ready, waiting...");
          // Save as pending and will be handled when Home is ready
          deepLinkHandler.setPendingDeepLink(url);
          return;
        }

        // Mark as processing
        isProcessingUrl.current = true;
        lastProcessedUrl.current = url;

        // Navigate to Home first
        (navigationRef.current as any).navigate("Home");

        // Then navigate to MiniApp after a short delay
        setTimeout(() => {
          console.log("🔗 [Deep Link] Now navigating to MiniApp:", appName);
          (navigationRef.current as any).navigate("MiniApp", { appName });
          isProcessingUrl.current = false;
        }, 300);
      } else if (parsed === "home") {
        console.log("🔗 [Deep Link] Navigating to Home");
        (navigationRef.current as any).navigate("Home");
        lastProcessedUrl.current = url;
      } else if (parsed === "login") {
        console.log("🔗 [Deep Link] Navigating to Login");
        (navigationRef.current as any).navigate("Login");
        lastProcessedUrl.current = url;
      } else if (parsed === "register") {
        console.log("🔗 [Deep Link] Navigating to Register");
        (navigationRef.current as any).navigate("Register");
        lastProcessedUrl.current = url;
      }
    }
  };

  // Handle pending deep links after authentication
  React.useEffect(() => {
    console.log("🔗 [Deep Link] Auth/Home state changed:", {
      isAuthenticated,
      isHomeReady,
    });

    if (
      isAuthenticated &&
      isHomeReady &&
      deepLinkHandler.hasPendingDeepLink()
    ) {
      const pendingUrl = deepLinkHandler.getPendingDeepLink();
      console.log("🔗 [Deep Link] Processing pending URL:", pendingUrl);

      if (pendingUrl) {
        // Wait for navigation to be ready
        setTimeout(() => {
          console.log("🔗 [Deep Link] Handling pending URL");
          handleDeepLink(pendingUrl);
          deepLinkHandler.clearPendingDeepLink();
        }, 500);
      }
    }
  }, [isAuthenticated, isHomeReady]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
                headerBackTitle: "Back",
                title: "Mini App",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
