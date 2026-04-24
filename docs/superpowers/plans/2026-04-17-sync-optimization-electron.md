# Sync Optimization + Electron Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Android sync pull bug, add delta sync, add Cloud Storage snapshot for efficient first-sync, and make the Electron app work with dynamic routes.

**Architecture:**
- Task 1 patches `SyncWorker.kt` pull phase to update existing SYNCED records when the remote version is newer (currently it skips them entirely).
- Task 2 adds a `updatedAt > lastSyncTimestamp` filter to all Firestore pull queries, turning full-collection scans into cheap delta fetches.
- Task 3 adds a callable Firebase Cloud Function that generates a gzip JSON snapshot of all user data in Storage — Android downloads it on first sync instead of fetching thousands of documents.
- Task 4 fixes the Electron production build: registers a custom `app://` protocol that serves the static Next.js export with SPA fallback routing so dynamic routes like `/projects/[id]` work.

**Tech Stack:**
- Android: Room DAOs (Kotlin), SyncWorker, RemoteDataSource, Firebase Kotlin SDK
- Firebase: Cloud Functions (Node.js 20), Firebase Storage
- Next.js: `next.config.ts`, App Router dynamic pages
- Electron: `electron-src/main.ts`, custom protocol

---

## Task 1: Fix Android pull — update existing SYNCED records

**Files:**
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/ProjectDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/StationDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/LithologyDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/StructuralDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/SampleDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/DrillHoleDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/local/dao/DrillIntervalDao.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt`

**Context:**
Currently `pullFromRemote()` does `if (existing == null) { insert } else { skip }` for every entity. This means any edit made on the web is permanently invisible to Android unless the record is deleted and recreated. The fix: when `existing != null`, compare remote `updatedAt` to local `updated_at`. If remote is newer AND local `syncStatus == "SYNCED"` (no unsaved local changes), overwrite.

The remote `updatedAt` arrives as a Firestore `Timestamp` in the raw `Map<String, Any>`. `RemoteDataSource.fetchAll()` already returns `List<Pair<String, Map<String, Any>>>` — but the DTO classes (e.g. `RemoteProject`) don't capture `updatedAt`. We will read `updatedAt` directly from the raw Firestore data in a helper.

- [ ] **Step 1: Add `updateFromRemote` query to ProjectDao**

Add this query to `app/src/main/java/com/geoagent/app/data/local/dao/ProjectDao.kt`:

```kotlin
@Query("""
    UPDATE projects
    SET name = :name, description = :description, location = :location,
        updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(id: Long, name: String, description: String, location: String, updatedAt: Long)
```

- [ ] **Step 2: Add `updateFromRemote` query to StationDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/StationDao.kt`:

```kotlin
@Query("""
    UPDATE stations
    SET code = :code, latitude = :latitude, longitude = :longitude, altitude = :altitude,
        date = :date, geologist = :geologist, description = :description,
        weather_conditions = :weatherConditions, updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, code: String, latitude: Double, longitude: Double, altitude: Double?,
    date: Long, geologist: String, description: String, weatherConditions: String?, updatedAt: Long
)
```

- [ ] **Step 3: Add `updateFromRemote` query to LithologyDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/LithologyDao.kt`:

```kotlin
@Query("""
    UPDATE lithologies
    SET rock_type = :rockType, rock_group = :rockGroup, color = :color, texture = :texture,
        grain_size = :grainSize, mineralogy = :mineralogy, alteration = :alteration,
        alteration_intensity = :alterationIntensity, mineralization = :mineralization,
        mineralization_percent = :mineralizationPercent, structure = :structure,
        weathering = :weathering, notes = :notes, updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, rockType: String, rockGroup: String, color: String, texture: String,
    grainSize: String, mineralogy: String, alteration: String?, alterationIntensity: String?,
    mineralization: String?, mineralizationPercent: Double?, structure: String?,
    weathering: String?, notes: String?, updatedAt: Long
)
```

- [ ] **Step 4: Add `updateFromRemote` query to StructuralDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/StructuralDao.kt`:

```kotlin
@Query("""
    UPDATE structural_data
    SET type = :type, strike = :strike, dip = :dip, dip_direction = :dipDirection,
        movement = :movement, thickness = :thickness, filling = :filling,
        roughness = :roughness, continuity = :continuity, notes = :notes,
        updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, type: String, strike: Double, dip: Double, dipDirection: String,
    movement: String?, thickness: Double?, filling: String?, roughness: String?,
    continuity: String?, notes: String?, updatedAt: Long
)
```

- [ ] **Step 5: Add `updateFromRemote` query to SampleDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/SampleDao.kt`:

```kotlin
@Query("""
    UPDATE samples
    SET code = :code, type = :type, weight = :weight, length = :length,
        description = :description, latitude = :latitude, longitude = :longitude,
        altitude = :altitude, destination = :destination, analysis_requested = :analysisRequested,
        status = :status, notes = :notes, updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, code: String, type: String, weight: Double?, length: Double?,
    description: String, latitude: Double?, longitude: Double?, altitude: Double?,
    destination: String?, analysisRequested: String?, status: String, notes: String?,
    updatedAt: Long
)
```

- [ ] **Step 6: Add `updateFromRemote` query to DrillHoleDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/DrillHoleDao.kt`:

```kotlin
@Query("""
    UPDATE drill_holes
    SET hole_id = :holeId, type = :type, latitude = :latitude, longitude = :longitude,
        altitude = :altitude, azimuth = :azimuth, inclination = :inclination,
        planned_depth = :plannedDepth, actual_depth = :actualDepth,
        start_date = :startDate, end_date = :endDate, status = :status,
        geologist = :geologist, notes = :notes, updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, holeId: String, type: String, latitude: Double, longitude: Double,
    altitude: Double?, azimuth: Double, inclination: Double, plannedDepth: Double,
    actualDepth: Double?, startDate: Long?, endDate: Long?, status: String,
    geologist: String, notes: String?, updatedAt: Long
)
```

- [ ] **Step 7: Add `updateFromRemote` query to DrillIntervalDao**

Add to `app/src/main/java/com/geoagent/app/data/local/dao/DrillIntervalDao.kt`:

