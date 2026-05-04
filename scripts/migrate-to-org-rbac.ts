// Backfills existing users/{uid}/drillholes -> orgs/cmsg/.../drillholes (idempotent).
// Run AFTER seed-cmsg-org.ts. Usage: npx tsx scripts/migrate-to-org-rbac.ts <uid> <yacId>
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'node:fs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SA, 'utf-8'))) });
}
const db = getFirestore();

async function main() {
  const [uid, yacId] = process.argv.slice(2);
  if (!uid || !yacId) throw new Error('usage: tsx migrate-to-org-rbac.ts <uid> <yacId>');

  const cols = ['drillholes', 'stations', 'lithologies', 'structurals', 'samples'];
  for (const col of cols) {
    const src = await db.collection('users').doc(uid).collection(col).get();
    console.log(`Migrating ${col}: ${src.size} docs`);
    let n = 0;
    for (const d of src.docs) {
      const data = d.data();
      if (!data.yacId) data.yacId = yacId;
      if (!data.orgId) data.orgId = 'cmsg';
      await d.ref.update({ yacId: data.yacId, orgId: data.orgId });
      n++;
    }
    console.log(`  tagged ${n} docs with yacId=${yacId}, orgId=cmsg`);
  }
  console.log('Migration done. Existing rules still allow access via legacy path.');
}

main().catch((e) => { console.error(e); process.exit(1); });
