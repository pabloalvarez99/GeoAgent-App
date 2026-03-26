package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.PhotoEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class RemotePhoto(
    @SerialName("id")
    val id: String? = null,

    @SerialName("station_id")
    val stationId: String? = null,

    @SerialName("drill_hole_id")
    val drillHoleId: String? = null,

    @SerialName("file_name")
    val fileName: String,

    @SerialName("storage_path")
    val storagePath: String? = null,

    @SerialName("description")
    val description: String? = null,

    @SerialName("latitude")
    val latitude: Double? = null,

    @SerialName("longitude")
    val longitude: Double? = null,

    @SerialName("taken_at")
    val takenAt: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "station_id" to stationId,
        "drill_hole_id" to drillHoleId,
        "file_name" to fileName,
        "storage_path" to storagePath,
        "description" to description,
        "latitude" to latitude,
        "longitude" to longitude,
        "taken_at" to takenAt,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemotePhoto = RemotePhoto(
            id = id,
            stationId = data["station_id"] as? String,
            drillHoleId = data["drill_hole_id"] as? String,
            fileName = data["file_name"] as? String ?: "",
            storagePath = data["storage_path"] as? String,
            description = data["description"] as? String,
            latitude = (data["latitude"] as? Number)?.toDouble(),
            longitude = (data["longitude"] as? Number)?.toDouble(),
            takenAt = data["taken_at"] as? String,
        )

        fun fromEntity(
            entity: PhotoEntity,
            stationRemoteId: String? = null,
            drillHoleRemoteId: String? = null,
            uploadedPath: String? = null,
            remoteId: String? = null,
        ): RemotePhoto {
            return RemotePhoto(
                id = remoteId ?: entity.remoteId,
                stationId = stationRemoteId,
                drillHoleId = drillHoleRemoteId,
                fileName = entity.fileName,
                storagePath = uploadedPath ?: entity.remoteUrl,
                description = entity.description,
                latitude = entity.latitude,
                longitude = entity.longitude,
                takenAt = Instant.ofEpochMilli(entity.takenAt).toString(),
            )
        }
    }
}
