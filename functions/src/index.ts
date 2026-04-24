import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
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
 * Callable: generates a gzip JSON snapshot of all user data.
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
    const bucket = storage.bucket();
    const filePath = `snapshots/${userId}/snapshot.json.gz`;
    const file = bucket.file(filePath);

    // ── Staleness check: reuse snapshot if it was generated < 1 hour ago ────
    const ONE_HOUR_MS = 60 * 60 * 1000;
    try {
      const [metadata] = await file.getMetadata();
      const updatedMs = new Date(metadata.updated as string).getTime();
      if (Date.now() - updatedMs < ONE_HOUR_MS) {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + ONE_HOUR_MS,
        });
        const cachedAt = Number(metadata.metadata?.generatedAt ?? updatedMs);
        functions.logger.info(`Snapshot cache hit for ${userId}, age=${Math.round((Date.now() - updatedMs) / 60000)}m`);
        return { snapshotUrl: url, generatedAt: cachedAt };
      }
    } catch {
      // File doesn't exist yet — fall through to generation
    }

    const snapshot: Record<string, Record<string, unknown>[]> = {};

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
    const compressed = await gzip(Buffer.from(payload, 'utf8'));

    await file.save(compressed, {
      contentType: 'application/gzip',
      // cacheControl + custom generatedAt go in the nested metadata object
      metadata: {
        cacheControl: 'private, max-age=0',
        metadata: { generatedAt: String(generatedAt) },
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: generatedAt + ONE_HOUR_MS,
    });

    functions.logger.info(`Snapshot generated for ${userId}: ${snapshot['stations']?.length ?? 0} stations`);
    return { snapshotUrl: url, generatedAt };
  }
);

// ── Cascade delete helpers ────────────────────────────────────────────────────

/** Delete all documents in a collection query in batches of 500. */
async function deleteQuery(q: FirebaseFirestore.Query): Promise<void> {
  const snap = await q.limit(500).get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  if (snap.size === 500) await deleteQuery(q); // recurse for next page
}

/**
 * When a station is deleted, clean up its child collections.
 * Triggered server-side, so it runs even if the web client disconnects.
 */
export const onStationDeleted = onDocumentDeleted(
  { document: 'users/{userId}/stations/{stationId}', region: 'us-central1' },
  async (event) => {
    const { userId, stationId } = event.params;
    const stationRef = db.collection('users').doc(userId);

    await Promise.all([
      deleteQuery(stationRef.collection('lithologies').where('stationId', '==', stationId)),
      deleteQuery(stationRef.collection('structural_data').where('stationId', '==', stationId)),
      deleteQuery(stationRef.collection('samples').where('stationId', '==', stationId)),
    ]);

    functions.logger.info(`Cascade deleted children of station ${stationId} (user ${userId})`);
  }
);

/**
 * When a drill hole is deleted, clean up its intervals.
 */
export const onDrillHoleDeleted = onDocumentDeleted(
  { document: 'users/{userId}/drill_holes/{drillHoleId}', region: 'us-central1' },
  async (event) => {
    const { userId, drillHoleId } = event.params;
    const userRef = db.collection('users').doc(userId);

    await deleteQuery(userRef.collection('drill_intervals').where('drillHoleId', '==', drillHoleId));

    functions.logger.info(`Cascade deleted intervals of drill hole ${drillHoleId} (user ${userId})`);
  }
);

/**
 * When a project is deleted, clean up all stations and drill holes
 * (which in turn trigger onStationDeleted / onDrillHoleDeleted cascades).
 */
export const onProjectDeleted = onDocumentDeleted(
  { document: 'users/{userId}/projects/{projectId}', region: 'us-central1' },
  async (event) => {
    const { userId, projectId } = event.params;
    const userRef = db.collection('users').doc(userId);

    // Delete stations and drill holes — their own triggers handle grandchildren
    const [stationsSnap, drillHolesSnap, photosSnap] = await Promise.all([
      userRef.collection('stations').where('projectId', '==', projectId).get(),
      userRef.collection('drill_holes').where('projectId', '==', projectId).get(),
      userRef.collection('photos').where('projectId', '==', projectId).get(),
    ]);

    const batch = db.batch();
    [...stationsSnap.docs, ...drillHolesSnap.docs, ...photosSnap.docs].forEach((d) =>
      batch.delete(d.ref),
    );
    await batch.commit();

    functions.logger.info(
      `Cascade deleted project ${projectId}: ${stationsSnap.size} stations, ${drillHolesSnap.size} drill holes, ${photosSnap.size} photos (user ${userId})`
    );
  }
);
