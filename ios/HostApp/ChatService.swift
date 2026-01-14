//
//  ChatService.swift
//  HostApp
//
//  Core Chat service with Firebase Realtime Database integration
//

import Foundation
import FirebaseDatabase
import FirebaseAuth

// MARK: - Models

struct ChatMessage: Codable {
  let id: String
  let roomId: String
  let uid: String
  let displayName: String
  let photoURL: String?
  let text: String
  let type: String
  let timestamp: Int64
  let edited: Bool?
  let editedAt: Int64?
  let metadata: [String: Any]?
  
  func toDictionary() -> [String: Any] {
    var dict: [String: Any] = [
      "id": id,
      "roomId": roomId,
      "uid": uid,
      "displayName": displayName,
      "text": text,
      "type": type,
      "timestamp": timestamp
    ]
    
    if let photoURL = photoURL { dict["photoURL"] = photoURL }
    if let edited = edited { dict["edited"] = edited }
    if let editedAt = editedAt { dict["editedAt"] = editedAt }
    if let metadata = metadata { dict["metadata"] = metadata }
    
    return dict
  }
}

struct ChatRoom: Codable {
  let id: String
  let name: String
  let description: String?
  let type: String
  let createdBy: String
  let createdAt: Int64
  let memberCount: Int
  let lastMessage: String?
  let lastMessageAt: Int64?
  let isActive: Bool
  
  func toDictionary() -> [String: Any] {
    var dict: [String: Any] = [
      "id": id,
      "name": name,
      "type": type,
      "createdBy": createdBy,
      "createdAt": createdAt,
      "memberCount": memberCount,
      "isActive": isActive
    ]
    
    if let description = description { dict["description"] = description }
    if let lastMessage = lastMessage { dict["lastMessage"] = lastMessage }
    if let lastMessageAt = lastMessageAt { dict["lastMessageAt"] = lastMessageAt }
    
    return dict
  }
}

struct MessagesResponse {
  let messages: [ChatMessage]
  let hasMore: Bool
  let nextCursor: String?
}

enum ChatEvent {
  case messageAdded(ChatMessage)
  case messageUpdated(ChatMessage)
  case typing(String)
  case roomUpdated(ChatRoom)
}

enum ChatError: Error {
  case notInitialized
  case notAuthenticated
  case invalidData
  case firebaseError(String)
  case networkError
}

// MARK: - ChatService

class ChatService {
  
  static let shared = ChatService()
  
  private var database: DatabaseReference!
  private var currentUserId: String?
  private var currentUserDisplayName: String?
  private var currentUserPhotoURL: String?
  
  private var roomSubscriptions: [String: DatabaseHandle] = [:]
  private let messageQueue: MessageQueue
  
  // Event callbacks
  var onMessageAck: ((String, String) -> Void)?
  var onMessageFailed: ((String, String?) -> Void)?
  var onSyncStateChanged: ((String) -> Void)?
  
  private init() {
    self.messageQueue = MessageQueue()
  }
  
  // MARK: - Initialization
  
  func initialize(userId: String, displayName: String, photoURL: String?, completion: @escaping (Error?) -> Void) {
    self.currentUserId = userId
    self.currentUserDisplayName = displayName
    self.currentUserPhotoURL = photoURL
    
    // Initialize Firebase Database
    database = Database.database().reference()
    
    // Enable offline persistence
    Database.database().isPersistenceEnabled = true
    
    // Setup message queue processor
    messageQueue.onMessageSent = { [weak self] localId, messageId in
      self?.onMessageAck?(localId, messageId)
    }
    
    messageQueue.onMessageFailed = { [weak self] localId, reason in
      self?.onMessageFailed?(localId, reason)
    }
    
    // Start processing pending messages
    messageQueue.startProcessing()
    
    completion(nil)
  }
  
  // MARK: - Room Management
  
  func getRooms(completion: @escaping (Result<[ChatRoom], Error>) -> Void) {
    guard let userId = currentUserId else {
      completion(.failure(ChatError.notInitialized))
      return
    }
    
    // Query user's rooms from Firebase
    let userRoomsRef = database.child("user_rooms").child(userId)
    
    userRoomsRef.observeSingleEvent(of: .value) { [weak self] snapshot in
      guard let self = self else { return }
      
      var rooms: [ChatRoom] = []
      let group = DispatchGroup()
      
      for child in snapshot.children {
        guard let snap = child as? DataSnapshot else { continue }
        let roomId = snap.key
        
        group.enter()
        self.getRoom(roomId: roomId) { result in
          if case .success(let room) = result {
            rooms.append(room)
          }
          group.leave()
        }
      }
      
      group.notify(queue: .main) {
        completion(.success(rooms))
      }
    }
  }
  
