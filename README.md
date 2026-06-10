# BridgefyScanner 1.0.2

The package is a JavaScript wrapper around the native `BeaconMeshSDK` TurboModule and exposes initialization, session control, messaging, connectivity helpers, and event listeners.

> `NotificationConfig` is **Android-only in practice** because it is used for the foreground service notification shown while the scanner or mesh service is running. The JavaScript API exposes it in `initialize` and `stop`, but this behavior is intended for Android integration.

---

## Overview

`BridgefyScanner` helps a React Native app connect to the native `BeaconMeshSDK` module named `BeaconMeshSDK`, then initialize the SDK, start a mesh session, exchange messages, observe nearby nodes, and listen for runtime events.

### Main capabilities

- Initialize the SDK with `initialize(apiKey, notification)`.
- Start a session with `start(userId)` and receive a `BeaconMeshSession` result.
- Stop or destroy the session with `stop()` and `destroySession()`.
- Send direct or broadcast messages with `sendP2PMessage()` and `sendBroadcast()`.
- Inspect state with `isInitialized()`, `isStarted()`, `getConnectedNodes()`, and `getCurrentSessionId()`.
- Subscribe to native events for lifecycle, discovery, connectivity, messages, and errors.

---

## Exposed API

### Import

```ts
import { BridgefyScanner, type NotificationConfig } from '@bridgefy/scanner-react-native';
```

### Methods

| Method | Description |
|---|---|
| `initialize(apiKey, notification)` | Initializes the native SDK using your Bridgefy API key and a notification configuration. |
| `start(userId)` | Starts a Beacon Mesh session and returns session data. |
| `stop(notification?)` | Stops the active session. |
| `destroySession()` | Clears the current native session state. |
| `sendP2PMessage(receiverId, payload)` | Sends a direct message and returns a message id. |
| `sendBroadcast(payload)` | Sends a broadcast message and returns a message id. |
| `getConnectedNodes()` | Returns currently connected nodes. |
| `isStarted()` | Indicates whether the mesh session is running. |
| `isInitialized()` | Indicates whether the SDK has been initialized. |
| `getCurrentSessionId()` | Returns the current session object. |

### Returned session shape

```ts
{
  userId: string;
  startTime: number;
  isActive: boolean;
}
```

This shape comes from the `BeaconMeshSession` type defined in the native module contract.

---

## Events

`BridgefyScanner` exposes these subscriptions:

- `onBeaconMeshStarted`
- `onBeaconMeshStopped`
- `onBeaconDiscovered`
- `onBeaconLost`
- `onNodeConnected`
- `onNodeDisconnected`
- `onP2PMessageReceived`
- `onBroadcastMessageReceived`
- `onError` (mapped to native `onBeaconMeshError`)

### Example subscription

```ts
const startedSub = BridgefyScanner.onBeaconMeshStarted(session => {
  console.log('Mesh started', session);
});

const errorSub = BridgefyScanner.onError(error => {
  console.log('Bridgefy error', error);
});

// cleanup
startedSub.remove();
errorSub.remove();
```

---

## Quick start

### 1. Initialize the SDK

Call `initialize` before `start`.

```ts
const notification: NotificationConfig = {
  title: 'Bridgefy active',
  message: 'Mesh service is running',
  startMessage: 'Bridgefy started',
  stopMessage: 'Bridgefy stopped',
};

await BridgefyScanner.initialize('YOUR_API_KEY', notification);
```

### 2. Start the session

```ts
const session = await BridgefyScanner.start('user-123');
console.log(session);
```

### 3. Send messages

```ts
await BridgefyScanner.sendP2PMessage('receiver-id', 'hello');
await BridgefyScanner.sendBroadcast('hello everyone');
```

### 4. Stop the session

```ts
await BridgefyScanner.stop();
```

---

## Permissions required

For reliable device discovery and connection, configure permissions for both **Location Services** and **Bluetooth** on Android and iOS. In practical BLE integrations, location-related permission is commonly needed for discovery, while Bluetooth permission is required to scan, discover, advertise, and connect to nearby devices.

---

## Android integration

### NotificationConfig behavior

`NotificationConfig` should be considered **Android-only** for app integration because Android requires a visible foreground service notification while the service is running. That is why the scanner service notification appears when the feature is active.

### AndroidManifest permissions

Use the following permissions in `AndroidManifest.xml`:

```xml
<!-- Android 12+ (API 31+) Bluetooth permissions -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- All Android versions - Location (required for Bluetooth scanning) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Android < 12 (API < 31) - Legacy Bluetooth permissions -->
<uses-permission
  android:name="android.permission.BLUETOOTH"
  android:maxSdkVersion="30" />
<uses-permission
  android:name="android.permission.BLUETOOTH_ADMIN"
  android:maxSdkVersion="30" />
```

### Android runtime permissions

Request runtime permissions before starting scanning, especially on Android 12+ and on devices where BLE discovery still depends on location permission.

### Android permission descriptions

Recommended user-facing permission explanations:

- **Location Services:** required to discover and connect nearby devices.
- **Bluetooth:** required to scan, discover, advertise, and connect nearby Bluetooth devices.

### Android note

If the app starts the scanner without the required permissions or without foreground-service support in the native layer, the service may fail to start correctly.

