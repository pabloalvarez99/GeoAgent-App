package com.geoagent.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "samples",
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
data class SampleEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "id")
    val id: Long = 0,

    @ColumnInfo(name = "station_id")
    val stationId: Long,

    @ColumnInfo(name = "code")
    val code: String,

    @ColumnInfo(name = "type")
    val type: String,

    @ColumnInfo(name = "weight")
    val weight: Double? = null,

    @ColumnInfo(name = "length")
    val length: Double? = null,

    @ColumnInfo(name = "description")
    val description: String,

    @ColumnInfo(name = "latitude")
    val latitude: Double? = null,

    @ColumnInfo(name = "longitude")
    val longitude: Double? = null,

    @ColumnInfo(name = "altitude")
    val altitude: Double? = null,

    @ColumnInfo(name = "destination")
    val destination: String? = null,

    @ColumnInfo(name = "analysis_requested")
    val analysisRequested: String? = null,

    @ColumnInfo(name = "status", defaultValue = "Recolectada")
    val status: String = "Recolectada",

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
