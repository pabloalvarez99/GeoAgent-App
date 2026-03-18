package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.StationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface StationDao {

    @Query("SELECT * FROM stations WHERE project_id = :projectId")
    fun getByProject(projectId: Long): Flow<List<StationEntity>>

    @Query("SELECT * FROM stations WHERE id = :id")
    fun getById(id: Long): Flow<StationEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(station: StationEntity): Long

    @Update
    suspend fun update(station: StationEntity)

    @Delete
    suspend fun delete(station: StationEntity)

    @Query("SELECT * FROM stations")
    fun getAll(): Flow<List<StationEntity>>

    @Query("SELECT COUNT(*) FROM stations WHERE project_id = :projectId")
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM stations")
    fun getTotalCount(): Flow<Int>

    @Query("SELECT * FROM stations WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<StationEntity>

    @Query("SELECT COUNT(*) FROM stations WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("UPDATE stations SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
