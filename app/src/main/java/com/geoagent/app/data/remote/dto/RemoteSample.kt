package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.SampleEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteSample(
    @SerialName("id")
    val id: String? = null,

    @SerialName("station_id")
    val stationId: String,

    @SerialName("code")
    val code: String,

    @SerialName("type")
    val type: String,

    @SerialName("weight")
    val weight: Double? = null,

    @SerialName("length")
    val length: Double? = null,

    @SerialName("description")
    val description: String,

    @SerialName("latitude")
    val latitude: Double? = null,

    @SerialName("longitude")
    val longitude: Double? = null,

    @SerialName("altitude")
    val altitude: Double? = null,

    @SerialName("destination")
    val destination: String? = null,

    @SerialName("analysis_requested")
    val analysisRequested: String? = null,

    @SerialName("status")
    val status: String,

    @SerialName("notes")
    val notes: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "station_id" to stationId,
        "code" to code,
        "type" to type,
        "weight" to weight,
        "length" to length,
        "description" to description,
        "latitude" to latitude,
        "longitude" to longitude,
        "altitude" to altitude,
        "destination" to destination,
        "analysis_requested" to analysisRequested,
        "status" to status,
        "notes" to notes,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteSample = RemoteSample(
            id = id,
            stationId = data["station_id"] as? String ?: "",
            code = data["code"] as? String ?: "",
            type = data["type"] as? String ?: "",
            weight = (data["weight"] as? Number)?.toDouble(),
            length = (data["length"] as? Number)?.toDouble(),
            description = data["description"] as? String ?: "",
            latitude = (data["latitude"] as? Number)?.toDouble(),
            longitude = (data["longitude"] as? Number)?.toDouble(),
            altitude = (data["altitude"] as? Number)?.toDouble(),
            destination = data["destination"] as? String,
            analysisRequested = data["analysis_requested"] as? String,
            status = data["status"] as? String ?: "Recolectada",
            notes = data["notes"] as? String,
        )

        fun fromEntity(
            entity: SampleEntity,
            stationRemoteId: String,
            remoteId: String? = null,
        ): RemoteSample {
            return RemoteSample(
                id = remoteId ?: entity.remoteId,
                stationId = stationRemoteId,
                code = entity.code,
                type = entity.type,
                weight = entity.weight,
                length = entity.length,
                description = entity.description,
                latitude = entity.latitude,
                longitude = entity.longitude,
                altitude = entity.altitude,
                destination = entity.destination,
                analysisRequested = entity.analysisRequested,
                status = entity.status,
                notes = entity.notes,
            )
        }
    }
}
