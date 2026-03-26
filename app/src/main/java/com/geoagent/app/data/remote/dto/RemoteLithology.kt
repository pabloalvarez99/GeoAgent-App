package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.LithologyEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteLithology(
    @SerialName("id")
    val id: String? = null,

    @SerialName("station_id")
    val stationId: String,

    @SerialName("rock_type")
    val rockType: String,

    @SerialName("rock_group")
    val rockGroup: String,

    @SerialName("color")
    val color: String,

    @SerialName("texture")
    val texture: String,

    @SerialName("grain_size")
    val grainSize: String,

    @SerialName("mineralogy")
    val mineralogy: String,

    @SerialName("alteration")
    val alteration: String? = null,

    @SerialName("alteration_intensity")
    val alterationIntensity: String? = null,

    @SerialName("mineralization")
    val mineralization: String? = null,

    @SerialName("mineralization_percent")
    val mineralizationPercent: Double? = null,

    @SerialName("structure")
    val structure: String? = null,

    @SerialName("weathering")
    val weathering: String? = null,

    @SerialName("notes")
    val notes: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "station_id" to stationId,
        "rock_type" to rockType,
        "rock_group" to rockGroup,
        "color" to color,
        "texture" to texture,
        "grain_size" to grainSize,
        "mineralogy" to mineralogy,
        "alteration" to alteration,
        "alteration_intensity" to alterationIntensity,
        "mineralization" to mineralization,
        "mineralization_percent" to mineralizationPercent,
        "structure" to structure,
        "weathering" to weathering,
        "notes" to notes,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteLithology = RemoteLithology(
            id = id,
            stationId = data["station_id"] as? String ?: "",
            rockType = data["rock_type"] as? String ?: "",
            rockGroup = data["rock_group"] as? String ?: "",
            color = data["color"] as? String ?: "",
            texture = data["texture"] as? String ?: "",
            grainSize = data["grain_size"] as? String ?: "",
            mineralogy = data["mineralogy"] as? String ?: "",
            alteration = data["alteration"] as? String,
            alterationIntensity = data["alteration_intensity"] as? String,
            mineralization = data["mineralization"] as? String,
            mineralizationPercent = (data["mineralization_percent"] as? Number)?.toDouble(),
            structure = data["structure"] as? String,
            weathering = data["weathering"] as? String,
            notes = data["notes"] as? String,
        )

        fun fromEntity(
            entity: LithologyEntity,
            stationRemoteId: String,
            remoteId: String? = null,
        ): RemoteLithology {
            return RemoteLithology(
                id = remoteId ?: entity.remoteId,
                stationId = stationRemoteId,
                rockType = entity.rockType,
                rockGroup = entity.rockGroup,
                color = entity.color,
                texture = entity.texture,
                grainSize = entity.grainSize,
                mineralogy = entity.mineralogy,
                alteration = entity.alteration,
                alterationIntensity = entity.alterationIntensity,
                mineralization = entity.mineralization,
                mineralizationPercent = entity.mineralizationPercent,
                structure = entity.structure,
                weathering = entity.weathering,
                notes = entity.notes,
            )
        }
    }
}
