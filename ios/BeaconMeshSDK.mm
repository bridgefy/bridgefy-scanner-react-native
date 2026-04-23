#import "BeaconMeshSDKSpec.h"
#import "BeaconMeshSDKBridge.h"

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

using namespace facebook;

@interface BeaconMeshSDK : NativeBeaconMeshSDKSpecBase <NativeBeaconMeshSDKSpec, BeaconMeshSDKBridgeDelegate>
@property (nonatomic, strong, readonly) BeaconMeshSDKBridge *shared;
@end

@implementation BeaconMeshSDK

RCT_EXPORT_MODULE(BeaconMeshSDK)

#pragma mark - Lifecycle

/// React Native: indicates module does not require main thread setup
+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

/// Lazy bridge accessor (avoids repeated singleton calls)
- (BeaconMeshSDKBridge *)shared
{
  return [BeaconMeshSDKBridge shared];
}

/// Initializes module and assigns delegate
- (instancetype)init
{
  self = [super init];
  if (self) {
    self.shared.delegate = self;
  }
  return self;
}

/// TurboModule binding
- (std::shared_ptr<react::TurboModule>)getTurboModule:
    (const react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<react::NativeBeaconMeshSDKSpecJSI>(params);
}

#pragma mark - Helpers

/// Safely returns non-null string
- (NSString *)safeString:(NSString * _Nullable)value
{
  return value ?: @"";
}

/// Builds mutable dictionary removing nil values
- (NSMutableDictionary *)eventWithBase:(NSDictionary *)base
{
  return [base mutableCopy];
}

/// Adds value only if not nil
- (void)addIfNotNil:(id _Nullable)value key:(NSString *)key to:(NSMutableDictionary *)dict
{
  if (value != nil) {
    dict[key] = value;
  }
}

/// Converts NotificationConfig (JSI) → NSDictionary
- (NSDictionary *)dictionaryFromNotificationConfig:
    (JS::NativeBeaconMeshSDK::NotificationConfig &)notification
{
  return @{
    @"title": notification.title() ?: @"",
    @"message": notification.message() ?: @"",
    @"startMessage": notification.startMessage() ?: @"",
    @"stopMessage": notification.stopMessage() ?: @"",
  };
}

#pragma mark - Spec Methods (Bridge → Native)

/**
 Initializes the SDK.
 */
- (void)initialize:(NSString *)apiKey
      notification:(JS::NativeBeaconMeshSDK::NotificationConfig &)notification
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  NSDictionary *notificationDict = [self dictionaryFromNotificationConfig:notification];

  [self.shared initialize:apiKey
             notification:notificationDict
                  resolve:resolve
                   reject:reject];
}

/**
 Starts mesh session.
 */
- (void)start:(NSString * _Nullable)userId
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject
{
  [self.shared start:userId resolve:resolve reject:reject];
}

/**
 Stops mesh session.
 */
- (void)stop:(JS::NativeBeaconMeshSDK::NotificationConfig &)notification
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
{
  NSDictionary *notificationDict = [self dictionaryFromNotificationConfig:notification];

  [self.shared stop:notificationDict resolve:resolve reject:reject];
}

/**
 Clears session state.
 */
- (void)destroySession:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self.shared destroySession:resolve reject:reject];
}

/**
 Sends P2P message.
 */
- (void)sendP2PMessage:(NSString *)receiverId
               payload:(NSString *)payload
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject
{
  [self.shared sendP2PMessage:receiverId payload:payload resolve:resolve reject:reject];
}

/**
 Sends broadcast message.
 */
- (void)sendBroadcast:(NSString *)payload
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  [self.shared sendBroadcast:payload resolve:resolve reject:reject];
}

/**
 Returns connected nodes.
 */
- (void)getConnectedNodes:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [self.shared getConnectedNodes:resolve reject:reject];
}

/**
 Returns node details.
 */
- (void)getNode:(NSString *)nodeId
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [self.shared getNode:nodeId resolve:resolve reject:reject];
}

- (void)isStarted:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [self.shared isStarted:resolve reject:reject];
}

- (void)isInitialized:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  [self.shared isInitialized:resolve reject:reject];
}

