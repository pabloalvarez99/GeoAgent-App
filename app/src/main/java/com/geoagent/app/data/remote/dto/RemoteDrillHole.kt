package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.DrillHoleEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import java.time.Instant

@Serializable
data class RemoteDrillHole(
    @SerialName("id")
    val id: String? = null,

    @SerialName("projectId")
    val projectId: String,

    @SerialName("holeId")
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

    @SerialName("plannedDepth")
    val plannedDepth: Double,

    @SerialName("actualDepth")
    val actualDepth: Double? = null,

    @SerialName("startDate")
    val startDate: String? = null,

    @SerialName("endDate")
    val endDate: String? = null,

    @SerialName("status")
    val status: String,

    @SerialName("geologist")
    val geologist: String,

    @SerialName("notes")
    val notes: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "projectId" to projectId,
        "holeId" to holeId,
        "type" to type,
        "latitude" to latitude,
        "longitude" to longitude,
        "altitude" to altitude,
        "azimuth" to azimuth,
        "inclination" to inclination,
        "plannedDepth" to plannedDepth,
        "actualDepth" to actualDepth,
        "startDate" to startDate,
        "endDate" to endDate,
        "status" to status,
        "geologist" to geologist,
        "notes" to notes,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteDrillHole = RemoteDrillHole(
            id = id,
            projectId = data["projectId"] as? String ?: "",
            holeId = data["holeId"] as? String ?: "",
            type = data["type"] as? String ?: "",
            latitude = (data["latitude"] as? Number)?.toDouble() ?: 0.0,
            longitude = (data["longitude"] as? Number)?.toDouble() ?: 0.0,
            altitude = (data["altitude"] as? Number)?.toDouble(),
            azimuth = (data["azimuth"] as? Number)?.toDouble() ?: 0.0,
            inclination = (data["inclination"] as? Number)?.toDouble() ?: 0.0,
            plannedDepth = (data["plannedDepth"] as? Number)?.toDouble() ?: 0.0,
            actualDepth = (data["actualDepth"] as? Number)?.toDouble(),
            startDate = data["startDate"] as? String,
            endDate = data["endDate"] as? String,
            status = data["status"] as? String ?: "En Progreso",
            geologist = data["geologist"] as? String ?: "",
            notes = data["notes"] as? String,
        )

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
