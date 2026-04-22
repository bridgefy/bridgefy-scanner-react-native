/**
 * BeaconMeshEventStore.ts
 *
 * Global event store/context for collecting all SDK events
 * Events are stored centrally and accessible from any screen
 */
import { create } from 'zustand';
import {
  type BeaconMeshError,
  type BeaconMessage,
  type BeaconNode,
  type Beacon,
  type BeaconMeshSession,
} from '@beaconmesh/react-native';

export interface SDKEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  eventName: string;
  eventKey: string;
  message: string;
  data?: any;
  screen?: string;
}

export interface BeaconMeshEventStoreState {
  // Events
  events: SDKEvent[];
  addEvent: (event: Omit<SDKEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  getEventsByType: (
    type: 'info' | 'success' | 'warning' | 'error'
  ) => SDKEvent[];
  getEventsByScreen: (screen: string) => SDKEvent[];

  // SDK Status
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;

  isStarted: boolean;
  setIsStarted: (value: boolean) => void;

  currentUserId: string;
  setCurrentUserId: (userId: string) => void;

  connectedPeersCount: number;
  setConnectedPeersCount: (count: number) => void;

  // Statistics
  totalMessagesSent: number;
  setTotalMessagesSent: (count: number) => void;

  totalMessagesReceived: number;
  setTotalMessagesReceived: (count: number) => void;

  // Max events limit
  MAX_EVENTS: number;
}

export const useBeaconMeshEventStore = create<BeaconMeshEventStoreState>(
  (set, get) => ({
    MAX_EVENTS: 500,

    events: [],

    addEvent: (event: Omit<SDKEvent, 'id' | 'timestamp'>) => {
      const newEvent: SDKEvent = {
        ...event,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };

      set((state) => {
        const events = [newEvent, ...state.events];
        // Keep only the latest MAX_EVENTS events
        if (events.length > state.MAX_EVENTS) {
          return { events: events.slice(0, state.MAX_EVENTS) };
        }
        return { events };
      });
    },

    clearEvents: () => {
      set({ events: [] });
    },

    getEventsByType: (type) => {
      return get().events.filter((event) => event.type === type);
    },

    getEventsByScreen: (screen) => {
      return get().events.filter((event) => event.screen === screen);
    },

    isInitialized: false,
    setIsInitialized: (value) => set({ isInitialized: value }),

    isStarted: false,
    setIsStarted: (value) => set({ isStarted: value }),

    currentUserId: '',
    setCurrentUserId: (userId) => set({ currentUserId: userId }),

    connectedPeersCount: 0,
    setConnectedPeersCount: (count) => set({ connectedPeersCount: count }),

    totalMessagesSent: 0,
    setTotalMessagesSent: (count) => set({ totalMessagesSent: count }),

    totalMessagesReceived: 0,
    setTotalMessagesReceived: (count) => set({ totalMessagesReceived: count }),
  })
);

/**
 * Helper function to create and add event to store
 */
export const addBeaconMeshEvent = (
  type: 'info' | 'success' | 'warning' | 'error',
  eventName: string,
  eventKey: string,
  message: string,
  data?: any,
  screen?: string
) => {
  useBeaconMeshEventStore.getState().addEvent({
    type,
    eventName,
    eventKey,
    message,
    data,
    screen,
  });
};

/**
 * Event listener setup hook
 * Call this once in your main app or a context provider
 */
export const setupBeaconMeshEventListeners = (BeaconMesh: any) => {
  const store = useBeaconMeshEventStore.getState();

  // Lifecycle Events
  BeaconMesh.onBeaconMeshStarted((event: BeaconMeshSession) => {
    store.setIsStarted(true);
    store.setCurrentUserId(event.userId);
    addBeaconMeshEvent(
      'success',
      'BEACON_MESH_DID_START',
      'beaconMeshDidStart',
      'SDK started successfully',
      event
    );
  });

  BeaconMesh.onBeaconMeshStopped(() => {
    store.setIsStarted(false);
    addBeaconMeshEvent(
      'info',
      'BEACON_MESH_DID_STOP',
      'beaconMeshDidStop',
      'SDK stopped'
    );
  });

  BeaconMesh.onError((error: BeaconMeshError) => {
    store.setIsStarted(false);
    addBeaconMeshEvent(
      'error',
      'BEACON_MESH_DID_FAIL_TO_START',
      'beaconMeshDidFailToStart',
      `Failed to start: ${error.message}`,
      error
    );
  });

  // Beacon Discovered

  BeaconMesh.onBeaconDiscovered((event: Beacon) => {
    addBeaconMeshEvent(
      'info',
      'BEACON_MESH_DID_BEACON_DISCOVERED',
      'beaconMeshDidBeaconDiscovered',
      `Beacon discovered ${event.uuid}`,
      event
    );
  });

  // Connection Events
  BeaconMesh.onNodeConnected((event: BeaconNode) => {
    addBeaconMeshEvent(
      'success',
      'BEACON_MESH_DID_CONNECT',
      'beaconMeshDidConnect',
      `Peer connected: ${event.id.substring(0, 12)}...`,
      event
    );
  });

  BeaconMesh.onNodeDisconnected((event: BeaconNode) => {
    addBeaconMeshEvent(
      'warning',
      'BEACON_MESH_DID_DISCONNECT',
      'beaconMeshDidDisconnect',
      `Peer disconnected: ${event.id.substring(0, 12)}...`,
      event
    );
  });

  // Message Events
  BeaconMesh.onP2PMessageReceived((event: BeaconMessage) => {
    store.setTotalMessagesReceived(store.totalMessagesReceived + 1);
    addBeaconMeshEvent(
      'info',
      'BEACON_MESH_DID_RECEIVE_P2P_DATA',
      'beaconMeshDidReceiveData',
      `Message received from ${event.from?.substring(0, 12)}...`,
      event
    );
  });

  BeaconMesh.onBroadcastMessageReceived((event: BeaconMessage) => {
    store.setTotalMessagesReceived(store.totalMessagesReceived + 1);
    addBeaconMeshEvent(
      'info',
      'BEACON_MESH_DID_RECEIVE_BROADCAST_DATA',
      'beaconMeshDidReceiveData',
      `Message received from ${event.from?.substring(0, 12)}...`,
      event
    );
  });
};
