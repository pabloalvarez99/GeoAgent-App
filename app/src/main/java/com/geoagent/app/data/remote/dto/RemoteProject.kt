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
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "name" to name,
        "description" to description,
        "location" to location,
    )

    companion object {
        fun fromEntity(entity: ProjectEntity, remoteId: String? = null): RemoteProject {
            return RemoteProject(
                id = remoteId ?: entity.remoteId,
                name = entity.name,
                description = entity.description,
                location = entity.location,
            )
        }

        fun fromFirestoreMap(id: String, data: Map<String, Any>): RemoteProject = RemoteProject(
            id = id,
            name = data["name"] as? String ?: "",
            description = data["description"] as? String ?: "",
            location = data["location"] as? String ?: "",
        )
    }
}
