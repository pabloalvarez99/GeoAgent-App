package com.geoagent.app.data.remote

import android.util.Log
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.ktx.functions
import com.google.firebase.ktx.Firebase
import com.google.firebase.storage.FirebaseStorage
import java.net.URL
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
    private val functions: FirebaseFunctions,
) {
    companion object {
        private const val TAG = "RemoteDataSource"
    }

    fun isAuthenticated(): Boolean = auth.currentUser != null

    private fun userId(): String =
        auth.currentUser?.uid ?: throw IllegalStateException("Usuario no autenticado")

    private fun col(name: String) =
        firestore.collection("users").document(userId()).collection(name)

    private suspend fun upsert(collection: String, id: String?, data: Map<String, Any?>): String {
        val docRef = if (id != null) col(collection).document(id) else col(collection).document()
        val cleanData = HashMap<String, Any>()
        data.forEach { (k, v) -> if (v != null) cleanData[k] = v }
        cleanData["updatedAt"] = FieldValue.serverTimestamp()  // camelCase matches web
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

    suspend fun uploadPhoto(fileName: String, file: java.io.File): String {
        Log.d(TAG, "Uploading photo: $fileName (${file.length()} bytes)")
        val ref = storage.reference.child("photos/${userId()}/$fileName")
        ref.putFile(android.net.Uri.fromFile(file)).await()
        val url = ref.downloadUrl.await().toString()
        Log.d(TAG, "Photo uploaded: $url")
        return url
    }

    // ---- Fetch all (pull/download from Firestore) ----

    /**
     * Fetches documents updated after [sinceMs] epoch millis.
     * Pass sinceMs = 0L to fetch all documents (first sync).
     */
    private suspend fun fetchAllSince(
        collection: String,
        sinceMs: Long,
    ): List<Pair<String, Map<String, Any>>> {
        val query = if (sinceMs > 0L) {
            val since = com.google.firebase.Timestamp(java.util.Date(sinceMs))
            col(collection).whereGreaterThan("updatedAt", since)
        } else {
            col(collection)
        }
        val snapshot = query.get().await()
        return snapshot.documents.mapNotNull { doc ->
            val data = doc.data ?: return@mapNotNull null
            doc.id to data
        }
    }

    suspend fun fetchAllProjects(): List<RemoteProject> =
        fetchAllProjectsRaw().mapNotNull { (id, data) ->
            runCatching { RemoteProject.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllStations(): List<RemoteStation> =
        fetchAllStationsRaw().mapNotNull { (id, data) ->
            runCatching { RemoteStation.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllLithologies(): List<RemoteLithology> =
        fetchAllLithologiesRaw().mapNotNull { (id, data) ->
            runCatching { RemoteLithology.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllStructuralData(): List<RemoteStructural> =
        fetchAllStructuralDataRaw().mapNotNull { (id, data) ->
            runCatching { RemoteStructural.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllSamples(): List<RemoteSample> =
        fetchAllSamplesRaw().mapNotNull { (id, data) ->
            runCatching { RemoteSample.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllDrillHoles(): List<RemoteDrillHole> =
        fetchAllDrillHolesRaw().mapNotNull { (id, data) ->
            runCatching { RemoteDrillHole.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllDrillIntervals(): List<RemoteDrillInterval> =
        fetchAllDrillIntervalsRaw().mapNotNull { (id, data) ->
            runCatching { RemoteDrillInterval.fromFirestoreMap(id, data) }.getOrNull()
        }

    suspend fun fetchAllPhotos(): List<RemotePhoto> =
        fetchAllPhotosRaw().mapNotNull { (id, data) ->
            runCatching { RemotePhoto.fromFirestoreMap(id, data) }.getOrNull()
        }

    /**
     * Reads the Firestore server timestamp 'updatedAt' from a raw document map.
     * Returns epoch millis, or 0 if the field is absent.
     */
    fun extractUpdatedAt(data: Map<String, Any>): Long {
        val ts = data["updatedAt"] as? com.google.firebase.Timestamp ?: return 0L
        return ts.toDate().time
    }

    suspend fun fetchAllProjectsRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("projects", sinceMs)
    suspend fun fetchAllStationsRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("stations", sinceMs)
    suspend fun fetchAllLithologiesRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("lithologies", sinceMs)
    suspend fun fetchAllStructuralDataRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("structural_data", sinceMs)
    suspend fun fetchAllSamplesRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("samples", sinceMs)
    suspend fun fetchAllDrillHolesRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("drill_holes", sinceMs)
    suspend fun fetchAllDrillIntervalsRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("drill_intervals", sinceMs)
    suspend fun fetchAllPhotosRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> = fetchAllSince("photos", sinceMs)

    /**
     * Calls the Cloud Function to generate a snapshot and downloads the gzip bytes.
     * Returns null if the function call or download fails — caller falls back to normal fetchAll.
     */
    suspend fun downloadSnapshot(): ByteArray? {
        return try {
            Log.d(TAG, "Requesting snapshot from Cloud Function...")
            val result = functions
                .getHttpsCallable("generateSnapshot")
                .call()
                .await()
            val data = result.getData() as? Map<*, *> ?: return null
            val url = data["snapshotUrl"] as? String ?: return null
            Log.d(TAG, "Downloading snapshot from Storage...")
            URL(url).readBytes()
        } catch (e: Exception) {
            Log.w(TAG, "Snapshot download failed, will use normal sync: ${e.message}")
            null
        }
    }
}
