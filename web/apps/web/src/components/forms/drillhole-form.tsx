'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { drillHoleSchema, type DrillHoleFormData } from '@geoagent/geo-shared/validation';
import { DRILL_HOLE_TYPES, DRILL_HOLE_STATUSES } from '@geoagent/geo-shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';

interface DrillHoleFormProps {
  defaultValues?: Partial<DrillHoleFormData>;
  onSubmit: (data: DrillHoleFormData) => Promise<void>;
  onCancel: () => void;
}

export function DrillHoleForm({ defaultValues, onSubmit, onCancel }: DrillHoleFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DrillHoleFormData>({
    resolver: zodResolver(drillHoleSchema),
    defaultValues: {
      holeId: '',
      type: '',
      geologist: '',
      latitude: 0,
      longitude: 0,
      altitude: null,
      azimuth: 0,
      inclination: -90,
      plannedDepth: 0,
      actualDepth: null,
      startDate: null,
      endDate: null,
      status: 'En Progreso',
      notes: null,
      ...defaultValues,
    },
  });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const hasCoords = latitude !== 0 || longitude !== 0;

  async function handleGetLocation() {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        if (pos.coords.altitude) setValue('altitude', pos.coords.altitude);
        setGettingLocation(false);
      },
      () => setGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onFormSubmit(data: DrillHoleFormData) {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Identificación */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Identificación</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>ID del sondaje *</Label>
            <Input placeholder="SDH-001" {...register('holeId')} />
            {errors.holeId && <p className="text-xs text-destructive">{errors.holeId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Tipo *</Label>
            <Select onValueChange={(v) => setValue('type', v)} value={watch('type')}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
              <SelectContent>
                {DRILL_HOLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Geólogo *</Label>
          <Input placeholder="Nombre del geólogo" {...register('geologist')} />
          {errors.geologist && <p className="text-xs text-destructive">{errors.geologist.message}</p>}
        </div>
      </div>

      <Separator />

      {/* Ubicación GPS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Collar GPS</p>
          <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={gettingLocation}>
            {gettingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <MapPin className="h-3.5 w-3.5 mr-1.5" />}
            Capturar GPS
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Latitud</Label>
            <Input type="number" step="any" placeholder="0.000000" {...register('latitude', { valueAsNumber: true })} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Longitud</Label>
            <Input type="number" step="any" placeholder="0.000000" {...register('longitude', { valueAsNumber: true })} className="font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Altitud (m)</Label>
            <Input type="number" step="any" placeholder="—" {...register('altitude', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} className="font-mono text-sm" />
          </div>
        </div>
        {hasCoords && (
          <p className="text-xs text-muted-foreground font-mono bg-muted/30 rounded px-2 py-1">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
        )}
        {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
      </div>

      <Separator />

      {/* Geometría y profundidad */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Geometría y profundidad</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Azimut (°) *</Label>
            <Input type="number" min="0" max="360" step="0.1" placeholder="0–360" {...register('azimuth', { valueAsNumber: true })} />
            {errors.azimuth && <p className="text-xs text-destructive">{errors.azimuth.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Inclinación (°) *</Label>
            <Input type="number" min="-90" max="0" step="0.1" placeholder="-90 a 0" {...register('inclination', { valueAsNumber: true })} />
            {errors.inclination && <p className="text-xs text-destructive">{errors.inclination.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Prof. planeada (m) *</Label>
            <Input type="number" min="0" step="0.1" placeholder="0.0" {...register('plannedDepth', { valueAsNumber: true })} />
            {errors.plannedDepth && <p className="text-xs text-destructive">{errors.plannedDepth.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Prof. real (m)</Label>
            <Input type="number" min="0" step="0.1" placeholder="—" {...register('actualDepth', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Estado y fechas */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Estado y fechas</p>
        <div className="space-y-1.5">
          <Label>Estado *</Label>
          <Select onValueChange={(v) => setValue('status', v)} value={watch('status')}>
            <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
            <SelectContent>
              {DRILL_HOLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Fecha inicio</Label>
            <Input type="date" {...register('startDate')} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha fin</Label>
            <Input type="date" {...register('endDate')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notas</Label>
          <Textarea rows={2} placeholder="Observaciones adicionales..." {...register('notes')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar sondaje
        </Button>
      </div>
    </form>
  );
}
