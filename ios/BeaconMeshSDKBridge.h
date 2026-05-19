#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>   // RCTPromiseResolveBlock / RCTPromiseRejectBlock
#import "BeaconMeshSDKBridgeDelegate.h"

NS_ASSUME_NONNULL_BEGIN

@protocol BeaconMeshSDKBridgeDelegate;

/**
 Main entry point for interacting with the Beacon Mesh SDK.

 This class acts as a bridge between native iOS code and higher-level consumers
 such as React Native. It manages lifecycle, messaging, and node discovery.

 Usage flow:
 1. Call `initialize`
 2. Call `start`
 3. Send/receive messages
 4. Call `stop` or `destroySession`
 */
@interface BeaconMeshSDKBridge : NSObject

/// Delegate used to receive asynchronous events.
@property (nonatomic, weak, nullable) id<BeaconMeshSDKBridgeDelegate> delegate;

/// Shared singleton instance.
+ (instancetype)shared;

#pragma mark - Lifecycle

/**
 Initializes the SDK.

 @param apiKey UUID string used as API key (required)
 @param notification Optional notification configuration (reserved for future use)
 @param resolve Promise resolve callback
 @param reject Promise reject callback

 @discussion Must be called before any other method.
 */
- (void)initialize:(NSString *)apiKey
      notification:(NSDictionary *)notification
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject;

/**
 Starts the mesh network session.

 @param userId Optional UUID string identifying the current user
 @param resolve Promise resolve callback
 @param reject Promise reject callback

 @discussion Requires prior initialization.
 */
- (void)start:(NSString * _Nullable)userId
      resolve:(RCTPromiseResolveBlock)resolve
       reject:(RCTPromiseRejectBlock)reject;

/**
 Stops the current mesh session.

 @param notification Optional notification data
 @param resolve Promise resolve callback
 @param reject Promise reject callback

 @discussion Requires the session to be started.
 */
- (void)stop:(NSDictionary * _Nullable)notification
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject;

/**
 Destroys the current session and clears all internal state.

 @param resolve Promise resolve callback
 @param reject Promise reject callback
 */
- (void)destroySession:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

#pragma mark - Messaging

/**
 Sends a peer-to-peer message.

 @param receiverId UUID string of the recipient
 @param payload UTF-8 string payload
 @param resolve Resolves with messageId (UUID string)
 @param reject Rejects on failure

 @discussion Requires the mesh to be started.
 */
- (void)sendP2PMessage:(NSString *)receiverId
               payload:(NSString *)payload
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;

/**
 Sends a broadcast message to all connected peers.

 @param payload UTF-8 string payload
 @param resolve Resolves with messageId (UUID string)
 @param reject Rejects on failure
 */
- (void)sendBroadcast:(NSString *)payload
              resolve:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

#pragma mark - Nodes

/**
 Retrieves all currently connected nodes.

 @param resolve Resolves with array of node dictionaries
 @param reject Rejects on failure
 */
- (void)getConnectedNodes:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject;

/**
 Retrieves information for a specific node.

 @param nodeId UUID string of the node
 @param resolve Resolves with node dictionary
 @param reject Rejects on failure
 */
- (void)getNode:(NSString *)nodeId
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;

#pragma mark - State

/// Returns whether the mesh session is currently started.
- (void)isStarted:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject;

/// Returns whether the SDK has been initialized.
- (void)isInitialized:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

/// Returns the current session UUID string.
- (void)getCurrentSessionId:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
