import { z } from 'zod';

// Mirror of FormValidation.kt validation rules

const requiredString = (field: string) =>
  z.string().min(1, `${field} es obligatorio`);

export const projectSchema = z.object({
  name: requiredString('Nombre del proyecto'),
  description: requiredString('Descripcion'),
  location: requiredString('Ubicacion'),
});

export const stationSchema = z
  .object({
    code: requiredString('Codigo de estacion'),
    geologist: requiredString('Geologo'),
    description: requiredString('Descripcion'),
    latitude: z.number({ required_error: 'Latitud es obligatoria' }).min(-90).max(90),
    longitude: z.number({ required_error: 'Longitud es obligatoria' }).min(-180).max(180),
    altitude: z.number().optional().nullable(),
    date: z.string().min(1, 'Fecha es obligatoria'),
    weatherConditions: z.string().optional().nullable(),
  })
  .refine((d) => !(d.latitude === 0 && d.longitude === 0), {
    message: 'Captura las coordenadas GPS antes de guardar',
    path: ['latitude'],
  });

export const lithologySchema = z.object({
  rockType: requiredString('Tipo de roca'),
  rockGroup: requiredString('Grupo de roca'),
  color: requiredString('Color'),
  texture: requiredString('Textura'),
  grainSize: requiredString('Tamaño de grano'),
  mineralogy: requiredString('Mineralogia'),
  alteration: z.string().optional().nullable(),
  alterationIntensity: z.string().optional().nullable(),
  mineralization: z.string().optional().nullable(),
  mineralizationPercent: z.number().min(0).max(100).optional().nullable(),
  structure: z.string().optional().nullable(),
  weathering: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const structuralSchema = z.object({
  type: requiredString('Tipo de estructura'),
  strike: z
    .number({ required_error: 'Rumbo es obligatorio' })
    .min(0, 'Rumbo debe estar entre 0 y 360')
    .max(360, 'Rumbo debe estar entre 0 y 360'),
  dip: z
    .number({ required_error: 'Buzamiento es obligatorio' })
    .min(0, 'Buzamiento debe estar entre 0 y 90')
    .max(90, 'Buzamiento debe estar entre 0 y 90'),
  dipDirection: requiredString('Direccion de buzamiento'),
  movement: z.string().optional().nullable(),
  thickness: z.number().positive('Espesor debe ser positivo').optional().nullable(),
  filling: z.string().optional().nullable(),
  roughness: z.string().optional().nullable(),
  continuity: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const sampleSchema = z.object({
  code: requiredString('Codigo de muestra'),
  type: requiredString('Tipo de muestra'),
  description: requiredString('Descripcion'),
  weight: z.number().positive('Peso debe ser positivo').optional().nullable(),
  length: z.number().positive('Largo debe ser positivo').optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  altitude: z.number().optional().nullable(),
  destination: z.string().optional().nullable(),
  analysisRequested: z.string().optional().nullable(),
  status: requiredString('Estado'),
  notes: z.string().optional().nullable(),
});

export const drillHoleSchema = z.object({
  holeId: requiredString('ID del sondaje'),
  type: requiredString('Tipo de sondaje'),
  geologist: requiredString('Geologo'),
  latitude: z.number({ required_error: 'Latitud es obligatoria' }).min(-90).max(90),
  longitude: z.number({ required_error: 'Longitud es obligatoria' }).min(-180).max(180),
  altitude: z.number().optional().nullable(),
  azimuth: z
    .number({ required_error: 'Azimut es obligatorio' })
    .min(0, 'Azimut debe estar entre 0 y 360')
    .max(360, 'Azimut debe estar entre 0 y 360'),
  inclination: z
    .number({ required_error: 'Inclinacion es obligatoria' })
    .min(-90, 'Inclinacion debe estar entre -90 y 0')
    .max(0, 'Inclinacion debe estar entre -90 y 0'),
  plannedDepth: z.number({ required_error: 'Profundidad planeada es obligatoria' }).positive(),
  actualDepth: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: requiredString('Estado'),
  notes: z.string().optional().nullable(),
});

export const drillIntervalSchema = z
  .object({
    fromDepth: z.number({ required_error: 'Ingrese la profundidad inicial' }),
    toDepth: z.number({ required_error: 'Ingrese la profundidad final' }),
    rockType: requiredString('Tipo de roca'),
    rockGroup: requiredString('Grupo de roca'),
    color: requiredString('Color'),
    texture: requiredString('Textura'),
    grainSize: requiredString('Tamaño de grano'),
    mineralogy: requiredString('Mineralogia'),
    alteration: z.string().optional().nullable(),
    alterationIntensity: z.string().optional().nullable(),
    mineralization: z.string().optional().nullable(),
    mineralizationPercent: z.number().min(0).max(100).optional().nullable(),
    rqd: z.number().min(0).max(100).optional().nullable(),
    recovery: z.number().min(0).max(100).optional().nullable(),
    structure: z.string().optional().nullable(),
    weathering: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine((d) => d.fromDepth < d.toDepth, {
    message: "'Desde' debe ser menor que 'Hasta'",
    path: ['fromDepth'],
  });

// Inferred types
export type ProjectFormData = z.infer<typeof projectSchema>;
export type StationFormData = z.infer<typeof stationSchema>;
export type LithologyFormData = z.infer<typeof lithologySchema>;
export type StructuralFormData = z.infer<typeof structuralSchema>;
export type SampleFormData = z.infer<typeof sampleSchema>;
export type DrillHoleFormData = z.infer<typeof drillHoleSchema>;
export type DrillIntervalFormData = z.infer<typeof drillIntervalSchema>;
