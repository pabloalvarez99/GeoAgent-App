// Mirror of GeoConstants.kt — all dropdown options used in the app

export const ROCK_GROUPS = ['Ignea', 'Sedimentaria', 'Metamorfica'] as const;

export const ROCK_TYPES_BY_GROUP: Record<string, string[]> = {
  Ignea: [
    'Andesita', 'Basalto', 'Granito', 'Diorita', 'Riolita', 'Dacita', 'Gabro',
    'Granodiorita', 'Tonalita', 'Sienita', 'Peridotita', 'Porfido', 'Toba',
    'Brecha Volcanica', 'Ignimbrita',
  ],
  Sedimentaria: [
    'Arenisca', 'Lutita', 'Caliza', 'Conglomerado', 'Limolita', 'Dolomita',
    'Arcillolita', 'Marga', 'Evaporita', 'Chert', 'Fosforita', 'Brecha Sedimentaria',
  ],
  Metamorfica: [
    'Esquisto', 'Gneis', 'Marmol', 'Pizarra', 'Cuarcita', 'Filita', 'Anfibolita',
    'Migmatita', 'Hornfels', 'Skarn', 'Serpentinita', 'Milonita',
  ],
};

export const ALL_ROCK_TYPES = Object.values(ROCK_TYPES_BY_GROUP).flat();

export const COLORS = [
  'Blanco', 'Gris Claro', 'Gris Medio', 'Gris Oscuro', 'Negro',
  'Rojo', 'Rosado', 'Cafe', 'Cafe Claro', 'Amarillo',
  'Verde', 'Verde Oscuro', 'Azul', 'Violeta', 'Naranja',
] as const;

export const TEXTURES = [
  'Faneritica', 'Afanitica', 'Porfirica', 'Vitrea',
  'Clastica', 'Foliada', 'Granoblastica', 'Piroclastica',
] as const;

export const GRAIN_SIZES = [
  'Muy Fina', 'Fina', 'Media', 'Gruesa', 'Muy Gruesa',
] as const;

export const ALTERATIONS = [
  'Ninguna', 'Filica', 'Argilica', 'Argilica Avanzada', 'Propilitica',
  'Potasica', 'Silicica', 'Clorita-Epidota', 'Carbonatacion', 'Sericitizacion', 'Turmalina',
] as const;

export const ALTERATION_INTENSITIES = [
  'Debil', 'Moderada', 'Fuerte', 'Intensa', 'Pervasiva',
] as const;

export const STRUCTURES = [
  'Masiva', 'Foliada', 'Bandeada', 'Brechada', 'Vesicular',
  'Amigdaloidal', 'Fluidal', 'Estratificada', 'Laminada', 'Cizallada',
] as const;

export const WEATHERING_GRADES = [
  'Fresca', 'Leve', 'Moderada', 'Alta', 'Muy Alta', 'Suelo Residual',
] as const;

export const STRUCTURAL_TYPES = [
  'Falla', 'Fractura', 'Veta', 'Vetilla', 'Foliacion',
  'Estratificacion', 'Contacto', 'Diaclasa', 'Clivaje', 'Zona de Cizalle',
] as const;

export const DIP_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export const FAULT_MOVEMENTS = ['Normal', 'Inversa', 'Dextral', 'Sinistral', 'Oblicua'] as const;
export const ROUGHNESS = ['Lisa', 'Rugosa', 'Escalonada', 'Ondulada', 'Estriada'] as const;
export const CONTINUITY = ['Continua', 'Discontinua', 'Intermitente'] as const;

export const SAMPLE_TYPES = [
  'Roca', 'Suelo', 'Sedimento', 'Canal', 'Chip', 'Trinchera', 'Panel',
] as const;

export const DRILL_HOLE_TYPES = [
  'Diamantina', 'RC', 'Aire Reverso', 'Percusion',
] as const;

export const DRILL_HOLE_STATUSES = [
  'En Progreso', 'Completado', 'Abandonado', 'Suspendido',
] as const;

export const SAMPLE_STATUSES = [
  'Pendiente', 'Enviada', 'En Laboratorio', 'Resultados Recibidos',
] as const;

export const MINERALS = [
  'Cuarzo', 'Feldespato', 'Plagioclasa', 'Biotita', 'Moscovita',
  'Hornblenda', 'Augita', 'Olivino', 'Calcita', 'Dolomita',
  'Pirita', 'Calcopirita', 'Molibdenita', 'Magnetita', 'Hematita',
  'Galena', 'Esfalerita', 'Arsenopirita', 'Bornita', 'Covelina',
  'Clorita', 'Epidota', 'Sericita', 'Arcilla', 'Turmalina',
  'Granate', 'Actinolita', 'Wollastonita', 'Fluorita',
] as const;

export const WEATHER_CONDITIONS = [
  'Despejado', 'Nublado', 'Parcial', 'Lluvia', 'Nieve', 'Viento', 'Niebla',
] as const;

// Firestore collection names — must match Android RemoteDataSource.kt
export const COLLECTIONS = {
  PROJECTS: 'projects',
  STATIONS: 'stations',
  LITHOLOGIES: 'lithologies',
  STRUCTURAL_DATA: 'structural_data',
  SAMPLES: 'samples',
  DRILL_HOLES: 'drill_holes',
  DRILL_INTERVALS: 'drill_intervals',
  PHOTOS: 'photos',
} as const;
