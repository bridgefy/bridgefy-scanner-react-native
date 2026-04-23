import type { SDKControlResult, SDKStatusSnapshot } from '../entities';
import type { BeaconNode } from '@bridgefy/scanner-react-native';

export interface ISDKRepository {
  checkStatus(): Promise<SDKStatusSnapshot>;
  initialize(apiKey: string): Promise<SDKControlResult>;
  start(userId: string | undefined | null): Promise<SDKControlResult>;
  stop(): Promise<SDKControlResult>;
  destroySession(): Promise<SDKControlResult>;
  getConnectedPeers(): Promise<BeaconNode[]>;
  subscribeToEvents(handlers: SDKEventHandlers): void;
  unsubscribeFromEvents(): void;
}

export interface SDKEventHandlers {
  onStart?: (userId: string) => void;
  onStop?: () => void;
  onPeerConnect?: (userId: string) => void;
  onPeerDisconnect?: (userId: string) => void;
  onPeersUpdated?: (peers: string[]) => void;
  onStartFailed?: (error: Error) => void;
}
