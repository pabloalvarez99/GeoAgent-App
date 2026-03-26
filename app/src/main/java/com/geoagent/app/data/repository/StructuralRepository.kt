package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.StructuralDao
import com.geoagent.app.data.local.entity.StructuralEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StructuralRepository @Inject constructor(
    private val structuralDao: StructuralDao,
) {
    fun getByStation(stationId: Long): Flow<List<StructuralEntity>> =
        structuralDao.getByStation(stationId)

    fun getPendingSyncCount(): Flow<Int> = structuralDao.getPendingSyncCount()

    fun getById(id: Long): Flow<StructuralEntity?> = structuralDao.getById(id)

    suspend fun create(
        stationId: Long,
        type: String,
        strike: Double,
        dip: Double,
        dipDirection: String,
        movement: String?,
        thickness: Double?,
        filling: String?,
        roughness: String?,
        continuity: String?,
        notes: String?,
    ): Long {
        val now = System.currentTimeMillis()
        return structuralDao.insert(
            StructuralEntity(
                stationId = stationId,
                type = type,
                strike = strike,
                dip = dip,
                dipDirection = dipDirection,
                movement = movement,
                thickness = thickness,
                filling = filling,
                roughness = roughness,
                continuity = continuity,
                notes = notes,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(structural: StructuralEntity) {
        structuralDao.update(structural.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(structural: StructuralEntity) {
        structuralDao.delete(structural)
    }
}