```kotlin
@Query("""
    UPDATE drill_intervals
    SET from_depth = :fromDepth, to_depth = :toDepth, rock_type = :rockType,
        rock_group = :rockGroup, color = :color, texture = :texture,
        grain_size = :grainSize, mineralogy = :mineralogy, alteration = :alteration,
        alteration_intensity = :alterationIntensity, mineralization = :mineralization,
        mineralization_percent = :mineralizationPercent, rqd = :rqd, recovery = :recovery,
        structure = :structure, weathering = :weathering, notes = :notes,
        updated_at = :updatedAt, sync_status = 'SYNCED'
    WHERE id = :id
""")
suspend fun updateFromRemote(
    id: Long, fromDepth: Double, toDepth: Double, rockType: String, rockGroup: String,
    color: String, texture: String, grainSize: String, mineralogy: String,
    alteration: String?, alterationIntensity: String?, mineralization: String?,
    mineralizationPercent: Double?, rqd: Double?, recovery: Double?,
    structure: String?, weathering: String?, notes: String?, updatedAt: Long
)
```

- [ ] **Step 8: Add helper to read `updatedAt` from Firestore raw data**

In `RemoteDataSource.kt`, add a helper at the bottom of the class (before the closing `}`):

```kotlin
/**
 * Reads the Firestore server timestamp 'updatedAt' from a raw document map.
 * Returns epoch millis, or 0 if the field is absent.
 */
fun extractUpdatedAt(data: Map<String, Any>): Long {
    val ts = data["updatedAt"] as? com.google.firebase.Timestamp ?: return 0L
    return ts.toDate().time
}
```

Also expose the raw document data alongside the DTOs. Add these public fetch-raw methods to `RemoteDataSource.kt`:

```kotlin
suspend fun fetchAllProjectsRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("projects")
suspend fun fetchAllStationsRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("stations")
suspend fun fetchAllLithologiesRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("lithologies")
suspend fun fetchAllStructuralDataRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("structural_data")
suspend fun fetchAllSamplesRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("samples")
suspend fun fetchAllDrillHolesRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("drill_holes")
suspend fun fetchAllDrillIntervalsRaw(): List<Pair<String, Map<String, Any>>> = fetchAll("drill_intervals")
```

- [ ] **Step 9: Update `pullFromRemote()` in SyncWorker.kt to use raw data + update existing**

Replace the entire `pullFromRemote()` function body in `SyncWorker.kt`. The logic for each entity now does:
1. Fetch raw `List<Pair<String, Map<String, Any>>>` from `remoteDataSource.fetchAll*Raw()`
2. Parse DTO from the raw data (reuse existing `fromFirestoreMap`)
3. Extract `remoteUpdatedAt` from `remoteDataSource.extractUpdatedAt(rawData)`
4. If `existing == null`: insert (same as before)
5. If `existing != null && existing.syncStatus == "SYNCED" && remoteUpdatedAt > existing.updatedAt`: call `updateFromRemote()`

Replace the projects pull block with:

```kotlin
// 1. Pull projects
val rawProjects = remoteDataSource.fetchAllProjectsRaw()
rawProjects.forEach { (id, rawData) ->
    val rp = runCatching { RemoteProject.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = projectDao.getByRemoteId(id)
    val localId = if (existing == null) {
        Log.d(TAG, "Pull: inserting new project '${rp.name}'")
        projectDao.insert(ProjectEntity(
            name = rp.name,
            description = rp.description,
            location = rp.location,
            createdAt = now,
            updatedAt = now,
            syncStatus = SYNC_STATUS_SYNCED,
            remoteId = id,
        ))
    } else {
        if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
            Log.d(TAG, "Pull: updating project '${rp.name}' (remote newer)")
            projectDao.updateFromRemote(existing.id, rp.name, rp.description, rp.location, now)
        }
        existing.id
    }
    remoteProjectToLocal[id] = localId
    projectIdMap[localId] = id
}
```

Replace the stations pull block with:

```kotlin
// 2. Pull stations
val rawStations = remoteDataSource.fetchAllStationsRaw()
rawStations.forEach { rs_raw ->
    val (id, rawData) = rs_raw
    val rs = runCatching { RemoteStation.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localProjectId = remoteProjectToLocal[rs.projectId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = stationDao.getByRemoteId(id)
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
            remoteId = id,
        ))
    } else {
        if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
            Log.d(TAG, "Pull: updating station '${rs.code}' (remote newer)")
            stationDao.updateFromRemote(
                existing.id, rs.code, rs.latitude, rs.longitude, rs.altitude,
                parseIsoDate(rs.date), rs.geologist, rs.description, rs.weatherConditions, now
            )
        }
        existing.id
    }
    remoteStationToLocal[id] = localId
    stationIdMap[localId] = id
}
```

Replace the lithologies pull block with:

```kotlin
// 3. Pull lithologies
remoteDataSource.fetchAllLithologiesRaw().forEach { (id, rawData) ->
    val rl = runCatching { RemoteLithology.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localStationId = remoteStationToLocal[rl.stationId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = lithologyDao.getByRemoteId(id)
    if (existing == null) {
        Log.d(TAG, "Pull: inserting new lithology '${rl.rockType}'")
        lithologyDao.insert(LithologyEntity(
            stationId = localStationId, rockType = rl.rockType, rockGroup = rl.rockGroup,
            color = rl.color, texture = rl.texture, grainSize = rl.grainSize,
            mineralogy = rl.mineralogy, alteration = rl.alteration,
            alterationIntensity = rl.alterationIntensity, mineralization = rl.mineralization,
            mineralizationPercent = rl.mineralizationPercent, structure = rl.structure,
            weathering = rl.weathering, notes = rl.notes,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    } else if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
        Log.d(TAG, "Pull: updating lithology '${rl.rockType}' (remote newer)")
        lithologyDao.updateFromRemote(
            existing.id, rl.rockType, rl.rockGroup, rl.color, rl.texture, rl.grainSize,
            rl.mineralogy, rl.alteration, rl.alterationIntensity, rl.mineralization,
            rl.mineralizationPercent, rl.structure, rl.weathering, rl.notes, now
        )
    }
}
```

Replace the structural pull block with:

```kotlin
// 4. Pull structural data
remoteDataSource.fetchAllStructuralDataRaw().forEach { (id, rawData) ->
    val rs = runCatching { RemoteStructural.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localStationId = remoteStationToLocal[rs.stationId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = structuralDao.getByRemoteId(id)
    if (existing == null) {
        Log.d(TAG, "Pull: inserting new structural '${rs.type}'")
        structuralDao.insert(StructuralEntity(
            stationId = localStationId, type = rs.type, strike = rs.strike, dip = rs.dip,
            dipDirection = rs.dipDirection, movement = rs.movement, thickness = rs.thickness,
            filling = rs.filling, roughness = rs.roughness, continuity = rs.continuity,
            notes = rs.notes, createdAt = now, updatedAt = now,
            syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    } else if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
        Log.d(TAG, "Pull: updating structural '${rs.type}' (remote newer)")
        structuralDao.updateFromRemote(
            existing.id, rs.type, rs.strike, rs.dip, rs.dipDirection, rs.movement,
            rs.thickness, rs.filling, rs.roughness, rs.continuity, rs.notes, now
        )
    }
}
```

