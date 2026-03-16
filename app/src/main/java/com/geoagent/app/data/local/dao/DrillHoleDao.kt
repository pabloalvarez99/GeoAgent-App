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

    @Query("SELECT * FROM drill_holes WHERE projectId = :projectId")
    fun getByProject(projectId: Long): Flow<List<DrillHoleEntity>>

    @Query("SELECT * FROM drill_holes WHERE id = :id")
    fun getById(id: Long): Flow<DrillHoleEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(drillHole: DrillHoleEntity): Long

    @Update
    suspend fun update(drillHole: DrillHoleEntity)

    @Delete
    suspend fun delete(drillHole: DrillHoleEntity)

    @Query("SELECT COUNT(*) FROM drill_holes WHERE projectId = :projectId")
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT * FROM drill_holes WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<DrillHoleEntity>

    @Query("UPDATE drill_holes SET syncStatus = :status, remoteId = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
