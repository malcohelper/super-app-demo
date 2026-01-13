# Adding a New Mini App

This guide shows how to create and integrate a new Mini App into the Super App ecosystem using Re.Pack and Module Federation.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step 1: Configure Module Federation](#step-1-configure-module-federation)
- [Step 2: Implement Mini App Component](#step-2-implement-mini-app-component)
- [Step 3: Register with Host App](#step-3-register-with-host-app)
- [Step 4: Build and Deploy](#step-4-build-and-deploy)
- [Example: ChatApp](#example-chatapp)

## Prerequisites

- Node.js >= 20
- React Native CLI
- Understanding of Module Federation
- Super App Host running

## Quick Start

Create a new Mini App using Re.Pack template in one command:

Re.Pack provides the bundler and Module Federation support for React Native.

```bash
cd YourMiniApp

# Initialize Re.Pack with rspack bundler
npx @callstack/repack-init --bundler rspack --format mjs

# Install dependencies
npm install
```

This will:

- Add `@callstack/repack` and `@rspack/core` to devDependencies
- Create `rspack.config.mjs` with Re.Pack configuration
- Update `react-native.config.js` to use Re.Pack commands
- Update package.json scripts

## Step 3: Configure Module Federation

Edit `rspack.config.mjs` to expose your Mini App:

```javascript
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Repack from "@callstack/repack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default Repack.defineRspackConfig({
  context: __dirname,
  entry: "./index.js",
  resolve: {
    ...Repack.getResolveOptions(),
  },
  module: {
    rules: [
      {
        test: /\.[cm]?[jt]sx?$/,
        type: "javascript/auto",
        use: {
          loader: "@callstack/repack/babel-swc-loader",
          parallel: true,
          options: {},
        },
      },
      ...Repack.getAssetTransformRules(),
    ],
  },
  plugins: [
    new Repack.RepackPlugin(),
    new Repack.plugins.ModuleFederationPluginV1({
      name: "YourMiniApp",
      filename: "yourMiniApp.container.bundle",
      exposes: {
        "./App": "./App.tsx",
      },
      shared: {
        react: { singleton: true, eager: true },
        "react-native": { singleton: true, eager: true },
      },
    }),
  ],
});
```

### Key Configuration Points:

- **name**: Unique identifier for your Mini App
- **filename**: Output bundle name (convention: `camelCase.container.bundle`)
- **exposes**: Components/modules to expose (must include `./App`)
- **shared**: Shared dependencies with Host App (must include react and react-native)

## Step 2: Implement Mini App Component

Update `App.tsx` with your Mini App logic:

```typescript
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

interface UserInfo {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: string;
  permissions: string[];
}

interface MiniAppProps {
  userInfo?: UserInfo;
  userToken?: string;
  theme?: "light" | "dark";
  language?: string;
}

const YourMiniApp: React.FC<MiniAppProps> = ({
  userInfo,
  userToken,
  theme,
  language,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Mini App</Text>
        <Text style={styles.subtitle}>
          Welcome, {userInfo?.displayName || "Guest"}!
        </Text>
      </View>

      {/* Your Mini App Content */}
      <View style={styles.content}>
        <Text>Build your mini app here...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  subtitle: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default YourMiniApp;
```

### Props from Host App:

The Host App will pass these props to your Mini App:

- **userInfo**: Authenticated user information
  - `uid`: User ID
  - `email`: User email
  - `displayName`: User display name
  - `role`: User role (admin, user, guest)
  - `permissions`: Array of permission strings
- **userToken**: JWT authentication token
- **theme**: UI theme ('light' or 'dark')
- **language**: User's preferred language

## Step 3: Register with Host App

### 5.1 Update Remote Configuration

Edit `src/federation/remotes.config.ts` in the Host App:

```typescript
export const REMOTES: RemotesConfig = {
  // ... existing remotes
  YourMiniApp: {
    dev: "http://localhost:3003/yourMiniApp.container.bundle",
    prod: "https://your-cdn.com/YourMiniApp/ios/yourMiniApp.container.bundle",
    requiredPermissions: ["your.permission.here"], // Optional
    requiredRole: "user", // Optional: 'admin' | 'user' | 'guest'
    featureFlag: "YOUR_MINI_APP", // Optional
  },
};
```

### 5.2 Add Feature Flag (Optional)

Edit `src/features/featureFlags.config.ts`:

```typescript
export interface FeatureFlags {
  // ... existing flags
  YOUR_MINI_APP: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // ... existing flags
  YOUR_MINI_APP: true,
};
```

### 5.3 Add to Home Screen

Edit `src/screens/HomeScreen.tsx`:

```typescript
const MINI_APPS = [
  // ... existing apps
  {
    id: "YourMiniApp",
    name: "🎯 Your App",
    description: "Description of your mini app",
    icon: "🎯",
    color: "#FF6B6B",
  },
];
```

## Step 4: Build and Deploy

### Development

Update `package.json` scripts for a unique port:

```json
{
  "scripts": {
    "start": "react-native webpack-start --port 3003",
    "build:ios": "react-native webpack-bundle --platform ios --dev false --entry-file index.js --bundle-output build/ios/yourMiniApp.container.bundle",
    "build:android": "react-native webpack-bundle --platform android --dev false --entry-file index.js --bundle-output build/outputs/yourMiniApp.container.bundle"
  }
}
```

**Start development server:**

```bash
npm start
```

### Production Build

**iOS:**

```bash
npm run build:ios
# Bundle will be in: build/ios/yourMiniApp.container.bundle
```

**Android:**

```bash
npm run build:android
# Bundle will be in: build/outputs/yourMiniApp.container.bundle
```

### Deploy to CDN

Upload the generated bundle to your CDN:

```bash
# Example: AWS S3
aws s3 cp build/ios/yourMiniApp.container.bundle \
  s3://your-bucket/YourMiniApp/ios/yourMiniApp.container.bundle

aws s3 cp build/outputs/yourMiniApp.container.bundle \
  s3://your-bucket/YourMiniApp/android/yourMiniApp.container.bundle
```

### GitHub Pages (Example)

Create `.github/workflows/build.yml`:

```yaml
name: Build and Deploy YourMiniApp

on:
  push:
    branches: [main]
    paths:
      - "YourMiniApp/**"

jobs:
  build-ios:
    runs-on: macos-latest
    defaults:
      run:
        working-directory: ./YourMiniApp

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: YourMiniApp/package-lock.json

      - run: npm ci
      - run: npm run build:ios

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./YourMiniApp/build/ios
          destination_dir: YourMiniApp/ios
          keep_files: true
```

## Example: ChatApp

See the `AppChat` directory for a complete example:

```
AppChat/
├── App.tsx                    # Chat UI component
├── index.js                   # Entry point
├── rspack.config.mjs          # Re.Pack + Module Federation config
├── package.json               # Dependencies and scripts
├── babel.config.js            # Babel configuration
├── metro.config.js            # Metro configuration
└── .github/workflows/         # CI/CD pipeline
    └── build.yml
```

### ChatApp Features:

- ✅ User profile header with shared auth
- ✅ Local chat interface (no backend)
- ✅ Echo bot responses
- ✅ Module Federation exposed as `./App`
- ✅ Running on port 3002

### Run ChatApp:

```bash
cd AppChat
npm install
npm start
```

Then access from Host App by navigating to ChatApp.

## Best Practices

### 1. Bundle Naming Convention

- Use camelCase for bundle names: `yourMiniApp.container.bundle`
- Match the bundle name in rspack.config.mjs and remotes.config.ts

### 2. Port Assignment

- Assign unique ports to avoid conflicts
- Common convention: 3001, 3002, 3003, etc.
- Document port assignments in README

### 3. Shared Dependencies

- Always share `react` and `react-native` as singletons
- Use `eager: true` to load dependencies immediately
- Avoid duplicating large dependencies

### 4. Props Interface

- Always define TypeScript interfaces for props
- Make props optional with sensible defaults
- Document expected prop structure

### 5. Error Handling

- Handle missing userInfo gracefully
- Provide fallback UI for loading states
- Log errors for debugging

### 6. Security

- Never store sensitive data in Mini App
- Validate userToken on backend
- Respect user permissions

### 7. Testing

- Test as standalone app first
- Test integration with Host App
- Test on both iOS and Android

## Troubleshooting

### Module Federation Errors

**Error: Cannot find module './App'**

- Verify `exposes` path in rspack.config.mjs matches actual file
- Check that App.tsx has default export

**Error: Shared module not found**

- Ensure React versions match between Host and Mini App
- Check shared config in rspack.config.mjs

### Network Errors

**Error: Failed to load bundle**

- Verify Mini App dev server is running
- Check URL in remotes.config.ts matches dev server
- Ensure no firewall blocking localhost ports

### Build Errors

**Error: Cannot resolve module**

- Run `npm install` to ensure dependencies are installed
- Clear Metro cache: `npx react-native start --reset-cache`

## Additional Resources

- [Re.Pack Documentation](https://re-pack.dev/)
- [Module Federation Docs](https://module-federation.io/)
- [React Native Documentation](https://reactnative.dev/)
- [Super App Architecture](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Next Steps

1. Create your Mini App following this guide
2. Test locally with Host App
3. Build and deploy to CDN
4. Update Host App remote configuration
5. Test in production environment

For questions or issues, refer to the main [README](./README.md) or open an issue.
