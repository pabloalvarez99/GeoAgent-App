'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lithologySchema, type LithologyFormData } from '@geoagent/geo-shared/validation';
import {
  ROCK_GROUPS,
  ROCK_TYPES_BY_GROUP,
  COLORS,
  TEXTURES,
  GRAIN_SIZES,
  MINERALS,
  ALTERATIONS,
  ALTERATION_INTENSITIES,
  STRUCTURES,
  WEATHERING_GRADES,
} from '@geoagent/geo-shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface LithologyFormProps {
  defaultValues?: Partial<LithologyFormData>;
  onSubmit: (data: LithologyFormData) => Promise<void>;
  onCancel: () => void;
}

function GeoSelect({
  label,
  required,
  options,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  value?: string | null;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && ' *'}</Label>
      <Select onValueChange={onChange} value={value || undefined}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder ?? `Seleccionar ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function LithologyForm({ defaultValues, onSubmit, onCancel }: LithologyFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LithologyFormData>({
    resolver: zodResolver(lithologySchema),
    defaultValues: {
      rockType: '',
      rockGroup: '',
      color: '',
      texture: '',
      grainSize: '',
      mineralogy: '',
      alteration: null,
      alterationIntensity: null,
      mineralization: null,
      mineralizationPercent: null,
      structure: null,
      weathering: null,
      notes: null,
      ...defaultValues,
    },
  });

  const rockGroup = watch('rockGroup');
  const rockTypes = rockGroup ? ROCK_TYPES_BY_GROUP[rockGroup] ?? [] : [];

  async function onFormSubmit(data: LithologyFormData) {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <GeoSelect
          label="Grupo de roca"
          required
          options={ROCK_GROUPS}
          value={watch('rockGroup')}
          onChange={(v) => { setValue('rockGroup', v); setValue('rockType', ''); }}
          error={errors.rockGroup?.message}
        />
        <GeoSelect
          label="Tipo de roca"
          required
          options={rockTypes}
          value={watch('rockType')}
          onChange={(v) => setValue('rockType', v)}
          error={errors.rockType?.message}
          placeholder={rockGroup ? 'Seleccionar tipo' : 'Selecciona grupo primero'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GeoSelect label="Color" required options={COLORS} value={watch('color')} onChange={(v) => setValue('color', v)} error={errors.color?.message} />
        <GeoSelect label="Textura" required options={TEXTURES} value={watch('texture')} onChange={(v) => setValue('texture', v)} error={errors.texture?.message} />
      </div>

      <GeoSelect label="Tamaño de grano" required options={GRAIN_SIZES} value={watch('grainSize')} onChange={(v) => setValue('grainSize', v)} error={errors.grainSize?.message} />

      <div className="space-y-1.5">
        <Label>Mineralogía *</Label>
        <Input placeholder="Cuarzo, Feldespato, Pirita..." {...register('mineralogy')} />
        {errors.mineralogy && <p className="text-xs text-destructive">{errors.mineralogy.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GeoSelect label="Alteración" options={ALTERATIONS} value={watch('alteration')} onChange={(v) => setValue('alteration', v)} />
        <GeoSelect label="Intensidad" options={ALTERATION_INTENSITIES} value={watch('alterationIntensity')} onChange={(v) => setValue('alterationIntensity', v)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Mineralización</Label>
          <Input placeholder="Sulfuros, Óxidos..." {...register('mineralization')} />
        </div>
        <div className="space-y-1.5">
          <Label>% Mineralización</Label>
          <Input type="number" step="0.1" min="0" max="100" placeholder="0–100" {...register('mineralizationPercent', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GeoSelect label="Estructura" options={STRUCTURES} value={watch('structure')} onChange={(v) => setValue('structure', v)} />
        <GeoSelect label="Meteorización" options={WEATHERING_GRADES} value={watch('weathering')} onChange={(v) => setValue('weathering', v)} />
      </div>

      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea rows={2} placeholder="Observaciones adicionales..." {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar litología
        </Button>
      </div>
    </form>
  );
}
