package com.geoagent.app.data.repository

import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.entity.ProjectEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProjectRepository @Inject constructor(
    private val projectDao: ProjectDao,
    private val stationDao: StationDao,
    private val drillHoleDao: DrillHoleDao,
    private val sampleDao: SampleDao,
) {
    fun getAll(): Flow<List<ProjectEntity>> = projectDao.getAll()

    fun getById(id: Long): Flow<ProjectEntity?> = projectDao.getById(id)

    fun getTotalCount(): Flow<Int> = projectDao.getTotalCount()

    fun getPendingSyncCount(): Flow<Int> = projectDao.getPendingSyncCount()

    fun getStationCount(projectId: Long): Flow<Int> = stationDao.getCountByProject(projectId)

    fun getDrillHoleCount(projectId: Long): Flow<Int> = drillHoleDao.getCountByProject(projectId)

    fun getSampleCount(projectId: Long): Flow<Int> = sampleDao.getCountByProject(projectId)

    suspend fun create(name: String, description: String, location: String): Long {
        val now = System.currentTimeMillis()
        return projectDao.insert(
            ProjectEntity(
                name = name,
                description = description,
                location = location,
                createdAt = now,
                updatedAt = now,
            )
        )
    }

    suspend fun update(project: ProjectEntity) {
        projectDao.update(project.copy(updatedAt = System.currentTimeMillis(), syncStatus = "MODIFIED"))
    }

    suspend fun delete(project: ProjectEntity) {
        projectDao.delete(project)
    }
}
