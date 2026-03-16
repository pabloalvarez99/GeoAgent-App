package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.LithologyDao
import com.geoagent.app.data.local.entity.LithologyEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LithologyRepository @Inject constructor(
    private val lithologyDao: LithologyDao,
) {
    fun getByStation(stationId: Long): Flow<List<LithologyEntity>> =
        lithologyDao.getByStation(stationId)

    fun getById(id: Long): Flow<LithologyEntity?> = lithologyDao.getById(id)

    suspend fun create(
        stationId: Long,
        rockType: String,
        rockGroup: String,
        color: String,
        texture: String,
        grainSize: String,
        mineralogy: String,
        alteration: String?,
        alterationIntensity: String?,
        mineralization: String?,
        mineralizationPercent: Double?,
        structure: String?,
        weathering: String?,
        notes: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return lithologyDao.insert(
            LithologyEntity(
                stationId = stationId,
                rockType = rockType,
                rockGroup = rockGroup,
                color = color,
                texture = texture,
                grainSize = grainSize,
                mineralogy = mineralogy,
                alteration = alteration,
                alterationIntensity = alterationIntensity,
                mineralization = mineralization,
                mineralizationPercent = mineralizationPercent,
                structure = structure,
                weathering = weathering,
                notes = notes,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(lithology: LithologyEntity) {
        lithologyDao.update(lithology.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(lithology: LithologyEntity) {
        lithologyDao.delete(lithology)
    }
}
