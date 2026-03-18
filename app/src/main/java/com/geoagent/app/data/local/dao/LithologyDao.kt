package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.LithologyEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LithologyDao {

    @Query("SELECT * FROM lithologies WHERE station_id = :stationId")
    fun getByStation(stationId: Long): Flow<List<LithologyEntity>>

    @Query("SELECT * FROM lithologies WHERE id = :id")
    fun getById(id: Long): Flow<LithologyEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(lithology: LithologyEntity): Long

    @Update
    suspend fun update(lithology: LithologyEntity)

    @Delete
    suspend fun delete(lithology: LithologyEntity)

    @Query("SELECT * FROM lithologies WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<LithologyEntity>

    @Query("UPDATE lithologies SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)
}
