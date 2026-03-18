package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.DrillHoleEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class RemoteDrillHole(
    @SerialName("id")
    val id: String? = null,

    @SerialName("project_id")
    val projectId: String,

    @SerialName("hole_id")
    val holeId: String,

    @SerialName("type")
    val type: String,

    @SerialName("latitude")
    val latitude: Double,

    @SerialName("longitude")
    val longitude: Double,

    @SerialName("altitude")
    val altitude: Double? = null,

    @SerialName("azimuth")
    val azimuth: Double,

    @SerialName("inclination")
    val inclination: Double,

    @SerialName("planned_depth")
    val plannedDepth: Double,

    @SerialName("actual_depth")
    val actualDepth: Double? = null,

    @SerialName("start_date")
    val startDate: String? = null,

    @SerialName("end_date")
    val endDate: String? = null,

    @SerialName("status")
    val status: String,

    @SerialName("geologist")
    val geologist: String,

    @SerialName("notes")
    val notes: String? = null,
) {
    companion object {
        fun fromEntity(
            entity: DrillHoleEntity,
            projectRemoteId: String,
            remoteId: String? = null,
        ): RemoteDrillHole {
            return RemoteDrillHole(
                id = remoteId ?: entity.remoteId,
                projectId = projectRemoteId,
                holeId = entity.holeId,
                type = entity.type,
                latitude = entity.latitude,
                longitude = entity.longitude,
                altitude = entity.altitude,
                azimuth = entity.azimuth,
                inclination = entity.inclination,
                plannedDepth = entity.plannedDepth,
                actualDepth = entity.actualDepth,
                startDate = entity.startDate?.let { Instant.ofEpochMilli(it).toString() },
                endDate = entity.endDate?.let { Instant.ofEpochMilli(it).toString() },
                status = entity.status,
                geologist = entity.geologist,
                notes = entity.notes,
            )
        }
    }
}
