package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.StructuralEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteStructural(
    @SerialName("id")
    val id: String? = null,

    @SerialName("station_id")
    val stationId: String,

    @SerialName("type")
    val type: String,

    @SerialName("strike")
    val strike: Double,

    @SerialName("dip")
    val dip: Double,

    @SerialName("dip_direction")
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

    @SerialName("created_at")
    val createdAt: Long,

    @SerialName("updated_at")
    val updatedAt: Long,

    @SerialName("local_id")
    val localId: Long? = null,
) {
    companion object {
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
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                localId = entity.id,
            )
        }
    }
}
