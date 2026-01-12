# API Reference

> Complete API documentation for HostApp contexts, hooks, and services

## Table of Contents

1. [Authentication](#authentication)
2. [Permissions](#permissions)
3. [Feature Flags](#feature-flags)
4. [Tenant](#tenant)
5. [Region](#region)
6. [Navigation](#navigation)
7. [Mini App Lifecycle](#mini-app-lifecycle)

---

## Authentication

### `useAuth()`

Hook để truy cập authentication context.

**Returns:**
```typescript
{
  isAuthenticated: boolean;
  isLoading: boolean;
  userToken: string | null;
  userInfo: UserInfo | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Example:**
```typescript
const { isAuthenticated, userInfo, login, logout } = useAuth();

// Login
await login('user@example.com', 'password');

// Logout
await logout();

// Check auth status
if (isAuthenticated) {
  console.log('User:', userInfo.name);
}
```

### `TokenRefreshService`

Service tự động làm mới token.

**Methods:**

#### `start(onSuccess, onFailure)`
Bắt đầu monitoring và auto-refresh.

```typescript
tokenRefreshService.start(
  (newToken) => {
    // Token refreshed successfully
  },
  () => {
    // Refresh failed
  }
);
```

#### `stop()`
Dừng monitoring.

```typescript
tokenRefreshService.stop();
```

#### `manualRefresh()`
Làm mới token thủ công.

```typescript
const success = await tokenRefreshService.manualRefresh();
```

---

## Permissions

### `usePermissions()`

Hook để kiểm tra permissions và roles.

**Returns:**
```typescript
{
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccessMiniApp: (appName: string, requiredPermissions?: string[], requiredRole?: string) => boolean;
}
```

**Example:**
```typescript
const { hasPermission, hasRole, canAccessMiniApp } = usePermissions();

// Check single permission
if (hasPermission('user.delete')) {
  // Show delete button
}

// Check role
if (hasRole('admin')) {
  // Show admin panel
}

// Check any permission
if (hasAnyPermission(['user.read', 'user.write'])) {
  // Show user management
}

// Check all permissions
if (hasAllPermissions(['user.read', 'user.write'])) {
  // Show full user management
}

// Check Mini App access
if (canAccessMiniApp('UserManagementApp', ['user.read'], 'user')) {
  // Show Mini App card
}
```

**Available Permissions:**

| Permission | Description |
|-----------|-------------|
| `user.create` | Create users |
| `user.read` | Read user data |
| `user.update` | Update users |
| `user.delete` | Delete users |
| `miniapp.access.all` | Access all Mini Apps |
| `miniapp.access.basic` | Access basic Mini Apps |
| `analytics.view` | View analytics |

---

## Feature Flags

### `useFeatureFlags()`

Hook để quản lý feature flags.

**Returns:**
```typescript
{
  flags: FeatureFlags;
  isFeatureEnabled: (featureName: keyof FeatureFlags) => boolean;
  enableFeature: (featureName: keyof FeatureFlags) => void;
  disableFeature: (featureName: keyof FeatureFlags) => void;
  setFlags: (flags: Partial<FeatureFlags>) => void;
}
```

**Example:**
```typescript
const { flags, isFeatureEnabled, enableFeature, disableFeature } = useFeatureFlags();

// Check if feature is enabled
if (isFeatureEnabled('DARK_MODE')) {
  // Apply dark theme
}

// Enable feature
enableFeature('BETA_FEATURES');

// Disable feature
disableFeature('PUSH_NOTIFICATIONS');

// Set multiple flags
setFlags({
  DARK_MODE: true,
  ANALYTICS: false,
});
```

**Available Feature Flags:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `MINI_APP_USER_MANAGEMENT` | boolean | true | User Management Mini App |
| `MINI_APP_A` | boolean | true | Mini App A |
| `MINI_APP_B` | boolean | true | Mini App B |
| `DARK_MODE` | boolean | true | Dark mode support |
| `ANALYTICS` | boolean | true | Analytics tracking |
| `PUSH_NOTIFICATIONS` | boolean | false | Push notifications |
| `BETA_FEATURES` | boolean | false | Beta features |

### `RemoteFeatureFlagService`

Service để fetch feature flags từ remote.

**Methods:**

#### `fetchRemoteFlags()`
Fetch flags từ remote server.

```typescript
const flags = await remoteFeatureFlagService.fetchRemoteFlags();
```

#### `refresh()`
Force refresh flags.

```typescript
await remoteFeatureFlagService.refresh();
```

#### `clearCache()`
Xóa cached flags.

```typescript
await remoteFeatureFlagService.clearCache();
```

---

## Tenant

### `useTenant()`

Hook để quản lý multi-tenancy.

**Returns:**
```typescript
{
  currentTenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
  isTenantFeatureEnabled: (feature: string) => boolean;
}
```

**Example:**
```typescript
const { currentTenant, setTenant, isTenantFeatureEnabled } = useTenant();

// Get current tenant
console.log('Tenant:', currentTenant?.name);

// Switch tenant
setTenant({
  id: 'org-123',
  name: 'Acme Corp',
  domain: 'acme.superapp.com',
  region: 'asia',
  config: {
    theme: 'dark',
    language: 'vi',
    features: ['analytics', 'reporting'],
  },
});

// Check tenant feature
if (isTenantFeatureEnabled('analytics')) {
  // Show analytics
}
```

**Tenant Interface:**
```typescript
interface Tenant {
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
```

---

## Region

### `useRegion()`

Hook để quản lý region-based access.

**Returns:**
```typescript
{
  currentRegion: Region;
  setRegion: (region: Region) => void;
  isFeatureEnabledInRegion: (feature: string) => boolean;
  isMiniAppEnabledInRegion: (miniAppName: string) => boolean;
  getRegionConfig: () => RegionConfig;
}
```

**Example:**
```typescript
const { 
  currentRegion, 
  setRegion,
  isFeatureEnabledInRegion,
  isMiniAppEnabledInRegion,
  getRegionConfig 
} = useRegion();

// Get current region
console.log('Region:', currentRegion);

// Switch region
setRegion('europe');

// Check feature in region
if (isFeatureEnabledInRegion('DARK_MODE')) {
  // Show dark mode
}

// Check Mini App in region
if (isMiniAppEnabledInRegion('UserManagementApp')) {
  // Show Mini App
}

// Get region config
const config = getRegionConfig();
console.log('Timezone:', config.timezone);
```

**Available Regions:**

| Region | Enabled Features | Enabled Mini Apps | Locale | Timezone |
|--------|-----------------|-------------------|--------|----------|
| `global` | All | All | en-US | UTC |
| `asia` | UserManagement, MiniAppA, Analytics | UserManagementApp, miniAppA | vi-VN | Asia/Ho_Chi_Minh |
| `europe` | UserManagement, MiniAppB, DarkMode | UserManagementApp, miniAppB | en-GB | Europe/London |
| `americas` | MiniAppA, MiniAppB, BetaFeatures | miniAppA, miniAppB | en-US | America/New_York |

---

## Navigation

### Deep Linking

**URL Schemes:**
- `superapp://`
- `https://superapp.com`

**Routes:**

| URL | Screen | Parameters |
|-----|--------|------------|
| `superapp://login` | Login | - |
| `superapp://register` | Register | - |
| `superapp://home` | Home | - |
| `superapp://mini-app/:appName` | MiniApp | `appName` |

**Example:**
```typescript
import { Linking } from 'react-native';

// Open deep link
Linking.openURL('superapp://mini-app/UserManagementApp');

// Listen for deep links
Linking.addEventListener('url', ({ url }) => {
  console.log('Deep link:', url);
});
```

### `DeepLinkHandler`

Service để quản lý pending deep links.

**Methods:**

#### `setPendingDeepLink(url)`
Lưu deep link khi user chưa login.

```typescript
deepLinkHandler.setPendingDeepLink('superapp://mini-app/UserManagementApp');
```

#### `getPendingDeepLink()`
Lấy pending deep link.

```typescript
const url = deepLinkHandler.getPendingDeepLink();
```

#### `clearPendingDeepLink()`
Xóa pending deep link.

```typescript
deepLinkHandler.clearPendingDeepLink();
```

#### `hasPendingDeepLink()`
Kiểm tra có pending deep link không.

```typescript
if (deepLinkHandler.hasPendingDeepLink()) {
  // Handle pending link
}
```

---

## Mini App Lifecycle

### `MiniAppLifecycleManager`

Manager để quản lý lifecycle events của Mini Apps.

**Methods:**

#### `addEventListener(miniAppName, event, listener)`
Đăng ký listener cho lifecycle event.

```typescript
const unsubscribe = miniAppLifecycleManager.addEventListener(
  'UserManagementApp',
  'focus',
  () => {
    console.log('Mini App focused');
  }
);

// Unsubscribe
unsubscribe();
```

#### `onMiniAppFocus(miniAppName)`
Thông báo Mini App được focus.

```typescript
miniAppLifecycleManager.onMiniAppFocus('UserManagementApp');
```

#### `onMiniAppBlur(miniAppName)`
Thông báo Mini App mất focus.

```typescript
miniAppLifecycleManager.onMiniAppBlur('UserManagementApp');
```

#### `onAppBackground()`
Thông báo app chuyển sang background.

```typescript
miniAppLifecycleManager.onAppBackground();
```

#### `onAppForeground()`
Thông báo app quay lại foreground.

```typescript
miniAppLifecycleManager.onAppForeground();
```

**Lifecycle Events:**

| Event | When Triggered | Use Case |
|-------|---------------|----------|
| `focus` | Mini App screen gains focus | Resume operations, fetch fresh data |
| `blur` | Mini App screen loses focus | Pause operations, save state |
| `background` | App goes to background | Stop heavy operations, cleanup |
| `foreground` | App comes to foreground | Resume operations, refresh data |

---

## Mini App Props

### `MiniAppProps`

Props được truyền cho Mini Apps.

```typescript
interface MiniAppProps {
  userToken: string;
  userInfo: {
    id: string;
    name: string;
    role: 'admin' | 'user' | 'guest';
    permissions: string[];
  };
  theme: 'light' | 'dark';
  language: 'vi' | 'en';
  onFocus?: () => void;
  onBlur?: () => void;
  onBackground?: () => void;
  onForeground?: () => void;
}
```

**Example Usage in Mini App:**
```typescript
export default function MyMiniApp({
  userToken,
  userInfo,
  theme,
  language,
  onFocus,
  onBlur,
}: MiniAppProps) {
  
  useEffect(() => {
    // Subscribe to focus
    onFocus?.();
    
    return () => {
      // Subscribe to blur
      onBlur?.();
    };
  }, [onFocus, onBlur]);
  
  return (
    <View>
      <Text>Welcome {userInfo.name}</Text>
      <Text>Role: {userInfo.role}</Text>
      {userInfo.permissions.includes('user.delete') && (
        <DeleteButton />
      )}
    </View>
  );
}
```

---

## Error Handling

### Authentication Errors

```typescript
try {
  await login(email, password);
} catch (error) {
  // Handle login error
  console.error('Login failed:', error);
}
```

### Permission Errors

```typescript
if (!hasPermission('user.delete')) {
  // Show error message
  Alert.alert('Access Denied', 'You do not have permission to delete users');
  return;
}
```

### Mini App Loading Errors

```typescript
// Handled automatically by RemoteLoader
// Shows error UI if loading fails
```

---

## Best Practices

### 1. Always Check Permissions

```typescript
// ❌ Bad
<DeleteButton onPress={deleteUser} />

// ✅ Good
{hasPermission('user.delete') && (
  <DeleteButton onPress={deleteUser} />
)}
```

### 2. Use Memoization

```typescript
// ✅ Good
const availableApps = useMemo(() => {
  return apps.filter(app => canAccessMiniApp(app.id));
}, [apps, canAccessMiniApp]);
```

### 3. Handle Loading States

```typescript
const { isLoading, isAuthenticated } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return <LoginScreen />;
}

return <HomeScreen />;
```

### 4. Cleanup Lifecycle Listeners

```typescript
useEffect(() => {
  const unsubscribe = onFocus?.(() => {
    // Handle focus
  });
  
  return () => {
    unsubscribe?.();
  };
}, [onFocus]);
```

---

**Version**: 2.0.0  
**Last Updated**: 2026-01-09
