'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { structuralSchema, type StructuralFormData } from '@geoagent/geo-shared/validation';
import {
  STRUCTURAL_TYPES,
  DIP_DIRECTIONS,
  FAULT_MOVEMENTS,
  ROUGHNESS,
  CONTINUITY,
} from '@geoagent/geo-shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface StructuralFormProps {
  defaultValues?: Partial<StructuralFormData>;
  onSubmit: (data: StructuralFormData) => Promise<void>;
  onCancel: () => void;
}

export function StructuralForm({ defaultValues, onSubmit, onCancel }: StructuralFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StructuralFormData>({
    resolver: zodResolver(structuralSchema),
    defaultValues: {
      type: '',
      strike: 0,
      dip: 0,
      dipDirection: '',
      movement: null,
      thickness: null,
      filling: null,
      roughness: null,
      continuity: null,
      notes: null,
      ...defaultValues,
    },
  });

  async function onFormSubmit(data: StructuralFormData) {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Orientación */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tipo y orientación</p>
        <div className="space-y-1.5">
          <Label>Tipo de estructura *</Label>
          <Select onValueChange={(v) => setValue('type', v)} value={watch('type')}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
            <SelectContent>
              {STRUCTURAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Rumbo (°) *</Label>
            <Input type="number" min="0" max="360" placeholder="0–360" {...register('strike', { valueAsNumber: true })} className="font-mono" />
            {errors.strike && <p className="text-xs text-destructive">{errors.strike.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Buzamiento (°) *</Label>
            <Input type="number" min="0" max="90" placeholder="0–90" {...register('dip', { valueAsNumber: true })} className="font-mono" />
            {errors.dip && <p className="text-xs text-destructive">{errors.dip.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Dirección *</Label>
            <Select onValueChange={(v) => setValue('dipDirection', v)} value={watch('dipDirection')}>
              <SelectTrigger><SelectValue placeholder="Dir." /></SelectTrigger>
              <SelectContent>
                {DIP_DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.dipDirection && <p className="text-xs text-destructive">{errors.dipDirection.message}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Propiedades */}
      <div className="space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Propiedades</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Movimiento</Label>
            <Select onValueChange={(v) => setValue('movement', v)} value={watch('movement') || undefined}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{FAULT_MOVEMENTS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Espesor (m)</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('thickness', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} className="font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Rugosidad</Label>
            <Select onValueChange={(v) => setValue('roughness', v)} value={watch('roughness') || undefined}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{ROUGHNESS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Continuidad</Label>
            <Select onValueChange={(v) => setValue('continuity', v)} value={watch('continuity') || undefined}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{CONTINUITY.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Relleno</Label>
          <Input placeholder="Material de relleno..." {...register('filling')} />
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
          Guardar estructura
        </Button>
      </div>
    </form>
  );
}
