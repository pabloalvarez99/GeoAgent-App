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

    @Query("SELECT * FROM drill_intervals WHERE drillHoleId = :drillHoleId ORDER BY fromDepth ASC")
    fun getByDrillHole(drillHoleId: Long): Flow<List<DrillIntervalEntity>>

    @Query("SELECT * FROM drill_intervals WHERE id = :id")
    fun getById(id: Long): Flow<DrillIntervalEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(interval: DrillIntervalEntity): Long

    @Update
    suspend fun update(interval: DrillIntervalEntity)

    @Delete
    suspend fun delete(interval: DrillIntervalEntity)

    @Query("SELECT * FROM drill_intervals WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<DrillIntervalEntity>

    @Query("UPDATE drill_intervals SET syncStatus = :status, remoteId = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
