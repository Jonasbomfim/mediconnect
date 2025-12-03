"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarDisponibilidade, atualizarDisponibilidade, listarExcecoes, DoctorAvailabilityCreate, DoctorAvailability, DoctorAvailabilityUpdate, DoctorException } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface AvailabilityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorId?: string | null
  onSaved?: (saved: any) => void
  // when editing, pass the existing availability and set mode to 'edit'
  availability?: DoctorAvailability | null
  mode?: 'create' | 'edit'
  // existing availabilities to prevent duplicate weekday selection
  existingAvailabilities?: DoctorAvailability[]
}

export function AvailabilityForm({ open, onOpenChange, doctorId = null, onSaved, availability = null, mode = 'create', existingAvailabilities = [] }: AvailabilityFormProps) {
  const [weekday, setWeekday] = useState<string>('segunda')
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('17:00')
  const [slotMinutes, setSlotMinutes] = useState<number>(30)
  const [appointmentType, setAppointmentType] = useState<'presencial'|'telemedicina'>('presencial')
  const [active, setActive] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [blockedException, setBlockedException] = useState<null | { date: string; reason?: string; times?: string }>(null)

  // Normalize weekday to standard format for comparison
  const normalizeWeekdayForComparison = (w?: string) => {
    if (!w) return w;
    const k = String(w).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
    const map: Record<string,string> = {
      'segunda':'segunda','terca':'terca','quarta':'quarta','quinta':'quinta','sexta':'sexta','sabado':'sabado','domingo':'domingo',
      'monday':'segunda','tuesday':'terca','wednesday':'quarta','thursday':'quinta','friday':'sexta','saturday':'sabado','sunday':'domingo',
      '1':'segunda','2':'terca','3':'quarta','4':'quinta','5':'sexta','6':'sabado','0':'domingo','7':'domingo'
    };
    return map[k] ?? k;
  };

  // Get list of already used weekdays (excluding current one in edit mode)
  const usedWeekdays = new Set(
    (existingAvailabilities || [])
      .filter(a => mode === 'edit' ? a.id !== availability?.id : true)
      .map(a => normalizeWeekdayForComparison(a.weekday))
      .filter(Boolean)
  );

  // When editing, populate state from availability prop
  useEffect(() => {
    if (mode === 'edit' && availability) {
      // weekday may be 'monday' or 'segunda' — keep original string
      setWeekday(String(availability.weekday ?? 'segunda'))
      // strip seconds for time inputs (HH:MM)
      const st = String(availability.start_time ?? '09:00:00').replace(/:00$/,'')
      const et = String(availability.end_time ?? '17:00:00').replace(/:00$/,'')
      setStartTime(st)
      setEndTime(et)
      setSlotMinutes(Number(availability.slot_minutes ?? 30))
      setAppointmentType((availability.appointment_type ?? 'presencial') as any)
      setActive(!!availability.active)
    }
  }, [mode, availability])

  // When creating and modal opens, set the first available weekday
  useEffect(() => {
    if (mode === 'create' && open) {
      const allWeekdays = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      const firstAvailable = allWeekdays.find(day => !usedWeekdays.has(day));
      if (firstAvailable) {
        setWeekday(firstAvailable);
      }
    }
  }, [mode, open, usedWeekdays])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!doctorId) {
      toast({ title: 'Erro', description: 'ID do médico não informado', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      // Pre-check exceptions for this doctor to avoid creating an availability
      // that is blocked by an existing exception. If a blocking exception is
      // found we show a specific toast and abort the creation request.
      try {
        const exceptions: DoctorException[] = await listarExcecoes({ doctorId: String(doctorId) });
        const today = new Date();
        const oneYearAhead = new Date();
        oneYearAhead.setFullYear(oneYearAhead.getFullYear() + 1);

        const parseTimeToMinutes = (t?: string | null) => {
          if (!t) return null;
          const parts = String(t).split(':').map((p) => Number(p));
          if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
            return parts[0] * 60 + parts[1];
          }
          return null;
        };

        const reqStart = parseTimeToMinutes(`${startTime}:00`);
        const reqEnd = parseTimeToMinutes(`${endTime}:00`);

        const normalizeWeekday = (w?: string) => {
          if (!w) return w;
          const k = String(w).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
          const map: Record<string,string> = {
            'segunda':'monday','terca':'tuesday','quarta':'wednesday','quinta':'thursday','sexta':'friday','sabado':'saturday','domingo':'sunday',
            'monday':'monday','tuesday':'tuesday','wednesday':'wednesday','thursday':'thursday','friday':'friday','saturday':'saturday','sunday':'sunday'
          };
          return map[k] ?? k;
        };

        const reqWeekday = normalizeWeekday(weekday);

        for (const ex of exceptions || []) {
          if (!ex || !ex.date) continue;
          const exDate = new Date(ex.date + 'T00:00:00');
          if (isNaN(exDate.getTime())) continue;
          if (exDate < today || exDate > oneYearAhead) continue;
          if (ex.kind !== 'bloqueio') continue;

          const exWeekday = normalizeWeekday(exDate.toLocaleDateString('en-US', { weekday: 'long' }));
          if (exWeekday !== reqWeekday) continue;

          // whole-day block
          if (!ex.start_time && !ex.end_time) {
            setBlockedException({ date: ex.date, reason: ex.reason ?? undefined, times: undefined })
            setSubmitting(false);
            return;
          }

          const exStart = parseTimeToMinutes(ex.start_time ?? undefined);
          const exEnd = parseTimeToMinutes(ex.end_time ?? undefined);
          if (reqStart != null && reqEnd != null && exStart != null && exEnd != null) {
            if (reqStart < exEnd && exStart < reqEnd) {
              setBlockedException({ date: ex.date, reason: ex.reason ?? undefined, times: `${ex.start_time}–${ex.end_time}` })
              setSubmitting(false);
              return;
            }
          }
        }
      } catch (e) {
        // If checking exceptions fails, continue and let the API handle it. We
        // intentionally do not block the flow here because failure to fetch
        // exceptions shouldn't completely prevent admins from creating slots.
        console.warn('Falha ao verificar exceções antes da criação:', e);
      }

      if (mode === 'create') {
        const payload: DoctorAvailabilityCreate = {
          doctor_id: String(doctorId),
          weekday: weekday as any,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          slot_minutes: slotMinutes,
          appointment_type: appointmentType,
          active,
        }

  const saved = await criarDisponibilidade(payload)
        const labelMap: Record<string,string> = {
          'segunda':'Segunda','terca':'Terça','quarta':'Quarta','quinta':'Quinta','sexta':'Sexta','sabado':'Sábado','domingo':'Domingo',
          'monday':'Segunda','tuesday':'Terça','wednesday':'Quarta','thursday':'Quinta','friday':'Sexta','saturday':'Sábado','sunday':'Domingo'
        }
        const label = labelMap[weekday as string] ?? String(weekday)
        toast({ title: 'Disponibilidade criada', description: `${label} ${startTime}–${endTime}`, variant: 'default' })
        onSaved?.(saved)
        onOpenChange(false)
      } else {
        // edit mode: update existing availability
        if (!availability || !availability.id) {
          throw new Error('Disponibilidade inválida para edição')
        }
        const payload: DoctorAvailabilityUpdate = {
          weekday: weekday as any,
          start_time: `${startTime}:00`,
          end_time: `${endTime}:00`,
          slot_minutes: slotMinutes,
          appointment_type: appointmentType,
          active,
        }
        const updated = await atualizarDisponibilidade(String(availability.id), payload)
        const labelMap: Record<string,string> = {
          'segunda':'Segunda','terca':'Terça','quarta':'Quarta','quinta':'Quinta','sexta':'Sexta','sabado':'Sábado','domingo':'Domingo',
          'monday':'Segunda','tuesday':'Terça','wednesday':'Quarta','thursday':'Quinta','friday':'Sexta','saturday':'Sábado','sunday':'Domingo'
        }
        const label = labelMap[weekday as string] ?? String(weekday)
        toast({ title: 'Disponibilidade atualizada', description: `${label} ${startTime}–${endTime}`, variant: 'default' })
        onSaved?.(updated)
        onOpenChange(false)
      }
    } catch (err: any) {
      console.error('Erro ao criar disponibilidade:', err)
      toast({ title: 'Erro', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const be = blockedException

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Editar disponibilidade' : 'Criar disponibilidade'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dia da semana</Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v)} disabled={mode === 'edit'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda" disabled={usedWeekdays.has('segunda')}>Segunda</SelectItem>
                  <SelectItem value="terca" disabled={usedWeekdays.has('terca')}>Terça</SelectItem>
                  <SelectItem value="quarta" disabled={usedWeekdays.has('quarta')}>Quarta</SelectItem>
                  <SelectItem value="quinta" disabled={usedWeekdays.has('quinta')}>Quinta</SelectItem>
                  <SelectItem value="sexta" disabled={usedWeekdays.has('sexta')}>Sexta</SelectItem>
                  <SelectItem value="sabado" disabled={usedWeekdays.has('sabado')}>Sábado</SelectItem>
                  <SelectItem value="domingo" disabled={usedWeekdays.has('domingo')}>Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={appointmentType} onValueChange={(v) => setAppointmentType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="telemedicina">Telemedicina</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Início</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Fim</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <Label>Minutos por slot</Label>
              <Input type="number" value={String(slotMinutes)} onChange={(e) => setSlotMinutes(Number(e.target.value || 30))} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <span>Ativo</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : (mode === 'edit' ? 'Salvar alterações' : 'Criar disponibilidade')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    
    <AlertDialog open={!!be} onOpenChange={(open) => { if (!open) setBlockedException(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Data bloqueada</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="px-6 pb-6 pt-2">
          {be ? (
            <div className="space-y-2">
              <p>Não é possível criar disponibilidade para o dia <strong>{be!.date}</strong>.</p>
              {be!.times ? <p>Horário bloqueado: <strong>{be!.times}</strong></p> : null}
              {be!.reason ? <p>Motivo: <strong>{be!.reason}</strong></p> : null}
            </div>
          ) : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => setBlockedException(null)}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

export default AvailabilityForm
