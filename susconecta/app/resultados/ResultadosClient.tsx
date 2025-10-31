"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Filter,
  Globe,
  HeartPulse,
  Languages,
  MapPin,
  ShieldCheck,
  Star,
  Stethoscope,
  ChevronRight,
  UserRound
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buscarMedicos,
  getAvailableSlots,
  criarAgendamento,
  criarAgendamentoDireto,
  getUserInfo,
  buscarPacientes,
  listarDisponibilidades,
  listarExcecoes,
  type Medico,
} from '@/lib/api'

// ...existing code (tipagens locais de UI)...
type TipoConsulta = 'teleconsulta' | 'local'

// Utilidades de formatação/agenda
const shortWeek = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.']
const monthPt = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const fmtDay = (d: Date) => `${d.getDate()} ${monthPt[d.getMonth()]}`

type DayAgenda = { label: string; data: string; dateKey: string; horarios: Array<{ iso: string; label: string }> }

const especialidadesHero = ['Psicólogo', 'Médico clínico geral', 'Pediatra', 'Dentista', 'Ginecologista', 'Veja mais']

export default function ResultadosClient() {
  const params = useSearchParams()
  const router = useRouter()

  // Filtros/controles da UI
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>(
    params?.get('tipo') === 'presencial' ? 'local' : 'teleconsulta'
  )
  const [especialidadeHero, setEspecialidadeHero] = useState<string>(params?.get('especialidade') || 'Psicólogo')
  const [convenio, setConvenio] = useState<string>('Todos')
  const [bairro, setBairro] = useState<string>('Todos')

  // Estado dinâmico
  const [patientId, setPatientId] = useState<string | null>(null)
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [loadingMedicos, setLoadingMedicos] = useState(false)

  // agenda por médico e loading por médico
  const [agendaByDoctor, setAgendaByDoctor] = useState<Record<string, DayAgenda[]>>({})
  const [agendaLoading, setAgendaLoading] = useState<Record<string, boolean>>({})
  const [agendasExpandida, setAgendasExpandida] = useState<Record<string, boolean>>({})
  const [nearestSlotByDoctor, setNearestSlotByDoctor] = useState<Record<string, { iso: string; label: string } | null>>({})

  // "Mostrar mais horários" modal state
  const [moreTimesForDoctor, setMoreTimesForDoctor] = useState<string | null>(null)
  const [moreTimesDate, setMoreTimesDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [moreTimesLoading, setMoreTimesLoading] = useState(false)
  const [moreTimesSlots, setMoreTimesSlots] = useState<Array<{ iso: string; label: string }>>([])
  const [moreTimesException, setMoreTimesException] = useState<string | null>(null)

  // Seleção para o Dialog de perfil completo
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null)
  const [abaDetalhe, setAbaDetalhe] = useState('experiencia')

  // Confirmation dialog for booking: hold pending selection until user confirms
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAppointment, setPendingAppointment] = useState<{ doctorId: string; iso: string } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  // Fields editable in the confirmation dialog to be sent to the create endpoint
  const [confirmDuration, setConfirmDuration] = useState<number>(30)
  const [confirmInsurance, setConfirmInsurance] = useState<string>('')
  const [confirmChiefComplaint, setConfirmChiefComplaint] = useState<string>('')
  const [confirmPatientNotes, setConfirmPatientNotes] = useState<string>('')

  // Toast simples
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }
  // booking success modal (used when origin=paciente)
  const [bookingSuccessOpen, setBookingSuccessOpen] = useState(false)
  const [bookedWhenLabel, setBookedWhenLabel] = useState<string | null>(null)

  // 1) Obter patientId a partir do usuário autenticado (email -> patients)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const info = await getUserInfo().catch(() => null)
        const uid = info?.user?.id ?? null
        const email = info?.user?.email ?? null
        if (!email) return
        const results = await buscarPacientes(email).catch(() => [])
        // preferir linha com user_id igual ao auth id
        const row = (results || []).find((p: any) => String(p.user_id) === String(uid)) || results?.[0]
        if (row && mounted) setPatientId(String(row.id))
      } catch {
        // silencioso
      }
    })()
    return () => { mounted = false }
  }, [])

  // 2) Buscar médicos conforme especialidade selecionada
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingMedicos(true)
        setMedicos([])
        setAgendaByDoctor({})
        setAgendasExpandida({})
        // termo de busca: usar a especialidade escolhida (fallback para string genérica)
        const termo = (especialidadeHero && especialidadeHero !== 'Veja mais') ? especialidadeHero : (params?.get('q') || 'medico')
        const list = await buscarMedicos(termo).catch(() => [])
        if (!mounted) return
        setMedicos(Array.isArray(list) ? list : [])
      } catch (e: any) {
        showToast('error', e?.message || 'Falha ao buscar profissionais')
      } finally {
        if (mounted) setLoadingMedicos(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especialidadeHero])

  // 3) Carregar horários disponíveis para um médico (próximos 7 dias) e agrupar por dia
  async function loadAgenda(doctorId: string) {
    if (!doctorId) return
    if (agendaLoading[doctorId]) return
    setAgendaLoading((s) => ({ ...s, [doctorId]: true }))
    try {
      // janela de 7 dias
      const start = new Date(); start.setHours(0,0,0,0)
      const end = new Date(); end.setDate(end.getDate() + 7); end.setHours(23,59,59,999)
      const res = await getAvailableSlots({
        doctor_id: doctorId,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        appointment_type: tipoConsulta === 'local' ? 'presencial' : 'telemedicina',
      })

      // construir colunas: hoje, amanhã, +2 dias (4 colunas visíveis)
      const days: DayAgenda[] = []
      for (let i = 0; i < 4; i++) {
        const d = new Date(start); d.setDate(start.getDate() + i)
        const dateKey = d.toISOString().split('T')[0]
        const label = i === 0 ? 'HOJE' : i === 1 ? 'AMANHÃ' : shortWeek[d.getDay()]
        days.push({ label, data: fmtDay(d), dateKey, horarios: [] })
      }

      const onlyAvail = (res?.slots || []).filter(s => s.available)
      for (const s of onlyAvail) {
        const dt = new Date(s.datetime)
        const key = dt.toISOString().split('T')[0]
        const bucket = days.find(d => d.dateKey === key)
        if (!bucket) continue
        const label = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        bucket.horarios.push({ iso: s.datetime, label })
      }

      // ordenar horários em cada dia
      for (const d of days) {
        d.horarios.sort((a, b) => new Date(a.iso).getTime() - new Date(b.iso).getTime())
      }

      // compute nearest slot (earliest available in the returned window, but after now)
      let nearest: { iso: string; label: string } | null = null
      const nowMs = Date.now()
      const allSlots = days.flatMap(d => d.horarios || [])
      const futureSorted = allSlots
        .map(s => ({ ...s, ms: new Date(s.iso).getTime() }))
        .filter(s => s.ms >= nowMs)
        .sort((a,b) => a.ms - b.ms)
      if (futureSorted.length) {
        const s = futureSorted[0]
        nearest = { iso: s.iso, label: s.label }
      }

      setAgendaByDoctor((prev) => ({ ...prev, [doctorId]: days }))
      setNearestSlotByDoctor((prev) => ({ ...prev, [doctorId]: nearest }))
    } catch (e: any) {
      showToast('error', e?.message || 'Falha ao buscar horários')
    } finally {
      setAgendaLoading((s) => ({ ...s, [doctorId]: false }))
    }
  }

  // 4) Agendar ao clicar em um horário (performs the actual create call)
  async function agendar(doctorId: string, iso: string) {
    if (!patientId) {
      showToast('error', 'Paciente não identificado. Faça login novamente.')
      return
    }
    try {
      await criarAgendamento({
        patient_id: String(patientId),
        doctor_id: String(doctorId),
        scheduled_at: String(iso),
        duration_minutes: 30,
        appointment_type: (tipoConsulta === 'local' ? 'presencial' : 'telemedicina'),
      })
      showToast('success', 'Consulta agendada com sucesso!')
      // remover horário da lista local
      setAgendaByDoctor((prev) => {
        const days = prev[doctorId]
        if (!days) return prev
        const updated = days.map(d => ({ ...d, horarios: d.horarios.filter(h => h.iso !== iso) }))
        return { ...prev, [doctorId]: updated }
      })
    } catch (e: any) {
      showToast('error', e?.message || 'Falha ao agendar')
    }
  }

  // Open confirmation dialog for a selected slot instead of immediately booking
  function openConfirmDialog(doctorId: string, iso: string) {
    setPendingAppointment({ doctorId, iso })
    setConfirmOpen(true)
  }

  // Called when the user confirms the booking in the dialog
  async function confirmAndBook() {
    if (!pendingAppointment) return
    const { doctorId, iso } = pendingAppointment
    if (!patientId) {
      showToast('error', 'Paciente não identificado. Faça login novamente.')
      return
    }
    // Debug: indicate the handler was invoked
  console.debug('[ResultadosClient] confirmAndBook invoked', { doctorId, iso, patientId, confirmDuration, confirmInsurance })
  showToast('success', 'Iniciando agendamento...')
    setConfirmLoading(true)
      try {
      // Use direct POST to ensure creation even if availability checks would block
      await criarAgendamentoDireto({
        patient_id: String(patientId),
        doctor_id: String(doctorId),
        scheduled_at: String(iso),
        duration_minutes: Number(confirmDuration) || 30,
        appointment_type: (tipoConsulta === 'local' ? 'presencial' : 'telemedicina'),
        chief_complaint: confirmChiefComplaint || null,
        patient_notes: confirmPatientNotes || null,
        insurance_provider: confirmInsurance || null,
      })
      showToast('success', 'Consulta agendada com sucesso!')
      // remover horário da lista local
      setAgendaByDoctor((prev) => {
        const days = prev[doctorId]
        if (!days) return prev
        const updated = days.map(d => ({ ...d, horarios: d.horarios.filter(h => h.iso !== iso) }))
        return { ...prev, [doctorId]: updated }
      })
      setConfirmOpen(false)
      setPendingAppointment(null)
      // If the user came from the paciente area, keep them here and show a success modal
      const origin = params?.get('origin')
      if (origin === 'paciente') {
        try {
          const when = new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
          setBookedWhenLabel(when)
        } catch {
          setBookedWhenLabel(iso)
        }
        setBookingSuccessOpen(true)
      } else {
        // Navigate to agenda after a short delay so user sees the toast
        setTimeout(() => router.push('/agenda'), 500)
      }
    } catch (e: any) {
      showToast('error', e?.message || 'Falha ao agendar')
    } finally {
      setConfirmLoading(false)
    }
  }

  // Fetch slots for an arbitrary date using the same logic as CalendarRegistrationForm
  async function fetchSlotsForDate(doctorId: string, dateOnly: string) {
    if (!doctorId || !dateOnly) return []
    setMoreTimesLoading(true)
    setMoreTimesException(null)
    try {
      // Check for blocking exceptions (listarExcecoes can filter by date)
      const exceptions = await listarExcecoes({ doctorId: String(doctorId), date: String(dateOnly) }).catch(() => [])
      if (exceptions && exceptions.length) {
        const blocking = (exceptions || []).find((e: any) => e && e.kind === 'bloqueio')
        if (blocking) {
          const reason = blocking.reason ? ` Motivo: ${blocking.reason}` : ''
          setMoreTimesException(`Não é possível agendar nesta data.${reason}`)
          setMoreTimesSlots([])
          return []
        }
      }

      // Build local start/end for the day
      let start: Date
      let end: Date
      try {
        const parts = String(dateOnly).split('-').map((p) => Number(p))
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
          const [y, m, d] = parts
          start = new Date(y, m - 1, d, 0, 0, 0, 0)
          end = new Date(y, m - 1, d, 23, 59, 59, 999)
        } else {
          start = new Date(dateOnly)
          start.setHours(0,0,0,0)
          end = new Date(dateOnly)
          end.setHours(23,59,59,999)
        }
      } catch (err) {
        start = new Date(dateOnly)
        start.setHours(0,0,0,0)
        end = new Date(dateOnly)
        end.setHours(23,59,59,999)
      }

      const av = await getAvailableSlots({
        doctor_id: String(doctorId),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        appointment_type: tipoConsulta === 'local' ? 'presencial' : 'telemedicina',
      })

      // Try to restrict to public availability windows and synthesize missing slots
      try {
        const disponibilidades = await listarDisponibilidades({ doctorId: String(doctorId) }).catch(() => [])
        const weekdayNumber = start.getDay()
        const weekdayNames: Record<number, string[]> = {
          0: ['0','sun','sunday','domingo'],
          1: ['1','mon','monday','segunda','segunda-feira'],
          2: ['2','tue','tuesday','terca','terça','terça-feira'],
          3: ['3','wed','wednesday','quarta','quarta-feira'],
          4: ['4','thu','thursday','quinta','quinta-feira'],
          5: ['5','fri','friday','sexta','sexta-feira'],
          6: ['6','sat','saturday','sabado','sábado']
        }
        const allowed = (weekdayNames[weekdayNumber] || []).map(s => String(s).toLowerCase())
        const matched = (disponibilidades || []).filter((d: any) => {
          try {
            const raw = String(d.weekday ?? d.weekday_name ?? d.day ?? d.day_of_week ?? '').toLowerCase()
            if (!raw) return false
            if (allowed.includes(raw)) return true
            if (typeof d.weekday === 'number' && d.weekday === weekdayNumber) return true
            if (typeof d.day_of_week === 'number' && d.day_of_week === weekdayNumber) return true
            return false
          } catch (e) { return false }
        })

        if (matched && matched.length) {
          const windows = matched.map((d: any) => {
            const parseTime = (t?: string) => {
              if (!t) return { hh: 0, mm: 0, ss: 0 }
              const parts = String(t).split(':').map((p) => Number(p))
              return { hh: parts[0] || 0, mm: parts[1] || 0, ss: parts[2] || 0 }
            }
            const s = parseTime(d.start_time)
            const e2 = parseTime(d.end_time)
            const winStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), s.hh, s.mm, s.ss || 0, 0)
            const winEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), e2.hh, e2.mm, e2.ss || 0, 999)
            const slotMinutes = (() => { const n = Number(d.slot_minutes ?? d.slot_minutes_minutes ?? NaN); return Number.isFinite(n) ? n : undefined })()
            return { winStart, winEnd, slotMinutes }
          })

          // compute step based on backend slot diffs
          let stepMinutes = 30
          try {
            const times = (av.slots || []).map((s: any) => new Date(s.datetime).getTime()).sort((a:number,b:number)=>a-b)
            const diffs: number[] = []
            for (let i = 1; i < times.length; i++) {
              const d = Math.round((times[i] - times[i-1]) / 60000)
              if (d > 0) diffs.push(d)
            }
            if (diffs.length) stepMinutes = Math.min(...diffs)
          } catch(e) {}

          const generatedSet = new Set<string>()
          windows.forEach((w:any) => {
            try {
              const perWindowStep = Number(w.slotMinutes) || stepMinutes
              const startMs = w.winStart.getTime()
              const endMs = w.winEnd.getTime()
              const lastStartMs = endMs - perWindowStep * 60000
              const backendSlotsInWindow = (av.slots || []).filter((s:any) => {
                try {
                  const sd = new Date(s.datetime)
                  const sm = sd.getHours() * 60 + sd.getMinutes()
                  const wmStart = w.winStart.getHours() * 60 + w.winStart.getMinutes()
                  const wmEnd = w.winEnd.getHours() * 60 + w.winEnd.getMinutes()
                  return sm >= wmStart && sm <= wmEnd
                } catch(e) { return false }
              }).map((s:any) => new Date(s.datetime).getTime()).sort((a:number,b:number)=>a-b)

              if (!backendSlotsInWindow.length) {
                let cursorMs = startMs
                while (cursorMs <= lastStartMs) {
                  generatedSet.add(new Date(cursorMs).toISOString())
                  cursorMs += perWindowStep * 60000
                }
              } else {
                const lastBackendMs = backendSlotsInWindow[backendSlotsInWindow.length - 1]
                let cursorMs = lastBackendMs + perWindowStep * 60000
                while (cursorMs <= lastStartMs) {
                  generatedSet.add(new Date(cursorMs).toISOString())
                  cursorMs += perWindowStep * 60000
                }
              }
            } catch(e) {}
          })

          const mergedMap = new Map<string, { datetime: string; available: boolean; slot_minutes?: number }>()
          const findWindowSlotMinutes = (isoDt: string) => {
            try {
              const sd = new Date(isoDt)
              const sm = sd.getHours() * 60 + sd.getMinutes()
              const w = windows.find((win:any) => {
                const ws = win.winStart
                const we = win.winEnd
                const winStartMinutes = ws.getHours() * 60 + ws.getMinutes()
                const winEndMinutes = we.getHours() * 60 + we.getMinutes()
                return sm >= winStartMinutes && sm <= winEndMinutes
              })
              return w && w.slotMinutes ? Number(w.slotMinutes) : null
            } catch(e) { return null }
          }

          const existingInWindow: any[] = (av.slots || []).filter((s:any) => {
            try {
              const sd = new Date(s.datetime)
              const slotMinutes = sd.getHours() * 60 + sd.getMinutes()
              return windows.some((w:any) => {
                const ws = w.winStart
                const we = w.winEnd
                const winStartMinutes = ws.getHours() * 60 + ws.getMinutes()
                const winEndMinutes = we.getHours() * 60 + we.getMinutes()
                return slotMinutes >= winStartMinutes && slotMinutes <= winEndMinutes
              })
            } catch(e) { return false }
          })

          for (const s of (existingInWindow || [])) {
            const sm = findWindowSlotMinutes(s.datetime)
            mergedMap.set(s.datetime, sm ? { ...s, slot_minutes: sm } : { ...s })
          }
          Array.from(generatedSet).forEach((dt) => {
            if (!mergedMap.has(dt)) {
              const sm = findWindowSlotMinutes(dt) || stepMinutes
              mergedMap.set(dt, { datetime: dt, available: true, slot_minutes: sm })
            }
          })

          const merged = Array.from(mergedMap.values()).sort((a:any,b:any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
          const formatted = (merged || []).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
          setMoreTimesSlots(formatted)
          return formatted
        } else {
          const slots = (av.slots || []).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
          setMoreTimesSlots(slots)
          return slots
        }
      } catch (e) {
        console.warn('[ResultadosClient] erro ao filtrar por disponibilidades', e)
        const slots = (av.slots || []).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
        setMoreTimesSlots(slots)
        return slots
      }
    } catch (e) {
      console.warn('[ResultadosClient] falha ao carregar horários para data', e)
      setMoreTimesSlots([])
      setMoreTimesException('Falha ao buscar horários para a data selecionada')
      return []
    } finally {
      setMoreTimesLoading(false)
    }
  }

  // Filtro visual (convenio/bairro são cosméticos; quando sem dado, mantemos tudo)
  const profissionais = useMemo(() => {
    return (medicos || []).filter((m: any) => {
      if (convenio !== 'Todos' && m.convenios && !m.convenios.includes(convenio)) return false
      if (bairro !== 'Todos' && m.neighborhood && String(m.neighborhood).toLowerCase() !== String(bairro).toLowerCase()) return false
      return true
    })
  }, [medicos, convenio, bairro])

  // Render
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`} role="alert">
            {toast.msg}
          </div>
        )}

        {/* Confirmation dialog shown when a user selects a slot */}
        <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) { setConfirmOpen(false); setPendingAppointment(null); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar agendamento</DialogTitle>
            </DialogHeader>
            <div className="mt-2">
              {pendingAppointment ? (
                (() => {
                  const doc = medicos.find(m => String(m.id) === String(pendingAppointment.doctorId))
                  const doctorName = doc ? (doc.full_name || (doc as any).name || 'Profissional') : 'Profissional'
                  const when = (() => {
                    try { return new Date(pendingAppointment.iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }) } catch { return pendingAppointment.iso }
                  })()
                  return (
                    <div className="space-y-2">
                      <p>Profissional: <strong>{doctorName}</strong></p>
                      <p>Data / Hora: <strong>{when}</strong></p>
                      <p>Paciente: <strong>Você</strong></p>
                    </div>
                  )
                })()
              ) : (
                <p>Carregando informações...</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => { setConfirmOpen(false); setPendingAppointment(null); }}>Cancelar</Button>
              <Button onClick={confirmAndBook} disabled={confirmLoading}>{confirmLoading ? 'Agendando...' : 'Marcar consulta'}</Button>
            </div>
          </DialogContent>
        </Dialog>

          {/* Booking success modal shown when origin=paciente */}
          <Dialog open={bookingSuccessOpen} onOpenChange={(open) => setBookingSuccessOpen(open)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Consulta agendada</DialogTitle>
              </DialogHeader>
              <div className="mt-2">
                <p className="text-sm">Sua consulta foi agendada com sucesso{bookedWhenLabel ? ` para ${bookedWhenLabel}` : ''}.</p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" onClick={() => setBookingSuccessOpen(false)}>Fechar</Button>
              </div>
            </DialogContent>
          </Dialog>

        {/* Hero de filtros (mantido) */}
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Resultados da procura</h1>
              <p className="text-sm text-primary-foreground/80">Qual especialização você deseja?</p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:!bg-primary-foreground hover:!text-primary transition-colors"
            >
              Ajustar filtros
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {especialidadesHero.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setEspecialidadeHero(item)}
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-primary-foreground/80',
                  especialidadeHero === item ? 'bg-primary-foreground text-primary' : 'bg-primary-foreground/10'
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Barra de filtros secundários (mantida) */}
        <section className="sticky top-0 z-30 flex flex-wrap gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur">
          <Toggle
            pressed={tipoConsulta === 'teleconsulta'}
            onPressedChange={() => setTipoConsulta('teleconsulta')}
            className={cn('rounded-full px-4 py-[10px] text-sm font-medium transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.97]',
              tipoConsulta === 'teleconsulta' ? 'bg-primary text-primary-foreground' : 'border border-primary/40 text-primary')}
          >
            <Globe className="mr-2 h-4 w-4" />
            Teleconsulta
          </Toggle>
          <Toggle
            pressed={tipoConsulta === 'local'}
            onPressedChange={() => setTipoConsulta('local')}
            className={cn('rounded-full px-4 py-[10px] text-sm font-medium transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.97]',
              tipoConsulta === 'local' ? 'bg-primary text-primary-foreground' : 'border border-primary/40 text-primary')}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Consulta no local
          </Toggle>

          <Select value={convenio} onValueChange={setConvenio}>
            <SelectTrigger className="h-10 min-w-[180px] rounded-full border border-primary/40 bg-primary/10 text-primary transition duration-200 hover:!border-primary focus:ring-2 focus:ring-primary cursor-pointer">
              <SelectValue placeholder="Convênio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os convênios</SelectItem>
              <SelectItem value="Amil">Amil</SelectItem>
              <SelectItem value="Unimed">Unimed</SelectItem>
              <SelectItem value="SulAmérica">SulAmérica</SelectItem>
              <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
              <SelectItem value="Particular">Particular</SelectItem>
            </SelectContent>
          </Select>

          <Select value={bairro} onValueChange={setBairro}>
            <SelectTrigger className="h-10 min-w-[160px] rounded-full border border-primary/40 bg-primary/10 text-primary transition duration-200 hover:!border-primary focus:ring-2 focus:ring-primary cursor-pointer">
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os bairros</SelectItem>
              <SelectItem value="Centro">Centro</SelectItem>
              <SelectItem value="Jardins">Jardins</SelectItem>
              <SelectItem value="Farolândia">Farolândia</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="rounded-full border border-primary/40 bg-primary/10 text-primary hover:!bg-primary hover:!text-white transition-colors"
          >
            <Filter className="mr-2 h-4 w-4" />
            Mais filtros
          </Button>

          <Button
            variant="ghost"
            className="ml-auto rounded-full text-primary hover:!bg-primary hover:!text-white transition-colors"
            onClick={() => router.back()}
          >
            Voltar
            <ChevronRight className="ml-1 h-4 w-4 rotate-180" />
          </Button>
        </section>

        {/* Lista de profissionais */}
        <section className="space-y-4">
          {loadingMedicos && (
            <Card className="flex items-center justify-center border border-dashed border-border bg-card/60 p-12 text-muted-foreground">
              Buscando profissionais...
            </Card>
          )}

          {!loadingMedicos && profissionais.map((medico) => {
            const id = String(medico.id)
            const agenda = agendaByDoctor[id]
            const isLoadingAgenda = !!agendaLoading[id]
            const atendeLocal = true // dados ausentes → manter visual
            const atendeTele = true
            const nome = medico.full_name || 'Profissional'
            const esp = (medico as any).specialty || medico.especialidade || '—'
            const crm = [medico.crm, (medico as any).crm_uf].filter(Boolean).join(' / ')
            const convenios = '—'
            const endereco = [medico.street, medico.number].filter(Boolean).join(', ') || medico.street || '—'
            const cidade = [medico.city, medico.state].filter(Boolean).join(' • ')
            const precoLocal = '—'
            const precoTeleconsulta = '—'

            return (
              <Card
                key={id}
                className="flex flex-col gap-4 border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <Avatar className="h-14 w-14 border border-primary/20 bg-primary/5">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <UserRound className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-foreground">{nome}</h2>
                      <Badge className="rounded-full bg-primary/10 text-primary">{esp}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        {/* sem avaliação → travar layout */}
                        {'4.9'} • {'23'} avaliações
                      </span>
                      <span>{crm || '—'}</span>
                      <span>{convenios}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="ml-auto h-fit rounded-full text-primary hover:!bg-primary hover:!text-white transition-colors"
                    onClick={() => {
                      setMedicoSelecionado(medico)
                      setAbaDetalhe('experiencia')
                      // carregar agenda para o diálogo
                      if (!agendaByDoctor[id]) loadAgenda(id)
                    }}
                  >
                    Ver perfil completo
                  </Button>
                </div>

                {tipoConsulta === 'local' && atendeLocal && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {endereco}
                    </span>
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-muted-foreground">{cidade || '—'}</span>
                      <span className="text-sm font-semibold text-primary">{precoLocal}</span>
                    </div>
                  </div>
                )}

                {tipoConsulta === 'teleconsulta' && atendeTele && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-primary">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Globe className="h-4 w-4" />
                      Teleconsulta
                    </span>
                    <span className="text-sm font-semibold">{precoTeleconsulta}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                    <Languages className="h-3.5 w-3.5 text-primary" />
                    Idiomas: Português, Inglês
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                    <HeartPulse className="h-3.5 w-3.5 text-primary" />
                    Acolhimento em cada consulta
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Pagamento seguro
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                    <Stethoscope className="h-3.5 w-3.5 text-primary" />
                    Especialista recomendado
                  </span>
                </div>

                {/* Quick action: nearest available slot */}
                {nearestSlotByDoctor[id] && (
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Próximo horário:</span>
                    <Button className="h-9 rounded-full bg-primary/10 text-primary" onClick={() => openConfirmDialog(id, nearestSlotByDoctor[id]!.iso)}>
                      {nearestSlotByDoctor[id]!.label}
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    className="h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => { if (!agendaByDoctor[id]) loadAgenda(id) }}
                  >
                    Agendar consulta
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:!bg-primary hover:!text-white transition-colors">
                    Enviar mensagem
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 rounded-full text-primary hover:!bg-primary hover:!text-white transition-colors"
                    onClick={() => {
                      const willOpen = !agendasExpandida[id]
                      setAgendasExpandida(prev => ({ ...prev, [id]: !prev[id] }))
                      if (!agendaByDoctor[id]) loadAgenda(id)
                      // open the "more times" modal when expanding
                      if (willOpen) {
                        setMoreTimesForDoctor(id)
                        // prefetch for the default date
                        void fetchSlotsForDate(id, moreTimesDate)
                      } else {
                        setMoreTimesForDoctor(null)
                      }
                    }}
                  >
                    {agendasExpandida[id] ? 'Ocultar horários' : 'Mostrar mais horários'}
                  </Button>
                </div>

                {/* Agenda: 4 colunas como no layout. Se ainda não carregou, mostra placeholders. */}
                <div className="mt-4 overflow-x-auto">
                  <div className="grid min-w-[360px] grid-cols-4 gap-3">
                    {(agenda || [
                      { label: 'HOJE', data: fmtDay(new Date()), horarios: [] },
                      { label: 'AMANHÃ', data: fmtDay(new Date(Date.now()+86400000)), horarios: [] },
                      { label: shortWeek[new Date(Date.now()+2*86400000).getDay()], data: fmtDay(new Date(Date.now()+2*86400000)), horarios: [] },
                      { label: shortWeek[new Date(Date.now()+3*86400000).getDay()], data: fmtDay(new Date(Date.now()+3*86400000)), horarios: [] },
                    ]).map((col, idx) => {
                      const horarios = agendasExpandida[id] ? col.horarios : col.horarios.slice(0, 3)
                      return (
                        <div key={`${id}-${col.label}-${idx}`} className="rounded-2xl border border-border p-3 text-center">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{col.label}</p>
                          <p className="text-[10px] text-muted-foreground">{col.data}</p>
                          <div className="mt-3 flex flex-col gap-2">
                            {isLoadingAgenda && !agenda ? (
                              <span className="rounded-lg border border-dashed border-border px-2 py-3 text-[11px] text-muted-foreground">
                                Carregando...
                              </span>
                            ) : horarios.length ? (
                              horarios.map(h => (
                                <button
                                  key={h.iso}
                                  type="button"
                                  className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => openConfirmDialog(id, h.iso)}
                                >
                                  {h.label}
                                </button>
                              ))
                            ) : (
                              <span className="rounded-lg border border-dashed border-border px-2 py-3 text-[11px] text-muted-foreground">
                                Sem horários
                              </span>
                            )}
                            {!agendasExpandida[id] && (col.horarios.length > 3) && (
                              <span className="text-[10px] text-muted-foreground">+{col.horarios.length - 3} horários</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}

          {!loadingMedicos && !profissionais.length && (
            <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
              Nenhum profissional encontrado. Ajuste os filtros para ver outras opções.
            </Card>
          )}
        </section>

        {/* Dialog de perfil completo (mantido e adaptado) */}
        <Dialog open={!!medicoSelecionado} onOpenChange={open => !open && setMedicoSelecionado(null)}>
          <DialogContent className="max-h[90vh] max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-border bg-card p-0">
            {medicoSelecionado && (
              <>
                <DialogHeader className="border-b border-border px-6 py-4">
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    {medicoSelecionado.full_name || 'Profissional'}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {((medicoSelecionado as any).specialty || medicoSelecionado.especialidade || '—')}
                    { ' • ' }
                    {[medicoSelecionado.crm, (medicoSelecionado as any).crm_uf].filter(Boolean).join(' / ') || '—'}
                  </p>
                </DialogHeader>

                <div className="flex flex-col gap-6 px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      4.9 (23 avaliações)
                    </span>
                    <span>Planos de saúde: —</span>
                  </div>

                  <Tabs value={abaDetalhe} onValueChange={setAbaDetalhe} className="space-y-6">
                    <TabsList className="w-full justify-start rounded-full bg-muted/50 p-1 text-sm">
                      <TabsTrigger value="experiencia" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Experiência
                      </TabsTrigger>
                      <TabsTrigger value="planos" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Planos de saúde
                      </TabsTrigger>
                      <TabsTrigger value="consultorios" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Consultórios
                      </TabsTrigger>
                      <TabsTrigger value="servicos" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Serviços
                      </TabsTrigger>
                      <TabsTrigger value="opinioes" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Opiniões (0)
                      </TabsTrigger>
                      <TabsTrigger value="agenda" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary" onClick={() => loadAgenda(String(medicoSelecionado.id))}>
                        Agenda
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="experiencia" className="space-y-3 text-sm text-muted-foreground">
                      <p>Informações fornecidas pelo profissional.</p>
                    </TabsContent>

                    <TabsContent value="planos" className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1 text-xs font-medium text-primary">—</span>
                    </TabsContent>

                    <TabsContent value="consultorios" className="space-y-3 text-sm text-muted-foreground">
                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <p>Atendimento por teleconsulta ou endereço informado no card.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="servicos" className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-3">
                        <span>Consulta</span>
                        <span className="font-semibold text-primary">—</span>
                      </div>
                    </TabsContent>

                    <TabsContent value="opinioes" className="space-y-3">
                      <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                        <p>Nenhuma opinião disponível.</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Escolha o melhor horário disponível para sua consulta.
                      </p>
                      <div className="overflow-x-auto">
                        <div className="grid min-w-[420px] grid-cols-4 gap-3">
                          {(agendaByDoctor[String(medicoSelecionado.id)] || []).map((col, idx) => (
                            <div key={`${medicoSelecionado.id}-${col.label}-${idx}`} className="rounded-2xl border border-border bg-muted/30 p-3 text-center text-sm">
                              <p className="font-semibold text-foreground">{col.label}</p>
                              <p className="text-xs text-muted-foreground">{col.data}</p>
                              <div className="mt-3 flex flex-col gap-2">
                                {col.horarios.length ? (
                                  col.horarios.map(h => (
                                    <button
                                      key={h.iso}
                                      type="button"
                                      className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                                      onClick={() => openConfirmDialog(String(medicoSelecionado.id), h.iso)}
                                    >
                                      {h.label}
                                    </button>
                                  ))
                                ) : (
                                  <span className="rounded-lg border border-dashed border-border px-2 py-3 text-[11px] text-muted-foreground">
                                    Sem horários
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                          {!(agendaByDoctor[String(medicoSelecionado.id)] || []).length && (
                            <div className="col-span-4 text-center text-muted-foreground">Carregando horários...</div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        {/* Dialog: Mostrar mais horários (escolher data arbitrária) */}
        <Dialog open={!!moreTimesForDoctor} onOpenChange={(open) => { if (!open) { setMoreTimesForDoctor(null); setMoreTimesSlots([]); setMoreTimesException(null); } }}>
          <DialogContent className="w-full max-w-2xl border border-border bg-card p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Mais horários</DialogTitle>
            </DialogHeader>
            
            <div className="flex items-center gap-2 mb-4">
              <input type="date" className="flex-1 rounded-md border border-border px-3 py-2 text-sm" value={moreTimesDate} onChange={(e) => setMoreTimesDate(e.target.value)} />
              <Button className="h-10" onClick={async () => { if (moreTimesForDoctor) await fetchSlotsForDate(moreTimesForDoctor, moreTimesDate) }}>Buscar horários</Button>
            </div>

            <div className="mt-2">
              {moreTimesLoading ? (
                <div className="text-sm text-muted-foreground">Carregando horários...</div>
              ) : moreTimesException ? (
                <div className="text-sm text-red-500">{moreTimesException}</div>
              ) : (moreTimesSlots.length ? (
                <div className="grid grid-cols-3 gap-2">
                  {moreTimesSlots.map(s => (
                    <button key={s.iso} type="button" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => { if (moreTimesForDoctor) { openConfirmDialog(moreTimesForDoctor, s.iso); setMoreTimesForDoctor(null); } }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Sem horários para a data selecionada.</div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
