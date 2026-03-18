package com.geoagent.app.data.repository

import android.content.Context
import com.geoagent.app.data.local.dao.PhotoDao
import com.geoagent.app.data.local.entity.PhotoEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PhotoRepository @Inject constructor(
    private val photoDao: PhotoDao,
    @ApplicationContext private val context: Context,
) {
    fun getByStation(stationId: Long): Flow<List<PhotoEntity>> =
        photoDao.getByStation(stationId)

    fun getByDrillHole(drillHoleId: Long): Flow<List<PhotoEntity>> =
        photoDao.getByDrillHole(drillHoleId)

    fun getByProject(projectId: Long): Flow<List<PhotoEntity>> =
        photoDao.getByProject(projectId)

    fun getById(id: Long): Flow<PhotoEntity?> = photoDao.getById(id)

    fun getCountByStation(stationId: Long): Flow<Int> = photoDao.getCountByStation(stationId)

    fun getCountByDrillHole(drillHoleId: Long): Flow<Int> = photoDao.getCountByDrillHole(drillHoleId)

    fun getCountByProject(projectId: Long): Flow<Int> = photoDao.getCountByProject(projectId)

    fun getTotalCount(): Flow<Int> = photoDao.getTotalCount()

    fun getPendingSyncCount(): Flow<Int> = photoDao.getPendingSyncCount()

    fun getPhotoDir(): File {
        // Prefer external files dir, fall back to internal files dir
        val baseDir = context.getExternalFilesDir(null) ?: context.filesDir
        val dir = File(baseDir, "photos")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    suspend fun create(
        stationId: Long?,
        drillHoleId: Long?,
        projectId: Long? = null,
        filePath: String,
        fileName: String,
        description: String?,
        latitude: Double?,
        longitude: Double?,
    ): Long {
        val now = System.currentTimeMillis()
        return photoDao.insert(
            PhotoEntity(
                stationId = stationId,
                drillHoleId = drillHoleId,
                projectId = projectId,
                filePath = filePath,
                fileName = fileName,
                description = description,
                latitude = latitude,
                longitude = longitude,
                takenAt = now,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(photo: PhotoEntity) {
        photoDao.update(photo.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(photo: PhotoEntity) {
        // Delete local file
        val file = File(photo.filePath)
        if (file.exists()) file.delete()
        photoDao.delete(photo)
    }
}
