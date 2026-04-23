import type { IP2PChatRepository, P2PEventHandlers } from './P2PChatRepository';
import type { P2PMessage } from '../entities';
import { BridgefyScanner } from '@bridgefy/scanner-react-native';
import type { EventSubscription } from 'react-native';

export class P2PChatRepository implements IP2PChatRepository {
  private eventHandlers: P2PEventHandlers = {};
  private eventListeners: EventSubscription[] = new Array<EventSubscription>();

  async getCurrentUserId(): Promise<string> {
    try {
      const userId = 'Get My user id not implemented'; // TODO: await Bridgefy.currentUserId();
      if (!userId) {
        throw new Error('Unable to retrieve user ID');
      }
      return userId;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      throw error;
    }
  }

  async sendP2PMessage(text: string, peerId: string): Promise<string> {
    try {
      const messageId = await BridgefyScanner.sendP2PMessage(peerId, text);
      return messageId;
    } catch (error) {
      console.error('Failed to send P2P message:', error);
      throw error;
    }
  }

  subscribeToP2PEvents(peerId: string, handlers: P2PEventHandlers): void {
    this.eventHandlers = handlers;

    this.eventListeners.push(
      BridgefyScanner.onP2PMessageReceived((event) => {
        const message: P2PMessage = {
          id: event.messageId || `msg-${Date.now()}-${Math.random()}`,
          text: event.payload,
          senderId: event.from,
          timestamp: event.timestamp,
          isMine: false,
          status: 'sent',
        };

        this.eventHandlers.onMessageReceived?.(message);
      })
    );

    // Escuchar desconexiones del peer
    this.eventListeners.push(
      BridgefyScanner.onNodeDisconnected((event) => {
        if (event.id === peerId) {
          console.log('Peer disconnected:', peerId);
          this.eventHandlers.onPeerDisconnected?.(peerId);
        }
      })
    );

    // Escuchar reconexiones del peer
    this.eventListeners.push(
      BridgefyScanner.onNodeConnected((event) => {
        if (event.id === peerId) {
          console.log('Peer connected:', peerId);
          this.eventHandlers.onPeerConnected?.(peerId);
        }
      })
    );

    // Escuchar fallos en el envío
    this.eventListeners.push(
      BridgefyScanner.onError((error) => {
        console.error('Failed to send message:', error);
        const err: Error & { messageId?: string } = Object.assign(
          new Error(error?.message ?? 'Failed to send message'),
          error
        );
        this.eventHandlers.onMessageFailed?.(err);
      })
    );
  }

  unsubscribeFromP2PEvents(): void {
    this.eventHandlers = {};
    this.eventListeners.forEach((listener: EventSubscription) => {
      listener.remove();
    });
    this.eventListeners = [];
  }
}
