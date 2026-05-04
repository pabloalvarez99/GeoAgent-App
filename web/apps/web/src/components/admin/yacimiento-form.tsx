'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { YacimientoTipo, YacimientoModelo } from '@/types/org';

export function YacimientoForm({ orgId, faenaId, onCreated }: { orgId: string; faenaId: string; onCreated: () => void }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<YacimientoTipo>('subt');
  const [modelo, setModelo] = useState<YacimientoModelo>('vetiforme');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    await addDoc(collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos'), {
      faenaId, nombre, tipo, modelo, activo: true,
    });
    setNombre('');
    onCreated();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end border rounded p-3">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre yacimiento" className="border rounded px-2 py-1 bg-background" />
      <select value={tipo} onChange={(e) => setTipo(e.target.value as YacimientoTipo)} className="border rounded px-2 py-1 bg-background">
        <option value="subt">Subterráneo</option>
        <option value="rajo">Rajo abierto</option>
        <option value="compra">Compra</option>
      </select>
      <select value={modelo} onChange={(e) => setModelo(e.target.value as YacimientoModelo)} className="border rounded px-2 py-1 bg-background">
        <option value="IOCG">IOCG</option>
        <option value="vetiforme">Vetiforme</option>
        <option value="oxido_Cu">Óxido Cu</option>
        <option value="porfido">Pórfido</option>
        <option value="otro">Otro</option>
      </select>
      <button className="px-3 py-1 rounded bg-primary text-primary-foreground">Crear</button>
    </form>
  );
}
