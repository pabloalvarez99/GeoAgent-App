'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stationSchema, type StationFormData } from '@geoagent/geo-shared/validation';
import { WEATHER_CONDITIONS } from '@geoagent/geo-shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { useState } from 'react';

interface StationFormProps {
  defaultValues?: Partial<StationFormData>;
  onSubmit: (data: StationFormData) => Promise<void>;
  onCancel: () => void;
}

export function StationForm({ defaultValues, onSubmit, onCancel }: StationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StationFormData>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      code: '',
      geologist: '',
      description: '',
      latitude: 0,
      longitude: 0,
      altitude: null,
      date: today,
      weatherConditions: null,
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

  async function onFormSubmit(data: StationFormData) {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Código *</Label>
          <Input id="code" placeholder="EST-001" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Fecha *</Label>
          <Input id="date" type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="geologist">Geólogo *</Label>
        <Input id="geologist" placeholder="Nombre del geólogo" {...register('geologist')} />
        {errors.geologist && <p className="text-xs text-destructive">{errors.geologist.message}</p>}
      </div>

      {/* GPS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Coordenadas GPS *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={gettingLocation}
          >
            {gettingLocation ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
            )}
            Capturar GPS
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Latitud</Label>
            <Input
              type="number"
              step="any"
              placeholder="0.000000"
              {...register('latitude', { valueAsNumber: true })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Longitud</Label>
            <Input
              type="number"
              step="any"
              placeholder="0.000000"
              {...register('longitude', { valueAsNumber: true })}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Altitud (m)</Label>
            <Input
              type="number"
              step="any"
              placeholder="—"
              {...register('altitude', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
              className="font-mono text-sm"
            />
          </div>
        </div>
        {hasCoords && (
          <p className="text-xs text-muted-foreground font-mono">
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        )}
        {errors.latitude && <p className="text-xs text-destructive">{errors.latitude.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Condiciones climáticas</Label>
        <Select
          onValueChange={(v) => setValue('weatherConditions', v)}
          defaultValue={defaultValues?.weatherConditions ?? undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar condición" />
          </SelectTrigger>
          <SelectContent>
            {WEATHER_CONDITIONS.map((w) => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción *</Label>
        <Textarea id="description" rows={3} placeholder="Descripción de la estación..." {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar estación
        </Button>
      </div>
    </form>
  );
}
