package com.beaconmesh.manager

import android.content.Context
import me.bridgefy.beaconmesh.beaconmesh.BeaconMesh

class MeshManager private constructor(
  private val applicationContext: Context,
) {
  private val beaconMesh: BeaconMesh by lazy { BeaconMesh.getInstance(applicationContext) }

  fun getSDK(): BeaconMesh = beaconMesh

  fun isStarted() = beaconMesh.isStarted

  fun isInitialized() = beaconMesh.isInitialized

  companion object {
    @Volatile
    private var instnace: MeshManager? = null

    fun getInstance(context: Context) =
      instnace ?: synchronized(this) {
        instnace ?: MeshManager(context.applicationContext).also { instnace = it }
      }
  }
}
