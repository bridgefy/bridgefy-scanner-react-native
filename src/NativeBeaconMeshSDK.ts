import type { TurboModule, CodegenTypes } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

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
  to?: string; // undefined for broadcast
  payload: string; // or base64
  timestamp: number;
};

export type BeaconMeshError = {
  code: string; // e.g. "NOT_STARTED", "START_FAILED", "SEND_FAILED"
  message: string;
  context?: string; // e.g. "start", "stop", "sendP2P"
};

export type Beacon = {
  uuid?: string;
  rssi: number;
  txPower?: number;
  deviceAddress: string;
  name: string;
};

export interface Spec extends TurboModule {
  // Control
  initialize(
    apiKey: string,
    notification: NotificationConfig
  ): Promise<boolean>;
  start(userId: string | undefined | null): Promise<BeaconMeshSession>;
  stop(notification: NotificationConfig | undefined | null): Promise<void>;
  destroySession(): Promise<void>;

  // Messaging
  sendP2PMessage(receiverId: string, payload: string): Promise<string>; // returns messageId
  sendBroadcast(payload: string): Promise<string>; // returns messageId

  // Connectivity
  getConnectedNodes(): Promise<BeaconNode[]>;
  getNode(nodeId: string): Promise<BeaconNode | null>;

  // State
  isStarted(): Promise<boolean>;
  isInitialized(): Promise<boolean>;

  // Session
  getCurrentSessionId(): Promise<BeaconMeshSession>;

  // Events (Codegen EventEmitter API)
  readonly onBeaconMeshStarted: CodegenTypes.EventEmitter<BeaconMeshSession>;
  readonly onBeaconMeshStopped: CodegenTypes.EventEmitter<void>;
  readonly onNodeConnected: CodegenTypes.EventEmitter<BeaconNode>;
  readonly onNodeDisconnected: CodegenTypes.EventEmitter<BeaconNode>;
  readonly onP2PMessageReceived: CodegenTypes.EventEmitter<BeaconMessage>;
  readonly onBroadcastMessageReceived: CodegenTypes.EventEmitter<BeaconMessage>;
  readonly onBeaconMeshError: CodegenTypes.EventEmitter<BeaconMeshError>;
  readonly onBeaconDiscovered: CodegenTypes.EventEmitter<Beacon>;
  readonly onBeaconLost: CodegenTypes.EventEmitter<Beacon>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BeaconMeshSDK');
