//
//  ChatModule.swift
//  HostApp
//
//  React Native bridge module for Chat functionality
//

import Foundation
import FirebaseDatabase
import FirebaseAuth

@objc(ChatModule)
class ChatModule: RCTEventEmitter {
  
  private let chatService = ChatService.shared
  private var hasListeners = false
  
  // MARK: - Module Setup
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String]! {
    return [
      "message_added",
      "message_ack",
      "message_failed",
      "sync_state",
      "room_updated",
      "typing"
    ]
  }
  
  override func startObserving() {
    hasListeners = true
  }
  
  override func stopObserving() {
    hasListeners = false
  }
  
  // MARK: - Event Emission
  
  private func sendEvent(name: String, body: Any) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }
  
  // MARK: - Exported Methods
  
  @objc
  func initialize(_ userInfo: [String: Any],
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let userId = userInfo["userId"] as? String else {
      reject("INVALID_USER", "User ID is required", nil)
      return
    }
    
    let displayName = userInfo["displayName"] as? String ?? "Unknown User"
    let photoURL = userInfo["photoURL"] as? String
    
    chatService.initialize(userId: userId, displayName: displayName, photoURL: photoURL) { [weak self] error in
      if let error = error {
        reject("INIT_ERROR", error.localizedDescription, error)
      } else {
        // Setup event listeners
        self?.setupEventListeners()
        resolve(["success": true])
      }
    }
  }
  
  @objc
  func getRooms(_ resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.getRooms { result in
      switch result {
      case .success(let rooms):
        let roomsData = rooms.map { $0.toDictionary() }
        resolve(["rooms": roomsData])
      case .failure(let error):
        reject("GET_ROOMS_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc
  func getRoom(_ roomId: String,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.getRoom(roomId: roomId) { result in
      switch result {
      case .success(let room):
        resolve(room.toDictionary())
      case .failure(let error):
        reject("GET_ROOM_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc
  func sendMessage(_ roomId: String,
                   payload: [String: Any],
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let text = payload["text"] as? String else {
      reject("INVALID_MESSAGE", "Message text is required", nil)
      return
    }
    
    let type = payload["type"] as? String ?? "text"
    let metadata = payload["metadata"] as? [String: Any]
    
    chatService.sendMessage(
      roomId: roomId,
      text: text,
      type: type,
      metadata: metadata
    ) { [weak self] result in
      switch result {
      case .success(let message):
        // Emit optimistic message_added event
        self?.sendEvent(name: "message_added", body: [
          "roomId": roomId,
          "message": message.toDictionary()
        ])
        resolve(message.toDictionary())
      case .failure(let error):
        // Emit message_failed event
        self?.sendEvent(name: "message_failed", body: [
          "roomId": roomId,
          "error": error.localizedDescription
        ])
        reject("SEND_MESSAGE_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc
  func subscribeToRoom(_ roomId: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.subscribeToRoom(roomId: roomId) { [weak self] event in
      self?.handleChatEvent(event)
    }
    
    resolve(["subscribed": true, "roomId": roomId])
  }
  
  @objc
  func unsubscribeFromRoom(_ roomId: String,
                           resolver resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.unsubscribeFromRoom(roomId: roomId)
    resolve(["unsubscribed": true, "roomId": roomId])
  }
  
  @objc
  func getMessages(_ roomId: String,
                   limit: NSNumber,
                   before beforeMessageId: String?,
                   resolver resolve: @escaping RCTPromiseResolveBlock,
                   rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    let limitValue = limit.intValue
    
    chatService.getMessages(
      roomId: roomId,
      limit: limitValue,
      before: beforeMessageId
    ) { result in
      switch result {
      case .success(let response):
        let messagesData = response.messages.map { $0.toDictionary() }
        resolve([
          "messages": messagesData,
          "hasMore": response.hasMore,
          "nextCursor": response.nextCursor as Any
        ])
      case .failure(let error):
        reject("GET_MESSAGES_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc
  func markAsRead(_ roomId: String,
                  messageId: String,
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.markAsRead(roomId: roomId, messageId: messageId) { error in
      if let error = error {
        reject("MARK_READ_ERROR", error.localizedDescription, error)
      } else {
        resolve(["success": true])
      }
    }
  }
  
  @objc
  func createRoom(_ roomData: [String: Any],
                  resolver resolve: @escaping RCTPromiseResolveBlock,
                  rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let name = roomData["name"] as? String else {
      reject("INVALID_ROOM", "Room name is required", nil)
      return
    }
    
    let description = roomData["description"] as? String
    let type = roomData["type"] as? String ?? "public"
    let memberUids = roomData["memberUids"] as? [String] ?? []
    
    chatService.createRoom(
      name: name,
      description: description,
      type: type,
      memberUids: memberUids
    ) { result in
      switch result {
      case .success(let room):
        resolve(room.toDictionary())
      case .failure(let error):
        reject("CREATE_ROOM_ERROR", error.localizedDescription, error)
      }
    }
  }
  
  @objc
  func joinRoom(_ roomId: String,
                resolver resolve: @escaping RCTPromiseResolveBlock,
                rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.joinRoom(roomId: roomId) { error in
      if let error = error {
        reject("JOIN_ROOM_ERROR", error.localizedDescription, error)
      } else {
        resolve(["success": true, "roomId": roomId])
      }
    }
  }
  
  @objc
  func leaveRoom(_ roomId: String,
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    chatService.leaveRoom(roomId: roomId) { error in
      if let error = error {
        reject("LEAVE_ROOM_ERROR", error.localizedDescription, error)
      } else {
        resolve(["success": true, "roomId": roomId])
      }
    }
  }
  
  // MARK: - Private Methods
  
  private func setupEventListeners() {
    chatService.onMessageAck = { [weak self] localId, messageId in
      self?.sendEvent(name: "message_ack", body: [
        "localId": localId,
        "messageId": messageId
      ])
    }
    
    chatService.onMessageFailed = { [weak self] localId, reason in
      self?.sendEvent(name: "message_failed", body: [
        "localId": localId,
        "reason": reason ?? "Unknown error"
      ])
    }
    
    chatService.onSyncStateChanged = { [weak self] state in
      self?.sendEvent(name: "sync_state", body: [
        "state": state
      ])
    }
  }
  
  private func handleChatEvent(_ event: ChatEvent) {
    switch event {
    case .messageAdded(let message):
      sendEvent(name: "message_added", body: [
        "message": message.toDictionary()
      ])
    case .messageUpdated(let message):
      sendEvent(name: "message_added", body: [
        "message": message.toDictionary()
      ])
    case .typing(let userId):
      sendEvent(name: "typing", body: [
        "userId": userId
      ])
    case .roomUpdated(let room):
      sendEvent(name: "room_updated", body: [
        "room": room.toDictionary()
      ])
    }
  }
}

// MARK: - Helper Extensions

extension Dictionary where Key == String, Value == Any {
  func toJSONString() -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: self, options: []) else {
      return nil
    }
    return String(data: data, encoding: .utf8)
  }
}
