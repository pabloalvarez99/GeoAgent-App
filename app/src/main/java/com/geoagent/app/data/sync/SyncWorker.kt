package com.geoagent.app.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.DrillIntervalDao
import com.geoagent.app.data.local.dao.LithologyDao
import com.geoagent.app.data.local.dao.PhotoDao
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.dao.StructuralDao
import com.geoagent.app.data.local.entity.DrillHoleEntity
import com.geoagent.app.data.local.entity.DrillIntervalEntity
import com.geoagent.app.data.local.entity.LithologyEntity
import com.geoagent.app.data.local.entity.PhotoEntity
import com.geoagent.app.data.local.entity.ProjectEntity
import com.geoagent.app.data.local.entity.SampleEntity
import com.geoagent.app.data.local.entity.StationEntity
import com.geoagent.app.data.local.entity.StructuralEntity
import com.geoagent.app.data.remote.RemoteDataSource
import com.geoagent.app.data.remote.dto.RemoteDrillHole
import com.geoagent.app.data.remote.dto.RemoteDrillInterval
import com.geoagent.app.data.remote.dto.RemoteLithology
import com.geoagent.app.data.remote.dto.RemotePhoto
import com.geoagent.app.data.remote.dto.RemoteProject
import com.geoagent.app.data.remote.dto.RemoteSample
import com.geoagent.app.data.remote.dto.RemoteStation
import com.geoagent.app.data.remote.dto.RemoteStructural
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.flow.firstOrNull
import java.io.File
import java.time.Instant

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val projectDao: ProjectDao,
    private val stationDao: StationDao,
    private val lithologyDao: LithologyDao,
    private val structuralDao: StructuralDao,
    private val sampleDao: SampleDao,
    private val drillHoleDao: DrillHoleDao,
    private val drillIntervalDao: DrillIntervalDao,
    private val photoDao: PhotoDao,
    private val remoteDataSource: RemoteDataSource,
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SyncWorker"
        private const val SYNC_STATUS_SYNCED = "SYNCED"
    }

    // Maps local IDs to remote UUIDs, built during sync so child entities can reference parents
    private val projectIdMap = mutableMapOf<Long, String>()
    private val stationIdMap = mutableMapOf<Long, String>()
    private val drillHoleIdMap = mutableMapOf<Long, String>()

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting sync...")
        var syncedCount = 0
        var errorCount = 0

        try {
            // Phase 1: Pull remote data into local DB (inserts new records from other devices)
            try {
                pullFromRemote()
            } catch (e: Exception) {
                Log.w(TAG, "Pull phase failed, continuing with push: ${e.message}", e)
            }

            // Phase 2: Push local pending changes to Firestore
            // 1. Sync projects first (no parent dependency)
            val pendingProjects = projectDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingProjects.size} projects...")
            for (project in pendingProjects) {
                try {
                    val dto = RemoteProject.fromEntity(project)
                    val remoteId = remoteDataSource.upsertProject(dto)
                    projectDao.updateSyncStatus(project.id, SYNC_STATUS_SYNCED, remoteId)
                    projectIdMap[project.id] = remoteId
                    syncedCount++
                    Log.d(TAG, "Synced project '${project.name}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync project id=${project.id}: ${e.message}", e)
                }
            }

            // 2. Sync stations (need project remote IDs)
            val pendingStations = stationDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingStations.size} stations...")
            for (station in pendingStations) {
                try {
                    val projectRemoteId = resolveProjectRemoteId(station.projectId)
                    if (projectRemoteId == null) {
                        Log.w(TAG, "Skipping station id=${station.id}: parent project id=${station.projectId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteStation.fromEntity(station, projectRemoteId)
                    val remoteId = remoteDataSource.upsertStation(dto)
                    stationDao.updateSyncStatus(station.id, SYNC_STATUS_SYNCED, remoteId)
                    stationIdMap[station.id] = remoteId
                    syncedCount++
                    Log.d(TAG, "Synced station '${station.code}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync station id=${station.id}: ${e.message}", e)
                }
            }

            // 3. Sync lithologies (need station remote IDs)
            val pendingLithologies = lithologyDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingLithologies.size} lithologies...")
            for (lithology in pendingLithologies) {
                try {
                    val stationRemoteId = resolveStationRemoteId(lithology.stationId)
                    if (stationRemoteId == null) {
                        Log.w(TAG, "Skipping lithology id=${lithology.id}: parent station id=${lithology.stationId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteLithology.fromEntity(lithology, stationRemoteId)
                    val remoteId = remoteDataSource.upsertLithology(dto)
                    lithologyDao.updateSyncStatus(lithology.id, SYNC_STATUS_SYNCED, remoteId)
                    syncedCount++
                    Log.d(TAG, "Synced lithology '${lithology.rockType}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync lithology id=${lithology.id}: ${e.message}", e)
                }
            }

            // 4. Sync structural data (need station remote IDs)
            val pendingStructural = structuralDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingStructural.size} structural records...")
            for (structural in pendingStructural) {
                try {
                    val stationRemoteId = resolveStationRemoteId(structural.stationId)
                    if (stationRemoteId == null) {
                        Log.w(TAG, "Skipping structural id=${structural.id}: parent station id=${structural.stationId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteStructural.fromEntity(structural, stationRemoteId)
                    val remoteId = remoteDataSource.upsertStructural(dto)
                    structuralDao.updateSyncStatus(structural.id, SYNC_STATUS_SYNCED, remoteId)
                    syncedCount++
                    Log.d(TAG, "Synced structural '${structural.type}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync structural id=${structural.id}: ${e.message}", e)
                }
            }

            // 5. Sync samples (need station remote IDs)
            val pendingSamples = sampleDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingSamples.size} samples...")
            for (sample in pendingSamples) {
                try {
                    val stationRemoteId = resolveStationRemoteId(sample.stationId)
                    if (stationRemoteId == null) {
                        Log.w(TAG, "Skipping sample id=${sample.id}: parent station id=${sample.stationId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteSample.fromEntity(sample, stationRemoteId)
                    val remoteId = remoteDataSource.upsertSample(dto)
                    sampleDao.updateSyncStatus(sample.id, SYNC_STATUS_SYNCED, remoteId)
                    syncedCount++
                    Log.d(TAG, "Synced sample '${sample.code}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync sample id=${sample.id}: ${e.message}", e)
                }
            }

            // 6. Sync drill holes (need project remote IDs)
            val pendingDrillHoles = drillHoleDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingDrillHoles.size} drill holes...")
            for (drillHole in pendingDrillHoles) {
                try {
                    val projectRemoteId = resolveProjectRemoteId(drillHole.projectId)
                    if (projectRemoteId == null) {
                        Log.w(TAG, "Skipping drill hole id=${drillHole.id}: parent project id=${drillHole.projectId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteDrillHole.fromEntity(drillHole, projectRemoteId)
                    val remoteId = remoteDataSource.upsertDrillHole(dto)
                    drillHoleDao.updateSyncStatus(drillHole.id, SYNC_STATUS_SYNCED, remoteId)
                    drillHoleIdMap[drillHole.id] = remoteId
                    syncedCount++
                    Log.d(TAG, "Synced drill hole '${drillHole.holeId}' -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync drill hole id=${drillHole.id}: ${e.message}", e)
                }
            }

            // 7. Sync drill intervals (need drill hole remote IDs)
            val pendingIntervals = drillIntervalDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingIntervals.size} drill intervals...")
            for (interval in pendingIntervals) {
                try {
                    val drillHoleRemoteId = resolveDrillHoleRemoteId(interval.drillHoleId)
                    if (drillHoleRemoteId == null) {
                        Log.w(TAG, "Skipping drill interval id=${interval.id}: parent drill hole id=${interval.drillHoleId} has no remote ID")
                        errorCount++
                        continue
                    }
                    val dto = RemoteDrillInterval.fromEntity(interval, drillHoleRemoteId)
                    val remoteId = remoteDataSource.upsertDrillInterval(dto)
                    drillIntervalDao.updateSyncStatus(interval.id, SYNC_STATUS_SYNCED, remoteId)
                    syncedCount++
                    Log.d(TAG, "Synced drill interval ${interval.fromDepth}-${interval.toDepth} -> $remoteId")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync drill interval id=${interval.id}: ${e.message}", e)
                }
            }

            // 8. Sync photos (upload file bytes + create DB record)
            val pendingPhotos = photoDao.getPendingSync()
            Log.d(TAG, "Syncing ${pendingPhotos.size} photos...")
            for (photo in pendingPhotos) {
                try {
                    syncPhoto(photo)
                    syncedCount++
                    Log.d(TAG, "Synced photo '${photo.fileName}'")
                } catch (e: Exception) {
                    errorCount++
                    Log.e(TAG, "Failed to sync photo id=${photo.id}: ${e.message}", e)
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Sync failed with unexpected error", e)
            return Result.failure(
                workDataOf("error" to (e.message ?: "Error inesperado"))
            )
        }

        Log.d(TAG, "Sync completed: $syncedCount synced, $errorCount errors")
        return if (errorCount > 0 && syncedCount == 0) {
            Result.failure(
                workDataOf("error" to "Fallaron todos los $errorCount elementos. Verifica tu conexion y los permisos en Firebase.")
            )
        } else {
            Result.success()
        }
    }

    // ---- Pull phase: fetch remote → insert new local records ----

    /**
     * Downloads all remote documents and inserts any that don't yet exist locally.
     * Records already present (by remoteId) are skipped regardless of sync status,
     * preserving any unsaved local changes. This enables multi-device use.
     */
    private suspend fun pullFromRemote() {
        Log.d(TAG, "Pull phase: fetching remote data...")
        val now = System.currentTimeMillis()

        // remoteId → localId maps built during pull, reused by push phase
        val remoteProjectToLocal = mutableMapOf<String, Long>()
        val remoteStationToLocal = mutableMapOf<String, Long>()
        val remoteDrillHoleToLocal = mutableMapOf<String, Long>()

        // 1. Pull projects
        remoteDataSource.fetchAllProjects().forEach { rp ->
            val remoteId = rp.id ?: return@forEach
            val existing = projectDao.getByRemoteId(remoteId)
            val localId = if (existing == null) {
                Log.d(TAG, "Pull: inserting new project '${rp.name}'")
                projectDao.insert(ProjectEntity(
                    name = rp.name,
                    description = rp.description,
                    location = rp.location,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            } else {
                existing.id
            }
            remoteProjectToLocal[remoteId] = localId
            projectIdMap[localId] = remoteId
        }

        // 2. Pull stations
        remoteDataSource.fetchAllStations().forEach { rs ->
            val remoteId = rs.id ?: return@forEach
            val localProjectId = remoteProjectToLocal[rs.projectId] ?: return@forEach
            val existing = stationDao.getByRemoteId(remoteId)
            val localId = if (existing == null) {
                Log.d(TAG, "Pull: inserting new station '${rs.code}'")
                stationDao.insert(StationEntity(
                    projectId = localProjectId,
                    code = rs.code,
                    latitude = rs.latitude,
                    longitude = rs.longitude,
                    altitude = rs.altitude,
                    date = parseIsoDate(rs.date),
                    geologist = rs.geologist,
                    description = rs.description,
                    weatherConditions = rs.weatherConditions,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            } else {
                existing.id
            }
            remoteStationToLocal[remoteId] = localId
            stationIdMap[localId] = remoteId
        }

        // 3. Pull lithologies
        remoteDataSource.fetchAllLithologies().forEach { rl ->
            val remoteId = rl.id ?: return@forEach
            val localStationId = remoteStationToLocal[rl.stationId] ?: return@forEach
            if (lithologyDao.getByRemoteId(remoteId) == null) {
                Log.d(TAG, "Pull: inserting new lithology '${rl.rockType}'")
                lithologyDao.insert(LithologyEntity(
                    stationId = localStationId,
                    rockType = rl.rockType,
                    rockGroup = rl.rockGroup,
                    color = rl.color,
                    texture = rl.texture,
                    grainSize = rl.grainSize,
                    mineralogy = rl.mineralogy,
                    alteration = rl.alteration,
                    alterationIntensity = rl.alterationIntensity,
                    mineralization = rl.mineralization,
                    mineralizationPercent = rl.mineralizationPercent,
                    structure = rl.structure,
                    weathering = rl.weathering,
                    notes = rl.notes,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            }
        }

        // 4. Pull structural data
        remoteDataSource.fetchAllStructuralData().forEach { rs ->
            val remoteId = rs.id ?: return@forEach
            val localStationId = remoteStationToLocal[rs.stationId] ?: return@forEach
            if (structuralDao.getByRemoteId(remoteId) == null) {
                Log.d(TAG, "Pull: inserting new structural '${rs.type}'")
                structuralDao.insert(StructuralEntity(
                    stationId = localStationId,
                    type = rs.type,
                    strike = rs.strike,
                    dip = rs.dip,
                    dipDirection = rs.dipDirection,
                    movement = rs.movement,
                    thickness = rs.thickness,
                    filling = rs.filling,
                    roughness = rs.roughness,
                    continuity = rs.continuity,
                    notes = rs.notes,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            }
        }

        // 5. Pull samples
        remoteDataSource.fetchAllSamples().forEach { rs ->
            val remoteId = rs.id ?: return@forEach
            val localStationId = remoteStationToLocal[rs.stationId] ?: return@forEach
            if (sampleDao.getByRemoteId(remoteId) == null) {
                Log.d(TAG, "Pull: inserting new sample '${rs.code}'")
                sampleDao.insert(SampleEntity(
                    stationId = localStationId,
                    code = rs.code,
                    type = rs.type,
                    weight = rs.weight,
                    length = rs.length,
                    description = rs.description,
                    latitude = rs.latitude,
                    longitude = rs.longitude,
                    altitude = rs.altitude,
                    destination = rs.destination,
                    analysisRequested = rs.analysisRequested,
                    status = rs.status,
                    notes = rs.notes,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            }
        }

        // 6. Pull drill holes
        remoteDataSource.fetchAllDrillHoles().forEach { rh ->
            val remoteId = rh.id ?: return@forEach
            val localProjectId = remoteProjectToLocal[rh.projectId] ?: return@forEach
            val existing = drillHoleDao.getByRemoteId(remoteId)
            val localId = if (existing == null) {
                Log.d(TAG, "Pull: inserting new drill hole '${rh.holeId}'")
                drillHoleDao.insert(DrillHoleEntity(
                    projectId = localProjectId,
                    holeId = rh.holeId,
                    type = rh.type,
                    latitude = rh.latitude,
                    longitude = rh.longitude,
                    altitude = rh.altitude,
                    azimuth = rh.azimuth,
                    inclination = rh.inclination,
                    plannedDepth = rh.plannedDepth,
                    actualDepth = rh.actualDepth,
                    startDate = rh.startDate?.let { parseIsoDate(it) },
                    endDate = rh.endDate?.let { parseIsoDate(it) },
                    status = rh.status,
                    geologist = rh.geologist,
                    notes = rh.notes,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            } else {
                existing.id
            }
            remoteDrillHoleToLocal[remoteId] = localId
            drillHoleIdMap[localId] = remoteId
        }

        // 7. Pull drill intervals
        remoteDataSource.fetchAllDrillIntervals().forEach { ri ->
            val remoteId = ri.id ?: return@forEach
            val localDrillHoleId = remoteDrillHoleToLocal[ri.drillHoleId] ?: return@forEach
            if (drillIntervalDao.getByRemoteId(remoteId) == null) {
                Log.d(TAG, "Pull: inserting new interval ${ri.fromDepth}-${ri.toDepth}")
                drillIntervalDao.insert(DrillIntervalEntity(
                    drillHoleId = localDrillHoleId,
                    fromDepth = ri.fromDepth,
                    toDepth = ri.toDepth,
                    rockType = ri.rockType,
                    rockGroup = ri.rockGroup,
                    color = ri.color,
                    texture = ri.texture,
                    grainSize = ri.grainSize,
                    mineralogy = ri.mineralogy,
                    alteration = ri.alteration,
                    alterationIntensity = ri.alterationIntensity,
                    mineralization = ri.mineralization,
                    mineralizationPercent = ri.mineralizationPercent,
                    rqd = ri.rqd,
                    recovery = ri.recovery,
                    structure = ri.structure,
                    weathering = ri.weathering,
                    notes = ri.notes,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                ))
            }
        }

        // 8. Pull photo metadata (remote_url serves as display source for non-local photos)
        remoteDataSource.fetchAllPhotos().forEach { rp ->
            val remoteId = rp.id ?: return@forEach
            if (photoDao.getByRemoteId(remoteId) == null) {
                val localStationId = rp.stationId?.let { remoteStationToLocal[it] }
                val localDrillHoleId = rp.drillHoleId?.let { remoteDrillHoleToLocal[it] }
                val takenAtMs = parseIsoDate(rp.takenAt)
                Log.d(TAG, "Pull: inserting new photo '${rp.fileName}'")
                photoDao.insert(PhotoEntity(
                    stationId = localStationId,
                    drillHoleId = localDrillHoleId,
                    filePath = "",  // No local file for photos pulled from remote
                    fileName = rp.fileName,
                    description = rp.description,
                    latitude = rp.latitude,
                    longitude = rp.longitude,
                    takenAt = takenAtMs,
                    createdAt = now,
                    updatedAt = now,
                    syncStatus = SYNC_STATUS_SYNCED,
                    remoteId = remoteId,
                    remoteUrl = rp.storagePath,
                ))
            }
        }

        Log.d(TAG, "Pull phase complete.")
    }

    private fun parseIsoDate(isoString: String?): Long {
        if (isoString == null) return System.currentTimeMillis()
        return try {
            Instant.parse(isoString).toEpochMilli()
        } catch (e: Exception) {
            System.currentTimeMillis()
        }
    }

    // ---- Parent ID resolution helpers ----

    /**
     * Resolves the remote UUID for a project. Checks the in-memory map first (populated
     * during this sync run), then falls back to reading the entity's stored remoteId
     * from the local database (set during a previous sync run).
     */
    private suspend fun resolveProjectRemoteId(localId: Long): String? {
        projectIdMap[localId]?.let { return it }
        val entity = projectDao.getById(localId).firstOrNull()
        return entity?.remoteId?.also { projectIdMap[localId] = it }
    }

    private suspend fun resolveStationRemoteId(localId: Long): String? {
        stationIdMap[localId]?.let { return it }
        val entity = stationDao.getById(localId).firstOrNull()
        return entity?.remoteId?.also { stationIdMap[localId] = it }
    }

    private suspend fun resolveDrillHoleRemoteId(localId: Long): String? {
        drillHoleIdMap[localId]?.let { return it }
        val entity = drillHoleDao.getById(localId).firstOrNull()
        return entity?.remoteId?.also { drillHoleIdMap[localId] = it }
    }

    // ---- Photo sync ----

    private suspend fun syncPhoto(photo: PhotoEntity) {
        // Resolve parent remote IDs
        val stationRemoteId = if (photo.stationId != null) {
            resolveStationRemoteId(photo.stationId)
        } else null

        val drillHoleRemoteId = if (photo.drillHoleId != null) {
            resolveDrillHoleRemoteId(photo.drillHoleId)
        } else null

        // Validate that at least one parent is resolved when the local ID is set
        if (photo.stationId != null && stationRemoteId == null) {
            throw IllegalStateException(
                "Parent station id=${photo.stationId} has no remote ID"
            )
        }
        if (photo.drillHoleId != null && drillHoleRemoteId == null) {
            throw IllegalStateException(
                "Parent drill hole id=${photo.drillHoleId} has no remote ID"
            )
        }

        // Upload the photo file to Firebase Storage if not already uploaded
        var uploadedPath = photo.remoteUrl
        if (uploadedPath == null) {
            val file = File(photo.filePath)
            if (file.exists()) {
                val storagePath = "${System.currentTimeMillis()}_${photo.fileName}"
                uploadedPath = remoteDataSource.uploadPhoto(storagePath, file)
            } else {
                Log.w(TAG, "Photo file not found at ${photo.filePath}, syncing record without file upload")
            }
        }

        // Upsert the photo record in Firestore
        val dto = RemotePhoto.fromEntity(
            entity = photo,
            stationRemoteId = stationRemoteId,
            drillHoleRemoteId = drillHoleRemoteId,
            uploadedPath = uploadedPath,
        )
        val remoteId = remoteDataSource.upsertPhoto(dto)
        photoDao.updateSyncStatus(photo.id, SYNC_STATUS_SYNCED, remoteId, uploadedPath)
    }
}
