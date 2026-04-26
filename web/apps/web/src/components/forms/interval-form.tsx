'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { drillIntervalSchema, type DrillIntervalFormData } from '@geoagent/geo-shared/validation';
import {
  ROCK_GROUPS,
  ROCK_TYPES_BY_GROUP,
  COLORS,
  TEXTURES,
  GRAIN_SIZES,
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
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface IntervalFormProps {
  defaultValues?: Partial<DrillIntervalFormData>;
  fromDepthMin?: number; // next available depth
  onSubmit: (data: DrillIntervalFormData) => Promise<void>;
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

export function IntervalForm({ defaultValues, fromDepthMin = 0, onSubmit, onCancel }: IntervalFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DrillIntervalFormData>({
    resolver: zodResolver(drillIntervalSchema),
    defaultValues: {
      fromDepth: fromDepthMin,
      toDepth: fromDepthMin + 1,
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
      rqd: null,
      recovery: null,
      structure: null,
      weathering: null,
      notes: null,
      ...defaultValues,
    },
  });

  const rockGroup = watch('rockGroup');
  const rockTypes = rockGroup ? ROCK_TYPES_BY_GROUP[rockGroup] ?? [] : [];
  const rqd = watch('rqd');
  const recovery = watch('recovery');
  const fromDepth = watch('fromDepth');
  const toDepth = watch('toDepth');
  const depthInvalid = typeof fromDepth === 'number' && typeof toDepth === 'number' && !isNaN(fromDepth) && !isNaN(toDepth) && toDepth <= fromDepth;

  async function onFormSubmit(data: DrillIntervalFormData) {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Section: Profundidad */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Profundidad</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Desde (m) *</Label>
            <Input type="number" step="0.1" min="0" placeholder="0.0" {...register('fromDepth', { valueAsNumber: true })} className="font-mono" />
            {errors.fromDepth && <p className="text-xs text-destructive">{errors.fromDepth.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Hasta (m) *</Label>
            <Input type="number" step="0.1" min="0" placeholder="1.0" {...register('toDepth', { valueAsNumber: true })} className="font-mono" />
            {errors.toDepth && <p className="text-xs text-destructive">{errors.toDepth.message}</p>}
          </div>
        </div>
        {depthInvalid && (
          <p className="text-xs text-amber-500 bg-amber-500/10 rounded px-2 py-1">
            ⚠ La profundidad &ldquo;hasta&rdquo; debe ser mayor que &ldquo;desde&rdquo; ({fromDepth} m).
          </p>
        )}
      </div>

      <Separator />

      {/* Section: Litología */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Litología</p>
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
      </div>

      <Separator />

      {/* Section: Calidad de testigo */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Calidad de testigo</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>RQD (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" placeholder="0–100" {...register('rqd', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} className="font-mono" />
            {rqd != null && !isNaN(rqd) && (
              <div className="space-y-0.5">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, rqd)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{rqd.toFixed(0)}%</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Recuperación (%)</Label>
            <Input type="number" step="0.1" min="0" max="100" placeholder="0–100" {...register('recovery', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} className="font-mono" />
            {recovery != null && !isNaN(recovery) && (
              <div className="space-y-0.5">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${Math.min(100, recovery)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">{recovery.toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Section: Alteración y mineralización */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Alteración y mineralización</p>
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
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar intervalo
        </Button>
      </div>
    </form>
  );
}
