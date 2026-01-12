# HostApp Architecture Documentation

> Chi tiết về kiến trúc hệ thống, design patterns, và implementation details

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Provider Hierarchy                     │ │
│  │                                                     │ │
│  │  SafeAreaProvider                                   │ │
│  │    └─ RegionProvider (Auto-detect user region)     │ │
│  │       └─ TenantProvider (Multi-org support)        │ │
│  │          └─ FeatureFlagProvider (Feature control)  │ │
│  │             └─ AuthProvider (Authentication)       │ │
│  │                └─ PermissionProvider (RBAC)        │ │
│  │                   └─ RootNavigator                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Navigation Layer                       │ │
│  │                                                     │ │
│  │  • Stack Navigation (Auth, Home, MiniApp)          │ │
│  │  • Deep Linking (superapp://)                      │ │
│  │  • Authentication Guards                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Module Federation Layer                   │ │
│  │                                                     │ │
│  │  • RemoteLoader (Dynamic loading)                  │ │
│  │  • ScriptManager (Bundle management)               │ │
│  │  • MiniAppLifecycleManager (Events)                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    Mini Apps (Remote)                    │
│                                                          │
│  • UserManagementApp (User CRUD)                        │
│  • miniAppA (Sample A)                                  │
│  • miniAppB (Sample B)                                  │
└─────────────────────────────────────────────────────────┘
```

## 🏗️ Core Components

### 1. Authentication System

**Components:**
- `AuthContext` - Global auth state
- `TokenRefreshService` - Auto token refresh
- `tokenUtils` - Token generation & validation

**Flow:**
```
User Login
    ↓
Validate Credentials (Dummy)
    ↓
Generate Token with Role & Permissions
    ↓
Store in AsyncStorage
    ↓
Start Token Refresh Service
    ↓
Update Auth State
    ↓
Navigate to Home
```

**Token Structure:**
```typescript
{
  sub: "user_id",
  email: "user@example.com",
  name: "User Name",
  role: "admin" | "user" | "guest",
  permissions: ["user.read", "user.create", ...],
  iat: 1704801600000,  // Issued at
  exp: 1704888000000   // Expires at (24h)
}
```

### 2. Permission System (RBAC)

**Architecture:**
```
PermissionContext
    ├─ hasPermission(permission: string)
    ├─ hasRole(role: string)
    ├─ hasAnyPermission(permissions: string[])
    ├─ hasAllPermissions(permissions: string[])
    └─ canAccessMiniApp(appName, permissions, role)
```

**Permission Hierarchy:**
```
admin
  ├─ user.create
  ├─ user.read
  ├─ user.update
  ├─ user.delete
  ├─ miniapp.access.all
  └─ analytics.view

user
  ├─ user.read
  └─ miniapp.access.basic

guest
  └─ (no permissions)
```

### 3. Feature Flag System

**Architecture:**
```
FeatureFlagContext
    ├─ Local Flags (featureFlags.config.ts)
    └─ Remote Flags (RemoteFeatureFlagService)
         ├─ Fetch from API
         ├─ Cache in AsyncStorage (1 hour)
         └─ Fallback to local defaults
```

**Flag Evaluation:**
```typescript
1. Check remote cache (if valid)
2. If cache expired → fetch from remote
3. If fetch fails → use local defaults
4. Merge remote with local (remote takes precedence)
5. Return final flags
```

### 4. Multi-Tenancy System

**Tenant Model:**
```typescript
interface Tenant {
  id: string;              // Unique tenant ID
  name: string;            // Organization name
  domain: string;          // Custom domain
  region: string;          // Geographic region
  config: {
    theme?: 'light' | 'dark';
    language?: 'vi' | 'en';
    features?: string[];   // Tenant-specific features
  };
}
```

**Tenant Resolution:**
```
App Launch
    ↓
Check subdomain/domain
    ↓
Resolve tenant from domain
    ↓
Load tenant configuration
    ↓
Apply tenant-specific settings
    ↓
Filter features by tenant
```

### 5. Region-Based Access

**Region Detection:**
```typescript
// Auto-detect from timezone
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

if (timezone.includes('Asia')) → 'asia'
if (timezone.includes('Europe')) → 'europe'
if (timezone.includes('America')) → 'americas'
else → 'global'
```

**Region Configuration:**
```typescript
{
  asia: {
    enabledFeatures: ['MINI_APP_USER_MANAGEMENT', 'MINI_APP_A'],
    enabledMiniApps: ['UserManagementApp', 'miniAppA'],
    locale: 'vi-VN',
    timezone: 'Asia/Ho_Chi_Minh'
  }
}
```

## 🔄 Data Flow

### Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │ 1. Enter credentials
     ↓
┌─────────────┐
│ LoginScreen │
└──────┬──────┘
       │ 2. Call login()
       ↓
┌──────────────┐
│ AuthContext  │
└──────┬───────┘
       │ 3. Generate token
       │ 4. Get role permissions
       │ 5. Save to AsyncStorage
       ↓
┌────────────────────┐
│ TokenRefreshService│
└──────┬─────────────┘
       │ 6. Start auto-refresh
       ↓
┌─────────────────┐
│ RootNavigator   │
└──────┬──────────┘
       │ 7. Navigate to Home
       ↓
┌─────────────┐
│ HomeScreen  │
└─────────────┘
```

### Mini App Loading Flow

```
User selects Mini App
    ↓
Check permissions & feature flags
    ↓
Navigate to MiniAppScreen
    ↓
RemoteLoader receives appName
    ↓
ScriptManager.loadScript(appName)
    ↓
Download bundle from CDN
    ↓
Initialize Module Federation container
    ↓
Get module from container
    ↓
Render Mini App with props:
    - userToken
    - userInfo (with role & permissions)
    - theme
    - language
    - lifecycle callbacks
```

### Permission Check Flow

```
Component renders
    ↓
Call usePermissions()
    ↓
Check user permissions
    ↓
┌─────────────────────┐
│ Is user admin?      │
│ Yes → Allow all     │
│ No → Check specific │
└─────────────────────┘
    ↓
Check required permissions
    ↓
Return true/false
    ↓
Conditionally render UI
```

## 🎨 Design Patterns

### 1. Context Pattern

**Usage:** Global state management

```typescript
// Provider
<AuthProvider>
  <App />
</AuthProvider>

// Consumer
const { userInfo } = useAuth();
```

**Benefits:**
- Avoid prop drilling
- Centralized state
- Easy to test

### 2. Higher-Order Component (HOC)

**Usage:** Permission-based rendering

```typescript
const withPermission = (Component, permission) => {
  return (props) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(permission)) {
      return <AccessDenied />;
    }
    
    return <Component {...props} />;
  };
};
```

### 3. Service Pattern

**Usage:** Business logic separation

```typescript
class TokenRefreshService {
  start(onSuccess, onFailure) { ... }
  stop() { ... }
  refresh() { ... }
}

export const tokenRefreshService = new TokenRefreshService();
```

### 4. Factory Pattern

**Usage:** Token generation

```typescript
function generateDummyToken(userId, email, name, role, permissions) {
  const payload = { sub, email, name, role, permissions, iat, exp };
  return encode(payload);
}
```

## 🔐 Security Architecture

### Token Security

```
Token Generation
    ↓
Base64 Encoding (Demo only!)
    ↓
Store in AsyncStorage
    ↓
Auto-refresh before expiration
    ↓
Validate on each request
```

> **Note:** Production should use proper JWT with signing!

### Permission Enforcement

```
UI Layer
    ├─ Hide unauthorized elements
    ├─ Disable unauthorized actions
    └─ Show access denied messages

API Layer (Future)
    ├─ Validate token
    ├─ Check permissions
    └─ Return 403 if unauthorized
```

## 📊 Performance Optimizations

### 1. Memoization

```typescript
// Memoize expensive computations
const availableMiniApps = useMemo(() => {
  return MINI_APPS.filter(app => canAccessMiniApp(app));
}, [canAccessMiniApp, isFeatureEnabled]);
```

### 2. Lazy Loading

```typescript
// Mini Apps are loaded on-demand
<RemoteLoader appName={appName} />
```

### 3. Caching

```typescript
// Feature flags cached for 1 hour
// Tokens cached until expiration
// Region config cached on app launch
```

## 🧩 Module Federation

### Container Configuration

```javascript
// rspack.config.mjs
new ModuleFederationPlugin({
  name: 'HostApp',
  shared: {
    react: { singleton: true },
    'react-native': { singleton: true },
  },
})
```

### Remote Loading

```typescript
// 1. Load script
await ScriptManager.shared.loadScript(appName);

// 2. Get container
const container = global[appName];

// 3. Initialize sharing scope
await container.init(__webpack_share_scopes__.default);

// 4. Get module
const factory = await container.get('./App');
const module = factory();

// 5. Render
<module.default {...props} />
```

## 🔄 Lifecycle Management

### App Lifecycle

```
App Launch
    ↓
Load Auth State
    ↓
Start Token Refresh (if authenticated)
    ↓
Detect Region
    ↓
Load Feature Flags
    ↓
Render Navigation
```

### Mini App Lifecycle

```
Screen Focus
    ↓
MiniAppLifecycleManager.onMiniAppFocus()
    ↓
Emit 'focus' event
    ↓
Mini App receives onFocus callback
    ↓
Resume operations

Screen Blur
    ↓
MiniAppLifecycleManager.onMiniAppBlur()
    ↓
Emit 'blur' event
    ↓
Mini App receives onBlur callback
    ↓
Pause operations
```

## 📱 Platform-Specific Considerations

### iOS

- Deep linking via Universal Links
- Token storage in Keychain (future)
- Background refresh limitations

### Android

- Deep linking via Intent Filters
- Token storage in EncryptedSharedPreferences (future)
- Background service for token refresh

## 🚀 Scalability

### Horizontal Scaling

- **Mini Apps**: Add new apps without modifying host
- **Features**: Toggle via feature flags
- **Regions**: Add new regions in config
- **Tenants**: Unlimited tenants supported

### Vertical Scaling

- **Permissions**: Add new permissions to role config
- **Roles**: Add new roles with custom permissions
- **Providers**: Add new context providers as needed

## 📈 Future Enhancements

1. **Analytics Integration**
   - Track user behavior
   - Monitor Mini App performance
   - A/B testing framework

2. **Offline Support**
   - Cache Mini App bundles
   - Offline authentication
   - Sync when online

3. **Push Notifications**
   - Deep link from notifications
   - Mini App-specific notifications
   - Permission-based notification routing

4. **Advanced Security**
   - Biometric authentication
   - Certificate pinning
   - Encrypted storage

---

**Version**: 2.0.0  
**Last Updated**: 2026-01-09