- (void)getCurrentSessionId:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject
{
  [self.shared getCurrentSessionId:resolve reject:reject];
}

#pragma mark - Delegate (Native → JS Events)

/// Mesh started event
- (void)emitBeaconMeshStartedWithUserId:(NSString * _Nullable)userId
                              startTime:(double)startTime
                               isActive:(BOOL)isActive
{
  NSDictionary *event = @{
    @"userId": [self safeString:userId],
    @"startTime": @(startTime),
    @"isActive": @(isActive),
  };

  [self emitOnBeaconMeshStarted:event];
}

/// Mesh stopped event
- (void)emitBeaconMeshStoppedEvent
{
  [self emitOnBeaconMeshStopped];
}

/// Node connected
- (void)emitNodeConnectedWithId:(NSString *)nodeId
                       lastSeen:(double)lastSeen
{
  NSDictionary *event = @{
    @"id": [self safeString:nodeId],
    @"lastSeen": @(lastSeen),
  };

  [self emitOnNodeConnected:event];
}

/// Node disconnected
- (void)emitNodeDisconnectedWithId:(NSString *)nodeId
                          lastSeen:(double)lastSeen
{
  NSDictionary *event = @{
    @"id": [self safeString:nodeId],
    @"lastSeen": @(lastSeen),
  };

  [self emitOnNodeDisconnected:event];
}

/// P2P message received
- (void)emitP2PMessageReceivedWithMessageId:(NSString *)messageId
                                       from:(NSString *)from
                                         to:(NSString * _Nullable)to
                                    payload:(NSString *)payload
                                  timestamp:(double)timestamp
{
  NSMutableDictionary *event = [self eventWithBase:@{
    @"messageId": [self safeString:messageId],
    @"from": [self safeString:from],
    @"payload": [self safeString:payload],
    @"timestamp": @(timestamp),
  }];

  [self addIfNotNil:to key:@"to" to:event];

  [self emitOnP2PMessageReceived:event];
}

/// Broadcast message received
- (void)emitBroadcastMessageReceivedWithMessageId:(NSString *)messageId
                                             from:(NSString *)from
                                          payload:(NSString *)payload
                                        timestamp:(double)timestamp
{
  NSDictionary *event = @{
    @"messageId": [self safeString:messageId],
    @"from": [self safeString:from],
    @"payload": [self safeString:payload],
    @"timestamp": @(timestamp),
  };

  [self emitOnBroadcastMessageReceived:event];
}

/// Error event
- (void)emitBeaconMeshErrorWithCode:(NSString *)code
                            message:(NSString *)message
                            context:(NSString * _Nullable)context
{
  NSMutableDictionary *event = [self eventWithBase:@{
    @"code": [self safeString:code],
    @"message": [self safeString:message],
  }];

  [self addIfNotNil:context key:@"context" to:event];

  [self emitOnBeaconMeshError:event];
}

/// Beacon discovered
- (void)emitBeaconDiscoveredWithUUID:(NSString * _Nullable)uuid
                                rssi:(double)rssi
                             txPower:(NSNumber * _Nullable)txPower
                       deviceAddress:(NSString *)deviceAddress
                                name:(NSString *)name
{
  NSMutableDictionary *event = [self eventWithBase:@{
    @"rssi": @(rssi),
    @"deviceAddress": [self safeString:deviceAddress],
    @"name": [self safeString:name],
  }];

  [self addIfNotNil:uuid key:@"uuid" to:event];
  [self addIfNotNil:txPower key:@"txPower" to:event];

  [self emitOnBeaconDiscovered:event];
}

/// Beacon lost
- (void)emitBeaconLostWithUUID:(NSString * _Nullable)uuid
                          rssi:(double)rssi
                       txPower:(NSNumber * _Nullable)txPower
                 deviceAddress:(NSString *)deviceAddress
                          name:(NSString *)name
{
  NSMutableDictionary *event = [self eventWithBase:@{
    @"rssi": @(rssi),
    @"deviceAddress": [self safeString:deviceAddress],
    @"name": [self safeString:name],
  }];

  [self addIfNotNil:uuid key:@"uuid" to:event];
  [self addIfNotNil:txPower key:@"txPower" to:event];

  [self emitOnBeaconLost:event];
}

@end
