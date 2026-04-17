package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.StructuralEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StructuralDao {

    @Query("SELECT * FROM structural_data WHERE station_id = :stationId ORDER BY created_at ASC")
    fun getByStation(stationId: Long): Flow<List<StructuralEntity>>

    @Query("SELECT * FROM structural_data WHERE id = :id")
    fun getById(id: Long): Flow<StructuralEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(structural: StructuralEntity): Long

    @Update
    suspend fun update(structural: StructuralEntity)

    @Delete
    suspend fun delete(structural: StructuralEntity)

    @Query("SELECT * FROM structural_data WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<StructuralEntity>

    @Query("UPDATE structural_data SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)

    @Query("SELECT COUNT(*) FROM structural_data WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("SELECT * FROM structural_data WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): StructuralEntity?

    @Query("""
        UPDATE structural_data
        SET type = :type, strike = :strike, dip = :dip, dip_direction = :dipDirection,
            movement = :movement, thickness = :thickness, filling = :filling,
            roughness = :roughness, continuity = :continuity, notes = :notes,
            updated_at = :updatedAt, sync_status = 'SYNCED'
        WHERE id = :id
    """)
    suspend fun updateFromRemote(
        id: Long, type: String, strike: Double, dip: Double, dipDirection: String,
        movement: String?, thickness: Double?, filling: String?, roughness: String?,
        continuity: String?, notes: String?, updatedAt: Long
    )
}