---

## iOS integration

### Add Swift package

In Xcode, add the Swift package `BeaconMeshSDK` and link it to the application target that hosts the React Native app. The JavaScript bridge expects the native module name `BeaconMeshSDK`, so the iOS target must contain that implementation.

### Steps in Xcode

1. Open the iOS project in Xcode.
2. Select **Package Dependencies**.
3. Add the Swift package for `BeaconMeshSDK`.
4. Attach the package product to the same app target used by React Native.
5. Build the project to resolve and link the package.

### Minimum iOS permission keys

If you only want the minimum permissions related to Bluetooth and discovery, the required description keys are:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to discover and communicate with nearby devices.</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location to connect with nearby devices.</string>
```

### iOS permission descriptions

Recommended permission message intent:

- **Location Services:** required to discover and connect nearby devices.
- **Bluetooth:** required to discover, connect, and communicate with nearby devices.

### iOS note

Unlike Android, the notification object is not the main integration concern on iOS. The important parts are the native SDK package, correct target linkage, Bluetooth and location permission descriptions, and matching registered bundle identifier.

---

## Bridgefy license and API key

`BridgefyScanner.initialize(apiKey, notification)` requires a valid Bridgefy API key.

### Create the license / API key

A typical implementation flow is:

1. Create the application in the Bridgefy dashboard or Bridgefy licensing portal.
2. Register the app identifiers for each platform.
3. Generate the API key or license.
4. Use that key in `BridgefyScanner.initialize(...)`.

### Relating the key to app identifiers

The Bridgefy key must be related to the exact app identity used by each platform:

- **Android** uses the app `applicationId`.
- **iOS** uses the app `bundleId`.
- Those identifiers should match the values registered when the key is created.

### Example

- Android `applicationId`: `com.company.myapp`
- iOS `bundleId`: `com.company.myapp`

If these identifiers do not match the Bridgefy registration, SDK initialization may fail or the key may not be accepted by the native implementation.

---

## Minimal usage example

```ts
import { useEffect } from 'react';
import { BridgefyScanner } from '@bridgefy/scanner-react-native';

export function useBridgefyScanner() {
  useEffect(() => {
    let startedSub: { remove: () => void } | undefined;

    const setup = async () => {
      await BridgefyScanner.initialize('YOUR_API_KEY', {
        title: 'Bridgefy active',
        message: 'Mesh session running',
        startMessage: 'Started',
        stopMessage: 'Stopped',
      });

      startedSub = BridgefyScanner.onBeaconMeshStarted(session => {
        console.log('Started', session);
      });

      await BridgefyScanner.start('user-123');
    };

    setup();

    return () => {
      startedSub?.remove();
      BridgefyScanner.stop().catch(() => undefined);
    };
  }, []);
}
```

---

## FAQ

<details>
<summary><strong>Do I need to call <code>initialize</code> before <code>start</code>?</strong></summary>

Yes. The API contract separates initialization from session start, so the app should initialize the SDK first and then start the mesh session.

</details>

<details>
<summary><strong>Is <code>NotificationConfig</code> used on both Android and iOS?</strong></summary>

No in practical app integration. `NotificationConfig` is intended for Android foreground-service notification behavior, which is why the notification appears while the service is running.

</details>

<details>
<summary><strong>Are Location Services and Bluetooth permissions required on both platforms?</strong></summary>

Yes for this integration guide. Configure both permission areas so the app can discover, advertise, and connect nearby devices reliably on Android and iOS.

</details>

<details>
<summary><strong>What do I put in the permission descriptions?</strong></summary>

Use short, direct explanations such as: Location Services are required to discover and connect nearby devices, and Bluetooth is required to scan, discover, advertise, and communicate with nearby devices.

</details>

<details>
<summary><strong>What do I pass as <code>userId</code>?</strong></summary>

The API accepts `string`, `undefined`, or `null`, so the user id is optional at the JavaScript layer.

</details>

<details>
<summary><strong>How do I receive messages?</strong></summary>

Use `onP2PMessageReceived` for direct messages and `onBroadcastMessageReceived` for broadcast messages.

</details>

<details>
<summary><strong>How do I know when another node connects or disconnects?</strong></summary>

Use `onNodeConnected` and `onNodeDisconnected` to react to peer connectivity changes.

</details>

<details>
<summary><strong>What payload format should I use?</strong></summary>

The exposed API uses `string` payloads, and the native type comment indicates the payload can represent text or base64 depending on the app protocol you define.

</details>

<details>
<summary><strong>Why is iOS not working after adding the package?</strong></summary>

Verify that the `BeaconMeshSDK` Swift package is linked to the correct target, Bluetooth and location usage keys exist in `Info.plist`, and the app uses the same `bundleId` registered for the Bridgefy key.

</details>

<details>
<summary><strong>Why is Android not discovering devices?</strong></summary>

Verify manifest permissions, runtime permissions, Bluetooth enabled state, and that the SDK was initialized and started successfully.

</details>

<details>
<summary><strong>Can the same API key be used on Android and iOS?</strong></summary>

That depends on how the Bridgefy license was created. The key must correspond to the registered Android `applicationId` and iOS `bundleId` used for the integration.

</details>

