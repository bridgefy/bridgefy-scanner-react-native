package com.beaconmesh.reactnative

import com.beaconmesh.manager.MeshManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import me.bridgefy.beaconmesh.beaconmesh.commons.exception.BeaconMeshException
import me.bridgefy.beaconmesh.sdkcommons.delegates.BeaconMeshDelegate
import me.bridgefy.beaconmesh.sdkcommons.message.BeaconMessage
import me.bridgefy.beaconmesh.sdkcommons.models.DiscoveredDevice
import me.bridgefy.beaconmesh.sdkcommons.models.NotificationConfig
import java.util.UUID

class BeaconMeshSDKModule(
  reactApplicationContext: ReactApplicationContext,
) : NativeBeaconMeshSDKSpec(reactApplicationContext),
  BeaconMeshDelegate {
  companion object {
    const val NAME = NativeBeaconMeshSDKSpec.NAME
  }

  private val meshManager: MeshManager by lazy { MeshManager.getInstance(reactApplicationContext.applicationContext) }

  override fun initialize(
    apiKey: String,
    notification: ReadableMap,
    promise: Promise,
  ) {
    try {
      validateNotInitialized()
      val title = notification.getString("title") ?: "Mesh service"
      val msg = notification.getString("message") ?: "Running"
      val action = notification.getString("action") ?: "Stop"

      meshManager
        .getSDK()
        .init(
          UUID.fromString(apiKey),
          this,
          NotificationConfig(
            title,
            msg,
            action,
          ),
        ).getOrThrow()
      promise.resolve(null)
    } catch (e: Exception) {
      handleException("ERROR_INITIALIZED", e, "initialize", promise)
    }
  }

  override fun start(
    userId: String?,
    promise: Promise,
  ) {
    try {
      validateStarted().getOrThrow()
      val session = meshManager.getSDK().start(userId?.let { UUID.fromString(it) }).getOrThrow()
      val map =
        Arguments.createMap().apply {
          putString("userId", session.userId)
          putLong("startTime", session.startTime)
          putBoolean("isActive", session.isActive)
        }
      emitOnBeaconMeshStarted(map.copy())
      promise.resolve(map)
    } catch (e: Exception) {
      handleException("ERROR_STARTED", e, "start", promise)
    }
  }

  override fun stop(
    notification: ReadableMap?,
    promise: Promise,
  ) {
    try {
      validateNotStarted()
      meshManager.getSDK().stop {
        it.getOrThrow()
        emitOnBeaconMeshStopped()
        promise.resolve(null)
      }
    } catch (e: Exception) {
      handleException("STOP_FAILED", e, "stop", promise)
    }
  }

  override fun destroySession(promise: Promise) {
    try {
      validateNotInitialized()
      meshManager.getSDK().destroySession()
      promise.resolve(null)
    } catch (e: Exception) {
      handleException("STOP_FAILED", e, "destroySession", promise)
    }
  }

  override fun sendP2PMessage(
    receiverId: String,
    payload: String,
    promise: Promise,
  ) {
    try {
      validateNotStarted()
      meshManager.getSDK().sendDirectMessage(
        payload.toByteArray(Charsets.UTF_8),
        receiverId,
      ) {
        promise.resolve(it.getOrThrow())
      }
    } catch (e: Exception) {
      handleException("NOT_STARTED", e, "sendP2P", promise)
    }
  }

  override fun sendBroadcast(
    payload: String,
    promise: Promise,
  ) {
    try {
      validateNotStarted()
      meshManager.getSDK().sendPublicMessage(
        payload.toByteArray(Charsets.UTF_8),
      ) {
        promise.resolve(it.getOrThrow())
      }
    } catch (e: Exception) {
      handleException("NOT_STARTED", e, "sendBroadcast", promise)
    }
  }

  override fun getConnectedNodes(promise: Promise) {
    try {
      validateNotStarted()
      val nodes = meshManager.getSDK().getConnectedNodes().getOrThrow() ?: emptyList()
      val array =
        Arguments.createArray().apply {
          nodes.forEach { node ->
            pushMap(
              Arguments.createMap().apply {
                putString("id", node.toString())
                putLong("lastSeen", System.currentTimeMillis())
              },
            )
          }
        }
      promise.resolve(array)
    } catch (e: Exception) {
      handleException("NOT_STARTED", e, "connectedNodes", promise)
    }
  }

  override fun getNode(
    nodeId: String,
    promise: Promise,
  ) {
    try {
      validateNotStarted()
      val nodes =
        MeshManager
          .getInstance(reactApplicationContext.applicationContext)
          .getSDK()
          .getConnectedNodes()
          .getOrThrow() ?: emptyList()
      val lastNode = nodes.find { it.toString() == nodeId }
      if (lastNode != null) {
        promise.resolve(
          Arguments.createMap().apply {
            putString("id", lastNode.toString())
            putLong("lastSeen", System.currentTimeMillis())
          },
        )
      } else {
        promise.resolve(null)
      }
    } catch (e: Exception) {
      handleException("NOT_STARTED", e, "getNode", promise)
    }
  }

  override fun isStarted(promise: Promise) {
    try {
      promise.resolve(meshManager.isStarted())
    } catch (e: Exception) {
      handleException("NOT_INITIALIZED", e, "sendBroadcast", promise)
    }
  }

  override fun isInitialized(promise: Promise) {
    promise.resolve(meshManager.getSDK().isInitialized)
  }

  override fun getCurrentSessionId(promise: Promise) {
    try {
      validateNotStarted()
      val session = meshManager.getSDK().currentSession!!
      promise.resolve(
        Arguments.createMap().apply {
          putString("userId", session.userId)
          putLong("startTime", session.startTime)
          putBoolean("isActive", session.isActive)
        },
      )
    } catch (e: Exception) {
      handleException("NOT_STARTED", e, "getCurrentSessionId", promise)
    }
  }

  // ****************************************
  // *** Bridgefy Scanner delegate events ***
  // ****************************************
  override fun onBeaconFound(deviceData: DiscoveredDevice) {
    val map =
      Arguments.createMap().apply {
        putString("uuid", deviceData.deviceId)
        putString("deviceAddress", deviceData.macAddress)
        putInt("rssi", deviceData.rssi)
        putDouble("distance", deviceData.distanceInMeters)
        putLong("timestamp", deviceData.timestamp)
      }
    emitOnBeaconDiscovered(map)
  }

  override fun onBeaconLost(deviceId: String) {
    val map =
      Arguments.createMap().apply {
        putString("uuid", deviceId)
      }
    emitOnBeaconLost(map)
  }

  override fun onBridgefyNodeConnected(id: String) {
    val map =
      Arguments.createMap().apply {
        putString("id", id)
      }
    emitOnNodeConnected(map)
  }

  override fun onBridgefyNodeLost(id: String) {
    val map =
      Arguments.createMap().apply {
        putString("id", id)
      }
    emitOnNodeDisconnected(map)
  }

  override fun onDirectMessageReceived(message: BeaconMessage) {
    val map =
      Arguments.createMap().apply {
        putString("messageId", message.id)
        putString("from", message.senderId)
        putString("to", meshManager.getSDK().currentSession!!.userId)
        putString("payload", String(message.payload!!))
        putDouble("timestamp", message.timestamp)
      }
    emitOnP2PMessageReceived(map)
  }

  override fun onPublicMessageReceived(message: BeaconMessage) {
    val map =
      Arguments.createMap().apply {
        putString("messageId", message.id)
        // putString("from", message)
        putString("to", meshManager.getSDK().currentSession!!.userId)
        putString("payload", String(message.payload!!))
        putDouble("timestamp", message.timestamp)
      }
    emitOnBroadcastMessageReceived(map)
  }

  private fun validateStarted() =
    runCatching {
      validateNotInitialized().getOrThrow()
      if (meshManager.isStarted()) throw BeaconMeshException.SessionErrorException("Bridgefy already started.")
      meshManager.isStarted()
    }

  private fun validateNotStarted() =
    runCatching {
      validateNotInitialized().getOrThrow()
      if (!meshManager.isStarted()) throw BeaconMeshException.SessionErrorException("Bridgefy is not started.")
      meshManager.isStarted()
    }

  private fun validateNotInitialized() =
    runCatching {
      if (!meshManager.isInitialized()) throw BeaconMeshException.SessionErrorException("Bridgefy is not initialized")
      meshManager.isInitialized()
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
        putString("message", e.localizedMessage ?: e.message ?: "unknow")
        putString("context", context)
      }
    promise?.reject(code, e) ?: emitOnBeaconMeshError(map)
  }
}

private fun ByteArray.toWritableArray(): ReadableArray =
  Arguments.createArray().apply {
    for (b in this@toWritableArray) {
      pushInt(b.toInt() and 0xFF)
    }
  }
