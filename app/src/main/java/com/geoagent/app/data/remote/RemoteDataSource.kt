package com.geoagent.app.data.remote

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.storage.FirebaseStorage
import com.geoagent.app.data.remote.dto.RemoteDrillHole
import com.geoagent.app.data.remote.dto.RemoteDrillInterval
import com.geoagent.app.data.remote.dto.RemoteLithology
import com.geoagent.app.data.remote.dto.RemotePhoto
import com.geoagent.app.data.remote.dto.RemoteProject
import com.geoagent.app.data.remote.dto.RemoteSample
import com.geoagent.app.data.remote.dto.RemoteStation
import com.geoagent.app.data.remote.dto.RemoteStructural
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RemoteDataSource @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val storage: FirebaseStorage,
    private val auth: FirebaseAuth,
) {
    companion object {
        private const val TAG = "RemoteDataSource"
    }

    private fun userId(): String =
        auth.currentUser?.uid ?: throw IllegalStateException("Usuario no autenticado")

    private fun col(name: String) =
        firestore.collection("users").document(userId()).collection(name)

    private suspend fun upsert(collection: String, id: String?, data: Map<String, Any?>): String {
        val docRef = if (id != null) col(collection).document(id) else col(collection).document()
        val cleanData = HashMap<String, Any>()
        data.forEach { (k, v) -> if (v != null) cleanData[k] = v }
        docRef.set(cleanData, SetOptions.merge()).await()
        return docRef.id
    }

    // ---- Projects ----

    suspend fun upsertProject(data: RemoteProject): String {
        Log.d(TAG, "Upserting project: ${data.name}")
        return upsert("projects", data.id, data.toMap())
    }

    // ---- Stations ----

    suspend fun upsertStation(data: RemoteStation): String {
        Log.d(TAG, "Upserting station: ${data.code}")
        return upsert("stations", data.id, data.toMap())
    }

    // ---- Lithologies ----

    suspend fun upsertLithology(data: RemoteLithology): String {
        Log.d(TAG, "Upserting lithology: ${data.rockType}")
        return upsert("lithologies", data.id, data.toMap())
    }

    // ---- Structural Data ----

    suspend fun upsertStructural(data: RemoteStructural): String {
        Log.d(TAG, "Upserting structural: ${data.type}")
        return upsert("structural_data", data.id, data.toMap())
    }

    // ---- Samples ----

    suspend fun upsertSample(data: RemoteSample): String {
        Log.d(TAG, "Upserting sample: ${data.code}")
        return upsert("samples", data.id, data.toMap())
    }

    // ---- Drill Holes ----

    suspend fun upsertDrillHole(data: RemoteDrillHole): String {
        Log.d(TAG, "Upserting drill hole: ${data.holeId}")
        return upsert("drill_holes", data.id, data.toMap())
    }

    // ---- Drill Intervals ----

    suspend fun upsertDrillInterval(data: RemoteDrillInterval): String {
        Log.d(TAG, "Upserting drill interval: ${data.fromDepth}-${data.toDepth}")
        return upsert("drill_intervals", data.id, data.toMap())
    }

    // ---- Photos ----

    suspend fun upsertPhoto(data: RemotePhoto): String {
        Log.d(TAG, "Upserting photo: ${data.fileName}")
        return upsert("photos", data.id, data.toMap())
    }

    suspend fun uploadPhoto(fileName: String, fileBytes: ByteArray): String {
        Log.d(TAG, "Uploading photo: $fileName (${fileBytes.size} bytes)")
        val ref = storage.reference.child("photos/${userId()}/$fileName")
        ref.putBytes(fileBytes).await()
        val url = ref.downloadUrl.await().toString()
        Log.d(TAG, "Photo uploaded: $url")
        return url
    }
}
