// Run with: npx tsx scripts/seed-cmsg-org.ts <super_geol_uid>
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'node:fs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SA, 'utf-8'))) });
}
const db = getFirestore();

async function main() {
  const superUid = process.argv[2];
  if (!superUid) throw new Error('usage: tsx seed-cmsg-org.ts <super_geol_uid>');

  const orgRef = db.collection('orgs').doc('cmsg');
  await orgRef.set({
    nombre: 'Compañía Minera San Gerónimo',
    plan: 'enterprise',
    createdAt: Date.now(),
  });

  await orgRef.collection('members').doc(superUid).set({
    email: 'super@cmsg.cl',
    nombre: 'Héctor Figueroa Aguilera',
    role: 'super_geol',
    faenaIds: ['talcuna', 'lambert'],
    yacimientoIds: ['21mayo', 'sanantonio', 'tugal', 'lambert'],
    activo: true,
  });

  await orgRef.collection('faenas').doc('talcuna').set({
    nombre: 'Talcuna', region: 'Coquimbo',
  });
  await orgRef.collection('faenas').doc('lambert').set({
    nombre: 'Lambert', region: 'Coquimbo',
  });

  const yacs = [
    { id: '21mayo', faena: 'talcuna', nombre: 'Mina 21 de Mayo', tipo: 'subt', modelo: 'vetiforme' },
    { id: 'sanantonio', faena: 'talcuna', nombre: 'Mina San Antonio', tipo: 'subt', modelo: 'IOCG' },
    { id: 'tugal', faena: 'talcuna', nombre: 'Mina Tugal', tipo: 'rajo', modelo: 'vetiforme' },
    { id: 'lambert', faena: 'lambert', nombre: 'Lambert (compra)', tipo: 'compra', modelo: 'oxido_Cu' },
  ];

  for (const y of yacs) {
    await orgRef.collection('faenas').doc(y.faena).collection('yacimientos').doc(y.id).set({
      faenaId: y.faena, nombre: y.nombre, tipo: y.tipo, modelo: y.modelo, activo: true,
    });
  }

  console.log('Seeded org=cmsg with super_geol=', superUid);
}

main().catch((e) => { console.error(e); process.exit(1); });