Replace the samples pull block with:

```kotlin
// 5. Pull samples
remoteDataSource.fetchAllSamplesRaw().forEach { (id, rawData) ->
    val rs = runCatching { RemoteSample.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localStationId = remoteStationToLocal[rs.stationId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = sampleDao.getByRemoteId(id)
    if (existing == null) {
        Log.d(TAG, "Pull: inserting new sample '${rs.code}'")
        sampleDao.insert(SampleEntity(
            stationId = localStationId, code = rs.code, type = rs.type, weight = rs.weight,
            length = rs.length, description = rs.description, latitude = rs.latitude,
            longitude = rs.longitude, altitude = rs.altitude, destination = rs.destination,
            analysisRequested = rs.analysisRequested, status = rs.status, notes = rs.notes,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    } else if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
        Log.d(TAG, "Pull: updating sample '${rs.code}' (remote newer)")
        sampleDao.updateFromRemote(
            existing.id, rs.code, rs.type, rs.weight, rs.length, rs.description,
            rs.latitude, rs.longitude, rs.altitude, rs.destination,
            rs.analysisRequested, rs.status, rs.notes, now
        )
    }
}
```

Replace the drill holes pull block with:

```kotlin
// 6. Pull drill holes
remoteDataSource.fetchAllDrillHolesRaw().forEach { (id, rawData) ->
    val rh = runCatching { RemoteDrillHole.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localProjectId = remoteProjectToLocal[rh.projectId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = drillHoleDao.getByRemoteId(id)
    val localId = if (existing == null) {
        Log.d(TAG, "Pull: inserting new drill hole '${rh.holeId}'")
        drillHoleDao.insert(DrillHoleEntity(
            projectId = localProjectId, holeId = rh.holeId, type = rh.type,
            latitude = rh.latitude, longitude = rh.longitude, altitude = rh.altitude,
            azimuth = rh.azimuth, inclination = rh.inclination,
            plannedDepth = rh.plannedDepth, actualDepth = rh.actualDepth,
            startDate = rh.startDate?.let { parseIsoDate(it) },
            endDate = rh.endDate?.let { parseIsoDate(it) },
            status = rh.status, geologist = rh.geologist, notes = rh.notes,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    } else {
        if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
            Log.d(TAG, "Pull: updating drill hole '${rh.holeId}' (remote newer)")
            drillHoleDao.updateFromRemote(
                existing.id, rh.holeId, rh.type, rh.latitude, rh.longitude, rh.altitude,
                rh.azimuth, rh.inclination, rh.plannedDepth, rh.actualDepth,
                rh.startDate?.let { parseIsoDate(it) }, rh.endDate?.let { parseIsoDate(it) },
                rh.status, rh.geologist, rh.notes, now
            )
        }
        existing.id
    }
    remoteDrillHoleToLocal[id] = localId
    drillHoleIdMap[localId] = id
}
```

Replace the drill intervals pull block with:

```kotlin
// 7. Pull drill intervals
remoteDataSource.fetchAllDrillIntervalsRaw().forEach { (id, rawData) ->
    val ri = runCatching { RemoteDrillInterval.fromFirestoreMap(id, rawData) }.getOrNull() ?: return@forEach
    val localDrillHoleId = remoteDrillHoleToLocal[ri.drillHoleId] ?: return@forEach
    val remoteUpdatedAt = remoteDataSource.extractUpdatedAt(rawData)
    val existing = drillIntervalDao.getByRemoteId(id)
    if (existing == null) {
        Log.d(TAG, "Pull: inserting new interval ${ri.fromDepth}-${ri.toDepth}")
        drillIntervalDao.insert(DrillIntervalEntity(
            drillHoleId = localDrillHoleId, fromDepth = ri.fromDepth, toDepth = ri.toDepth,
            rockType = ri.rockType, rockGroup = ri.rockGroup, color = ri.color,
            texture = ri.texture, grainSize = ri.grainSize, mineralogy = ri.mineralogy,
            alteration = ri.alteration, alterationIntensity = ri.alterationIntensity,
            mineralization = ri.mineralization, mineralizationPercent = ri.mineralizationPercent,
            rqd = ri.rqd, recovery = ri.recovery, structure = ri.structure,
            weathering = ri.weathering, notes = ri.notes,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    } else if (existing.syncStatus == SYNC_STATUS_SYNCED && remoteUpdatedAt > existing.updatedAt) {
        Log.d(TAG, "Pull: updating interval ${ri.fromDepth}-${ri.toDepth} (remote newer)")
        drillIntervalDao.updateFromRemote(
            existing.id, ri.fromDepth, ri.toDepth, ri.rockType, ri.rockGroup,
            ri.color, ri.texture, ri.grainSize, ri.mineralogy, ri.alteration,
            ri.alterationIntensity, ri.mineralization, ri.mineralizationPercent,
            ri.rqd, ri.recovery, ri.structure, ri.weathering, ri.notes, now
        )
    }
}
```

The photos pull block does not need `updateFromRemote` — photo records are immutable after upload (changing photo description is out of scope). Keep it as-is.

- [ ] **Step 10: Build the Android app**

Run from the repo root:
```bash
./gradlew assembleDebug --no-daemon 2>&1 | tail -30
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 11: Commit Task 1**

```bash
git add app/src/main/java/com/geoagent/app/data/local/dao/
git add app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt
git add app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt
git commit -m "fix(android): pull phase now updates existing SYNCED records when remote is newer

Web edits were permanently invisible to Android because pullFromRemote()
skipped records that already existed locally. Now compares remote updatedAt
vs local updated_at and overwrites if remote is newer and no local edits pending."
```

---

## Task 2: Delta sync — filter pull by `updatedAt > lastSyncTimestamp`

**Files:**
- Modify: `app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt`
- Modify: `firestore.indexes.json`

**Context:**
`fetchAll()` currently does `col(collection).get()` — downloads every document every 15 minutes. `preferencesHelper.lastSyncTimestamp` is saved on success but never used to filter. Adding `whereGreaterThan("updatedAt", Timestamp(since))` turns O(N docs) into O(changed docs). This also requires a Firestore composite index on `updatedAt` for collections that already have a `where` clause (stations, drill_holes filter by projectId — but the pull fetches all, so single-field index on `updatedAt` is enough).

- [ ] **Step 1: Change `fetchAll` to `fetchAllSince` in RemoteDataSource.kt**

Replace the private `fetchAll()` helper with:

```kotlin
/**
 * Fetches documents updated after [sinceMs] epoch millis.
 * Pass sinceMs = 0 to fetch all documents (first sync).
 */
