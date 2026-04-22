import BeaconMeshSDK, {
  type BeaconMeshError,
  type BeaconMessage,
  type BeaconNode,
  type NotificationConfig,
  type Beacon,
  type BeaconMeshSession,
} from './NativeBeaconMeshSDK';
import type { EventSubscription } from 'react-native';

export {
  type BeaconMeshError,
  type BeaconMessage,
  type BeaconNode,
  type NotificationConfig,
  type Beacon,
  type BeaconMeshSession,
};

export const BeaconMesh = {
  initialize(apiKey: string, notification: NotificationConfig) {
    return BeaconMeshSDK.initialize(apiKey, notification);
  },

  start(userId: string | undefined | null) {
    return BeaconMeshSDK.start(userId);
  },

  stop(notification?: NotificationConfig) {
    return BeaconMeshSDK.stop(notification);
  },

  destroySession() {
    return BeaconMeshSDK.destroySession();
  },

  sendP2PMessage(receiverId: string, payload: string) {
    return BeaconMeshSDK.sendP2PMessage(receiverId, payload);
  },

  sendBroadcast(payload: string) {
    return BeaconMeshSDK.sendBroadcast(payload);
  },

  getConnectedNodes() {
    return BeaconMeshSDK.getConnectedNodes();
  },

  isStarted() {
    return BeaconMeshSDK.isStarted();
  },

  isInitialized() {
    return BeaconMeshSDK.isInitialized();
  },

  getCurrentSessionId() {
    return BeaconMeshSDK.getCurrentSessionId();
  },

  // Events

  onBeaconMeshStarted(
    cb: (node: BeaconMeshSession) => void
  ): EventSubscription {
    return BeaconMeshSDK.onBeaconMeshStarted(cb);
  },

  onBeaconMeshStopped(cb: () => void): EventSubscription {
    return BeaconMeshSDK.onBeaconMeshStopped(cb);
  },

  onBeaconDiscovered(cb: (node: Beacon) => void): EventSubscription {
    return BeaconMeshSDK.onBeaconDiscovered(cb);
  },

  onBeaconLost(cb: (node: Beacon) => void): EventSubscription {
    return BeaconMeshSDK.onBeaconLost(cb);
  },

  onNodeConnected(cb: (node: BeaconNode) => void): EventSubscription {
    return BeaconMeshSDK.onNodeConnected(cb);
  },

  onNodeDisconnected(cb: (node: BeaconNode) => void): EventSubscription {
    return BeaconMeshSDK.onNodeDisconnected(cb);
  },

  onP2PMessageReceived(cb: (msg: BeaconMessage) => void): EventSubscription {
    return BeaconMeshSDK.onP2PMessageReceived(cb);
  },

  onBroadcastMessageReceived(
    cb: (msg: BeaconMessage) => void
  ): EventSubscription {
    return BeaconMeshSDK.onBroadcastMessageReceived(cb);
  },

  onError(cb: (err: BeaconMeshError) => void): EventSubscription {
    return BeaconMeshSDK.onBeaconMeshError(cb);
  },
};
