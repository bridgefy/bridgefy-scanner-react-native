import { TurboModuleRegistry, type TurboModule } from 'react-native';

export type NotificationConfig = {
  title: string;
  message: string;
  startMessage: string;
  stopMessage: string;
};

export type BeaconMeshSession = {
  userId: string;
  startTime: number;
  isActive: boolean;
};

export type BeaconNode = {
  id: string;
  lastSeen: number;
};

export type BeaconMessage = {
  messageId: string;
  from: string;
  to?: string;
  payload: string;
  timestamp: number;
};

export type BeaconMeshError = {
  code: string;
  message: string;
  context?: string;
};

export type Beacon = {
  uuid?: string;
  rssi: number;
  txPower?: number;
  deviceAddress: string;
  name: string;
};

export interface Spec extends TurboModule {
  initialize(
    apiKey: string,
    notification: NotificationConfig
  ): Promise<boolean>;
  start(userId?: string | null): Promise<BeaconMeshSession>;
  stop(notification?: NotificationConfig | null): Promise<void>;
  destroySession(): Promise<void>;

  sendP2PMessage(receiverId: string, payload: string): Promise<string>;
  sendBroadcast(payload: string): Promise<string>;

  getConnectedNodes(): Promise<BeaconNode[]>;
  getNode(nodeId: string): Promise<BeaconNode | null>;

  isStarted(): Promise<boolean>;
  isInitialized(): Promise<boolean>;
  getCurrentSessionId(): Promise<BeaconMeshSession>;

  addListener?(eventName: string): void;
  removeListeners?(count: number): void;
}

export const BridgefyScannerNative =
  TurboModuleRegistry.get<Spec>('BeaconMeshSDK');