private suspend fun fetchAllSince(
    collection: String,
    sinceMs: Long,
): List<Pair<String, Map<String, Any>>> {
    val query = if (sinceMs > 0L) {
        val since = com.google.firebase.Timestamp(java.util.Date(sinceMs))
        col(collection).whereGreaterThan("updatedAt", since)
    } else {
        col(collection)
    }
    val snapshot = query.get().await()
    return snapshot.documents.mapNotNull { doc ->
        val data = doc.data ?: return@mapNotNull null
        doc.id to data
    }
}
```

Update all the `fetchAll*Raw` methods (added in Task 1) to accept and pass `sinceMs`:

```kotlin
suspend fun fetchAllProjectsRaw(sinceMs: Long = 0L) = fetchAllSince("projects", sinceMs)
suspend fun fetchAllStationsRaw(sinceMs: Long = 0L) = fetchAllSince("stations", sinceMs)
suspend fun fetchAllLithologiesRaw(sinceMs: Long = 0L) = fetchAllSince("lithologies", sinceMs)
suspend fun fetchAllStructuralDataRaw(sinceMs: Long = 0L) = fetchAllSince("structural_data", sinceMs)
suspend fun fetchAllSamplesRaw(sinceMs: Long = 0L) = fetchAllSince("samples", sinceMs)
suspend fun fetchAllDrillHolesRaw(sinceMs: Long = 0L) = fetchAllSince("drill_holes", sinceMs)
suspend fun fetchAllDrillIntervalsRaw(sinceMs: Long = 0L) = fetchAllSince("drill_intervals", sinceMs)
suspend fun fetchAllPhotosRaw(sinceMs: Long = 0L): List<Pair<String, Map<String, Any>>> =
    fetchAllSince("photos", sinceMs)
```

Also update the existing typed `fetchAllProjects()` etc. that were used before Task 1 — replace them to use the same `fetchAllSince`:

```kotlin
suspend fun fetchAllProjects(): List<RemoteProject> =
    fetchAllProjectsRaw().mapNotNull { (id, data) ->
        runCatching { RemoteProject.fromFirestoreMap(id, data) }.getOrNull()
    }

suspend fun fetchAllPhotos(): List<RemotePhoto> =
    fetchAllPhotosRaw().mapNotNull { (id, data) ->
        runCatching { RemotePhoto.fromFirestoreMap(id, data) }.getOrNull()
    }
