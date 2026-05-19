#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTTurboModule.h>

#import "BeaconMeshSDKBridge.h"
#import "BeaconMeshSDKBridgeDelegate.h"

using namespace facebook;

@interface BeaconMeshSDK : RCTEventEmitter <BeaconMeshSDKBridgeDelegate>
@property (nonatomic, strong, readonly) BeaconMeshSDKBridge *shared;
@end

@implementation BeaconMeshSDK

RCT_EXPORT_MODULE(BeaconMeshSDK);

#pragma mark - Lifecycle

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (BeaconMeshSDKBridge *)shared
{
  return [BeaconMeshSDKBridge shared];
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    self.shared.delegate = self;
  }
  return self;
}

#pragma mark - Events

/// Lista de eventos soportados (IMPORTANTE)
- (NSArray<NSString *> *)supportedEvents
{
  return @[
    @"onBeaconMeshStarted",
    @"onBeaconMeshStopped",
    @"onNodeConnected",
    @"onNodeDisconnected",
    @"onP2PMessageReceived",
    @"onBroadcastMessageReceived",
    @"onBeaconMeshError",
    @"onBeaconDiscovered",
    @"onBeaconLost"
  ];
}

#pragma mark - Helpers

- (NSString *)safeString:(NSString * _Nullable)value
{
  return value ?: @"";
}

- (NSMutableDictionary *)eventWithBase:(NSDictionary *)base
{
  return [base mutableCopy];
}

- (void)addIfNotNil:(id _Nullable)value key:(NSString *)key to:(NSMutableDictionary *)dict
{
  if (value != nil) {
    dict[key] = value;
  }
}

#pragma mark - React Methods (JS → Native)

RCT_REMAP_METHOD(initialize,
                 apiKey:(NSString *)apiKey
                 notification:(NSDictionary *)notification
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared initialize:apiKey
             notification:notification
                  resolve:resolve
                   reject:reject];
}

RCT_REMAP_METHOD(start,
                 userId:(NSString * _Nullable)userId
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared start:userId resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(stop,
                 notification:(NSDictionary *)notification
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared stop:notification resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(destroySession,
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared destroySession:resolve reject:reject];
}

RCT_REMAP_METHOD(sendP2PMessage,
                 receiverId:(NSString *)receiverId
                 payload:(NSString *)payload
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared sendP2PMessage:receiverId payload:payload resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(sendBroadcast,
                 payload:(NSString *)payload
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared sendBroadcast:payload resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(getConnectedNodes,
                 getConnectedNodesWithResolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared getConnectedNodes:resolve reject:reject];
}

RCT_REMAP_METHOD(getNode,
                 nodeId:(NSString *)nodeId
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared getNode:nodeId resolve:resolve reject:reject];
}

RCT_REMAP_METHOD(isStarted,
                 isStartedWithResolver:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared isStarted:resolve reject:reject];
}

RCT_REMAP_METHOD(isInitialized,
                 isInitializedWithResolver:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared isInitialized:resolve reject:reject];
}

RCT_REMAP_METHOD(getCurrentSessionId,
                 getCurrentSessionIdWithResolver:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  [self.shared getCurrentSessionId:resolve reject:reject];
}

#pragma mark - Delegate (Native → JS)

- (void)emitBeaconMeshStartedWithUserId:(NSString * _Nullable)userId
                              startTime:(double)startTime
                               isActive:(BOOL)isActive
{
  [self sendEventWithName:@"onBeaconMeshStarted"
                    body:@{
                      @"userId": [self safeString:userId],
                      @"startTime": @(startTime),
                      @"isActive": @(isActive)
                    }];
}

- (void)emitBeaconMeshStoppedEvent
{
  [self sendEventWithName:@"onBeaconMeshStopped" body:nil];
}

- (void)emitNodeConnectedWithId:(NSString *)nodeId
                       lastSeen:(double)lastSeen
{
  [self sendEventWithName:@"onNodeConnected"
                    body:@{
                      @"id": [self safeString:nodeId],
                      @"lastSeen": @(lastSeen)
                    }];
}

- (void)emitNodeDisconnectedWithId:(NSString *)nodeId
                          lastSeen:(double)lastSeen
{
  [self sendEventWithName:@"onNodeDisconnected"
                    body:@{
                      @"id": [self safeString:nodeId],
                      @"lastSeen": @(lastSeen)
                    }];
}

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

  [self sendEventWithName:@"onP2PMessageReceived" body:event];
}

- (void)emitBroadcastMessageReceivedWithMessageId:(NSString *)messageId
                                             from:(NSString *)from
                                          payload:(NSString *)payload
                                        timestamp:(double)timestamp
{
  [self sendEventWithName:@"onBroadcastMessageReceived"
                    body:@{
                      @"messageId": [self safeString:messageId],
                      @"from": [self safeString:from],
                      @"payload": [self safeString:payload],
                      @"timestamp": @(timestamp)
                    }];
}

- (void)emitBeaconMeshErrorWithCode:(NSString *)code
                            message:(NSString *)message
                            context:(NSString * _Nullable)context
{
  NSMutableDictionary *event = [self eventWithBase:@{
    @"code": [self safeString:code],
    @"message": [self safeString:message],
  }];

  [self addIfNotNil:context key:@"context" to:event];

  [self sendEventWithName:@"onBeaconMeshError" body:event];
}

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

  [self sendEventWithName:@"onBeaconDiscovered" body:event];
}

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

  [self sendEventWithName:@"onBeaconLost" body:event];
}

@end
