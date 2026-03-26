package com.geoagent.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "photos",
    foreignKeys = [
        ForeignKey(
            entity = StationEntity::class,
            parentColumns = ["id"],
            childColumns = ["station_id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = DrillHoleEntity::class,
            parentColumns = ["id"],
            childColumns = ["drill_hole_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["station_id"]),
        Index(value = ["drill_hole_id"]),
        Index(value = ["project_id"]),
        Index(value = ["sync_status"]),
        Index(value = ["remote_id"]),
    ]
)
data class PhotoEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "station_id")
    val stationId: Long? = null,

    @ColumnInfo(name = "drill_hole_id")
    val drillHoleId: Long? = null,

    @ColumnInfo(name = "project_id")
    val projectId: Long? = null,

    @ColumnInfo(name = "file_path")
    val filePath: String,

    @ColumnInfo(name = "file_name")
    val fileName: String,

    @ColumnInfo(name = "description")
    val description: String? = null,

    @ColumnInfo(name = "latitude")
    val latitude: Double? = null,

    @ColumnInfo(name = "longitude")
    val longitude: Double? = null,

    @ColumnInfo(name = "taken_at")
    val takenAt: Long,

    @ColumnInfo(name = "created_at")
    val createdAt: Long,

    @ColumnInfo(name = "updated_at")
    val updatedAt: Long,

    @ColumnInfo(name = "sync_status", defaultValue = "PENDING")
    val syncStatus: String = "PENDING",

    @ColumnInfo(name = "remote_id")
    val remoteId: String? = null,

    @ColumnInfo(name = "remote_url")
    val remoteUrl: String? = null
)
