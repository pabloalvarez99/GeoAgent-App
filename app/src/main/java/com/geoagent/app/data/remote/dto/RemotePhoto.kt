package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.PhotoEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class RemotePhoto(
    @SerialName("id")
    val id: String? = null,

    @SerialName("projectId")
    val projectId: String? = null,

    @SerialName("stationId")
    val stationId: String? = null,

    @SerialName("drillHoleId")
    val drillHoleId: String? = null,

    @SerialName("fileName")
    val fileName: String,

    @SerialName("storagePath")
    val storagePath: String? = null,

    @SerialName("description")
    val description: String? = null,

    @SerialName("latitude")
    val latitude: Double? = null,

    @SerialName("longitude")
    val longitude: Double? = null,

    @SerialName("takenAt")
    val takenAt: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "projectId" to projectId,
        "stationId" to stationId,
        "drillHoleId" to drillHoleId,
        "fileName" to fileName,
        "storagePath" to storagePath,
        "description" to description,
        "latitude" to latitude,
        "longitude" to longitude,
        "takenAt" to takenAt,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemotePhoto = RemotePhoto(
            id = id,
            projectId = data["projectId"] as? String,
            stationId = data["stationId"] as? String,
            drillHoleId = data["drillHoleId"] as? String,
            fileName = data["fileName"] as? String ?: "",
            storagePath = data["storagePath"] as? String,
            description = data["description"] as? String,
            latitude = (data["latitude"] as? Number)?.toDouble(),
            longitude = (data["longitude"] as? Number)?.toDouble(),
            takenAt = data["takenAt"] as? String,
        )

        fun fromEntity(
            entity: PhotoEntity,
            projectRemoteId: String? = null,
            stationRemoteId: String? = null,
            drillHoleRemoteId: String? = null,
            uploadedPath: String? = null,
            remoteId: String? = null,
        ): RemotePhoto {
            return RemotePhoto(
                id = remoteId ?: entity.remoteId,
                projectId = projectRemoteId,
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
