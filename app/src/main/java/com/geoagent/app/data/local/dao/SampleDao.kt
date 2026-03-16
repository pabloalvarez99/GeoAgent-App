package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.SampleEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface SampleDao {

    @Query("SELECT * FROM samples WHERE stationId = :stationId")
    fun getByStation(stationId: Long): Flow<List<SampleEntity>>

    @Query("SELECT * FROM samples WHERE id = :id")
    fun getById(id: Long): Flow<SampleEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(sample: SampleEntity): Long

    @Update
    suspend fun update(sample: SampleEntity)

    @Delete
    suspend fun delete(sample: SampleEntity)

    @Query(
        """
        SELECT COUNT(*) FROM samples
        INNER JOIN stations ON samples.stationId = stations.id
        WHERE stations.projectId = :projectId
        """
    )
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT * FROM samples WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<SampleEntity>

    @Query("UPDATE samples SET syncStatus = :status, remoteId = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
