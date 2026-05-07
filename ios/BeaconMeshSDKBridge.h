#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>   // RCTPromiseResolveBlock / RCTPromiseRejectBlock

NS_ASSUME_NONNULL_BEGIN

/**
 Delegate protocol used by `BeaconMeshSDKBridge` to emit real-time events
 from the native mesh network layer to the consumer (e.g., React Native bridge).

 All timestamps are expressed in milliseconds since Unix epoch.
 */

@protocol BeaconMeshSDKBridgeDelegate <NSObject>

/// Called when the mesh network has successfully started.
///
/// @param userId The current user UUID string (if available)
/// @param startTime Timestamp in milliseconds when the session started
/// @param isActive Indicates whether the mesh is actively running
- (void)emitBeaconMeshStartedWithUserId:(nullable NSString *)userId
                              startTime:(double)startTime
                               isActive:(BOOL)isActive;

/// Called when the mesh network has stopped.
- (void)emitBeaconMeshStoppedEvent;

/// Called when a peer node connects.
///
/// @param nodeId UUID string of the connected node
/// @param lastSeen Timestamp in milliseconds of last detection
- (void)emitNodeConnectedWithId:(NSString *)nodeId
                       lastSeen:(double)lastSeen;

/// Called when a peer node disconnects.
///
/// @param nodeId UUID string of the disconnected node
/// @param lastSeen Timestamp in milliseconds of last detection
- (void)emitNodeDisconnectedWithId:(NSString *)nodeId
                          lastSeen:(double)lastSeen;

/// Called when a peer-to-peer message is received.
///
/// @param messageId UUID string of the message
/// @param from Sender UUID
/// @param to Receiver UUID (may be nil if not available)
/// @param payload UTF-8 decoded message payload
/// @param timestamp Timestamp in milliseconds when received
- (void)emitP2PMessageReceivedWithMessageId:(NSString *)messageId
                                       from:(NSString *)from
                                         to:(nullable NSString *)to
                                    payload:(NSString *)payload
                                  timestamp:(double)timestamp;

/// Called when a broadcast message is received.
///
/// @param messageId UUID string of the message
/// @param from Sender UUID
/// @param payload UTF-8 decoded message payload
/// @param timestamp Timestamp in milliseconds when received
- (void)emitBroadcastMessageReceivedWithMessageId:(NSString *)messageId
                                             from:(NSString *)from
                                          payload:(NSString *)payload
                                        timestamp:(double)timestamp;

/// Called when an internal SDK error occurs.
///
/// @param code Error identifier
/// @param message Human-readable description
/// @param context Optional additional debug context
- (void)emitBeaconMeshErrorWithCode:(NSString *)code
                            message:(NSString *)message
                            context:(nullable NSString *)context;

/// Called when a Bluetooth beacon is discovered.
///
/// @param uuid Beacon UUID (if available)
/// @param rssi Signal strength indicator
/// @param txPower Transmission power (if available)
/// @param deviceAddress MAC address or identifier
/// @param name Device name
- (void)emitBeaconDiscoveredWithUUID:(nullable NSString *)uuid
                                rssi:(double)rssi
                             txPower:(nullable NSNumber *)txPower
                       deviceAddress:(NSString *)deviceAddress
                                name:(NSString *)name;

/// Called when a previously discovered beacon is lost.
///
/// @param uuid Beacon UUID (if available)
/// @param rssi Last known signal strength
/// @param txPower Transmission power (if available)
/// @param deviceAddress MAC address or identifier
/// @param name Device name
- (void)emitBeaconLostWithUUID:(nullable NSString *)uuid
                          rssi:(double)rssi
                       txPower:(nullable NSNumber *)txPower
                 deviceAddress:(NSString *)deviceAddress
                          name:(NSString *)name;

@end


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
