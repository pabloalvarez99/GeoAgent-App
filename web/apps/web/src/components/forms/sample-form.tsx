'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sampleSchema, type SampleFormData } from '@geoagent/geo-shared/validation';
import { SAMPLE_TYPES, SAMPLE_STATUSES } from '@geoagent/geo-shared/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SampleFormProps {
  defaultValues?: Partial<SampleFormData>;
  onSubmit: (data: SampleFormData) => Promise<void>;
  onCancel: () => void;
}

export function SampleForm({ defaultValues, onSubmit, onCancel }: SampleFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SampleFormData>({
    resolver: zodResolver(sampleSchema),
    defaultValues: {
      code: '',
      type: '',
      description: '',
      weight: null,
      length: null,
      latitude: null,
      longitude: null,
      altitude: null,
      destination: null,
      analysisRequested: null,
      status: 'Pendiente',
      notes: null,
      ...defaultValues,
    },
  });

  async function onFormSubmit(data: SampleFormData) {
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
        <div className="space-y-1.5">
          <Label>Código de muestra *</Label>
          <Input placeholder="MUE-001" {...register('code')} />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de muestra *</Label>
          <Select onValueChange={(v) => setValue('type', v)} value={watch('type')}>
            <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
            <SelectContent>
              {SAMPLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descripción *</Label>
        <Textarea rows={2} placeholder="Descripción de la muestra..." {...register('description')} />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Peso (kg)</Label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('weight', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} />
        </div>
        <div className="space-y-1.5">
          <Label>Largo (m)</Label>
          <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('length', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Destino</Label>
        <Input placeholder="Laboratorio, nombre del destinatario..." {...register('destination')} />
      </div>

      <div className="space-y-1.5">
        <Label>Análisis solicitados</Label>
        <Input placeholder="Au, Ag, Cu, ICP-MS..." {...register('analysisRequested')} />
      </div>

      <div className="space-y-1.5">
        <Label>Estado *</Label>
        <Select onValueChange={(v) => setValue('status', v)} value={watch('status')}>
          <SelectTrigger><SelectValue placeholder="Seleccionar estado" /></SelectTrigger>
          <SelectContent>
            {SAMPLE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Notas</Label>
        <Textarea rows={2} placeholder="Observaciones adicionales..." {...register('notes')} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar muestra
        </Button>
      </div>
    </form>
  );
}