```

(Keep the other typed `fetchAll*` for backward compatibility but they now delegate to the raw versions with sinceMs=0.)

- [ ] **Step 2: Pass `lastSyncTimestamp` from SyncWorker to pull phase**

In `SyncWorker.kt`, add a field at the top of `doWork()` to capture the timestamp BEFORE the sync starts (so we don't miss records modified during the sync window):

```kotlin
// Capture before sync starts — anything updated before this moment will be caught
val syncStartMs = System.currentTimeMillis()
val lastSyncMs = preferencesHelper.lastSyncTimestamp
```

Update the `pullFromRemote()` signature:

```kotlin
private suspend fun pullFromRemote(sinceMs: Long) {
    Log.d(TAG, "Pull phase: fetching remote data since ${if (sinceMs == 0L) "beginning" else java.util.Date(sinceMs)}...")
```

Update the call in `doWork()`:

```kotlin
try {
    pullFromRemote(lastSyncMs)
} catch (e: Exception) {
    Log.w(TAG, "Pull phase failed, continuing with push: ${e.message}", e)
}
```

Update each `fetchAll*Raw()` call inside `pullFromRemote()` to pass `sinceMs`:

```kotlin
// In pullFromRemote(sinceMs: Long):
val rawProjects = remoteDataSource.fetchAllProjectsRaw(sinceMs)
// ... (same for all 8 collections)
val rawPhotos = remoteDataSource.fetchAllPhotosRaw(sinceMs)
```

Update `preferencesHelper.lastSyncTimestamp` at the end of a successful sync to use `syncStartMs` (captured before sync):

```kotlin
// In the success branches at the bottom of doWork():
preferencesHelper.lastSyncTimestamp = syncStartMs
```

- [ ] **Step 3: Add `updatedAt` indexes to firestore.indexes.json**

Replace the entire content of `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "drill_intervals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "drillHoleId", "order": "ASCENDING" },
        { "fieldPath": "fromDepth",   "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "stations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "lithologies",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "structural_data",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "samples",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "drill_holes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "drill_intervals",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "photos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "updatedAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 4: Deploy indexes to Firebase**

Run (from repo root, requires firebase CLI):
```bash
firebase deploy --only firestore:indexes
```
Expected output: `✔  firestore: deployed indexes in firestore.indexes.json successfully`

If firebase CLI not installed: `npm install -g firebase-tools && firebase login`

- [ ] **Step 5: Build Android app**

```bash
./gradlew assembleDebug --no-daemon 2>&1 | tail -20
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit Task 2**

```bash
git add app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt
git add app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt
git add firestore.indexes.json
git commit -m "perf(android): delta sync — only pull documents changed since last sync

Adds whereGreaterThan('updatedAt', lastSyncTimestamp) filter to all pull
queries. First sync (timestamp=0) still fetches everything. Subsequent syncs
only download changed documents. Adds updatedAt single-field indexes for all
8 collections."
```

---

## Task 3: Cloud Storage snapshot for efficient first-sync

**Files:**
- Create: `functions/package.json`
- Create: `functions/tsconfig.json`
- Create: `functions/src/index.ts`
- Modify: `app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt`
- Modify: `app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt`
- Modify: `storage.rules`

**Context:**
On first sync (or after app reinstall), Android downloads ALL documents from 8 collections. With 500 stations + 2000 intervals + all child records, this is thousands of Firestore reads (billed per read). A callable Cloud Function reads the same data via Admin SDK (no billing for Admin reads), compresses it to JSON.gz, uploads to Storage, and returns a signed download URL. Android downloads the ~50-200KB blob instead of thousands of small reads. After applying the snapshot, normal delta sync resumes.

The callable function only runs when `lastSyncTimestamp == 0`. On subsequent syncs, Android uses the existing delta path from Task 2.

- [ ] **Step 1: Initialize Firebase Functions directory**

Run from repo root:
```bash
mkdir -p functions/src
```

Create `functions/package.json`:

```json
{
  "name": "geoagent-functions",
  "version": "1.0.0",
  "private": true,
  "engines": { "node": "20" },
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions"
  },
  "dependencies": {
    "firebase-admin": "^12.7.0",
    "firebase-functions": "^6.3.2"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^20.0.0"
  }
}
```

Create `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": false,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2019",
    "lib": ["es2019"]
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

- [ ] **Step 2: Write the Cloud Function**

Create `functions/src/index.ts`:

```typescript
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as zlib from 'zlib';
import { promisify } from 'util';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const gzip = promisify(zlib.gzip);

const COLLECTIONS = [
  'projects', 'stations', 'lithologies', 'structural_data',
  'samples', 'drill_holes', 'drill_intervals', 'photos',
];

/**
 * Callable function: generates a gzip JSON snapshot of all user data.
 * Returns { snapshotUrl: string, generatedAt: number }.
 * Called by Android when lastSyncTimestamp == 0 (first sync or reinstall).
 */
export const generateSnapshot = onCall(
  { region: 'us-central1', timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = request.auth.uid;
    const snapshot: Record<string, Record<string, unknown>[]> = {};

    // Fetch all collections for this user
    for (const col of COLLECTIONS) {
      const snap = await db
        .collection('users')
        .doc(userId)
        .collection(col)
        .get();
      snapshot[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    const generatedAt = Date.now();
    const payload = JSON.stringify({ generatedAt, data: snapshot });

    // Compress
    const compressed = await gzip(Buffer.from(payload, 'utf8'));

    // Upload to Storage
    const bucket = storage.bucket();
    const filePath = `snapshots/${userId}/snapshot.json.gz`;
    const file = bucket.file(filePath);
    await file.save(compressed, {
      contentType: 'application/gzip',
      metadata: { cacheControl: 'private, max-age=0' },
    });

    // Generate signed URL valid for 1 hour
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000,
    });

    functions.logger.info(`Snapshot generated for ${userId}: ${snapshot['stations']?.length} stations`);
    return { snapshotUrl: url, generatedAt };
  }
);
```

- [ ] **Step 3: Install functions dependencies**

```bash
cd functions && npm install && cd ..
```

Expected: `added N packages` with no errors.

- [ ] **Step 4: Build and deploy the function**

```bash
cd functions && npm run build && cd ..
firebase deploy --only functions
```

Expected output:
```
✔  functions: Uploaded 1 new function(s)
✔  functions[generateSnapshot(us-central1)]: Successful create operation.
```

- [ ] **Step 5: Add snapshot download to RemoteDataSource.kt**

Add these imports at the top of `RemoteDataSource.kt` if not already present:
```kotlin
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.ktx.functions
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.tasks.await
import java.net.URL
```

Add the `functions` field to the class constructor (add `FirebaseFunctions` to the DI):
```kotlin
// In the @Inject constructor, add:
private val functions: FirebaseFunctions = Firebase.functions
```

Add this method to `RemoteDataSource.kt`:

```kotlin
/**
 * Calls the Cloud Function to generate a snapshot and returns the gzip bytes.
 * Returns null if the function call fails (fallback to normal fetchAll).
 */
suspend fun downloadSnapshot(): ByteArray? {
    return try {
        Log.d(TAG, "Requesting snapshot from Cloud Function...")
        val result = functions
            .getHttpsCallable("generateSnapshot")
            .call()
            .await()
        val data = result.getData() as? Map<*, *> ?: return null
        val url = data["snapshotUrl"] as? String ?: return null
        Log.d(TAG, "Downloading snapshot from Storage...")
        URL(url).readBytes()
    } catch (e: Exception) {
        Log.w(TAG, "Snapshot download failed, will use normal sync: ${e.message}")
        null
    }
}
```

- [ ] **Step 6: Add snapshot data classes and parser to SyncWorker.kt**

At the top of `SyncWorker.kt` (after the `companion object`), add:

```kotlin
// ---- Snapshot deserialization ----

private data class SnapshotPayload(
    val generatedAt: Long,
    val data: Map<String, List<Map<String, Any?>>>,
)

@Suppress("UNCHECKED_CAST")
private fun parseSnapshot(bytes: ByteArray): SnapshotPayload? {
    return try {
        val json = java.util.zip.GZIPInputStream(bytes.inputStream()).bufferedReader().readText()
        val obj = org.json.JSONObject(json)
        val generatedAt = obj.getLong("generatedAt")
        val dataObj = obj.getJSONObject("data")
        val data = mutableMapOf<String, List<Map<String, Any?>>>()
        for (col in dataObj.keys()) {
            val arr = dataObj.getJSONArray(col)
            val list = mutableListOf<Map<String, Any?>>()
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                val map = mutableMapOf<String, Any?>()
                for (key in item.keys()) map[key] = item.get(key)
                list.add(map)
            }
            data[col] = list
        }
        SnapshotPayload(generatedAt, data)
    } catch (e: Exception) {
        Log.e(TAG, "Failed to parse snapshot: ${e.message}", e)
        null
    }
}
```

- [ ] **Step 7: Apply snapshot on first sync in SyncWorker.doWork()**

In `doWork()`, before the pull/push logic, add a snapshot bootstrap step (runs only when `lastSyncMs == 0L`):

```kotlin
// ---- Snapshot bootstrap (first sync only) ----
if (lastSyncMs == 0L) {
    Log.d(TAG, "First sync: attempting snapshot download...")
    val snapshotBytes = remoteDataSource.downloadSnapshot()
    if (snapshotBytes != null) {
        val payload = parseSnapshot(snapshotBytes)
        if (payload != null) {
            Log.d(TAG, "Applying snapshot (generatedAt=${java.util.Date(payload.generatedAt)})")
            applySnapshot(payload)
            // After applying snapshot, set lastSyncMs to snapshot time so
            // the pull phase only fetches what changed AFTER the snapshot
            preferencesHelper.lastSyncTimestamp = payload.generatedAt
        }
    } else {
        Log.d(TAG, "Snapshot unavailable, proceeding with full pull")
    }
}
```

Add the `applySnapshot()` function to `SyncWorker.kt`. This function applies snapshot data using the same insert logic as the pull phase, re-using remoteProjectToLocal/etc. maps:

```kotlin
@Suppress("UNCHECKED_CAST")
private suspend fun applySnapshot(payload: SnapshotPayload) {
    val now = System.currentTimeMillis()

    // Projects
    payload.data["projects"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (projectDao.getByRemoteId(id) != null) return@forEach
        projectDao.insert(ProjectEntity(
            name = item["name"] as? String ?: "",
            description = item["description"] as? String ?: "",
            location = item["location"] as? String ?: "",
            createdAt = now, updatedAt = now,
            syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    }

    // Build remoteId → localId maps needed for child entities
    val remoteProjectToLocal = mutableMapOf<String, Long>()
    val remoteStationToLocal = mutableMapOf<String, Long>()
    val remoteDrillHoleToLocal = mutableMapOf<String, Long>()

    projectDao.getPendingSync().forEach { /* already synced */ }
    // Re-read all projects to fill the map
    // (getPendingSync won't work — use a raw select all)
    // We rely on getByRemoteId to resolve IDs lazily per child insert below.

    // Stations
    payload.data["stations"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (stationDao.getByRemoteId(id) != null) return@forEach
        val projectRemoteId = item["projectId"] as? String ?: return@forEach
        val localProjectId = projectDao.getByRemoteId(projectRemoteId)?.id ?: return@forEach
        val localId = stationDao.insert(StationEntity(
            projectId = localProjectId,
            code = item["code"] as? String ?: "",
            latitude = (item["latitude"] as? Number)?.toDouble() ?: 0.0,
            longitude = (item["longitude"] as? Number)?.toDouble() ?: 0.0,
            altitude = (item["altitude"] as? Number)?.toDouble(),
            date = parseIsoDate(item["date"] as? String),
            geologist = item["geologist"] as? String ?: "",
            description = item["description"] as? String ?: "",
            weatherConditions = item["weatherConditions"] as? String,
            createdAt = now, updatedAt = now,
            syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
        remoteStationToLocal[id] = localId
    }

    // Drill holes
    payload.data["drill_holes"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (drillHoleDao.getByRemoteId(id) != null) return@forEach
        val projectRemoteId = item["projectId"] as? String ?: return@forEach
        val localProjectId = projectDao.getByRemoteId(projectRemoteId)?.id ?: return@forEach
        val localId = drillHoleDao.insert(DrillHoleEntity(
            projectId = localProjectId,
            holeId = item["holeId"] as? String ?: "",
            type = item["type"] as? String ?: "",
            latitude = (item["latitude"] as? Number)?.toDouble() ?: 0.0,
            longitude = (item["longitude"] as? Number)?.toDouble() ?: 0.0,
            altitude = (item["altitude"] as? Number)?.toDouble(),
            azimuth = (item["azimuth"] as? Number)?.toDouble() ?: 0.0,
            inclination = (item["inclination"] as? Number)?.toDouble() ?: 0.0,
            plannedDepth = (item["plannedDepth"] as? Number)?.toDouble() ?: 0.0,
            actualDepth = (item["actualDepth"] as? Number)?.toDouble(),
            startDate = parseIsoDate(item["startDate"] as? String).takeIf { it > 0 },
            endDate = parseIsoDate(item["endDate"] as? String).takeIf { it > 0 },
            status = item["status"] as? String ?: "En Progreso",
            geologist = item["geologist"] as? String ?: "",
            notes = item["notes"] as? String,
            createdAt = now, updatedAt = now,
            syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
        remoteDrillHoleToLocal[id] = localId
    }

    // Lithologies
    payload.data["lithologies"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (lithologyDao.getByRemoteId(id) != null) return@forEach
        val stationRemoteId = item["stationId"] as? String ?: return@forEach
        val localStationId = remoteStationToLocal[stationRemoteId]
            ?: stationDao.getByRemoteId(stationRemoteId)?.id ?: return@forEach
        lithologyDao.insert(LithologyEntity(
            stationId = localStationId,
            rockType = item["rockType"] as? String ?: "",
            rockGroup = item["rockGroup"] as? String ?: "",
            color = item["color"] as? String ?: "",
            texture = item["texture"] as? String ?: "",
            grainSize = item["grainSize"] as? String ?: "",
            mineralogy = item["mineralogy"] as? String ?: "",
            alteration = item["alteration"] as? String,
            alterationIntensity = item["alterationIntensity"] as? String,
            mineralization = item["mineralization"] as? String,
            mineralizationPercent = (item["mineralizationPercent"] as? Number)?.toDouble(),
            structure = item["structure"] as? String,
            weathering = item["weathering"] as? String,
            notes = item["notes"] as? String,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    }

    // Structural data
    payload.data["structural_data"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (structuralDao.getByRemoteId(id) != null) return@forEach
        val stationRemoteId = item["stationId"] as? String ?: return@forEach
        val localStationId = remoteStationToLocal[stationRemoteId]
            ?: stationDao.getByRemoteId(stationRemoteId)?.id ?: return@forEach
        structuralDao.insert(StructuralEntity(
            stationId = localStationId,
            type = item["type"] as? String ?: "",
            strike = (item["strike"] as? Number)?.toDouble() ?: 0.0,
            dip = (item["dip"] as? Number)?.toDouble() ?: 0.0,
            dipDirection = item["dipDirection"] as? String ?: "",
            movement = item["movement"] as? String,
            thickness = (item["thickness"] as? Number)?.toDouble(),
            filling = item["filling"] as? String,
            roughness = item["roughness"] as? String,
            continuity = item["continuity"] as? String,
            notes = item["notes"] as? String,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    }

    // Samples
    payload.data["samples"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (sampleDao.getByRemoteId(id) != null) return@forEach
        val stationRemoteId = item["stationId"] as? String ?: return@forEach
        val localStationId = remoteStationToLocal[stationRemoteId]
            ?: stationDao.getByRemoteId(stationRemoteId)?.id ?: return@forEach
        sampleDao.insert(SampleEntity(
            stationId = localStationId,
            code = item["code"] as? String ?: "",
            type = item["type"] as? String ?: "",
            weight = (item["weight"] as? Number)?.toDouble(),
            length = (item["length"] as? Number)?.toDouble(),
            description = item["description"] as? String ?: "",
            latitude = (item["latitude"] as? Number)?.toDouble(),
            longitude = (item["longitude"] as? Number)?.toDouble(),
            altitude = (item["altitude"] as? Number)?.toDouble(),
            destination = item["destination"] as? String,
            analysisRequested = item["analysisRequested"] as? String,
            status = item["status"] as? String ?: "Recolectada",
            notes = item["notes"] as? String,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    }

    // Drill intervals
    payload.data["drill_intervals"]?.forEach { item ->
        val id = item["id"] as? String ?: return@forEach
        if (drillIntervalDao.getByRemoteId(id) != null) return@forEach
        val dhRemoteId = item["drillHoleId"] as? String ?: return@forEach
        val localDrillHoleId = remoteDrillHoleToLocal[dhRemoteId]
            ?: drillHoleDao.getByRemoteId(dhRemoteId)?.id ?: return@forEach
        drillIntervalDao.insert(DrillIntervalEntity(
            drillHoleId = localDrillHoleId,
            fromDepth = (item["fromDepth"] as? Number)?.toDouble() ?: 0.0,
            toDepth = (item["toDepth"] as? Number)?.toDouble() ?: 0.0,
            rockType = item["rockType"] as? String ?: "",
            rockGroup = item["rockGroup"] as? String ?: "",
            color = item["color"] as? String ?: "",
            texture = item["texture"] as? String ?: "",
            grainSize = item["grainSize"] as? String ?: "",
            mineralogy = item["mineralogy"] as? String ?: "",
            alteration = item["alteration"] as? String,
            alterationIntensity = item["alterationIntensity"] as? String,
            mineralization = item["mineralization"] as? String,
            mineralizationPercent = (item["mineralizationPercent"] as? Number)?.toDouble(),
            rqd = (item["rqd"] as? Number)?.toDouble(),
            recovery = (item["recovery"] as? Number)?.toDouble(),
            structure = item["structure"] as? String,
            weathering = item["weathering"] as? String,
            notes = item["notes"] as? String,
            createdAt = now, updatedAt = now, syncStatus = SYNC_STATUS_SYNCED, remoteId = id,
        ))
    }

    Log.d(TAG, "Snapshot applied successfully.")
}
```

- [ ] **Step 8: Add FirebaseFunctions to the Hilt DI module**

In `app/src/main/java/com/geoagent/app/di/FirebaseModule.kt`, add:

```kotlin
@Provides
@Singleton
fun provideFirebaseFunctions(): com.google.firebase.functions.FirebaseFunctions =
    com.google.firebase.functions.ktx.functions.let {
        com.google.firebase.ktx.Firebase.functions
    }
```

And add `FirebaseFunctions` to `RemoteDataSource`'s constructor:

```kotlin
class RemoteDataSource @Inject constructor(
    private val firestore: FirebaseFirestore,
    private val storage: FirebaseStorage,
    private val auth: FirebaseAuth,
    private val functions: com.google.firebase.functions.FirebaseFunctions,
) {
```

Update `downloadSnapshot()` to use the injected `functions` instead of `Firebase.functions`.

Also add the Firebase Functions dependency to `app/build.gradle.kts` (inside `dependencies {}`):

```kotlin
implementation("com.google.firebase:firebase-functions-ktx")
```

- [ ] **Step 9: Update storage.rules to allow snapshot reads**

In `storage.rules`, add a rule for the snapshots path. Existing rules likely look like:

```
match /photos/{userId}/{fileName} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Add after that:

```
match /snapshots/{userId}/snapshot.json.gz {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if false; // only Cloud Functions can write
}
```

- [ ] **Step 10: Deploy storage rules**

```bash
firebase deploy --only storage
```

Expected: `✔  storage: rules file storage.rules compiled successfully`

- [ ] **Step 11: Build Android app**

```bash
./gradlew assembleDebug --no-daemon 2>&1 | tail -20
```
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 12: Commit Task 3**

```bash
git add functions/
git add app/src/main/java/com/geoagent/app/
git add storage.rules
git commit -m "feat: Cloud Storage snapshot for efficient first-sync

Adds a callable Firebase Cloud Function that generates a gzip JSON snapshot
of all user data. Android downloads the snapshot on first sync (lastSyncTimestamp=0)
instead of fetching thousands of individual Firestore documents. After applying
the snapshot, normal delta sync resumes from the snapshot timestamp."
```

---

## Task 4: Fix Electron — dynamic routes in production

**Files:**
- Modify: `web/apps/desktop/electron-src/main.ts`
- Modify: `web/apps/web/next.config.ts`

**Context:**
The Electron production build loads the Next.js static export via `loadFile(path/to/index.html)`. With `output: 'export'`, dynamic routes like `/projects/abc123` have no corresponding HTML file. Electron tries to open `projects/abc123.html` → file not found → blank page. Fix: register a custom `app://` protocol that serves files from the static export directory, and falls back to `index.html` for any path that doesn't match a physical file. React Router (Next.js client-side) then handles the navigation.

- [ ] **Step 1: Register custom protocol in main.ts**

Replace the entire `main.ts` file content with the updated version that adds a custom `app://` protocol handler. Only changes are: (1) add `protocol` import, (2) register `app://` in `app.whenReady()`, (3) change `loadFile` to `loadURL('app://-/')`.

The full updated `main.ts`:

```typescript
import {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
  protocol,
  net,
  type MenuItemConstructorOptions,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import * as fs from 'fs';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const WEB_URL = isDev ? 'http://localhost:3000' : null;

let mainWindow: BrowserWindow | null = null;

// Register custom protocol so static Next.js export works with SPA routing.
// Must be called before app.whenReady().
if (!isDev) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        allowServiceWorkers: true,
        corsEnabled: true,
      },
    },
  ]);
}

function getWebOutPath(): string {
  return path.join(process.resourcesPath, 'web-out');
}

function registerAppProtocol(): void {
  const webOutPath = getWebOutPath();

  protocol.handle('app', (request) => {
    const url = new URL(request.url);
    // Strip leading slash, decode URI components
    let relativePath = decodeURIComponent(url.pathname);
    if (relativePath.startsWith('/')) relativePath = relativePath.slice(1);

    // Try to serve the exact file first
    const filePath = path.join(webOutPath, relativePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return net.fetch('file://' + filePath);
    }

    // Try with .html extension (Next.js export creates /page.html)
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      return net.fetch('file://' + htmlPath);
    }

    // Try index.html inside directory (Next.js export trailing slash mode)
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return net.fetch('file://' + indexPath);
    }

    // SPA fallback: serve the root index.html for all unknown paths
    return net.fetch('file://' + path.join(webOutPath, 'index.html'));
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'GeoAgent',
    backgroundColor: '#09090b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  if (WEB_URL) {
    mainWindow.loadURL(WEB_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: serve via custom protocol with SPA fallback
    mainWindow.loadURL('app://-/');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── Menu nativo Windows ──────────────────────────────────────────────────────
function buildMenu() {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Proyecto',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.executeJavaScript(
            `window.location.href = '/projects'`,
          ),
        },
        { type: 'separator' },
        {
          label: 'Exportar',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.executeJavaScript(
            `window.location.href = window.location.pathname.replace(/\\/(stations|drillholes|map|photos|import|export).*$/, '') + '/export'`,
          ),
        },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Inicio', accelerator: 'CmdOrCtrl+Shift+H', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/home'`) },
        { label: 'Proyectos', accelerator: 'CmdOrCtrl+Shift+P', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/projects'`) },
        { label: 'Ajustes', click: () => mainWindow?.webContents.executeJavaScript(`window.location.href = '/settings'`) },
        { type: 'separator' },
        { label: 'Recargar', role: 'reload' },
        { label: 'Forzar Recarga', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Pantalla Completa', role: 'togglefullscreen' },
        { label: 'Zoom +', role: 'zoomIn' },
        { label: 'Zoom -', role: 'zoomOut' },
        { label: 'Zoom Normal', role: 'resetZoom' },
        ...(isDev ? [{ type: 'separator' as const }, { label: 'DevTools', role: 'toggleDevTools' as const }] : []),
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Buscar actualizaciones',
          click: () => { autoUpdater.checkForUpdatesAndNotify(); },
        },
        { type: 'separator' },
        {
          label: 'Acerca de GeoAgent',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              title: 'GeoAgent',
              message: 'GeoAgent Desktop',
              detail: `Versión ${app.getVersion()}\nApp de geología de campo — datos sincronizados con Firebase`,
              buttons: ['Cerrar'],
            });
          },
        },
        {
          label: 'Ver en GitHub',
          click: () => shell.openExternal('https://github.com/pabloalvarez99/GeoAgent-App'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('save-file', async (_event, filename: string, buffer: ArrayBuffer) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: filename,
    filters: getFiltersFromExt(filename),
  });
  if (!filePath) return null;
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return filePath;
});

