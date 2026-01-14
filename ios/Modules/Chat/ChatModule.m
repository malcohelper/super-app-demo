//
//  ChatModule.m
//  HostApp
//
//  React Native bridge for Chat module
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ChatModule, RCTEventEmitter)

// Initialize chat with user info
RCT_EXTERN_METHOD(initialize:(NSDictionary *)userInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get list of rooms for current user
RCT_EXTERN_METHOD(getRooms:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get room details
RCT_EXTERN_METHOD(getRoom:(NSString *)roomId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Send a message to a room
RCT_EXTERN_METHOD(sendMessage:(NSString *)roomId
                  payload:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Subscribe to room messages
RCT_EXTERN_METHOD(subscribeToRoom:(NSString *)roomId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Unsubscribe from room messages
RCT_EXTERN_METHOD(unsubscribeFromRoom:(NSString *)roomId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get messages for a room with pagination
RCT_EXTERN_METHOD(getMessages:(NSString *)roomId
                  limit:(NSNumber *)limit
                  before:(NSString *)beforeMessageId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Mark messages as read
RCT_EXTERN_METHOD(markAsRead:(NSString *)roomId
                  messageId:(NSString *)messageId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Create a new chat room
RCT_EXTERN_METHOD(createRoom:(NSDictionary *)roomData
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Join a room
RCT_EXTERN_METHOD(joinRoom:(NSString *)roomId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Leave a room
RCT_EXTERN_METHOD(leaveRoom:(NSString *)roomId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
