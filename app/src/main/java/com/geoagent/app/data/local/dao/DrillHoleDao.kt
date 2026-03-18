package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.DrillHoleEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DrillHoleDao {

    @Query("SELECT * FROM drill_holes WHERE project_id = :projectId")
    fun getByProject(projectId: Long): Flow<List<DrillHoleEntity>>

    @Query("SELECT * FROM drill_holes WHERE id = :id")
    fun getById(id: Long): Flow<DrillHoleEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(drillHole: DrillHoleEntity): Long

    @Update
    suspend fun update(drillHole: DrillHoleEntity)

    @Delete
    suspend fun delete(drillHole: DrillHoleEntity)

    @Query("SELECT * FROM drill_holes")
    fun getAll(): Flow<List<DrillHoleEntity>>

    @Query("SELECT COUNT(*) FROM drill_holes WHERE project_id = :projectId")
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM drill_holes")
    fun getTotalCount(): Flow<Int>

    @Query("SELECT * FROM drill_holes WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<DrillHoleEntity>

    @Query("SELECT COUNT(*) FROM drill_holes WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("UPDATE drill_holes SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
