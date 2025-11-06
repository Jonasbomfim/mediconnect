"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const { toast } = useToast()

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
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao criar exceção:', err)
      toast({ title: 'Erro', description: err?.message || String(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar exceção</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? 'Salvando...' : 'Criar exceção'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