ipcMain.handle('show-save-dialog', async (_event, options: any) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow!, options);
  return filePath ?? null;
});

ipcMain.handle('open-file', async (_event, options: any) => {
  const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    ...options,
  });
  if (!filePaths[0]) return null;
  const buffer = fs.readFileSync(filePaths[0]).buffer;
  return { path: filePaths[0], buffer };
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

function getFiltersFromExt(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx') return [{ name: 'Excel', extensions: ['xlsx'] }];
  if (ext === 'pdf') return [{ name: 'PDF', extensions: ['pdf'] }];
  if (ext === 'csv') return [{ name: 'CSV', extensions: ['csv'] }];
  if (ext === 'json' || ext === 'geojson') return [{ name: 'GeoJSON', extensions: ['json', 'geojson'] }];
  if (ext === 'zip') return [{ name: 'ZIP', extensions: ['zip'] }];
  return [{ name: 'Todos los archivos', extensions: ['*'] }];
}

// ── Auto-updater ─────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return;

  autoUpdater.autoDownload = false;

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Actualización disponible',
      message: `GeoAgent ${info.version} está disponible.`,
      detail: 'La nueva versión se descargará en segundo plano.',
      buttons: ['Descargar', 'Más tarde'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.downloadUpdate();
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow!, {
      type: 'info',
      title: 'Actualización lista',
      message: 'Reinicia GeoAgent para instalar la nueva versión.',
      buttons: ['Reiniciar ahora', 'Más tarde'],
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.checkForUpdatesAndNotify();
}

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (!isDev) registerAppProtocol();
  buildMenu();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

- [ ] **Step 2: Add `trailingSlash` to next.config.ts for static export**

In `web/apps/web/next.config.ts`, update the static export conditional:

```typescript
...(process.env.NEXT_EXPORT === '1'
  ? { output: 'export', trailingSlash: true, images: { unoptimized: true } }
  : {}),
```

`trailingSlash: true` makes Next.js generate `/projects/index.html` instead of `/projects.html`, which aligns with how the `app://` protocol handler looks for `index.html` inside directories.

- [ ] **Step 3: Compile Electron TypeScript to verify no errors**

```bash
cd web/apps/desktop && npx tsc -p tsconfig.electron.json --noEmit
```
Expected: no output (no errors).

- [ ] **Step 4: Test Electron dev mode**

```bash
cd web && npm run dev &
# Wait for Next.js to start, then:
cd apps/desktop && npx electron .
```

Verify: app opens at `http://localhost:3000`, login works, navigation to projects works.

- [ ] **Step 5: Test Electron production build locally (optional — requires Windows)**

```bash
cd web/apps/web && NEXT_EXPORT=1 npm run build
cd ../desktop && npm install && npx tsc -p tsconfig.electron.json && npx electron-builder --win --x64
```

Expected: `dist-build/GeoAgent Setup 1.0.0.exe` created.

- [ ] **Step 6: Commit Task 4**

```bash
git add web/apps/desktop/electron-src/main.ts
git add web/apps/web/next.config.ts
git commit -m "fix(electron): custom app:// protocol enables SPA routing in production build

Static Next.js export has no HTML files for dynamic routes like /projects/[id].
Registers a custom app:// protocol that serves files from the static export
and falls back to index.html for unknown paths, letting client-side routing work."
```

---

## Self-Review

**Spec coverage:**
- Option A (pull update existing records): Tasks 1 steps 1-11 ✅
- Option B (delta sync): Task 2 steps 1-6 ✅
- Option C (Cloud Storage snapshot): Task 3 steps 1-12 ✅
- Option D (Electron dynamic routes): Task 4 steps 1-6 ✅

**Type consistency:**
- `updateFromRemote` signatures in DAOs match calls in SyncWorker.kt ✅
- `fetchAllSince()` replaces `fetchAll()` — all call sites updated ✅
- `SnapshotPayload.data` keys match Firestore collection names ✅

**Potential gaps:**
- Task 3: `FirebaseModule.kt` update for `FirebaseFunctions` injection — included in Step 8
- Task 3: `functions/` directory is not part of the Android Gradle build — no changes needed there
- Task 2: The `preferencesHelper.lastSyncTimestamp = syncStartMs` in BOTH success branches (partial success and full success) — both branches need updating, specified in Step 2

**Known limitation:**
- Task 3's snapshot Timestamp fields (Firestore Timestamps) serialize to JSON as `{seconds: N, nanoseconds: N}` objects, not epoch millis. The `extractUpdatedAt` helper in RemoteDataSource reads `Timestamp` objects from live Firestore docs. In the snapshot JSON, these serialize differently. The `applySnapshot()` function doesn't use `updatedAt` from the snapshot (just sets `updatedAt = now`), so this is not a problem for correctness. After snapshot is applied, delta sync uses the `generatedAt` timestamp from the snapshot payload.
