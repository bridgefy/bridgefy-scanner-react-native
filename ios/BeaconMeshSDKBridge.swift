import Foundation
import React
import BeaconMesh

@objc(BeaconMeshSDKBridge)
final class BeaconMeshSDKBridge: NSObject, BeaconMeshClientDelegate {

  // MARK: - Singleton

  /// Shared singleton instance used by React Native bridge
  @objc static let instance = BeaconMeshSDKBridge()

  @objc static func shared() -> BeaconMeshSDKBridge {
    instance
  }

  // MARK: - Dependencies

  /// Core mesh manager (source of truth for state)
  private let meshManager = BeaconMeshManager.shared

  /// Delegate used to emit events to JS layer
  @objc weak var delegate: BeaconMeshSDKBridgeDelegate?

  // MARK: - Session State

  private var currentSessionId: String?
  private var currentUserId: String?
  private var startTime: Double?

  // MARK: - Validation Helpers

  /// Ensures SDK is initialized
  private func requireInitialized(_ reject: RCTPromiseRejectBlock) -> Bool {
    guard meshManager.isInitialized else {
      reject("NOT_INITIALIZED", "BeaconMesh SDK is not initialized", nil)
      return false
    }
    return true
  }

  /// Ensures SDK is started
  private func requireStarted(_ reject: RCTPromiseRejectBlock) -> Bool {
    guard meshManager.isStarted else {
      reject("NOT_STARTED", "BeaconMesh SDK is not started", nil)
      return false
    }
    return true
  }

  /// Validates and converts String → UUID
  private func requireUUID(
    _ value: String,
    field: String,
    reject: RCTPromiseRejectBlock
  ) -> UUID? {
    guard !value.isEmpty else {
      reject("INVALID_PARAM", "\(field) is required", nil)
      return nil
    }

    guard let uuid = UUID(uuidString: value) else {
      reject("INVALID_UUID", "\(field) must be a valid UUID", nil)
      return nil
    }

    return uuid
  }

  /// Converts payload string to Data
  private func requireData(
    _ payload: String,
    reject: RCTPromiseRejectBlock
  ) -> Data? {
    guard let data = payload.data(using: .utf8) else {
      reject("INVALID_PAYLOAD", "Payload encoding failed", nil)
      return nil
    }
    return data
  }

  // MARK: - Initialize

  /**
   Initializes the BeaconMesh SDK.

   - Parameter apiKey: UUID string used as API key
   - Parameter notification: Optional notification config (unused for now)
   - Resolves when initialization completes successfully
   */
  @objc func initialize(
    _ apiKey: String,
    notification: NSDictionary,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireUUID(apiKey, field: "apiKey", reject: reject) != nil else {
      return
    }

    meshManager.initialize(apiKey: apiKey, delegate: self) { error in
      if let error {
        reject("INIT_ERROR", error.localizedDescription, error)
      } else {
        resolve(nil)
      }
    }
  }

  // MARK: - Start

  /**
   Starts the mesh network session.

   - Parameter userId: Optional UUID string identifying the user
   */
  @objc func start(
    _ userId: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireInitialized(reject) else { return }

    if let userId, !userId.isEmpty {
      guard requireUUID(userId, field: "userId", reject: reject) != nil else {
        return
      }
    }

    meshManager.start(userId: userId) { error in
      if let error {
        reject("START_ERROR", error.localizedDescription, error)
      } else {
        self.currentUserId = userId
        self.startTime = Date().timeIntervalSince1970 * 1000
        resolve(nil)
      }
    }
  }

  // MARK: - Stop

  /**
   Stops the active mesh session.
   */
  @objc func stop(
    _ notification: NSDictionary?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireStarted(reject) else { return }

    meshManager.stop()
    delegate?.emitBeaconMeshStoppedEvent()
    resolve(nil)
  }

  // MARK: - Session

  /**
   Resets the current session and clears local state.
   */
  @objc func destroySession(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireInitialized(reject) else { return }

    meshManager.resetSession()
    currentSessionId = nil
    currentUserId = nil
    resolve(nil)
  }

  // MARK: - Messaging

  /**
   Sends a peer-to-peer message.

   - Parameter receiverId: UUID string of recipient
   - Parameter payload: UTF-8 string message
   - Returns: messageId (UUID string)
   */
  @objc func sendP2PMessage(
    _ receiverId: String,
    payload: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireStarted(reject) else { return }

    guard let uuid = requireUUID(receiverId, field: "receiverId", reject: reject),
          let data = requireData(payload, reject: reject) else {
      return
    }

    var error: NSError?
    guard let messageId = meshManager.sendP2PMessage(data, userId: uuid, err: &error) else {
      reject("SEND_ERROR", error?.localizedDescription ?? "Unknown error", error)
      return
    }

    resolve(messageId)
  }

