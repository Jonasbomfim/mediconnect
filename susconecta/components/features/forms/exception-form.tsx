"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Calendar } from 'lucide-react'
import { criarExcecao, DoctorExceptionCreate } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export interface ExceptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  doctorId?: string | null
  onSaved?: (saved: any) => void
}

export default function ExceptionForm({ open, onOpenChange, doctorId = null, onSaved }: ExceptionFormProps) {
  const [date, setDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [kind, setKind] = useState<'bloqueio'|'liberacao'>('bloqueio')
  const [reason, setReason] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const { toast } = useToast()

  // Resetar form quando dialog fecha
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDate('')
      setStartTime('')
      setEndTime('')
      setKind('bloqueio')
      setReason('')
      setShowDatePicker(false)
    }
    onOpenChange(newOpen)
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!doctorId) {
      toast({ title: 'Erro', description: 'ID do médico não informado', variant: 'destructive' })
      return
    }
    if (!date) {
      toast({ title: 'Erro', description: 'Data obrigatória', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const payload: DoctorExceptionCreate = {
        doctor_id: String(doctorId),
        date: String(date),
        start_time: startTime ? `${startTime}:00` : undefined,
        end_time: endTime ? `${endTime}:00` : undefined,
        kind,
        reason: reason || undefined,
      }

      const saved = await criarExcecao(payload)
      toast({ title: 'Exceção criada', description: `${payload.date} • ${kind}`, variant: 'default' })
      onSaved?.(saved)
      handleOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao criar exceção:', err)
      toast({ title: 'Erro', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar exceção</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-[13px]">Data *</Label>
              <button
                type="button"
                aria-label="Abrir seletor de data"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Input 
                type="text"
                placeholder="DD/MM/AAAA"
                className="h-11 w-full rounded-md pl-3 pr-3 text-[13px] transition-colors hover:bg-muted/30" 
                value={date ? (() => {
                  try {
                    const [y, m, d] = String(date).split('-');
                    return `${d}/${m}/${y}`;
                  } catch (e) {
                    return '';
                  }
                })() : ''} 
                readOnly
              />
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg p-3">
                  <CalendarComponent
                    mode="single"
                    selected={date ? (() => {
                      try {
                        // Parse como local date para compatibilidade com Calendar
                        const [y, m, d] = String(date).split('-').map(Number);
                        return new Date(y, m - 1, d);
                      } catch (e) {
                        return undefined;
                      }
                    })() : undefined}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        // Extrair data como local para evitar problemas de timezone
                        const y = selectedDate.getFullYear();
                        const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const d = String(selectedDate.getDate()).padStart(2, '0');
                        const dateStr = `${y}-${m}-${d}`;
                        console.log('[ExceptionForm] Data selecionada:', dateStr, 'de', selectedDate);
                        setDate(dateStr);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(checkDate) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return checkDate < today;
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início (opcional)</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>Fim (opcional)</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bloqueio">Bloqueio</SelectItem>
                <SelectItem value="liberacao">Liberação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo (opcional)</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Criar exceção'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
