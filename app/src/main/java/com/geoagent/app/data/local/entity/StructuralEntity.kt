package com.geoagent.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "structural_data",
    foreignKeys = [
        ForeignKey(
            entity = StationEntity::class,
            parentColumns = ["id"],
            childColumns = ["station_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["station_id"])]
)
data class StructuralEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "station_id")
    val stationId: Long,

    @ColumnInfo(name = "type")
    val type: String,

    @ColumnInfo(name = "strike")
    val strike: Double,

    @ColumnInfo(name = "dip")
    val dip: Double,

    @ColumnInfo(name = "dip_direction")
    val dipDirection: String,

    @ColumnInfo(name = "movement")
    val movement: String? = null,

    @ColumnInfo(name = "thickness")
    val thickness: Double? = null,

    @ColumnInfo(name = "filling")
    val filling: String? = null,

    @ColumnInfo(name = "roughness")
    val roughness: String? = null,

    @ColumnInfo(name = "continuity")
    val continuity: String? = null,

    @ColumnInfo(name = "notes")
    val notes: String? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long,

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long,

    @ColumnInfo(name = "sync_status", defaultValue = "PENDING")
    val syncStatus: String = "PENDING",

    @ColumnInfo(name = "remote_id")
    val remoteId: String? = null
)
