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

    @SerialName("created_at")
    val createdAt: Long,

    @SerialName("updated_at")
    val updatedAt: Long,

    @SerialName("local_id")
    val localId: Long? = null,
) {
    companion object {
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
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                localId = entity.id,
            )
        }
    }
}
