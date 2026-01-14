# Chat Native Module Integration - Implementation Guide

## ✅ Completed Implementation

The chat system has been fully integrated into the super app with offline-first architecture, following the specifications from `super_app_chat_architecture.md` and `chat_offline_queue_delivery_semantics_extension.md`.

---

## 📁 Architecture Overview

```
┌──────────────────────────┐
│       Mini App           │
│  (import from @host-sdk) │
└───────────▲──────────────┘
            │ native.chat API
┌───────────┴──────────────┐
│    Host SDK (JS Layer)   │
│  src/host-sdk/native.ts  │
└───────────▲──────────────┘
            │
┌───────────┴──────────────┐
│   ChatContext (React)    │
│ src/chat/ChatContext.tsx │
└───────────▲──────────────┘
            │
┌───────────┴──────────────┐
│  chatNativeApi (Bridge)  │
│ src/chat/chatNativeApi.ts│
└───────────▲──────────────┘
            │ NativeEventEmitter
┌───────────┴──────────────┐
│  ChatNativeModule (iOS)  │
│  ChatNativeModule (Kotlin)│
└───────────▲──────────────┘
            │
┌───────────┴──────────────┐
│    ChatService (Core)    │
│ Firebase + SQLite/Room   │
└──────────────────────────┘
```

---

## 📦 File Structure

### Native Layer (iOS)

- `ios/HostApp/Modules/ChatModels.swift` - Data models
- `ios/HostApp/Modules/ChatDatabase.swift` - SQLite OUTBOX/INBOX
- `ios/HostApp/Modules/ChatService.swift` - Firebase operations + offline queue
- `ios/HostApp/Modules/ChatNativeModule.swift` - React Native bridge
- `ios/HostApp/Modules/ChatNativeModule.m` - Bridge interface

### Native Layer (Android)

- `android/app/src/main/java/com/hostapp/modules/chat/ChatModels.kt` - Data models
- `android/app/src/main/java/com/hostapp/modules/chat/ChatDatabase.kt` - SQLite OUTBOX/INBOX
- `android/app/src/main/java/com/hostapp/modules/chat/ChatService.kt` - Firebase operations + offline queue
- `android/app/src/main/java/com/hostapp/modules/chat/ChatNativeModule.kt` - React Native bridge
- `android/app/src/main/java/com/hostapp/modules/chat/ChatPackage.kt` - Package registration

### JavaScript Layer

- `src/chat/types.ts` - TypeScript type definitions
- `src/chat/chatNativeApi.ts` - Native module wrapper
- `src/chat/ChatContext.tsx` - React Context for global state
- `src/chat/useChatAuth.ts` - Authentication integration hook
- `src/chat/index.ts` - Public exports

### Host SDK Integration

- `src/host-sdk/types.ts` - Added `ChatCapabilities` interface
- `src/host-sdk/native.ts` - Expose chat API to mini apps
- `App.tsx` - ChatProvider integration

---

## 🔥 Firebase Configuration

### Step 1: Add Configuration Files

You need to download these files from Firebase Console:

#### iOS

```bash
# Place at: ios/HostApp/GoogleService-Info.plist
```

#### Android

```bash
# Place at: android/app/google-services.json
```

### Step 2: Firebase Console Setup

1. Create project at https://console.firebase.google.com
2. Add iOS app (bundle ID: `com.hostapp`)
3. Add Android app (package: `com.hostapp`)
4. Enable **Realtime Database**
5. Enable **Firestore**
6. Enable **Authentication** → Email/Password
7. Configure Database Rules (see CHAT_API.md)

### Step 3: Database Rules

See `CHAT_API.md` attachment for complete Realtime Database and Firestore security rules.

---

## 🚀 Installation

```bash
# Install dependencies
npm install

# iOS
cd ios && pod install && cd ..

# Run
npm run ios
# or
npm run android
```

---

## 💻 Usage Examples

### For Mini Apps

Mini apps can use chat via Host SDK without knowing about Firebase:

```typescript
// In Mini App
import { native } from "@host-sdk";

// Send a message
const message = await native.chat.sendMessage("room123", {
  text: "Hello from mini app!",
  type: "text",
});

// Subscribe to room messages
const unsubscribe = native.chat.subscribeRoom("room123", (event) => {
  if (event.type === "message_added") {
    console.log("New message:", event.message);
  } else if (event.type === "message_ack") {
    console.log("Message sent:", event.messageId);
  } else if (event.type === "message_failed") {
    console.error("Message failed:", event.reason);
  }
});

// Get user's rooms
const { rooms } = await native.chat.getRooms();

// Get messages for a room
const messages = native.chat.getMessagesForRoom("room123");

// Cleanup
unsubscribe();
```

### For Host App

```typescript
import { useChatContext, useChatAuth } from "./src/chat";

function ChatScreen() {
  const { isChatReady } = useChatAuth(); // Auto-authenticates
  const { sendMessage, subscribeRoom, rooms } = useChatContext();

  useEffect(() => {
    if (!isChatReady) return;

    const unsubscribe = subscribeRoom("room123", (event) => {
      console.log("Chat event:", event);
    });

    return unsubscribe;
  }, [isChatReady]);

  const handleSend = async () => {
    await sendMessage("room123", {
      text: "Hello!",
      type: "text",
    });
  };

  return <View>...</View>;
}
```

---

## 🔐 Authentication Flow

### Backend Token Exchange

You need to implement this endpoint in your backend:

```typescript
// POST /api/chat/auth/exchange-token
// Request:
{
  "userToken": "app_user_token",
  "userId": "user123",
  "displayName": "John Doe"
}

// Response:
{
  "success": true,
  "data": {
    "customToken": "firebase_custom_token"
  }
}
```

