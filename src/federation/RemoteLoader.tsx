import React, { Suspense, ComponentType } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import {  ScriptManager } from '@callstack/repack/client';
import type { MiniAppProps } from '../host-sdk';

interface RemoteLoaderProps {
  appName: string;
  moduleName?: string;
  userToken: string;
  userInfo: { 
    id: string; 
    name: string;
    role: 'admin' | 'user' | 'guest';
    permissions: string[];
  };
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
}

/**
 * RemoteLoader Component
 * Dynamically loads and renders Mini Apps via Module Federation
 */
export const RemoteLoader: React.FC<RemoteLoaderProps> = ({
  appName,
  moduleName = './App',
  userToken,
  userInfo,
  theme,
  language,
}) => {
  const miniAppProps: MiniAppProps = {
    userToken,
    userInfo,
    theme,
    language,
  };

  return (
    <ErrorBoundary appName={appName}>
      <RemoteComponent
        appName={appName}
        moduleName={moduleName}
        props={miniAppProps}
      />
    </ErrorBoundary>
  );
};

/**
 * Remote Component Loader
 * Uses Federated component from Re.Pack to load remote modules
 */
const RemoteComponent: React.FC<{
  appName: string;
  moduleName: string;
  props: MiniAppProps;
}> = ({ appName, moduleName, props }) => {
  const [Component, setComponent] = React.useState<ComponentType<MiniAppProps> | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let mounted = true;
    console.log(`[RemoteLoader] Requesting ${appName}/${moduleName}`);

    // Use ScriptManager to load the container script first
    ScriptManager.shared.loadScript(appName)
      .then(async () => {
        if (!mounted) return;
        
        // After script is loaded, the container is available globally
        // Check standard MF global scope
        // @ts-ignore
        const container = global[appName] || window[appName];
        
        if (!container) {
          throw new Error(`Container ${appName} not found in global scope`);
        }

        // Initialize sharing scope
        // @ts-ignore
        await container.init(__webpack_share_scopes__.default);
        
        // Load the module
        const factory = await container.get(moduleName);
        const module = factory();
        
        if (module.default) {
          console.log(`[RemoteLoader] Module ${appName} loaded successfully`);
          setComponent(() => module.default);
        } else {
          throw new Error(`Module ${appName} has no default export`);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error(`[RemoteLoader] Error loading ${appName}:`, err);
          setError(err);
        }
      });

    return () => {
      mounted = false;
    };
  }, [appName, moduleName]);

  if (error) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Failed to load {appName}</Text>
        <Text style={{ color: '#666', fontSize: 12 }}>{error.message}</Text>
      </View>
    );
  }

  if (!Component) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading {appName}...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Component {...props} />
    </View>
  );
};

/**
 * Loading Fallback
 */
const LoadingFallback: React.FC<{ appName: string }> = ({ appName }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.text}>Loading {appName}...</Text>
  </View>
);

/**
 * Error Boundary for Mini Apps
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; appName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; appName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary] Error in ${this.props.appName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorTitle}>⚠️ Failed to Load Mini App</Text>
          <Text style={styles.errorText}>{this.props.appName}</Text>
          <Text style={styles.errorDetail}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  errorDetail: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
