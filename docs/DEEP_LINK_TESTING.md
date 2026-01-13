# Deep Link Testing Guide

## 🎯 How Deep Links Work

### Scenario 1: App Đang Mở (Foreground)

- Deep link được xử lý ngay lập tức
- Listener `Linking.addEventListener('url')` bắt sự kiện
- Navigate trực tiếp đến screen tương ứng

### Scenario 2: App Bị Kill (Killed/Not Running)

- Deep link được lưu trong `Linking.getInitialURL()`
- **Nếu chưa login:**
  - Lưu deep link vào `pendingDeepLink`
  - Hiển thị màn hình Login
  - Sau khi login thành công → tự động navigate đến deep link đã lưu
- **Nếu đã login (có token trong AsyncStorage):**
  - Load token và user info
  - Navigate trực tiếp đến deep link

### Scenario 3: App Ở Background

- Tương tự Scenario 1 (Foreground)
- Listener vẫn hoạt động

---

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
# 1. Logout trong app (hoặc xóa app data)
# 2. Kill app hẳn (swipe up từ app switcher)
# 3. Trigger deep link:

# iOS
xcrun simctl openurl booted "superapp://mini-app/UserManagementApp"

# Android
adb shell am start -a android.intent.action.VIEW -d "superapp://mini-app/UserManagementApp"
```

**Expected Result:**

- ✅ App opens và hiển thị Login screen
- ✅ Deep link được lưu vào `pendingDeepLink`
- ✅ Sau khi login → tự động navigate đến UserManagementApp
- ✅ Mini App loads với token mới từ API

**Lưu ý quan trọng:**

- Token phải được lưu vào AsyncStorage khi login thành công
- AuthContext sẽ tự động load token khi app khởi động
- Nếu token hết hạn (>1 giờ), app sẽ logout và yêu cầu login lại

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

### Issue 2: Deep link opens but doesn't navigate (App đang mở)

**Cause:** Listener không handle navigation

**Solution:**

- Đã fix bằng cách thêm `handleDeepLink()` function trong RootNavigator
- Function này parse URL và gọi `navigation.navigate()` trực tiếp

**Check logs:**

```bash
🔗 [Deep Link] Received URL in foreground: superapp://mini-app/UserManagementApp
🔗 [Deep Link] Handling URL: superapp://mini-app/UserManagementApp { isAuthenticated: true }
🔗 [Deep Link] Parsed path: mini-app/UserManagementApp
🔗 [Deep Link] Navigating to MiniApp: UserManagementApp
```

### Issue 3: Kill app thì không load được mini app (No token)

**Cause:** Khi kill app và trigger deep link, nếu chưa login thì không có token để call API

**Solution:**

1. **Khi chưa login:** Deep link được lưu vào `pendingDeepLink`
2. **Sau khi login:** Tự động navigate đến pending deep link
3. **Nếu đã login trước:** Token được load từ AsyncStorage, navigate trực tiếp

**Check logs:**

```bash
# Khi chưa login:
🔗 [Deep Link] Initial URL: superapp://mini-app/UserManagementApp
🔗 [Deep Link] Not authenticated, saving pending URL

# Sau khi login:
🔗 [Deep Link] Auth state changed: { isAuthenticated: true }
🔗 [Deep Link] Processing pending URL: superapp://mini-app/UserManagementApp
🔗 [Deep Link] Handling pending URL
🔗 [Deep Link] Navigating to MiniApp: UserManagementApp
```

**Verify AsyncStorage:**

```bash
# Check if token is saved
# In React Native Debugger console:
AsyncStorage.getItem('@super_app_token').then(console.log)
AsyncStorage.getItem('@super_app_token_timestamp').then(console.log)
AsyncStorage.getItem('@super_app_user_info').then(console.log)
```

### Issue 4: Token expired khi mở deep link

**Cause:** Token có thời hạn 1 giờ, nếu quá 1 giờ thì bị expired

**Solution:**

- AuthContext tự động check `isTokenExpired()` khi load
- Nếu expired → logout và yêu cầu login lại
- Deep link được lưu và navigate sau khi login

### Issue 5: Deep link opens but app crashes

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

- [ ] **App đang mở:** Deep link navigate ngay lập tức
- [ ] **App đang mở:** Navigate đến mini app khác
- [ ] **App bị kill + đã login:** Navigate trực tiếp (load token từ AsyncStorage)
- [ ] **App bị kill + chưa login:** Hiển thị Login → sau login navigate đến mini app
- [ ] **Token expired:** Logout tự động → Login → Navigate đến mini app
- [ ] iOS: Test trên simulator
- [ ] iOS: Test trên real device
- [ ] Android: Test trên emulator
- [ ] Android: Test trên real device
- [ ] No crashes or errors
- [ ] Mini app load với token và user info đúng

---

## 🔍 Debug Tips

### 1. Check Deep Link Logs

Tìm các logs này trong Metro Bundler:

```
🔗 [Deep Link] Setting up listeners...
🔗 [Deep Link] Received URL in foreground: <url>
🔗 [Deep Link] Handling URL: <url>
🔗 [Deep Link] Navigating to MiniApp: <appName>
```

### 2. Check Auth State

```typescript
// In React Native Debugger
console.log("Auth:", {
  isAuthenticated,
  isLoading,
  userToken,
  userInfo,
});
```

### 3. Check AsyncStorage

```typescript
// Check saved token
AsyncStorage.getItem("@super_app_token").then((token) => {
  console.log("Token:", token);
});

// Check timestamp
AsyncStorage.getItem("@super_app_token_timestamp").then((timestamp) => {
  const age = Date.now() - parseInt(timestamp);
  console.log("Token age (minutes):", age / 1000 / 60);
});
```

### 4. Test Token Expiration

```typescript
// Manually expire token for testing
AsyncStorage.setItem(
  "@super_app_token_timestamp",
  (Date.now() - 2 * 60 * 60 * 1000).toString() // 2 hours ago
);
```

---

## 📊 Test Checklist

- [ ] **App đang mở:** Deep link navigate ngay lập tức
- [ ] **App đang mở:** Navigate đến mini app khác
- [ ] **App bị kill + đã login:** Navigate trực tiếp (load token từ AsyncStorage)
- [ ] **App bị kill + chưa login:** Hiển thị Login → sau login navigate đến mini app
- [ ] **Token expired:** Logout tự động → Login → Navigate đến mini app
- [ ] iOS: Test trên simulator
- [ ] iOS: Test trên real device
- [ ] Android: Test trên emulator
- [ ] Android: Test trên real device
- [ ] No crashes or errors
- [ ] Mini app load với token và user info đúng

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
