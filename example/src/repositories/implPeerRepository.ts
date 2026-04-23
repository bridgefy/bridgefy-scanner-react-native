import type { Peer } from '../entities';
import { PeerListService } from '../services';
import type { IPeerRepository, PeerEventHandlers } from './PeerRepository';
import { BridgefyScanner } from '@bridgefy/scanner-react-native';
import type { EventSubscription } from 'react-native';

export class PeerRepository implements IPeerRepository {
  private eventHandlers: PeerEventHandlers = {};
  private eventListeners: EventSubscription[] = new Array<EventSubscription>();

  private readonly peerListService = new PeerListService();

  async getPeers(): Promise<Peer[]> {
    try {
      const connectedPeers = await BridgefyScanner.getConnectedNodes();

      if (!Array.isArray(connectedPeers)) {
        return [];
      }

      const peerList: Peer[] = connectedPeers.map((beacon, index) => ({
        id: `${index}-${beacon.id}`,
        userId: beacon.id,
        status: 'connected',
        connectionTime: beacon.lastSeen,
        signal: Math.floor(Math.random() * 40) + 60,
      }));

      return peerList;
    } catch (error) {
      console.error('Failed to get peers:', error);
      throw error;
    }
  }

  subscribeToEvents(handlers: PeerEventHandlers): void {
    this.eventHandlers = handlers;

    this.eventListeners.push(
      BridgefyScanner.onNodeConnected((event) => {
        console.log('Peer connected:', event.id);
        const peer: Peer = {
          id: `${Date.now()}-${Math.random()}`,
          userId: event.id,
          status: 'connected',
          connectionTime: event.lastSeen,
          signal: Math.floor(Math.random() * 40) + 60,
        };

        this.peerListService.addOrUpdatePeer(peer);
        this.eventHandlers.onPeerConnect?.(event.id);
        this.eventHandlers.onPeersUpdated?.(this.peerListService.getPeers());
      })
    );

    this.eventListeners.push(
      BridgefyScanner.onNodeDisconnected((event) => {
        console.log('Peer disconnected:', event.id);
        this.peerListService.updatePeerStatus(event.id, 'disconnected');
        this.eventHandlers.onPeerDisconnect?.(event.id);
        this.eventHandlers.onPeersUpdated?.(this.peerListService.getPeers());
      })
    );
  }

  unsubscribeFromEvents(): void {
    this.eventHandlers = {};
    this.eventListeners.forEach((event: EventSubscription) => {
      event.remove();
    });
    this.eventListeners = [];
  }
}
