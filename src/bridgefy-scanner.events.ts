import { NativeEventEmitter, NativeModules } from 'react-native';
import type { EventSubscription } from 'react-native';

import type {
  Beacon,
  BeaconMessage,
  BeaconMeshError,
  BeaconNode,
} from './bridgefy-scanner.spec';

const { BeaconMeshSDK } = NativeModules;

const emitter = new NativeEventEmitter(BeaconMeshSDK);

export const Events = {
  ON_BEACON_MESH_STARTED: 'onBeaconMeshStarted',
  ON_BEACON_MESH_STOPPED: 'onBeaconMeshStopped',
  ON_NODE_CONNECTED: 'onNodeConnected',
  ON_NODE_DISCONNECTED: 'onNodeDisconnected',
  ON_P2P_RECEIVED: 'onP2PMessageReceived',
  ON_BROADCAST_RECEIVED: 'onBroadcastMessageReceived',
  ON_ERROR: 'onBeaconMeshError',
  ON_BEACON_DISCOVERED: 'onBeaconDiscovered',
  ON_BEACON_LOST: 'onBeaconLost',
} as const;

export const BridgefyScannerEvents = {
  onBeaconMeshStarted(callback: (session: any) => void): EventSubscription {
    return emitter.addListener(Events.ON_BEACON_MESH_STARTED, callback);
  },

  onBeaconMeshStopped(callback: () => void): EventSubscription {
    return emitter.addListener(Events.ON_BEACON_MESH_STOPPED, callback);
  },

  onNodeConnected(callback: (node: BeaconNode) => void): EventSubscription {
    return emitter.addListener(Events.ON_NODE_CONNECTED, callback);
  },

  onNodeDisconnected(callback: (node: BeaconNode) => void): EventSubscription {
    return emitter.addListener(Events.ON_NODE_DISCONNECTED, callback);
  },

  onP2PMessageReceived(callback: (msg: BeaconMessage) => void): EventSubscription {
    return emitter.addListener(Events.ON_P2P_RECEIVED, callback);
  },

  onBroadcastMessageReceived(
    callback: (msg: BeaconMessage) => void
  ): EventSubscription {
    return emitter.addListener(Events.ON_BROADCAST_RECEIVED, callback);
  },

  onBeaconMeshError(callback: (err: BeaconMeshError) => void): EventSubscription {
    return emitter.addListener(Events.ON_ERROR, callback);
  },

  onBeaconDiscovered(callback: (beacon: Beacon) => void): EventSubscription {
    return emitter.addListener(Events.ON_BEACON_DISCOVERED, callback);
  },

  onBeaconLost(callback: (beacon: Beacon) => void): EventSubscription {
    return emitter.addListener(Events.ON_BEACON_LOST, callback);
  },

  addEventListener(
    eventName: string,
    listener: (event: unknown) => void
  ): EventSubscription {
    return emitter.addListener(eventName, listener);
  },

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      emitter.removeAllListeners(eventName);
      return;
    }

    Object.values(Events).forEach((event) => {
      emitter.removeAllListeners(event);
    });
  },
};

export { emitter as BridgefyScannerEmitter };
