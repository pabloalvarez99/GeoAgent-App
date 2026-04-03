package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.DrillIntervalEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteDrillInterval(
    @SerialName("id")
    val id: String? = null,

    @SerialName("drillHoleId")
    val drillHoleId: String,

    @SerialName("fromDepth")
    val fromDepth: Double,

    @SerialName("toDepth")
    val toDepth: Double,

    @SerialName("rockType")
    val rockType: String,

    @SerialName("rockGroup")
    val rockGroup: String,

    @SerialName("color")
    val color: String,

    @SerialName("texture")
    val texture: String,

    @SerialName("grainSize")
    val grainSize: String,

    @SerialName("mineralogy")
    val mineralogy: String,

    @SerialName("alteration")
    val alteration: String? = null,

    @SerialName("alterationIntensity")
    val alterationIntensity: String? = null,

    @SerialName("mineralization")
    val mineralization: String? = null,

    @SerialName("mineralizationPercent")
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
        "drillHoleId" to drillHoleId,
        "fromDepth" to fromDepth,
        "toDepth" to toDepth,
        "rockType" to rockType,
        "rockGroup" to rockGroup,
        "color" to color,
        "texture" to texture,
        "grainSize" to grainSize,
        "mineralogy" to mineralogy,
        "alteration" to alteration,
        "alterationIntensity" to alterationIntensity,
        "mineralization" to mineralization,
        "mineralizationPercent" to mineralizationPercent,
        "rqd" to rqd,
        "recovery" to recovery,
        "structure" to structure,
        "weathering" to weathering,
        "notes" to notes,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteDrillInterval = RemoteDrillInterval(
            id = id,
            drillHoleId = data["drillHoleId"] as? String ?: "",
            fromDepth = (data["fromDepth"] as? Number)?.toDouble() ?: 0.0,
            toDepth = (data["toDepth"] as? Number)?.toDouble() ?: 0.0,
            rockType = data["rockType"] as? String ?: "",
            rockGroup = data["rockGroup"] as? String ?: "",
            color = data["color"] as? String ?: "",
            texture = data["texture"] as? String ?: "",
            grainSize = data["grainSize"] as? String ?: "",
            mineralogy = data["mineralogy"] as? String ?: "",
            alteration = data["alteration"] as? String,
            alterationIntensity = data["alterationIntensity"] as? String,
            mineralization = data["mineralization"] as? String,
            mineralizationPercent = (data["mineralizationPercent"] as? Number)?.toDouble(),
            rqd = (data["rqd"] as? Number)?.toDouble(),
            recovery = (data["recovery"] as? Number)?.toDouble(),
            structure = data["structure"] as? String,
            weathering = data["weathering"] as? String,
            notes = data["notes"] as? String,
        )

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
