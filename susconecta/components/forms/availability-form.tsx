"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarDisponibilidade, atualizarDisponibilidade, DoctorAvailabilityCreate, DoctorAvailability, DoctorAvailabilityUpdate } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface AvailabilityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorId?: string | null
  onSaved?: (saved: any) => void
  // when editing, pass the existing availability and set mode to 'edit'
  availability?: DoctorAvailability | null
  mode?: 'create' | 'edit'
}

export function AvailabilityForm({ open, onOpenChange, doctorId = null, onSaved, availability = null, mode = 'create' }: AvailabilityFormProps) {
  const [weekday, setWeekday] = useState<string>('segunda')
  const [startTime, setStartTime] = useState<string>('09:00')
  const [endTime, setEndTime] = useState<string>('17:00')
  const [slotMinutes, setSlotMinutes] = useState<number>(30)
  const [appointmentType, setAppointmentType] = useState<'presencial'|'telemedicina'>('presencial')
  const [active, setActive] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

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

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!doctorId) {
      toast({ title: 'Erro', description: 'ID do médico não informado', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar disponibilidade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Dia da semana</Label>
              <Select value={weekday} onValueChange={(v) => setWeekday(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segunda">Segunda</SelectItem>
                  <SelectItem value="terca">Terça</SelectItem>
                  <SelectItem value="quarta">Quarta</SelectItem>
                  <SelectItem value="quinta">Quinta</SelectItem>
                  <SelectItem value="sexta">Sexta</SelectItem>
                  <SelectItem value="sabado">Sábado</SelectItem>
                  <SelectItem value="domingo">Domingo</SelectItem>
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
            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Criar disponibilidade'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AvailabilityForm
