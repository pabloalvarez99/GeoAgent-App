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

    @Query("SELECT * FROM drill_intervals WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): DrillIntervalEntity?
}
