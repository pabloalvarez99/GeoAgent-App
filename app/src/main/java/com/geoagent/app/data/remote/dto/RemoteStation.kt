package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.StationEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class RemoteStation(
    @SerialName("id")
    val id: String? = null,

    @SerialName("project_id")
    val projectId: String,

    @SerialName("code")
    val code: String,

    @SerialName("latitude")
    val latitude: Double,

    @SerialName("longitude")
    val longitude: Double,

    @SerialName("altitude")
    val altitude: Double? = null,

    @SerialName("date")
    val date: String,

    @SerialName("geologist")
    val geologist: String,

    @SerialName("description")
    val description: String,

    @SerialName("weather_conditions")
    val weatherConditions: String? = null,
) {
    companion object {
        fun fromEntity(
            entity: StationEntity,
            projectRemoteId: String,
            remoteId: String? = null,
        ): RemoteStation {
            return RemoteStation(
                id = remoteId ?: entity.remoteId,
                projectId = projectRemoteId,
                code = entity.code,
                latitude = entity.latitude,
                longitude = entity.longitude,
                altitude = entity.altitude,
                date = Instant.ofEpochMilli(entity.date).toString(),
                geologist = entity.geologist,
                description = entity.description,
                weatherConditions = entity.weatherConditions,
            )
        }
    }
}
