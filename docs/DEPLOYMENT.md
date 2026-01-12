# Deployment Guide

> Production deployment guide for HostApp

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [iOS Deployment](#ios-deployment)
3. [Android Deployment](#android-deployment)
4. [Environment Configuration](#environment-configuration)
5. [CI/CD Setup](#cicd-setup)
6. [Monitoring & Analytics](#monitoring--analytics)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] Code coverage ≥ 85%
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code formatted (`npm run format`)

### Security
- [ ] Update to production API endpoints
- [ ] Remove debug logs
- [ ] Enable ProGuard (Android)
- [ ] Enable code obfuscation
- [ ] Review permissions in manifests

### Configuration
- [ ] Update app version in `package.json`
- [ ] Update build numbers
- [ ] Configure production feature flags
- [ ] Set production environment variables
- [ ] Update deep linking domains

### Assets
- [ ] App icons (all sizes)
- [ ] Splash screens
- [ ] App Store screenshots
- [ ] Privacy policy URL
- [ ] Terms of service URL

---

## iOS Deployment

### 1. Xcode Configuration

```bash
cd ios
open HostApp.xcworkspace
```

**Settings to update:**
1. **General Tab**
   - Display Name: `Super App`
   - Bundle Identifier: `com.superapp.host`
   - Version: `2.0.0`
   - Build: `1`

2. **Signing & Capabilities**
   - Team: Select your team
   - Provisioning Profile: Distribution
   - Add capabilities:
     - Associated Domains (for deep linking)
     - Push Notifications

3. **Info.plist**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>superapp</string>
    </array>
  </dict>
</array>

<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <false/>
</dict>
```

### 2. Build for Production

```bash
# Clean build
cd ios
rm -rf build
rm -rf Pods
pod install

# Build archive
xcodebuild -workspace HostApp.xcworkspace \
  -scheme HostApp \
  -configuration Release \
  -archivePath build/HostApp.xcarchive \
  archive

# Export IPA
xcodebuild -exportArchive \
  -archivePath build/HostApp.xcarchive \
  -exportPath build \
  -exportOptionsPlist ExportOptions.plist
```

### 3. Upload to App Store

**Option 1: Xcode**
1. Product → Archive
2. Window → Organizer
3. Select archive → Distribute App
4. App Store Connect → Upload

**Option 2: Transporter**
1. Open Transporter app
2. Drag IPA file
3. Click Deliver

**Option 3: Command Line**
```bash
xcrun altool --upload-app \
  --type ios \
  --file build/HostApp.ipa \
  --username "your@email.com" \
  --password "@keychain:AC_PASSWORD"
```

### 4. TestFlight

1. Go to App Store Connect
2. Select your app
3. TestFlight tab
4. Add internal testers
5. Submit for external testing (optional)

---

## Android Deployment

### 1. Generate Signing Key

```bash
cd android/app

# Generate keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore superapp-release.keystore \
  -alias superapp-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 2. Configure Gradle

**android/gradle.properties:**
```properties
MYAPP_RELEASE_STORE_FILE=superapp-release.keystore
MYAPP_RELEASE_KEY_ALIAS=superapp-key
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

**android/app/build.gradle:**
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Build APK/AAB

```bash
cd android

# Build APK
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease

# Output locations:
# APK: android/app/build/outputs/apk/release/app-release.apk
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Upload to Play Store

**Option 1: Play Console**
1. Go to Google Play Console
2. Select your app
3. Production → Create new release
4. Upload AAB
5. Fill release notes
6. Review and rollout

**Option 2: Command Line (Fastlane)**
```bash
fastlane supply \
  --aab android/app/build/outputs/bundle/release/app-release.aab \
  --track production
```

### 5. ProGuard Rules

**android/app/proguard-rules.pro:**
```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Module Federation
-keep class com.callstack.repack.** { *; }

# Keep Mini App interfaces
-keep interface com.superapp.host.** { *; }
```

---

## Environment Configuration

### Development
```bash
# .env.development
API_URL=https://api-dev.superapp.com
FEATURE_FLAG_URL=https://flags-dev.superapp.com
ANALYTICS_KEY=dev-analytics-key
SENTRY_DSN=https://dev-sentry-dsn
```

### Staging
```bash
# .env.staging
API_URL=https://api-staging.superapp.com
FEATURE_FLAG_URL=https://flags-staging.superapp.com
ANALYTICS_KEY=staging-analytics-key
SENTRY_DSN=https://staging-sentry-dsn
```

### Production
```bash
# .env.production
API_URL=https://api.superapp.com
FEATURE_FLAG_URL=https://flags.superapp.com
ANALYTICS_KEY=prod-analytics-key
SENTRY_DSN=https://prod-sentry-dsn
```

---

## CI/CD Setup

### GitHub Actions

**.github/workflows/ios.yml:**
```yaml
name: iOS Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Install pods
        run: cd ios && pod install
        
      - name: Build iOS
        run: |
          xcodebuild -workspace ios/HostApp.xcworkspace \
            -scheme HostApp \
            -configuration Release \
            -archivePath build/HostApp.xcarchive \
            archive
```

**.github/workflows/android.yml:**
```yaml
name: Android Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '11'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build Android
        run: |
          cd android
          ./gradlew bundleRelease
```

### Fastlane

**Fastfile:**
```ruby
default_platform(:ios)

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    increment_build_number
    build_app(scheme: "HostApp")
    upload_to_testflight
  end
  
  desc "Deploy to App Store"
  lane :release do
    build_app(scheme: "HostApp")
    upload_to_app_store
  end
end

platform :android do
  desc "Deploy to Play Store"
  lane :release do
    gradle(task: "bundleRelease")
    upload_to_play_store
  end
end
```

---

## Monitoring & Analytics

### 1. Sentry Setup

```bash
npm install @sentry/react-native
```

**App.tsx:**
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export default Sentry.wrap(App);
```

### 2. Firebase Analytics

```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/analytics
```

**Track Events:**
```typescript
import analytics from '@react-native-firebase/analytics';

// Track screen view
await analytics().logScreenView({
  screen_name: 'HomeScreen',
  screen_class: 'HomeScreen',
});

// Track Mini App load
await analytics().logEvent('mini_app_loaded', {
  app_name: 'UserManagementApp',
  load_time: 1234,
});
```

### 3. Performance Monitoring

```typescript
import perf from '@react-native-firebase/perf';

// Track Mini App load time
const trace = await perf().startTrace('mini_app_load');
await loadMiniApp();
await trace.stop();
```

---

## Post-Deployment

### Monitoring Checklist
- [ ] Check crash reports (Sentry)
- [ ] Monitor app performance (Firebase)
- [ ] Review user analytics
- [ ] Check API error rates
- [ ] Monitor token refresh success rate

### Rollback Plan
1. Keep previous version available
2. Monitor crash rate (< 1%)
3. If issues detected:
   - Pause rollout
   - Fix critical bugs
   - Submit hotfix
4. Resume rollout after verification

---

## Versioning Strategy

### Semantic Versioning
```
MAJOR.MINOR.PATCH

2.0.0 → Major release (breaking changes)
2.1.0 → Minor release (new features)
2.1.1 → Patch release (bug fixes)
```

### Build Numbers
- iOS: Increment for each build
- Android: `versionCode` auto-incremented

---

## Support & Maintenance

### Regular Updates
- [ ] Weekly dependency updates
- [ ] Monthly security patches
- [ ] Quarterly feature releases

### Monitoring
- [ ] Daily crash reports review
- [ ] Weekly performance metrics
- [ ] Monthly user feedback review

---

**Version**: 2.0.0  
**Last Updated**: 2026-01-09
