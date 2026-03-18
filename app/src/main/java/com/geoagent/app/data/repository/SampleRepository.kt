package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.entity.SampleEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SampleRepository @Inject constructor(
    private val sampleDao: SampleDao,
) {
    fun getByStation(stationId: Long): Flow<List<SampleEntity>> =
        sampleDao.getByStation(stationId)

    fun getById(id: Long): Flow<SampleEntity?> = sampleDao.getById(id)

    fun getTotalCount(): Flow<Int> = sampleDao.getTotalCount()

    fun getPendingSyncCount(): Flow<Int> = sampleDao.getPendingSyncCount()

    suspend fun create(
        stationId: Long,
        code: String,
        type: String,
        weight: Double?,
        length: Double?,
        description: String,
        latitude: Double?,
        longitude: Double?,
        altitude: Double?,
        destination: String?,
        analysisRequested: String?,
        notes: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return sampleDao.insert(
            SampleEntity(
                stationId = stationId,
                code = code,
                type = type,
                weight = weight,
                length = length,
                description = description,
                latitude = latitude,
                longitude = longitude,
                altitude = altitude,
                destination = destination,
                analysisRequested = analysisRequested,
                notes = notes,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(sample: SampleEntity) {
        sampleDao.update(sample.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(sample: SampleEntity) {
        sampleDao.delete(sample)
    }
}
