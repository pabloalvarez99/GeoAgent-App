package com.geoagent.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "lithologies",
    foreignKeys = [
        ForeignKey(
            entity = StationEntity::class,
            parentColumns = ["id"],
            childColumns = ["station_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["station_id"]),
        Index(value = ["sync_status"]),
        Index(value = ["remote_id"]),
    ]
)
data class LithologyEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "station_id")
    val stationId: Long,

    @ColumnInfo(name = "rock_type")
    val rockType: String,

    @ColumnInfo(name = "rock_group")
    val rockGroup: String,

    @ColumnInfo(name = "color")
    val color: String,

    @ColumnInfo(name = "texture")
    val texture: String,

    @ColumnInfo(name = "grain_size")
    val grainSize: String,

    @ColumnInfo(name = "mineralogy")
    val mineralogy: String,

    @ColumnInfo(name = "alteration")
    val alteration: String? = null,

    @ColumnInfo(name = "alteration_intensity")
    val alterationIntensity: String? = null,

    @ColumnInfo(name = "mineralization")
    val mineralization: String? = null,

    @ColumnInfo(name = "mineralization_percent")
    val mineralizationPercent: Double? = null,

    @ColumnInfo(name = "structure")
    val structure: String? = null,

    @ColumnInfo(name = "weathering")
    val weathering: String? = null,

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
