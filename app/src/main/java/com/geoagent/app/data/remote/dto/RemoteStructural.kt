package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.StructuralEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteStructural(
    @SerialName("id")
    val id: String? = null,

    @SerialName("stationId")
    val stationId: String,

    @SerialName("type")
    val type: String,

    @SerialName("strike")
    val strike: Double,

    @SerialName("dip")
    val dip: Double,

    @SerialName("dipDirection")
    val dipDirection: String,

    @SerialName("movement")
    val movement: String? = null,

    @SerialName("thickness")
    val thickness: Double? = null,

    @SerialName("filling")
    val filling: String? = null,

    @SerialName("roughness")
    val roughness: String? = null,

    @SerialName("continuity")
    val continuity: String? = null,

    @SerialName("notes")
    val notes: String? = null,
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "stationId" to stationId,
        "type" to type,
        "strike" to strike,
        "dip" to dip,
        "dipDirection" to dipDirection,
        "movement" to movement,
        "thickness" to thickness,
        "filling" to filling,
        "roughness" to roughness,
        "continuity" to continuity,
        "notes" to notes,
    )

    companion object {
        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteStructural = RemoteStructural(
            id = id,
            stationId = data["stationId"] as? String ?: "",
            type = data["type"] as? String ?: "",
            strike = (data["strike"] as? Number)?.toDouble() ?: 0.0,
            dip = (data["dip"] as? Number)?.toDouble() ?: 0.0,
            dipDirection = data["dipDirection"] as? String ?: "",
            movement = data["movement"] as? String,
            thickness = (data["thickness"] as? Number)?.toDouble(),
            filling = data["filling"] as? String,
            roughness = data["roughness"] as? String,
            continuity = data["continuity"] as? String,
            notes = data["notes"] as? String,
        )

        fun fromEntity(
            entity: StructuralEntity,
            stationRemoteId: String,
            remoteId: String? = null,
        ): RemoteStructural {
            return RemoteStructural(
                id = remoteId ?: entity.remoteId,
                stationId = stationRemoteId,
                type = entity.type,
                strike = entity.strike,
                dip = entity.dip,
                dipDirection = entity.dipDirection,
                movement = entity.movement,
                thickness = entity.thickness,
                filling = entity.filling,
                roughness = entity.roughness,
                continuity = entity.continuity,
                notes = entity.notes,
            )
        }
    }
}
