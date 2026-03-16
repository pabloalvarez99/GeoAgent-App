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

    @Query("SELECT * FROM photos WHERE stationId = :stationId")
    fun getByStation(stationId: Long): Flow<List<PhotoEntity>>

    @Query("SELECT * FROM photos WHERE drillHoleId = :drillHoleId")
    fun getByDrillHole(drillHoleId: Long): Flow<List<PhotoEntity>>

    @Query("SELECT * FROM photos WHERE id = :id")
    fun getById(id: Long): Flow<PhotoEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(photo: PhotoEntity): Long

    @Update
    suspend fun update(photo: PhotoEntity)

    @Delete
    suspend fun delete(photo: PhotoEntity)

    @Query("SELECT COUNT(*) FROM photos WHERE stationId = :stationId")
    fun getCountByStation(stationId: Long): Flow<Int>

    @Query("SELECT * FROM photos WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSync(): List<PhotoEntity>

    @Query(
        """
        UPDATE photos
        SET syncStatus = :status, remoteId = :remoteId, remoteUrl = :remoteUrl
        WHERE id = :id
        """
    )
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?, remoteUrl: String?)
}
