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

    @Query("SELECT * FROM samples WHERE station_id = :stationId")
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
        INNER JOIN stations ON samples.station_id = stations.id
        WHERE stations.project_id = :projectId
        """
    )
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM samples")
    fun getTotalCount(): Flow<Int>

    @Query("SELECT * FROM samples WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<SampleEntity>

    @Query("SELECT COUNT(*) FROM samples WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("UPDATE samples SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
