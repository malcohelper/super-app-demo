#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

/**
 * AuthModule Bridge Header
 * 
 * Exposes Swift AuthModule to React Native
 */
@interface RCT_EXTERN_MODULE(AuthModule, RCTEventEmitter)

// Authentication methods
RCT_EXTERN_METHOD(login:(NSString *)email
                  password:(NSString *)password
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(signup:(NSString *)email
                  password:(NSString *)password
                  displayName:(NSString *)displayName
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(logout:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Storage methods (for backward compatibility)
RCT_EXTERN_METHOD(saveAuthState:(NSString *)token
                  userInfo:(NSDictionary *)userInfo
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(loadAuthState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearAuthState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Read-only methods for Mini Apps
RCT_EXTERN_METHOD(getAuthState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(hasToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getTokenTimestamp:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Support for event emitter
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
