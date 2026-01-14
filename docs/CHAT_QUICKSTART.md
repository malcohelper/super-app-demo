# Chat Native Module - Quick Start Guide

## 🎯 What Was Built

A **production-ready chat system** for your React Native super app with:

✅ **Offline-First Architecture** - Messages sent offline are queued and auto-sent when online  
✅ **Idempotent Delivery** - No duplicate messages even with retries  
✅ **Event-Driven Updates** - Real-time message status (SENDING → SENT → FAILED)  
✅ **Native Performance** - Core logic in Swift/Kotlin for optimal battery & speed  
✅ **Mini App Ready** - Exposed via Host SDK, mini apps don't touch Firebase directly  
✅ **Production Semantics** - Retry logic, exponential backoff, max retries

---

## 📂 What You Need to Do

### 1. Add Firebase Config Files (5 minutes)

**iOS**: Download `GoogleService-Info.plist` from Firebase Console → Place at:

```
ios/HostApp/GoogleService-Info.plist
```

**Android**: Download `google-services.json` from Firebase Console → Place at:

```
android/app/google-services.json
```

See `firebase-config-instructions.md` for detailed steps.

### 2. Implement Backend Token Exchange (15 minutes)

Your backend needs one endpoint to exchange app tokens for Firebase custom tokens:

```typescript
// POST /api/chat/auth/exchange-token
app.post("/api/chat/auth/exchange-token", async (req, res) => {
  const { userToken, userId, displayName } = req.body;

  // 1. Verify your app's token
  const user = await verifyAppToken(userToken);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // 2. Create Firebase custom token
  const customToken = await admin.auth().createCustomToken(userId, {
    displayName,
  });

  res.json({ success: true, data: { customToken } });
});
```

### 3. Install & Run (2 minutes)

```bash
npm install
cd ios && pod install && cd ..
npm run ios
```

---

## 🚀 How Mini Apps Use Chat

Mini apps import from `@host-sdk` and use chat without knowing Firebase exists:

```typescript
import { native } from "@host-sdk";

// Send message (works offline!)
await native.chat.sendMessage("room123", {
  text: "Hello!",
  type: "text",
});

// Subscribe to room
const unsubscribe = native.chat.subscribeRoom("room123", (event) => {
  if (event.type === "message_added") {
    console.log("New message:", event.message);
  }
  if (event.type === "message_ack") {
    console.log("Message sent!", event.messageId);
  }
  if (event.type === "message_failed") {
    console.error("Failed:", event.reason);
  }
});

// Get rooms
const { rooms } = await native.chat.getRooms();

// Get messages
const messages = native.chat.getMessagesForRoom("room123");
```

See `docs/examples/ChatScreenExample.tsx` for a complete UI example.

---

## 🏗️ Architecture Highlights

### Offline Queue Flow

```
User sends message
  ↓
Save to OUTBOX (SQLite) - App can close here, message won't be lost
  ↓
Emit optimistic UI update (SENDING status)
  ↓
Background worker picks up OUTBOX
  ↓
Send to Firebase
  ↓
Success? → Emit message_ack (SENT status)
Failure? → Retry with backoff → Eventually emit message_failed
```

### Message ID Strategy

- **Client generates ID**: `{userId}_{timestamp}_{random}`
- Firebase writes with this ID as key
- Duplicate writes are ignored (idempotent)
- Safe to retry without creating duplicates

### Event Contract

| Event            | When                   | Mini App Action                     |
| ---------------- | ---------------------- | ----------------------------------- |
| `message_added`  | Message saved locally  | Show in UI with "sending" indicator |
| `message_ack`    | Server acknowledged    | Update UI to "sent" ✓               |
| `message_failed` | Retry limit exceeded   | Show retry button or error          |
| `sync_state`     | Background sync status | Optional loading indicator          |

---

## 📱 Platform Features

### iOS

- SQLite for OUTBOX/INBOX
- Firebase Realtime Database offline persistence
- Timer-based background sync (10s interval)
- `NotificationCenter` for native → JS events

### Android

- Room Database for OUTBOX/INBOX
- Firebase Realtime Database offline persistence
- Coroutines for background sync (10s interval)
- `DeviceEventManagerModule` for native → JS events

---

## 🔐 Security

- Mini apps **never** authenticate with Firebase directly
- All Firebase operations go through native modules
- Backend controls who gets custom tokens
- Firestore/RTDB rules enforce access control
- See `CHAT_API.md` for security rules

---

## 📊 Monitoring

### Check OUTBOX Queue

**iOS Simulator**:

```bash
# Find app container
xcrun simctl get_app_container booted com.hostapp data

# Open SQLite
sqlite3 ~/Library/.../Documents/chat.db
SELECT * FROM outbox_messages;
```

**Android Emulator**:

```bash
adb shell
run-as com.hostapp
sqlite3 databases/chat.db
SELECT * FROM outbox_messages;
```

---

## 🐛 Common Issues

### "Chat capabilities not initialized"

- Make sure `ChatProvider` is mounted in `App.tsx` ✅ (Already done)
- Check that `useChatAuth` hook runs after login

### Messages not sending

1. Check Firebase config files exist
2. Verify user is authenticated (check logs)
3. Inspect OUTBOX table - messages stuck?
4. Check network connectivity

### iOS build errors

```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

### Android build errors

```bash
cd android && ./gradlew clean && cd ..
```

---

## 📚 Documentation

- **[CHAT_IMPLEMENTATION.md](./CHAT_IMPLEMENTATION.md)** - Full implementation guide
- **[CHAT_API.md](../CHAT_API.md)** - Backend API reference
- **[ChatScreenExample.tsx](./examples/ChatScreenExample.tsx)** - Mini app UI example
- **[firebase-config-instructions.md](../firebase-config-instructions.md)** - Firebase setup

---

## ✅ What's Complete

- [x] Native modules (iOS + Android)
- [x] Offline OUTBOX queue with SQLite
- [x] Client-generated message IDs
- [x] Idempotent Firebase writes
- [x] Retry logic with exponential backoff
- [x] Event-driven delivery semantics
- [x] React Context integration
- [x] Host SDK exposure
- [x] Auth integration hook
- [x] App state handling
- [x] Comprehensive documentation

---

## 🔜 What's Not Included (Optional)

- ❌ Push notifications (needs FCM setup)
- ❌ Image/file uploads (needs storage service)
- ❌ Read receipts (needs additional events)
- ❌ Typing indicators (needs presence system)
- ❌ Message editing (needs update logic)
- ❌ E2E encryption (needs key management)

These can be added incrementally without breaking existing functionality.

---

## 🎉 You're Ready!

1. Add Firebase config files
2. Implement token exchange endpoint
3. Test with a mini app

The chat system will work offline, retry failed messages, prevent duplicates, and give real-time feedback to users.

**Questions?** Check `CHAT_IMPLEMENTATION.md` or inspect the code - it's fully commented!
