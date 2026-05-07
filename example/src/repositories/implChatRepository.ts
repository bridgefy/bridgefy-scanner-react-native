import type { ChatEventHandlers, IChatRepository } from './ChatRepository';
import type { Message, TransmissionMode } from '../entities';
import { BridgefyScanner } from '@bridgefy/scanner-react-native';
import type { EventSubscription } from 'react-native';

export class ChatRepository implements IChatRepository {
  private eventHandlers: ChatEventHandlers = {};
  private eventListeners: EventSubscription[] = new Array<EventSubscription>();

  async getCurrentUserId(): Promise<string> {
    try {
      const userId = 'User Id not implemented'; // TODO  await BeaconMesh.currentUserId();
      if (!userId) {
        throw new Error('Unable to retrieve user ID');
      }
      return userId;
    } catch (error) {
      console.error('Failed to get current user ID:', error);
      throw error;
    }
  }

  async sendMessage(text: string): Promise<string> {
    try {
      return await BridgefyScanner.sendBroadcast(text);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  subscribeToMessages(handlers: ChatEventHandlers): void {
    this.eventHandlers = handlers;

    this.eventListeners.push(
      BridgefyScanner.Events.onBroadcastMessageReceived((event) => {
        console.log(JSON.stringify(event));
        const message: Message = {
          id: event.messageId || `msg-${Date.now()}-${Math.random()}`,
          text: event.payload,
          senderId: event.from || 'unknown',
          timestamp: event.timestamp,
          isMine: false,
          transmissionMode: 'broadcast' as TransmissionMode,
        };

        this.eventHandlers.onMessageReceived?.(message);
      })
    );

    this.eventListeners.push(
      BridgefyScanner.Events.onBeaconMeshStarted((event) => {
        this.eventHandlers.onUserIdChanged?.(event.userId);
      })
    );
  }

  unsubscribeFromMessages(): void {
    this.eventHandlers = {};
    this.eventListeners.forEach((event) => {
      event.remove();
    });
    this.eventListeners = [];
  }
}
