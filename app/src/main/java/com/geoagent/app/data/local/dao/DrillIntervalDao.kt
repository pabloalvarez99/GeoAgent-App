package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DrillIntervalDao {

    @Query("SELECT * FROM drill_intervals WHERE drill_hole_id = :drillHoleId ORDER BY from_depth ASC")
    fun getByDrillHole(drillHoleId: Long): Flow<List<DrillIntervalEntity>>

    @Query("SELECT * FROM drill_intervals WHERE id = :id")
    fun getById(id: Long): Flow<DrillIntervalEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(interval: DrillIntervalEntity): Long

    @Update
    suspend fun update(interval: DrillIntervalEntity)

    @Delete
    suspend fun delete(interval: DrillIntervalEntity)

    @Query("SELECT * FROM drill_intervals WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<DrillIntervalEntity>

    @Query("UPDATE drill_intervals SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)

    @Query("SELECT COUNT(*) FROM drill_intervals WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("SELECT * FROM drill_intervals WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): DrillIntervalEntity?

    @Query("""
        UPDATE drill_intervals
        SET from_depth = :fromDepth, to_depth = :toDepth, rock_type = :rockType,
            rock_group = :rockGroup, color = :color, texture = :texture,
            grain_size = :grainSize, mineralogy = :mineralogy, alteration = :alteration,
            alteration_intensity = :alterationIntensity, mineralization = :mineralization,
            mineralization_percent = :mineralizationPercent, rqd = :rqd, recovery = :recovery,
            structure = :structure, weathering = :weathering, notes = :notes,
            updated_at = :updatedAt, sync_status = 'SYNCED'
        WHERE id = :id
    """)
    suspend fun updateFromRemote(
        id: Long, fromDepth: Double, toDepth: Double, rockType: String, rockGroup: String,
        color: String, texture: String, grainSize: String, mineralogy: String,
        alteration: String?, alterationIntensity: String?, mineralization: String?,
        mineralizationPercent: Double?, rqd: Double?, recovery: Double?,
        structure: String?, weathering: String?, notes: String?, updatedAt: Long
    )
}
