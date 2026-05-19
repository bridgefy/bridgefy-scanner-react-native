#import <Foundation/Foundation.h>

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

NS_ASSUME_NONNULL_END
