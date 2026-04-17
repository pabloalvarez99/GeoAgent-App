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

    const bucket = storage.bucket();
    const filePath = `snapshots/${userId}/snapshot.json.gz`;
    const file = bucket.file(filePath);
    await file.save(compressed, {
      contentType: 'application/gzip',
      metadata: { cacheControl: 'private, max-age=0' },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    functions.logger.info(`Snapshot generated for ${userId}: ${snapshot['stations']?.length ?? 0} stations`);
    return { snapshotUrl: url, generatedAt };
  }
);