### Backend Implementation (Node.js + Firebase Admin)

```typescript
import admin from "firebase-admin";

app.post("/api/chat/auth/exchange-token", async (req, res) => {
  const { userToken, userId, displayName } = req.body;

  // 1. Verify app token
  const user = await verifyAppToken(userToken);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // 2. Create Firebase custom token
  const customToken = await admin.auth().createCustomToken(userId, {
    displayName,
  });

  res.json({
    success: true,
    data: { customToken },
  });
});
```

---

## 📨 Message Delivery Semantics

### Offline-First Flow

```
1. User sends message → Save to OUTBOX (PENDING)
2. Emit optimistic `message_added` (localId)
3. Background worker sends to Firebase
4. On success → Emit `message_ack` (localId + messageId)
5. On failure → Retry with exponential backoff
6. Max retries → Emit `message_failed`
```

### Message States

| State       | Meaning                        |
| ----------- | ------------------------------ |
| `SENDING`   | Optimistic UI, not yet sent    |
| `SENT`      | Server acknowledged            |
| `DELIVERED` | Received by recipient (future) |
| `READ`      | Read by recipient (future)     |
| `FAILED`    | Max retries exceeded           |

### Idempotency

- Messages have client-generated IDs: `{userId}_{timestamp}_{random}`
- Firebase write uses messageId as key
- Duplicate writes are ignored (idempotent)
- Safe to retry without creating duplicates

---

## 🧪 Testing

### Test Chat Initialization

```typescript
import { chatNativeApi } from "./src/chat/chatNativeApi";

await chatNativeApi.initialize();
await chatNativeApi.authenticate("firebase_custom_token");
```

### Test Offline Queue

1. Enable airplane mode
2. Send messages
3. Check SQLite database (OUTBOX table)
4. Disable airplane mode
5. Messages should auto-send
6. Check for `message_ack` events

### Test Idempotency

1. Send message with network delay
2. Kill app mid-send
3. Restart app
4. Message should retry without duplicate

---

## 🔧 Configuration

### Retry Strategy

Edit in native code:

**iOS**: `ChatService.swift`

```swift
private let maxRetryCount = 5
private let retryDelays: [TimeInterval] = [1, 2, 4, 8, 16]
```

**Android**: `ChatService.kt`

```kotlin
private val maxRetryCount = 5
private val retryDelays = listOf<Long>(1000, 2000, 4000, 8000, 16000)
```

### Background Sync Interval

**iOS**: `ChatService.swift`

```swift
Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { ... }
```

**Android**: `ChatService.kt`

```kotlin
delay(10000) // 10 seconds
```

---

## 🐛 Troubleshooting

### iOS Build Errors

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Android Build Errors

```bash
# Clean build
cd android
./gradlew clean
cd ..
npm run android
```

### Firebase Not Initialized

- Check `GoogleService-Info.plist` (iOS) exists
- Check `google-services.json` (Android) exists
- Verify bundle ID / package name matches Firebase console

### Messages Not Sending

1. Check Firebase auth (user logged in?)
2. Check network connectivity
3. Check OUTBOX table in SQLite
4. Check native logs for errors

### Events Not Received

1. Verify `subscribeRoom` was called
2. Check `NativeEventEmitter` listeners
3. Check native module is emitting events
4. Verify room ID is correct

---

## 📊 Monitoring

### SQLite Database Location

**iOS**:

```
~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Documents/chat.db
```

**Android**:

```
/data/data/com.hostapp/databases/chat.db
```

### Inspect OUTBOX

```sql
SELECT * FROM outbox_messages ORDER BY created_at DESC;
```

### Inspect INBOX

```sql
SELECT * FROM inbox_messages WHERE room_id = 'room123' ORDER BY timestamp DESC;
```

---

## 🚨 Known Limitations

1. **Background Sync (iOS)**: Requires foreground app or background modes
2. **Message Media**: Text only, images/files need separate implementation
3. **Read Receipts**: Not implemented (deliveryStatus remains SENT)
4. **Push Notifications**: Not integrated (requires FCM setup)
5. **Multi-device Sync**: Works but no conflict resolution for concurrent edits

---

## 🔜 Future Enhancements

- [ ] Image/file upload support
- [ ] Read receipts and delivery status
- [ ] Push notifications integration
- [ ] Typing indicators
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Voice messages
- [ ] E2E encryption

---

## 📚 References

- [CHAT_API.md](CHAT_API.md) - Backend API documentation
- [super_app_chat_architecture.md](super_app_chat_architecture.md) - Architecture design
- [chat_offline_queue_delivery_semantics_extension.md](chat_offline_queue_delivery_semantics_extension.md) - Offline queue specs
- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Native Event Emitter](https://reactnative.dev/docs/native-modules-ios#sending-events-to-javascript)

---

## ✅ Implementation Checklist

- [x] Firebase SDK setup (iOS + Android)
- [x] Native database schemas (OUTBOX/INBOX)
- [x] ChatNativeModule iOS implementation
- [x] ChatNativeModule Android implementation
- [x] Offline queue with retry logic
- [x] Client-generated message IDs
- [x] Idempotent message delivery
- [x] Event-driven delivery semantics
- [x] Chat JS SDK wrapper
- [x] ChatContext with React integration
- [x] Host SDK exposure
- [x] AuthContext integration
- [x] App state handling (foreground/background)
- [x] Documentation

---

**Status**: ✅ Implementation Complete

**Next Steps**:

1. Add Firebase configuration files
2. Implement backend token exchange endpoint
3. Test end-to-end message flow
4. Add push notifications (optional)