  /**
   Sends a broadcast message to all peers.
   */
  @objc func sendBroadcast(
    _ payload: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireStarted(reject) else { return }

    guard let data = requireData(payload, reject: reject) else { return }

    var error: NSError?
    guard let messageId = meshManager.sendBroadcast(data, err: &error) else {
      reject("SEND_ERROR", error?.localizedDescription ?? "Unknown error", error)
      return
    }

    resolve(messageId)
  }

  // MARK: - Nodes

  /**
   Returns list of connected nodes.
   */
  @objc func getConnectedNodes(
    _ resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireStarted(reject) else { return }

    var error: NSError?
    guard let nodes = meshManager.getConnectedNodes(err: &error) else {
      reject("NODES_ERROR", error?.localizedDescription ?? "Unknown error", error)
      return
    }

    resolve(nodes)
  }

  /**
   Returns details of a specific node.
   */
  @objc func getNode(
    _ nodeId: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard requireStarted(reject) else { return }

    guard requireUUID(nodeId, field: "nodeId", reject: reject) != nil else {
      return
    }

    var error: NSError?
    guard let node = meshManager.getNode(nodeId: nodeId, err: &error) else {
      reject("NODE_ERROR", error?.localizedDescription ?? "Unknown error", error)
      return
    }

    resolve(node)
  }

  // MARK: - State

  /// Returns whether SDK is started
  @objc func isStarted(
    _ resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    resolve(meshManager.isStarted)
  }

  /// Returns whether SDK is initialized
  @objc func isInitialized(
    _ resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    resolve(meshManager.isInitialized)
  }

  /// Returns current session UUID
  @objc func getCurrentSessionId(
    _ resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    let node: [String: Any] = [
      "userId": self.meshManager.currentUUID(),
      "startTime": self.startTime,
      "isActive" : true
    ]
    resolve(node)
  }

  // MARK: - Delegate Events

  func beaconMeshClientDidStart(_ client: BeaconMeshClient) {
    currentSessionId = client.currentUUID?.uuidString

    meshManager.handleDidStart()

    delegate?.emitBeaconMeshStarted(
      withUserId: currentSessionId,
      startTime: Date().timeIntervalSince1970 * 1000,
      isActive: true
    )
  }

  func beaconMeshClientDidStop(_ client: BeaconMeshClient) {
    meshManager.handleDidStop()
    delegate?.emitBeaconMeshStoppedEvent()
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        didReceiveP2PMessage payload: Data,
                        with messageId: UUID,
                        from peerID: UUID) {

    let message = String(data: payload, encoding: .utf8) ?? ""

    delegate?.emitP2PMessageReceived(
      withMessageId: messageId.uuidString,
      from: peerID.uuidString,
      to: meshManager.currentUUID(),
      payload: message,
      timestamp: Date().timeIntervalSince1970 * 1000
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        didReceiveBroadcastMessage payload: Data,
                        with messageId: UUID,
                        from peerID: UUID) {

    let message = String(data: payload, encoding: .utf8) ?? ""

    delegate?.emitBroadcastMessageReceived(
      withMessageId: messageId.uuidString,
      from: peerID.uuidString,
      payload: message,
      timestamp: Date().timeIntervalSince1970 * 1000
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        didEncounterError error: BeaconMeshClientError) {

    delegate?.emitBeaconMeshError(
      withCode: error.localizedDescription,
      message: error.failureReason ?? "Unknown error",
      context: error.localizedDescription
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        didDetectBeacon beacon: Beacon) {

    delegate?.emitBeaconDiscovered(
      withUUID: nil,
      rssi: Double(beacon.rssi) ?? 0,
      txPower: nil,
      deviceAddress: beacon.minewMAC,
      name: beacon.name
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        didLoseBeacon beacon: Beacon) {

    delegate?.emitBeaconLost(
      withUUID: nil,
      rssi: Double(beacon.rssi) ?? 0,
      txPower: nil,
      deviceAddress: beacon.minewMAC,
      name: beacon.name
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        peerDidConnect peerUUID: UUID) {

    delegate?.emitNodeConnected(
      withId: peerUUID.uuidString,
      lastSeen: Date().timeIntervalSince1970 * 1000
    )
  }

  func beaconMeshClient(_ client: BeaconMeshClient,
                        peerDidDisconnect peerUUID: UUID) {

    delegate?.emitNodeDisconnected(
      withId: peerUUID.uuidString,
      lastSeen: Date().timeIntervalSince1970 * 1000
    )
  }
}
