package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.LithologyEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LithologyDao {

    @Query("SELECT * FROM lithologies WHERE station_id = :stationId ORDER BY created_at ASC")
    fun getByStation(stationId: Long): Flow<List<LithologyEntity>>

    @Query("SELECT * FROM lithologies WHERE id = :id")
    fun getById(id: Long): Flow<LithologyEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(lithology: LithologyEntity): Long

    @Update
    suspend fun update(lithology: LithologyEntity)

    @Delete
    suspend fun delete(lithology: LithologyEntity)

    @Query("SELECT * FROM lithologies WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<LithologyEntity>

    @Query("UPDATE lithologies SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)

    @Query("SELECT COUNT(*) FROM lithologies WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("SELECT * FROM lithologies WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): LithologyEntity?

    @Query("""
        UPDATE lithologies
        SET rock_type = :rockType, rock_group = :rockGroup, color = :color, texture = :texture,
            grain_size = :grainSize, mineralogy = :mineralogy, alteration = :alteration,
            alteration_intensity = :alterationIntensity, mineralization = :mineralization,
            mineralization_percent = :mineralizationPercent, structure = :structure,
            weathering = :weathering, notes = :notes, updated_at = :updatedAt, sync_status = 'SYNCED'
        WHERE id = :id
    """)
    suspend fun updateFromRemote(
        id: Long, rockType: String, rockGroup: String, color: String, texture: String,
        grainSize: String, mineralogy: String, alteration: String?, alterationIntensity: String?,
        mineralization: String?, mineralizationPercent: Double?, structure: String?,
        weathering: String?, notes: String?, updatedAt: Long
    )
}
