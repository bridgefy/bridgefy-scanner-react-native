import type { ISDKRepository, SDKEventHandlers } from './SDKRepository';
import type { SDKControlResult, SDKStatusSnapshot } from '../entities';
import {
  BridgefyScanner,
  type BeaconMeshError,
  type BeaconNode,
  type NotificationConfig,
} from '@bridgefy/scanner-react-native';
import type { EventSubscription } from 'react-native';

export class SDKRepository implements ISDKRepository {
  destroySession(): Promise<SDKControlResult> {
    throw new Error('Method not implemented.');
  }
  private eventHandlers: SDKEventHandlers = {};
  private eventListeners: EventSubscription[] = new Array<EventSubscription>();

  async initialize(apiKey: string): Promise<SDKControlResult> {
    try {
      const isAlreadyInitialized = await BridgefyScanner.isInitialized();
      if (isAlreadyInitialized) {
        return {
          success: true,
          message: 'SDK is already initialized',
        };
      }

      await BridgefyScanner.initialize(apiKey, {
        title: 'Monitor has started',
        message: 'SDK is already started',
        startMessage: 'Start SDK',
        stopMessage: 'Stop SDK',
      } as NotificationConfig);
      return {
        success: true,
        message: 'Bridgefy SDK initialized successfully',
      };
    } catch (error: any) {
      console.error('Failed to initialize SDK:', error);
      return {
        success: false,
        error,
      };
    }
  }

  async checkStatus(): Promise<SDKStatusSnapshot> {
    try {
      const isInitialized = await BridgefyScanner.isInitialized();
      const isStarted = await BridgefyScanner.isStarted();
      let userId = '';
      let connectedPeers: string[] = [];

      if (isStarted) {
        let session = await BridgefyScanner.getCurrentSessionId();
        userId = session.userId;
        connectedPeers =
          (await BridgefyScanner.getConnectedNodes()).map((peer) => peer.id) ||
          [];
      }

      return {
        isInitialized,
        isStarted,
        userId,
        connectedPeers,
        loading: false,
      };
    } catch (error) {
      console.error('Failed to check SDK status:', error);
      throw error;
    }
  }

  async start(userId: string | undefined | null): Promise<SDKControlResult> {
    try {
      const isAlreadyStarted = await BridgefyScanner.isStarted();
      if (isAlreadyStarted) {
        return {
          success: true,
          message: 'SDK is already started',
        };
      }

      await BridgefyScanner.start(userId);
      return {
        success: true,
        message: 'Beacon Mesh SDK started successfully',
      };
    } catch (error: any) {
      console.error('Failed to start SDK:', error);
      return {
        success: false,
        error,
      };
    }
  }

  async stop(): Promise<SDKControlResult> {
    try {
      const isStarted = await BridgefyScanner.isStarted();
      if (!isStarted) {
        return {
          success: true,
          message: 'SDK is not running',
        };
      }

      await BridgefyScanner.stop({
        title: 'Monitor',
        message: 'SDK is already stopped',
        startMessage: 'Start SDK',
        stopMessage: 'Stop SDK',
      } as NotificationConfig);
      return {
        success: true,
        message: 'Beacon Mesh SDK stopped successfully',
      };
    } catch (error: any) {
      console.error('Failed to stop SDK:', error);
      return {
        success: false,
        error,
      };
    }
  }

  async getConnectedPeers(): Promise<BeaconNode[]> {
    try {
      return (await BridgefyScanner.getConnectedNodes()) || [];
    } catch (error) {
      console.error('Failed to get connected peers:', error);
      throw error;
    }
  }

  subscribeToEvents(handlers: SDKEventHandlers): void {
    this.eventHandlers = handlers;

    this.eventListeners.push(
      BridgefyScanner.onBeaconMeshStarted((event) => {
        this.eventHandlers.onStart?.(event.userId);
      })
    );

    this.eventListeners.push(
      BridgefyScanner.onBeaconMeshStopped(() => {
        this.eventHandlers.onStop?.();
      })
    );

    this.eventListeners.push(
      BridgefyScanner.onNodeConnected((event) => {
        this.eventHandlers.onPeerConnect?.(event.id);
        this.updatePeers();
      })
    );

    this.eventListeners.push(
      BridgefyScanner.onNodeDisconnected((event) => {
        this.eventHandlers.onPeerDisconnect?.(event.id);
        this.updatePeers();
      })
    );

    this.eventListeners.push(
      BridgefyScanner.onError((error: BeaconMeshError) => {
        const err = new Error(
          (error as any)?.message ?? 'Beacon Mesh failed to start'
        );
        err.name = (error as any)?.name ?? 'Beacon MeshError';
        (err as any).code = (error as any)?.code;
        (err as any).original = error;
        this.eventHandlers.onStartFailed?.(err);
      })
    );
  }

  unsubscribeFromEvents(): void {
    this.eventHandlers = {};
    this.eventListeners.forEach((listener: EventSubscription) => {
      listener.remove();
    });
    this.eventListeners = [];
  }

  private async updatePeers(): Promise<void> {
    try {
      const peers = await this.getConnectedPeers();
      this.eventHandlers.onPeersUpdated?.(peers.map((peer) => peer.id));
    } catch (error) {
      console.error('Failed to update peers:', error);
    }
  }
}
