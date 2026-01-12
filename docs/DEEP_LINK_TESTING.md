# Deep Link Testing Guide

## ✅ Đã Cấu Hình

### iOS
- ✅ Đã thêm `CFBundleURLTypes` vào `Info.plist`
- ✅ URL Scheme: `superapp://`

### Android
- ✅ Đã thêm intent filter vào `AndroidManifest.xml`
- ✅ URL Scheme: `superapp://`

---

## 🚀 Cách Test

### Bước 1: Rebuild App

**iOS:**
```bash
cd ios
rm -rf build
pod install
cd ..
npm run ios
```

**Android:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### Bước 2: Test Deep Links

#### Option 1: Sử dụng Script Tự Động (Recommended)

```bash
# Chạy script test
./test-deeplinks.sh

# Chọn platform:
# 1 = iOS only
# 2 = Android only
# 3 = Both
```

#### Option 2: Test Thủ Công

**iOS:**
```bash
# Test từng URL
xcrun simctl openurl booted "superapp://mini-app/UserManagementApp"
xcrun simctl openurl booted "superapp://home"
xcrun simctl openurl booted "superapp://login"
```

**Android:**
```bash
# Test từng URL
adb shell am start -a android.intent.action.VIEW -d "superapp://mini-app/UserManagementApp"
adb shell am start -a android.intent.action.VIEW -d "superapp://home"
adb shell am start -a android.intent.action.VIEW -d "superapp://login"
```

---

## 📋 Test Scenarios

### Scenario 1: Open Mini App (Logged In)
```bash
# iOS
xcrun simctl openurl booted "superapp://mini-app/UserManagementApp"

# Android
adb shell am start -a android.intent.action.VIEW -d "superapp://mini-app/UserManagementApp"
```

**Expected Result:**
- ✅ App opens
- ✅ Navigate directly to UserManagementApp screen
- ✅ Mini App loads with user data

### Scenario 2: Open Mini App (Not Logged In)
```bash
# Logout first in the app, then:
xcrun simctl openurl booted "superapp://mini-app/UserManagementApp"
```

**Expected Result:**
- ✅ App opens
- ✅ Shows Login screen
- ✅ After login → automatically navigate to UserManagementApp

### Scenario 3: Navigate to Home
```bash
xcrun simctl openurl booted "superapp://home"
```

**Expected Result:**
- ✅ App opens
- ✅ Navigate to Home screen
- ✅ Shows list of Mini Apps

### Scenario 4: Open Login Screen
```bash
xcrun simctl openurl booted "superapp://login"
```

**Expected Result:**
- ✅ App opens
- ✅ Shows Login screen

---

## 🔍 Verify Deep Link Setup

### iOS - Check URL Scheme Registration
```bash
# View Info.plist
cat ios/HostApp/Info.plist | grep -A 10 "CFBundleURLTypes"
```

**Expected Output:**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleTypeRole</key>
    <string>Editor</string>
    <key>CFBundleURLName</key>
    <string>com.hostapp</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>superapp</string>
    </array>
  </dict>
</array>
```

### Android - Check Intent Filter
```bash
# View AndroidManifest.xml
cat android/app/src/main/AndroidManifest.xml | grep -A 5 "intent-filter"
```

**Expected Output:**
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="superapp" />
</intent-filter>
```

---

## 🐛 Troubleshooting

### Issue 1: "No app found to handle URL"

**Solution:**
```bash
# iOS - Rebuild
npm run ios

# Android - Rebuild
npm run android
```

### Issue 2: Deep link opens but doesn't navigate

**Check console logs:**
```bash
# Look for these logs:
📱 Deep link received: superapp://mini-app/UserManagementApp
[Navigation] Navigating to: MiniApp
```

**Verify linking config:**
```typescript
// In RootNavigator.tsx
<NavigationContainer ref={navigationRef} linking={linkingConfig}>
```

### Issue 3: App crashes on deep link

**Check:**
1. Navigation routes are defined correctly
2. Screen components exist
3. No TypeScript errors

---

## 📱 Test on Real Device

### iOS
```bash
# List connected devices
xcrun devicectl device info devices

# Open URL on device
xcrun simctl openurl <DEVICE_UDID> "superapp://mini-app/UserManagementApp"
```

Or send link via Messages/Email and tap it.

### Android
```bash
# Check connected devices
adb devices

# Send deep link
adb shell am start -a android.intent.action.VIEW -d "superapp://mini-app/UserManagementApp"
```

---

## 🧪 All Test URLs

```bash
# Authentication
superapp://login
superapp://register

# Main App
superapp://home

# Mini Apps
superapp://mini-app/UserManagementApp
superapp://mini-app/miniAppA
superapp://mini-app/miniAppB
```

---

## 📊 Test Checklist

- [ ] iOS: Open app from deep link (app closed)
- [ ] iOS: Navigate via deep link (app running)
- [ ] iOS: Deep link when not logged in
- [ ] Android: Open app from deep link (app closed)
- [ ] Android: Navigate via deep link (app running)
- [ ] Android: Deep link when not logged in
- [ ] All routes work correctly
- [ ] Pending deep link works after login
- [ ] No crashes or errors

---

## 💡 Tips

1. **Watch Metro Bundler logs** for deep link events
2. **Use React Native Debugger** to inspect navigation state
3. **Test on both simulator and real device**
4. **Test with app in different states** (closed, background, foreground)

---

**Quick Test Command:**
```bash
# iOS
xcrun simctl openurl booted "superapp://mini-app/UserManagementApp"

# Android
adb shell am start -a android.intent.action.VIEW -d "superapp://mini-app/UserManagementApp"
```

✅ **Setup Complete! Ready to test deep links!**
