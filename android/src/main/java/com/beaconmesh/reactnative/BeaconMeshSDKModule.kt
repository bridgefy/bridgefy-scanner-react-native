package com.beaconmesh.reactnative

import com.beaconmesh.manager.MeshManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import me.bridgefy.beaconmesh.beaconmesh.commons.exception.BeaconMeshException
import me.bridgefy.beaconmesh.sdkcommons.delegates.BeaconMeshDelegate
import me.bridgefy.beaconmesh.sdkcommons.message.BeaconMessage
import me.bridgefy.beaconmesh.sdkcommons.models.DiscoveredDevice
import me.bridgefy.beaconmesh.sdkcommons.models.NotificationConfig
import java.util.UUID

class BeaconMeshSDKModule(
  reactApplicationContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactApplicationContext), BeaconMeshDelegate {

  companion object {
    const val NAME = "BeaconMeshSDK"
  }

  private val meshManager: MeshManager by lazy {
    MeshManager.getInstance(reactApplicationContext.applicationContext)
  }

  private var listenerCount = 0

  override fun getName(): String = NAME

  @ReactMethod
  fun initialize(
    apiKey: String,
    notification: ReadableMap,
    promise: Promise,
  ) {
    try {
      ensureNotInitialized()

      val title = notification.getString("title") ?: "Mesh service"
      val message = notification.getString("message") ?: "Running"
      val stopMessage = notification.getString("stopMessage") ?: "Stop"

      meshManager
        .getSDK()
        .init(
          UUID.fromString(apiKey),
          this,
          NotificationConfig(
            title,
            message,
            stopMessage,
          ),
        ).getOrThrow()

      promise.resolve(true)
    } catch (e: Exception) {
      handleException("INITIALIZE_FAILED", e, "initialize", promise)
    }
  }

  @ReactMethod
  fun start(
    userId: String?,
    promise: Promise,
  ) {
    try {
      ensureInitialized()
      ensureNotStarted()

      val session = meshManager.getSDK().start(userId?.let(UUID::fromString)).getOrThrow()

      val map =
        Arguments.createMap().apply {
          putString("userId", session.userId)
          putDouble("startTime", session.startTime.toDouble())
          putBoolean("isActive", session.isActive)
        }

      sendEvent("onBeaconMeshStarted", map)
      promise.resolve(map)
    } catch (e: Exception) {
      handleException("START_FAILED", e, "start", promise)
    }
  }

  @ReactMethod
  fun stop(
    notification: ReadableMap?,
    promise: Promise,
  ) {
    try {
      ensureInitialized()
      ensureStarted()

      meshManager.getSDK().stop {
        try {
          it.getOrThrow()
          sendEvent("onBeaconMeshStopped", null)
          promise.resolve(null)
        } catch (e: Exception) {
          handleException("STOP_FAILED", e, "stop", promise)
        }
      }
    } catch (e: Exception) {
      handleException("STOP_FAILED", e, "stop", promise)
    }
  }

  @ReactMethod
  fun destroySession(promise: Promise) {
    try {
      ensureInitialized()
      meshManager.getSDK().destroySession()
      promise.resolve(null)
    } catch (e: Exception) {
      handleException("DESTROY_SESSION_FAILED", e, "destroySession", promise)
    }
  }

  @ReactMethod
  fun sendP2PMessage(
    receiverId: String,
    payload: String,
    promise: Promise,
  ) {
    try {
      ensureInitialized()
      ensureStarted()

      meshManager.getSDK().sendDirectMessage(
        payload.toByteArray(Charsets.UTF_8),
        receiverId,
      ) {
        try {
          promise.resolve(it.getOrThrow())
        } catch (e: Exception) {
          handleException("SEND_P2P_FAILED", e, "sendP2PMessage", promise)
        }
      }
    } catch (e: Exception) {
      handleException("SEND_P2P_FAILED", e, "sendP2PMessage", promise)
    }
  }

  @ReactMethod
  fun sendBroadcast(
    payload: String,
    promise: Promise,
  ) {
    try {
      ensureInitialized()
      ensureStarted()

      meshManager.getSDK().sendPublicMessage(
        payload.toByteArray(Charsets.UTF_8),
      ) {
        try {
          promise.resolve(it.getOrThrow())
        } catch (e: Exception) {
          handleException("SEND_BROADCAST_FAILED", e, "sendBroadcast", promise)
        }
      }
    } catch (e: Exception) {
      handleException("SEND_BROADCAST_FAILED", e, "sendBroadcast", promise)
    }
  }

  @ReactMethod
  fun getConnectedNodes(promise: Promise) {
    try {
      ensureInitialized()
      ensureStarted()

      val nodes = meshManager.getSDK().getConnectedNodes().getOrThrow().orEmpty()
      val array =
        Arguments.createArray().apply {
          nodes.forEach { node ->
            pushMap(
              Arguments.createMap().apply {
                putString("id", node.toString())
                putDouble("lastSeen", System.currentTimeMillis().toDouble())
              },
            )
          }
        }

      promise.resolve(array)
    } catch (e: Exception) {
      handleException("GET_CONNECTED_NODES_FAILED", e, "getConnectedNodes", promise)
    }
  }

  @ReactMethod
  fun getNode(
    nodeId: String,
    promise: Promise,
  ) {
    try {
      ensureInitialized()
      ensureStarted()

      val node =
        meshManager
          .getSDK()
          .getConnectedNodes()
          .getOrThrow()
          .orEmpty()
          .find { it.toString() == nodeId }

      if (node == null) {
        promise.resolve(null)
        return
      }

      promise.resolve(
        Arguments.createMap().apply {
          putString("id", node.toString())
          putDouble("lastSeen", System.currentTimeMillis().toDouble())
        },
      )
    } catch (e: Exception) {
      handleException("GET_NODE_FAILED", e, "getNode", promise)
    }
  }

  @ReactMethod
  fun isStarted(promise: Promise) {
    try {
      promise.resolve(meshManager.isStarted())
    } catch (e: Exception) {
      handleException("IS_STARTED_FAILED", e, "isStarted", promise)
    }
  }

  @ReactMethod
  fun isInitialized(promise: Promise) {
    try {
      promise.resolve(meshManager.isInitialized())
    } catch (e: Exception) {
      handleException("IS_INITIALIZED_FAILED", e, "isInitialized", promise)
    }
  }

  @ReactMethod
  fun getCurrentSessionId(promise: Promise) {
    try {
      ensureInitialized()
      ensureStarted()

      val session = meshManager.getSDK().currentSession
        ?: throw BeaconMeshException.SessionErrorException("Current session is null.")

      promise.resolve(
        Arguments.createMap().apply {
          putString("userId", session.userId)
          putDouble("startTime", session.startTime.toDouble())
          putBoolean("isActive", session.isActive)
        },
      )
    } catch (e: Exception) {
      handleException("GET_CURRENT_SESSION_FAILED", e, "getCurrentSessionId", promise)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    listenerCount += 1
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    listenerCount = (listenerCount - count).coerceAtLeast(0)
  }

  override fun onBeaconFound(deviceData: DiscoveredDevice) {
    val map =
      Arguments.createMap().apply {
        putString("uuid", deviceData.deviceId)
        putString("deviceAddress", deviceData.macAddress)
        putInt("rssi", deviceData.rssi)
        putDouble("txPower", deviceData.distanceInMeters)
        // putString("name", deviceData.deviceName ?: "")
      }
    sendEvent("onBeaconDiscovered", map)
  }

  override fun onBeaconLost(deviceId: String) {
    val map =
      Arguments.createMap().apply {
        putString("uuid", deviceId)
      }
    sendEvent("onBeaconLost", map)
  }

  override fun onBridgefyNodeConnected(id: String) {
    val map =
      Arguments.createMap().apply {
        putString("id", id)
        putDouble("lastSeen", System.currentTimeMillis().toDouble())
      }
    sendEvent("onNodeConnected", map)
  }

  override fun onBridgefyNodeLost(id: String) {
    val map =
      Arguments.createMap().apply {
        putString("id", id)
        putDouble("lastSeen", System.currentTimeMillis().toDouble())
      }
    sendEvent("onNodeDisconnected", map)
  }

  override fun onDirectMessageReceived(message: BeaconMessage) {
    val payload = message.payload?.let { String(it, Charsets.UTF_8) } ?: ""
    val sessionUserId = meshManager.getSDK().currentSession?.userId

    val map =
      Arguments.createMap().apply {
        putString("messageId", message.id)
        putString("from", message.senderId)
        putString("to", sessionUserId)
        putString("payload", payload)
        putDouble("timestamp", message.timestamp.toDouble())
      }
    sendEvent("onP2PMessageReceived", map)
  }

  override fun onPublicMessageReceived(message: BeaconMessage) {
    val payload = message.payload?.let { String(it, Charsets.UTF_8) } ?: ""
    val sessionUserId = meshManager.getSDK().currentSession?.userId

    val map =
      Arguments.createMap().apply {
        putString("messageId", message.id)
        putString("from", message.senderId)
        putString("to", sessionUserId)
        putString("payload", payload)
        putDouble("timestamp", message.timestamp.toDouble())
      }
    sendEvent("onBroadcastMessageReceived", map)
  }

  private fun ensureInitialized() {
    if (!meshManager.isInitialized()) {
      throw BeaconMeshException.SessionErrorException("Bridgefy is not initialized.")
    }
  }

  private fun ensureNotInitialized() {
    if (meshManager.isInitialized()) {
      throw BeaconMeshException.SessionErrorException("Bridgefy is already initialized.")
    }
  }

  private fun ensureStarted() {
    if (!meshManager.isStarted()) {
      throw BeaconMeshException.SessionErrorException("Bridgefy is not started.")
    }
  }

  private fun ensureNotStarted() {
    if (meshManager.isStarted()) {
      throw BeaconMeshException.SessionErrorException("Bridgefy is already started.")
    }
  }

  private fun handleException(
    code: String,
    e: Exception,
    context: String,
    promise: Promise? = null,
  ) {
    val map =
      Arguments.createMap().apply {
        putString("code", code)
        putString("message", e.localizedMessage ?: e.message ?: "unknown")
        putString("context", context)
      }

    if (promise != null) {
      promise.reject(code, e.message, e)
    } else {
      sendEvent("onBeaconMeshError", map)
    }
  }

  private fun sendEvent(
    eventName: String,
    params: WritableMap?,
  ) {
    if (listenerCount <= 0) return

    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
