package com.geoagent.app.data.sync

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.geoagent.app.data.local.dao.DrillHoleDao
import com.geoagent.app.data.local.dao.DrillIntervalDao
import com.geoagent.app.data.local.dao.LithologyDao
import com.geoagent.app.data.local.dao.PhotoDao
import com.geoagent.app.data.local.dao.ProjectDao
import com.geoagent.app.data.local.dao.SampleDao
import com.geoagent.app.data.local.dao.StationDao
import com.geoagent.app.data.local.dao.StructuralDao
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject

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
) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "SyncWorker"
    }

    override suspend fun doWork(): Result {
        return try {
            Log.d(TAG, "Starting sync...")

            // Collect all pending items
            val pendingProjects = projectDao.getPendingSync()
            val pendingStations = stationDao.getPendingSync()
            val pendingLithologies = lithologyDao.getPendingSync()
            val pendingStructural = structuralDao.getPendingSync()
            val pendingSamples = sampleDao.getPendingSync()
            val pendingDrillHoles = drillHoleDao.getPendingSync()
            val pendingIntervals = drillIntervalDao.getPendingSync()
            val pendingPhotos = photoDao.getPendingSync()

            val totalPending = pendingProjects.size + pendingStations.size +
                pendingLithologies.size + pendingStructural.size +
                pendingSamples.size + pendingDrillHoles.size +
                pendingIntervals.size + pendingPhotos.size

            Log.d(TAG, "Found $totalPending pending items to sync")

            // TODO: Implement Supabase sync when backend is configured
            // For now, just log what needs syncing
            // In production, this would:
            // 1. Upload pending projects first (to get remote IDs)
            // 2. Upload stations (with project remote IDs)
            // 3. Upload lithology, structural, samples (with station remote IDs)
            // 4. Upload drill holes (with project remote IDs)
            // 5. Upload drill intervals (with drill hole remote IDs)
            // 6. Upload photos to Supabase Storage
            // 7. Update local syncStatus to "SYNCED" and store remoteId

            Log.d(TAG, "Sync completed")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Sync failed", e)
            Result.retry()
        }
    }
}
