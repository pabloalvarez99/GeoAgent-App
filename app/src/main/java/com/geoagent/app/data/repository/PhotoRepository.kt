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

    fun getById(id: Long): Flow<PhotoEntity?> = photoDao.getById(id)

    fun getCountByStation(stationId: Long): Flow<Int> = photoDao.getCountByStation(stationId)

    fun getPhotoDir(): File {
        val dir = File(context.getExternalFilesDir(null), "photos")
        if (!dir.exists()) dir.mkdirs()
        return dir
    }

    suspend fun create(
        stationId: Long?,
        drillHoleId: Long?,
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