  func getRoom(roomId: String, completion: @escaping (Result<ChatRoom, Error>) -> Void) {
    let roomRef = database.child("chat/rooms").child(roomId).child("info")
    
    roomRef.observeSingleEvent(of: .value) { snapshot in
      guard let dict = snapshot.value as? [String: Any],
            let id = dict["id"] as? String,
            let name = dict["name"] as? String,
            let type = dict["type"] as? String,
            let createdBy = dict["createdBy"] as? String,
            let createdAt = dict["createdAt"] as? Int64,
            let memberCount = dict["memberCount"] as? Int,
            let isActive = dict["isActive"] as? Bool else {
        completion(.failure(ChatError.invalidData))
        return
      }
      
      let room = ChatRoom(
        id: id,
        name: name,
        description: dict["description"] as? String,
        type: type,
        createdBy: createdBy,
        createdAt: createdAt,
        memberCount: memberCount,
        lastMessage: dict["lastMessage"] as? String,
        lastMessageAt: dict["lastMessageAt"] as? Int64,
        isActive: isActive
      )
      
      completion(.success(room))
    }
  }
  
  func createRoom(name: String, description: String?, type: String, memberUids: [String], completion: @escaping (Result<ChatRoom, Error>) -> Void) {
    guard let userId = currentUserId else {
      completion(.failure(ChatError.notInitialized))
      return
    }
    
    let roomId = database.child("chat/rooms").childByAutoId().key ?? UUID().uuidString
    let timestamp = Int64(Date().timeIntervalSince1970 * 1000)
    
    let roomData: [String: Any] = [
      "id": roomId,
      "name": name,
      "description": description ?? "",
      "type": type,
      "createdBy": userId,
      "createdAt": timestamp,
      "memberCount": memberUids.count + 1,
      "isActive": true
    ]
    
    let roomRef = database.child("chat/rooms").child(roomId).child("info")
    
    roomRef.setValue(roomData) { error, _ in
      if let error = error {
        completion(.failure(error))
        return
      }
      
      // Add creator as member
      let membersRef = self.database.child("chat/rooms").child(roomId).child("members")
      membersRef.child(userId).setValue(true)
      
      // Add to user's rooms
      let userRoomsRef = self.database.child("user_rooms").child(userId)
      userRoomsRef.child(roomId).setValue(true)
      
      // Add other members
      for memberUid in memberUids {
        membersRef.child(memberUid).setValue(true)
        self.database.child("user_rooms").child(memberUid).child(roomId).setValue(true)
      }
      
      let room = ChatRoom(
        id: roomId,
        name: name,
        description: description,
        type: type,
        createdBy: userId,
        createdAt: timestamp,
        memberCount: memberUids.count + 1,
        lastMessage: nil,
        lastMessageAt: nil,
        isActive: true
      )
      
      completion(.success(room))
    }
  }
  
  func joinRoom(roomId: String, completion: @escaping (Error?) -> Void) {
    guard let userId = currentUserId else {
      completion(ChatError.notInitialized)
      return
    }
    
    let membersRef = database.child("chat/rooms").child(roomId).child("members")
    membersRef.child(userId).setValue(true) { error, _ in
      if let error = error {
        completion(error)
        return
      }
      
      // Add to user's rooms
      let userRoomsRef = self.database.child("user_rooms").child(userId)
      userRoomsRef.child(roomId).setValue(true)
      
      completion(nil)
    }
  }
  
  func leaveRoom(roomId: String, completion: @escaping (Error?) -> Void) {
    guard let userId = currentUserId else {
      completion(ChatError.notInitialized)
      return
    }
    
    let membersRef = database.child("chat/rooms").child(roomId).child("members")
    membersRef.child(userId).removeValue() { error, _ in
      if let error = error {
        completion(error)
        return
      }
      
      // Remove from user's rooms
      let userRoomsRef = self.database.child("user_rooms").child(userId)
      userRoomsRef.child(roomId).removeValue()
      
      completion(nil)
    }
  }
  
  // MARK: - Messaging
  
