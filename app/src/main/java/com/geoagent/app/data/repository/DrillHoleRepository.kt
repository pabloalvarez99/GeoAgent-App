package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.DrillIntervalDao
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DrillHoleRepository @Inject constructor(
    private val drillHoleDao: DrillHoleDao,
    private val drillIntervalDao: DrillIntervalDao,
) {
    fun getByProject(projectId: Long): Flow<List<DrillHoleEntity>> =
        drillHoleDao.getByProject(projectId)

    fun getAll(): Flow<List<DrillHoleEntity>> = drillHoleDao.getAll()

    fun getTotalCount(): Flow<Int> = drillHoleDao.getTotalCount()

    fun getPendingSyncCount(): Flow<Int> = drillHoleDao.getPendingSyncCount()

    fun getById(id: Long): Flow<DrillHoleEntity?> = drillHoleDao.getById(id)

    fun getIntervals(drillHoleId: Long): Flow<List<DrillIntervalEntity>> =
        drillIntervalDao.getByDrillHole(drillHoleId)

    fun getIntervalById(id: Long): Flow<DrillIntervalEntity?> = drillIntervalDao.getById(id)

    suspend fun create(
        projectId: Long,
        holeId: String,
        type: String,
        latitude: Double,
        longitude: Double,
        altitude: Double?,
        azimuth: Double,
        inclination: Double,
        plannedDepth: Double,
        geologist: String,
        notes: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return drillHoleDao.insert(
            DrillHoleEntity(
                projectId = projectId,
                holeId = holeId,
                type = type,
                latitude = latitude,
                longitude = longitude,
                altitude = altitude,
                azimuth = azimuth,
                inclination = inclination,
                plannedDepth = plannedDepth,
                geologist = geologist,
                notes = notes,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun createInterval(
        drillHoleId: Long,
        fromDepth: Double,
        toDepth: Double,
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
        rqd: Double?,
        recovery: Double?,
        structure: String?,
        weathering: String?,
        notes: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return drillIntervalDao.insert(
            DrillIntervalEntity(
                drillHoleId = drillHoleId,
                fromDepth = fromDepth,
                toDepth = toDepth,
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
                rqd = rqd,
                recovery = recovery,
                structure = structure,
                weathering = weathering,
                notes = notes,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(drillHole: DrillHoleEntity) {
        drillHoleDao.update(drillHole.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun updateInterval(interval: DrillIntervalEntity) {
        drillIntervalDao.update(interval.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(drillHole: DrillHoleEntity) {
        drillHoleDao.delete(drillHole)
    }

    suspend fun deleteInterval(interval: DrillIntervalEntity) {
        drillIntervalDao.delete(interval)
    }
}
