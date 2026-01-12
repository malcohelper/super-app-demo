import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { usePermissions } from '../permissions/PermissionContext';
import { useFeatureFlags } from '../features/FeatureFlagContext';
import { REMOTES } from '../federation/remotes.config';
import { MINI_APP_FEATURE_FLAGS } from '../features/featureFlags.config';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const MINI_APPS = [
  {
    id: 'UserManagementApp',
    name: '👥 User Management',
    description: 'Manage users with full CRUD operations',
    icon: '👥',
    color: '#6366f1',
  },
  {
    id: 'miniAppA',
    name: 'Mini App A',
    description: 'Sample Mini App A with dynamic loading',
    icon: '🎯',
    color: '#FF6B6B',
  },
  {
    id: 'miniAppB',
    name: 'Mini App B',
    description: 'Sample Mini App B with dynamic loading',
    icon: '🚀',
    color: '#4ECDC4',
  },
];

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { userInfo, logout } = useAuth();
  const { canAccessMiniApp } = usePermissions();
  const { isFeatureEnabled } = useFeatureFlags();
  
  // Filter Mini Apps based on permissions and feature flags
  const availableMiniApps = useMemo(() => {
    return MINI_APPS.filter(app => {
      const config = REMOTES[app.id];
      if (!config) return false;

      // Check feature flag
      if (config.featureFlag && !isFeatureEnabled(config.featureFlag as any)) {
        return false;
      }

      // Check permissions
      return canAccessMiniApp(app.id, config.requiredPermissions, config.requiredRole);
    });
  }, [canAccessMiniApp, isFeatureEnabled]);
  
  const handleMiniAppPress = (appName: string) => {
    navigation.navigate('MiniApp', { appName });
  };

  const handleLogout = async () => {
    await logout();
  };

  const getRoleColor = (role?: 'admin' | 'user' | 'guest'): string => {
    switch (role) {
      case 'admin':
        return '#FF6B6B';
      case 'user':
        return '#4ECDC4';
      case 'guest':
        return '#ADB5BD';
      default:
        return '#ADB5BD';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Super App Host</Text>
          <Text style={styles.subtitle}>Welcome, {userInfo?.name || 'User'}!</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* User Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.userIconContainer}>
            <Text style={styles.userIcon}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{userInfo?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{userInfo?.email || 'No email'}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.userId}>ID: {userInfo?.id || 'N/A'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(userInfo?.role) }]}>
                <Text style={styles.roleText}>{userInfo?.role?.toUpperCase() || 'GUEST'}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Mini Apps ({availableMiniApps.length})</Text>

        {availableMiniApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>🔒 No Mini Apps available</Text>
            <Text style={styles.emptyStateSubtext}>
              Contact your administrator for access
            </Text>
          </View>
        ) : (
          availableMiniApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={[styles.appCard, { borderLeftColor: app.color }]}
              onPress={() => handleMiniAppPress(app.id)}
              activeOpacity={0.7}
            >
              <View style={styles.appIconContainer}>
                <Text style={styles.appIcon}>{app.icon}</Text>
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appDescription}>{app.description}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About</Text>
          <Text style={styles.infoText}>
            This is a React Native Super App host using Module Federation.
            Mini Apps are loaded dynamically from remote CDN endpoints.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E7F5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userIcon: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 2,
  },
  userId: {
    fontSize: 12,
    color: '#ADB5BD',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIcon: {
    fontSize: 24,
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  appDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#CED4DA',
  },
  infoCard: {
    backgroundColor: '#E7F5FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1971C2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1971C2',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFF3CD',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
});
