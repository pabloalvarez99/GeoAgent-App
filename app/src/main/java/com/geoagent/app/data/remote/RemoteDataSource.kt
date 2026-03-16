package com.geoagent.app.data.remote

import android.util.Log
import com.geoagent.app.data.remote.dto.RemoteDrillHole
import com.geoagent.app.data.remote.dto.RemoteDrillInterval
import com.geoagent.app.data.remote.dto.RemoteLithology
import com.geoagent.app.data.remote.dto.RemotePhoto
import com.geoagent.app.data.remote.dto.RemoteProject
import com.geoagent.app.data.remote.dto.RemoteSample
import com.geoagent.app.data.remote.dto.RemoteStation
import com.geoagent.app.data.remote.dto.RemoteStructural
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.query.PostgrestQueryBuilder
import io.github.jan.supabase.storage.Storage
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RemoteDataSource @Inject constructor(
    private val postgrest: Postgrest,
    private val storage: Storage,
) {
    companion object {
        private const val TAG = "RemoteDataSource"
        private const val PHOTOS_BUCKET = "photos"
    }

    // ---- Projects ----

    suspend fun upsertProject(data: RemoteProject): String {
        Log.d(TAG, "Upserting project: ${data.name}")
        val result = postgrest.from("projects")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteProject>()
        return result.id ?: throw IllegalStateException("No ID returned for project upsert")
    }

    // ---- Stations ----

    suspend fun upsertStation(data: RemoteStation): String {
        Log.d(TAG, "Upserting station: ${data.code}")
        val result = postgrest.from("stations")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteStation>()
        return result.id ?: throw IllegalStateException("No ID returned for station upsert")
    }

    // ---- Lithologies ----

    suspend fun upsertLithology(data: RemoteLithology): String {
        Log.d(TAG, "Upserting lithology: ${data.rockType}")
        val result = postgrest.from("lithologies")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteLithology>()
        return result.id ?: throw IllegalStateException("No ID returned for lithology upsert")
    }

    // ---- Structural Data ----

    suspend fun upsertStructural(data: RemoteStructural): String {
        Log.d(TAG, "Upserting structural: ${data.type}")
        val result = postgrest.from("structural_data")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteStructural>()
        return result.id ?: throw IllegalStateException("No ID returned for structural upsert")
    }

    // ---- Samples ----

    suspend fun upsertSample(data: RemoteSample): String {
        Log.d(TAG, "Upserting sample: ${data.code}")
        val result = postgrest.from("samples")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteSample>()
        return result.id ?: throw IllegalStateException("No ID returned for sample upsert")
    }

    // ---- Drill Holes ----

    suspend fun upsertDrillHole(data: RemoteDrillHole): String {
        Log.d(TAG, "Upserting drill hole: ${data.holeId}")
        val result = postgrest.from("drill_holes")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteDrillHole>()
        return result.id ?: throw IllegalStateException("No ID returned for drill hole upsert")
    }

    // ---- Drill Intervals ----

    suspend fun upsertDrillInterval(data: RemoteDrillInterval): String {
        Log.d(TAG, "Upserting drill interval: ${data.fromDepth}-${data.toDepth}")
        val result = postgrest.from("drill_intervals")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemoteDrillInterval>()
        return result.id ?: throw IllegalStateException("No ID returned for drill interval upsert")
    }

    // ---- Photos ----

    suspend fun upsertPhoto(data: RemotePhoto): String {
        Log.d(TAG, "Upserting photo record: ${data.fileName}")
        val result = postgrest.from("photos")
            .upsert(data) {
                select()
            }
            .decodeSingle<RemotePhoto>()
        return result.id ?: throw IllegalStateException("No ID returned for photo upsert")
    }

    suspend fun uploadPhoto(fileName: String, fileBytes: ByteArray): String {
        Log.d(TAG, "Uploading photo file: $fileName (${fileBytes.size} bytes)")
        val bucket = storage.from(PHOTOS_BUCKET)
        bucket.upload(fileName, fileBytes, upsert = true)
        val publicUrl = bucket.publicUrl(fileName)
        Log.d(TAG, "Photo uploaded, public URL: $publicUrl")
        return publicUrl
    }
}
