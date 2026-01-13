import React from "react";
import "./src/federation/ScriptManager"; // Ensure ScriptManager init
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { AuthProvider } from "./src/auth/AuthContext";
import { PermissionProvider } from "./src/permissions/PermissionContext";
import { FeatureFlagProvider } from "./src/features/FeatureFlagContext";
import { TenantProvider } from "./src/tenant/TenantContext";
import { RegionProvider } from "./src/region/RegionContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <RegionProvider>
        <TenantProvider>
          <FeatureFlagProvider>
            <AuthProvider>
              <PermissionProvider>
                <RootNavigator />
              </PermissionProvider>
            </AuthProvider>
          </FeatureFlagProvider>
        </TenantProvider>
      </RegionProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
