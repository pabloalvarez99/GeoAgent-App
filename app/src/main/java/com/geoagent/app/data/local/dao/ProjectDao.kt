package com.geoagent.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.geoagent.app.data.local.entity.ProjectEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ProjectDao {

    @Query("SELECT * FROM projects ORDER BY updated_at DESC")
    fun getAll(): Flow<List<ProjectEntity>>

    @Query("SELECT * FROM projects WHERE id = :id")
    fun getById(id: Long): Flow<ProjectEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(project: ProjectEntity): Long

    @Update
    suspend fun update(project: ProjectEntity)

    @Delete
    suspend fun delete(project: ProjectEntity)

    @Query("SELECT COUNT(*) FROM projects")
    fun getTotalCount(): Flow<Int>

    @Query("SELECT * FROM projects WHERE sync_status != 'SYNCED'")
    suspend fun getPendingSync(): List<ProjectEntity>

    @Query("SELECT COUNT(*) FROM projects WHERE sync_status != 'SYNCED'")
    fun getPendingSyncCount(): Flow<Int>

    @Query("UPDATE projects SET sync_status = :status, remote_id = :remoteId WHERE id = :id")
    suspend fun updateSyncStatus(id: Long, status: String, remoteId: String?)

    @Query("SELECT * FROM projects WHERE remote_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): ProjectEntity?

    @Query("""
        UPDATE projects
        SET name = :name, description = :description, location = :location,
            updated_at = :updatedAt, sync_status = 'SYNCED'
        WHERE id = :id
    """)
    suspend fun updateFromRemote(id: Long, name: String, description: String, location: String, updatedAt: Long)
}