  func sendMessage(roomId: String, text: String, type: String, metadata: [String: Any]?, completion: @escaping (Result<ChatMessage, Error>) -> Void) {
    guard let userId = currentUserId,
          let displayName = currentUserDisplayName else {
      completion(.failure(ChatError.notInitialized))
      return
    }
    
    let timestamp = Int64(Date().timeIntervalSince1970 * 1000)
    let messageId = "\(timestamp)_\(userId.prefix(8))"
    let localId = UUID().uuidString
    
    let message = ChatMessage(
      id: messageId,
      roomId: roomId,
      uid: userId,
      displayName: displayName,
      photoURL: currentUserPhotoURL,
      text: text,
      type: type,
      timestamp: timestamp,
      edited: nil,
      editedAt: nil,
      metadata: metadata
    )
    
    // Add to OUTBOX queue for offline-first sending
    messageQueue.enqueue(message: message, localId: localId) { [weak self] result in
      switch result {
      case .success:
        completion(.success(message))
      case .failure(let error):
        completion(.failure(error))
      }
    }
  }
  
  func getMessages(roomId: String, limit: Int, before: String?, completion: @escaping (Result<MessagesResponse, Error>) -> Void) {
    let messagesRef = database.child("chat/rooms").child(roomId).child("messages")
    var query = messagesRef.queryOrdered(byChild: "timestamp")
    
    if let before = before {
      // Parse timestamp from messageId (format: timestamp_userId)
      if let beforeTimestamp = Int64(before.split(separator: "_").first ?? "") {
        query = query.queryEnding(atValue: beforeTimestamp)
      }
    }
    
    query = query.queryLimited(toLast: UInt(limit))
    
    query.observeSingleEvent(of: .value) { snapshot in
      var messages: [ChatMessage] = []
      
      for child in snapshot.children {
        guard let snap = child as? DataSnapshot,
              let dict = snap.value as? [String: Any],
              let message = self.parseMessage(from: dict) else {
          continue
        }
        messages.append(message)
      }
      
      // Sort by timestamp descending
      messages.sort { $0.timestamp > $1.timestamp }
      
      let hasMore = messages.count == limit
      let nextCursor = messages.last?.id
      
      let response = MessagesResponse(
        messages: messages,
        hasMore: hasMore,
        nextCursor: nextCursor
      )
      
      completion(.success(response))
    }
  }
  
  func subscribeToRoom(roomId: String, callback: @escaping (ChatEvent) -> Void) {
    let messagesRef = database.child("chat/rooms").child(roomId).child("messages")
    
    let handle = messagesRef.observe(.childAdded) { snapshot in
      guard let dict = snapshot.value as? [String: Any],
            let message = self.parseMessage(from: dict) else {
        return
      }
      callback(.messageAdded(message))
    }
    
    roomSubscriptions[roomId] = handle
  }
  
  func unsubscribeFromRoom(roomId: String) {
    if let handle = roomSubscriptions[roomId] {
      let messagesRef = database.child("chat/rooms").child(roomId).child("messages")
      messagesRef.removeObserver(withHandle: handle)
      roomSubscriptions.removeValue(forKey: roomId)
    }
  }
  
  func markAsRead(roomId: String, messageId: String, completion: @escaping (Error?) -> Void) {
    guard let userId = currentUserId else {
      completion(ChatError.notInitialized)
      return
    }
    
    let readRef = database.child("chat/rooms").child(roomId).child("read").child(userId)
    readRef.setValue(messageId) { error, _ in
      completion(error)
    }
  }
  
  // MARK: - Helper Methods
  
  private func parseMessage(from dict: [String: Any]) -> ChatMessage? {
    guard let id = dict["id"] as? String,
          let roomId = dict["roomId"] as? String,
          let uid = dict["uid"] as? String,
          let displayName = dict["displayName"] as? String,
          let text = dict["text"] as? String,
          let type = dict["type"] as? String,
          let timestamp = dict["timestamp"] as? Int64 else {
      return nil
    }
    
    return ChatMessage(
      id: id,
      roomId: roomId,
      uid: uid,
      displayName: displayName,
      photoURL: dict["photoURL"] as? String,
      text: text,
      type: type,
      timestamp: timestamp,
      edited: dict["edited"] as? Bool,
      editedAt: dict["editedAt"] as? Int64,
      metadata: dict["metadata"] as? [String: Any]
    )
  }
}
