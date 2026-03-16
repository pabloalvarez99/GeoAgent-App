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

    @Query("SELECT * FROM stations WHERE projectId = :projectId")
    fun getByProject(projectId: Long): Flow<List<StationEntity>>

    @Query("SELECT * FROM stations WHERE id = :id")
    fun getById(id: Long): Flow<StationEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(station: StationEntity): Long

    @Update
    suspend fun update(station: StationEntity)

    @Delete
    suspend fun delete(station: StationEntity)

    @Query("SELECT COUNT(*) FROM stations WHERE projectId = :projectId")
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT * FROM stations WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<StationEntity>

    @Query("UPDATE stations SET syncStatus = :status, remoteId = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
