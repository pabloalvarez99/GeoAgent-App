package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.DrillIntervalEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteDrillInterval(
    @SerialName("id")
    val id: String? = null,

    @SerialName("drill_hole_id")
    val drillHoleId: String,

    @SerialName("from_depth")
    val fromDepth: Double,

    @SerialName("to_depth")
    val toDepth: Double,

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

    @SerialName("rqd")
    val rqd: Double? = null,

    @SerialName("recovery")
    val recovery: Double? = null,

    @SerialName("structure")
    val structure: String? = null,

    @SerialName("weathering")
    val weathering: String? = null,

    @SerialName("notes")
    val notes: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "drill_hole_id" to drillHoleId,
        "from_depth" to fromDepth,
        "to_depth" to toDepth,
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
        "rqd" to rqd,
        "recovery" to recovery,
        "structure" to structure,
        "weathering" to weathering,
        "notes" to notes,
    )

    companion object {
        fun fromEntity(
            entity: DrillIntervalEntity,
            drillHoleRemoteId: String,
            remoteId: String? = null,
        ): RemoteDrillInterval {
            return RemoteDrillInterval(
                id = remoteId ?: entity.remoteId,
                drillHoleId = drillHoleRemoteId,
                fromDepth = entity.fromDepth,
                toDepth = entity.toDepth,
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
                rqd = entity.rqd,
                recovery = entity.recovery,
                structure = entity.structure,
                weathering = entity.weathering,
                notes = entity.notes,
            )
        }
    }
}
