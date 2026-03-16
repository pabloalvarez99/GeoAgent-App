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

    @Query("SELECT * FROM structural_data WHERE stationId = :stationId")
    fun getByStation(stationId: Long): Flow<List<StructuralEntity>>

    @Query("SELECT * FROM structural_data WHERE id = :id")
    fun getById(id: Long): Flow<StructuralEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(structural: StructuralEntity): Long

    @Update
    suspend fun update(structural: StructuralEntity)

    @Delete
    suspend fun delete(structural: StructuralEntity)

    @Query("SELECT * FROM structural_data WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<StructuralEntity>

    @Query("UPDATE structural_data SET syncStatus = :status, remoteId = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
