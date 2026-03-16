package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.entity.StationEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StationRepository @Inject constructor(
    private val stationDao: StationDao,
) {
    fun getByProject(projectId: Long): Flow<List<StationEntity>> =
        stationDao.getByProject(projectId)

    fun getById(id: Long): Flow<StationEntity?> = stationDao.getById(id)

    suspend fun create(
        projectId: Long,
        code: String,
        latitude: Double,
        longitude: Double,
        altitude: Double?,
        geologist: String,
        description: String,
        weatherConditions: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return stationDao.insert(
            StationEntity(
                projectId = projectId,
                code = code,
                latitude = latitude,
                longitude = longitude,
                altitude = altitude,
                date = now,
                geologist = geologist,
                description = description,
                weatherConditions = weatherConditions,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(station: StationEntity) {
        stationDao.update(station.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(station: StationEntity) {
        stationDao.delete(station)
    }
}
