//
//  MessageQueue.swift
//  HostApp
//
//  Offline OUTBOX queue for reliable message delivery
//

import Foundation
import FirebaseDatabase

enum MessageStatus: String {
  case pending = "PENDING"
  case sending = "SENDING"
  case sent = "SENT"
  case failed = "FAILED"
}

struct QueuedMessage {
  let localId: String
  let message: ChatMessage
  var status: MessageStatus
  var retryCount: Int
  let createdAt: Date
  
  func toDictionary() -> [String: Any] {
    return [
      "localId": localId,
      "messageId": message.id,
      "roomId": message.roomId,
      "text": message.text,
      "type": message.type,
      "status": status.rawValue,
      "retryCount": retryCount,
      "createdAt": createdAt.timeIntervalSince1970
    ]
  }
}

class MessageQueue {
  
  private var queue: [String: QueuedMessage] = [:]
  private let queueKey = "chat_message_outbox"
  private let maxRetries = 5
  private let retryDelays: [TimeInterval] = [1, 2, 4, 8, 16] // Exponential backoff
  
  private var database: DatabaseReference?
  private var isProcessing = false
  
  // Callbacks
  var onMessageSent: ((String, String) -> Void)?
  var onMessageFailed: ((String, String?) -> Void)?
  
  init() {
    loadQueue()
  }
  
  // MARK: - Queue Management
  
  func enqueue(message: ChatMessage, localId: String, completion: @escaping (Result<Void, Error>) -> Void) {
    let queuedMessage = QueuedMessage(
      localId: localId,
      message: message,
      status: .pending,
      retryCount: 0,
      createdAt: Date()
    )
    
    queue[localId] = queuedMessage
    saveQueue()
    
    // Try to send immediately
    processQueue()
    
    completion(.success(()))
  }
  
  func startProcessing() {
    database = Database.database().reference()
    processQueue()
  }
  
  private func processQueue() {
    guard !isProcessing else { return }
    guard let database = database else { return }
    
    isProcessing = true
    
    let pendingMessages = queue.values.filter { $0.status == .pending || $0.status == .failed }
    
    for var queuedMessage in pendingMessages {
      // Check if max retries exceeded
      if queuedMessage.retryCount >= maxRetries {
        queuedMessage.status = .failed
        queue[queuedMessage.localId] = queuedMessage
        saveQueue()
        onMessageFailed?(queuedMessage.localId, "Max retries exceeded")
        continue
      }
      
      // Update status to sending
      queuedMessage.status = .sending
      queue[queuedMessage.localId] = queuedMessage
      saveQueue()
      
      // Send to Firebase
      sendToFirebase(queuedMessage: queuedMessage, database: database)
    }
    
    isProcessing = false
  }
  
  private func sendToFirebase(queuedMessage: QueuedMessage, database: DatabaseReference) {
    let message = queuedMessage.message
    let messagesRef = database.child("chat/rooms").child(message.roomId).child("messages")
    let messageRef = messagesRef.child(message.id)
    
    let messageData: [String: Any] = [
      "id": message.id,
      "roomId": message.roomId,
      "uid": message.uid,
      "displayName": message.displayName,
      "photoURL": message.photoURL ?? "",
      "text": message.text,
      "type": message.type,
      "timestamp": message.timestamp
    ]
    
    messageRef.setValue(messageData) { [weak self] error, _ in
      guard let self = self else { return }
      
      if let error = error {
        // Failed - increment retry count
        self.handleSendFailure(localId: queuedMessage.localId, error: error)
      } else {
        // Success - mark as sent
        self.handleSendSuccess(localId: queuedMessage.localId, messageId: message.id)
      }
    }
  }
  
  private func handleSendSuccess(localId: String, messageId: String) {
    // Remove from queue
    queue.removeValue(forKey: localId)
    saveQueue()
    
    // Notify success
    onMessageSent?(localId, messageId)
  }
  
  private func handleSendFailure(localId: String, error: Error) {
    guard var queuedMessage = queue[localId] else { return }
    
    queuedMessage.retryCount += 1
    
    if queuedMessage.retryCount >= maxRetries {
      queuedMessage.status = .failed
      queue[localId] = queuedMessage
      saveQueue()
      onMessageFailed?(localId, error.localizedDescription)
    } else {
      queuedMessage.status = .pending
      queue[localId] = queuedMessage
      saveQueue()
      
      // Schedule retry with exponential backoff
      let delay = retryDelays[min(queuedMessage.retryCount - 1, retryDelays.count - 1)]
      DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
        self?.processQueue()
      }
    }
  }
  
  // MARK: - Persistence
  
  private func saveQueue() {
    let queueData = queue.values.map { $0.toDictionary() }
    UserDefaults.standard.set(queueData, forKey: queueKey)
    UserDefaults.standard.synchronize()
  }
  
  private func loadQueue() {
    guard let queueData = UserDefaults.standard.array(forKey: queueKey) as? [[String: Any]] else {
      return
    }
    
    for dict in queueData {
      guard let localId = dict["localId"] as? String,
            let messageId = dict["messageId"] as? String,
            let roomId = dict["roomId"] as? String,
            let text = dict["text"] as? String,
            let type = dict["type"] as? String,
            let statusString = dict["status"] as? String,
            let status = MessageStatus(rawValue: statusString),
            let retryCount = dict["retryCount"] as? Int,
            let createdAtTimestamp = dict["createdAt"] as? TimeInterval else {
        continue
      }
      
      // Reconstruct message (simplified - missing some fields)
      let message = ChatMessage(
        id: messageId,
        roomId: roomId,
        uid: "", // Will be set from current user
        displayName: "", // Will be set from current user
        photoURL: nil,
        text: text,
        type: type,
        timestamp: Int64(Date().timeIntervalSince1970 * 1000),
        edited: nil,
        editedAt: nil,
        metadata: nil
      )
      
      let queuedMessage = QueuedMessage(
        localId: localId,
        message: message,
        status: status,
        retryCount: retryCount,
        createdAt: Date(timeIntervalSince1970: createdAtTimestamp)
      )
      
      queue[localId] = queuedMessage
    }
  }
  
  // MARK: - Public Methods
  
  func getPendingCount() -> Int {
    return queue.values.filter { $0.status == .pending || $0.status == .sending }.count
  }
  
  func clearSentMessages() {
    queue = queue.filter { $0.value.status != .sent }
    saveQueue()
  }
  
  func retryFailed() {
    for (localId, var message) in queue where message.status == .failed {
      message.status = .pending
      message.retryCount = 0
      queue[localId] = message
    }
    saveQueue()
    processQueue()
  }
}
