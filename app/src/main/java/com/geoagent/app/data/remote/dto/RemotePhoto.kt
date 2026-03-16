package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.PhotoEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

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

    @SerialName("remote_url")
    val remoteUrl: String? = null,

    @SerialName("description")
    val description: String? = null,

    @SerialName("latitude")
    val latitude: Double? = null,

    @SerialName("longitude")
    val longitude: Double? = null,

    @SerialName("taken_at")
    val takenAt: Long,

    @SerialName("created_at")
    val createdAt: Long,

    @SerialName("updated_at")
    val updatedAt: Long,

    @SerialName("local_id")
    val localId: Long? = null,
) {
    companion object {
        fun fromEntity(
            entity: PhotoEntity,
            stationRemoteId: String? = null,
            drillHoleRemoteId: String? = null,
            uploadedUrl: String? = null,
            remoteId: String? = null,
        ): RemotePhoto {
            return RemotePhoto(
                id = remoteId ?: entity.remoteId,
                stationId = stationRemoteId,
                drillHoleId = drillHoleRemoteId,
                fileName = entity.fileName,
                remoteUrl = uploadedUrl ?: entity.remoteUrl,
                description = entity.description,
                latitude = entity.latitude,
                longitude = entity.longitude,
                takenAt = entity.takenAt,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                localId = entity.id,
            )
        }
    }
}
