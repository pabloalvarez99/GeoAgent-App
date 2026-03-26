package com.geoagent.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "drill_intervals",
    foreignKeys = [
        ForeignKey(
            entity = DrillHoleEntity::class,
            parentColumns = ["id"],
            childColumns = ["drill_hole_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["drill_hole_id"]),
        Index(value = ["sync_status"]),
        Index(value = ["remote_id"]),
    ]
)
data class DrillIntervalEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "drill_hole_id")
    val drillHoleId: Long,

    @ColumnInfo(name = "from_depth")
    val fromDepth: Double,

    @ColumnInfo(name = "to_depth")
    val toDepth: Double,

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

    @ColumnInfo(name = "rqd")
    val rqd: Double? = null,

    @ColumnInfo(name = "recovery")
    val recovery: Double? = null,

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
