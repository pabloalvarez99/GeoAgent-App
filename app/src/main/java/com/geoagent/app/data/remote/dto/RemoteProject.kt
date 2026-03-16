package com.geoagent.app.data.remote.dto

import com.geoagent.app.data.local.entity.ProjectEntity
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RemoteProject(
    @SerialName("id")
    val id: String? = null,

    @SerialName("name")
    val name: String,

    @SerialName("description")
    val description: String,

    @SerialName("location")
    val location: String,

    @SerialName("created_at")
    val createdAt: Long,

    @SerialName("updated_at")
    val updatedAt: Long,

    @SerialName("local_id")
    val localId: Long? = null,
) {
    companion object {
        fun fromEntity(entity: ProjectEntity, remoteId: String? = null): RemoteProject {
            return RemoteProject(
                id = remoteId ?: entity.remoteId,
                name = entity.name,
                description = entity.description,
                location = entity.location,
                createdAt = entity.createdAt,
                updatedAt = entity.updatedAt,
                localId = entity.id,
            )
        }
    }
}
