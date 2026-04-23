import type { Peer } from '../entities';

export interface IPeerRepository {
  getPeers(): Promise<Peer[]>;
  subscribeToEvents(handlers: PeerEventHandlers): void;
  unsubscribeFromEvents(): void;
}

export interface PeerEventHandlers {
  onPeerConnect?: (userId: string) => void;
  onPeerDisconnect?: (userId: string) => void;
  onSecureConnection?: (userId: string) => void;
  onPeersUpdated?: (peers: Peer[]) => void;
  onError?: (error: Error) => void;
}
