import { NativeModules } from 'react-native';

import { BridgefyScannerNative } from './bridgefy-scanner.spec';
import { BridgefyScannerEvents } from './bridgefy-scanner.events';

import type {
  BeaconMeshSession,
  BeaconNode,
  NotificationConfig,
} from './bridgefy-scanner.spec';

const nativeModule = BridgefyScannerNative ?? NativeModules.BeaconMeshSDK;

if (!nativeModule) {
  throw new Error('BeaconMeshSDK native module is not available');
}

export const BridgefyScanner = {
  initialize(
    apiKey: string,
    notification: NotificationConfig
  ): Promise<boolean> {
    return nativeModule.initialize(apiKey, notification);
  },

  start(userId?: string | null): Promise<BeaconMeshSession> {
    return nativeModule.start(userId);
  },

  stop(notification?: NotificationConfig | null): Promise<void> {
    return nativeModule.stop(notification);
  },

  destroySession(): Promise<void> {
    return nativeModule.destroySession();
  },

  sendP2PMessage(receiverId: string, payload: string): Promise<string> {
    return nativeModule.sendP2PMessage(receiverId, payload);
  },

  sendBroadcast(payload: string): Promise<string> {
    return nativeModule.sendBroadcast(payload);
  },

  getConnectedNodes(): Promise<BeaconNode[]> {
    return nativeModule.getConnectedNodes();
  },

  getNode(nodeId: string): Promise<BeaconNode | null> {
    return nativeModule.getNode(nodeId);
  },

  isStarted(): Promise<boolean> {
    return nativeModule.isStarted();
  },

  isInitialized(): Promise<boolean> {
    return nativeModule.isInitialized();
  },

  getCurrentSessionId(): Promise<BeaconMeshSession> {
    return nativeModule.getCurrentSessionId();
  },

  Events: BridgefyScannerEvents,
};
