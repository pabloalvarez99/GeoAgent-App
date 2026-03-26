package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.PhotoEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PhotoDao {

    @Query("SELECT * FROM photos WHERE station_id = :stationId ORDER BY taken_at DESC")
    fun getByStation(stationId: Long): Flow<List<PhotoEntity>>

    @Query("SELECT * FROM photos WHERE drill_hole_id = :drillHoleId ORDER BY taken_at DESC")
    fun getByDrillHole(drillHoleId: Long): Flow<List<PhotoEntity>>

    @Query("SELECT * FROM photos WHERE project_id = :projectId ORDER BY taken_at DESC")
    fun getByProject(projectId: Long): Flow<List<PhotoEntity>>

    @Query("SELECT COUNT(*) FROM photos WHERE project_id = :projectId")
    fun getCountByProject(projectId: Long): Flow<Int>

    @Query("SELECT * FROM photos WHERE id = :id")
    fun getById(id: Long): Flow<PhotoEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(photo: PhotoEntity): Long

    @Update
    suspend fun update(photo: PhotoEntity)

    @Delete
    suspend fun delete(photo: PhotoEntity)

    @Query("SELECT COUNT(*) FROM photos WHERE station_id = :stationId")
    fun getCountByStation(stationId: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM photos WHERE drill_hole_id = :drillHoleId")
    fun getCountByDrillHole(drillHoleId: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM photos")
    fun getTotalCount(): Flow<Int>

    @Query("SELECT * FROM photos WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<PhotoEntity>

    @Query("SELECT COUNT(*) FROM photos WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query(
        """
        UPDATE photos
        SET sync_status = :status, remote_id = :remoteId, remote_url = :remoteUrl
        WHERE id = :id
        """
    )
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?, remoteUrl: String?)

    @Query("SELECT * FROM photos WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): PhotoEntity?
}
