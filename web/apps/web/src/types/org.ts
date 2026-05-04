export type Role =
  | 'super_geol'
  | 'geol_senior'
  | 'geol_mina'
  | 'qaqc'
  | 'geotec'
  | 'visitante';

export const ROLE_LABELS: Record<Role, string> = {
  super_geol: 'Superintendente de Geología',
  geol_senior: 'Geólogo Senior',
  geol_mina: 'Geólogo Mina',
  qaqc: 'QA/QC',
  geotec: 'Geotécnico',
  visitante: 'Visitante',
};

export interface Org {
  id: string;
  nombre: string;
  ruc?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: number;
}

export interface Member {
  uid: string;
  email: string;
  nombre: string;
  role: Role;
  faenaIds: string[];
  yacimientoIds: string[];
  activo: boolean;
}

export type FaenaNombre = 'Talcuna' | 'Lambert';

export interface Faena {
  id: string;
  nombre: FaenaNombre | string;
  region: string;
}

export type YacimientoTipo = 'subt' | 'rajo' | 'compra';
export type YacimientoModelo = 'IOCG' | 'vetiforme' | 'oxido_Cu' | 'porfido' | 'otro';

export interface Yacimiento {
  id: string;
  faenaId: string;
  nombre: string;
  tipo: YacimientoTipo;
  modelo: YacimientoModelo;
  coords?: { lat: number; lng: number };
  activo: boolean;
}
