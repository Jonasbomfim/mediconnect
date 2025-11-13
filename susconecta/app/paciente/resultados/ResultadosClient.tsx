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
  MapPin,
  Star,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buscarMedicos,
  getAvailableSlots,
  criarAgendamento,
  criarAgendamentoDireto,
  listarAgendamentos,
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

  // Filtros/controles da UI - initialize with defaults to avoid hydration mismatch
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>('teleconsulta')
  const [especialidadeHero, setEspecialidadeHero] = useState<string>('Psicólogo')
  const [bairro, setBairro] = useState<string>('Todos')
  // Busca por nome do médico
  const [searchQuery, setSearchQuery] = useState<string>('')
  // Filtro de médico específico vindo da URL (quando clicado no dashboard)
  const [medicoFiltro, setMedicoFiltro] = useState<string | null>(null)

  // Track if URL params have been synced to avoid race condition
  const [paramsSync, setParamsSync] = useState(false)

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

  // 1) Sincronize URL params with state after client mount (prevent hydration mismatch)
  useEffect(() => {
    if (!params) return
    const tipoParam = params.get('tipo')
    if (tipoParam === 'presencial') setTipoConsulta('local')
    
    const especialidadeParam = params.get('especialidade')
    if (especialidadeParam) setEspecialidadeHero(especialidadeParam)
    
    // Ler filtro de médico específico da URL
    const medicoParam = params.get('medico')
    if (medicoParam) setMedicoFiltro(medicoParam)
    
    // Mark params as synced
    setParamsSync(true)
  }, [params])

  // 2) Fetch patient ID from auth
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

  // 3) Initial doctors fetch on mount (one-time initialization)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoadingMedicos(true)
        console.log('[ResultadosClient] Initial doctors fetch starting')
        const list = await buscarMedicos('').catch((err) => {
          console.error('[ResultadosClient] Initial fetch error:', err)
          return []
        })
        if (!mounted) return
        console.log('[ResultadosClient] Initial fetch completed, got:', list?.length || 0, 'doctors')
        setMedicos(Array.isArray(list) ? list : [])
      } finally {
        if (mounted) setLoadingMedicos(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // 4) Re-fetch doctors when especialidade changes (after initial sync)
  // SKIP this if medicoFiltro está definido (médico específico selecionado)
  useEffect(() => {
    // Skip if this is the initial render or if user is searching by name or if a specific doctor is selected
    if (!paramsSync || medicoFiltro || (searchQuery && String(searchQuery).trim().length > 1)) return

    let mounted = true
    ;(async () => {
      try {
        setLoadingMedicos(true)
        setMedicos([])
        setAgendaByDoctor({})
        setAgendasExpandida({})
        // termo de busca: usar a especialidade escolhida
        const termo = (especialidadeHero && especialidadeHero !== 'Veja mais') ? especialidadeHero : ''
        console.log('[ResultadosClient] Fetching doctors with term:', termo)
        const list = await buscarMedicos(termo).catch((err) => {
          console.error('[ResultadosClient] buscarMedicos error:', err)
          return []
        })
        if (!mounted) return
        console.log('[ResultadosClient] Doctors fetched:', list?.length || 0)
        setMedicos(Array.isArray(list) ? list : [])
      } catch (e: any) {
        showToast('error', e?.message || 'Falha ao buscar profissionais')
      } finally {
        if (mounted) setLoadingMedicos(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especialidadeHero, paramsSync, medicoFiltro])

  // 5) Debounced search by doctor name
  // SKIP this if medicoFiltro está definido
  useEffect(() => {
    if (medicoFiltro) return // Skip se médico específico foi selecionado
    
    let mounted = true
    const term = String(searchQuery || '').trim()
    const handle = setTimeout(async () => {
      if (!mounted) return
      // if no meaningful search, do nothing (the specialidade effect will run)
      if (!term || term.length < 2) return
      try {
        setLoadingMedicos(true)
        setMedicos([])
        setAgendaByDoctor({})
        setAgendasExpandida({})
        const list = await buscarMedicos(term).catch(() => [])
        if (!mounted) return
        setMedicos(Array.isArray(list) ? list : [])
      } catch (e: any) {
        showToast('error', e?.message || 'Falha ao buscar profissionais')
      } finally {
        if (mounted) setLoadingMedicos(false)
      }
    }, 350)
    return () => { mounted = false; clearTimeout(handle) }
  }, [searchQuery, medicoFiltro])

  // 5b) Quando um médico específico é selecionado, fazer uma busca por ele (PRIORIDADE MÁXIMA)
  useEffect(() => {
    if (!medicoFiltro || !paramsSync) return
    
    let mounted = true
    ;(async () => {
      try {
        setLoadingMedicos(true)
        // Resetar agenda e expandidas quando mudar o médico
        setAgendaByDoctor({})
        setAgendasExpandida({})
        console.log('[ResultadosClient] Buscando médico específico:', medicoFiltro)
        // Tentar buscar pelo nome do médico
        const list = await buscarMedicos(medicoFiltro).catch(() => [])
        if (!mounted) return
        console.log('[ResultadosClient] Médicos encontrados:', list?.length || 0)
        setMedicos(Array.isArray(list) ? list : [])
      } catch (e: any) {
        console.warn('[ResultadosClient] Erro ao buscar médico:', e)
        showToast('error', e?.message || 'Falha ao buscar profissional')
      } finally {
        if (mounted) setLoadingMedicos(false)
      }
    })()
    
    return () => { mounted = false }
  }, [medicoFiltro, paramsSync])

  // 3) Carregar horários disponíveis para um médico (próximos 7 dias) e agrupar por dia
  async function loadAgenda(doctorId: string): Promise<{ iso: string; label: string } | null> {
  if (!doctorId) return null
  if (agendaLoading[doctorId]) return null
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

      const onlyAvail = (res?.slots || []).filter((s: any) => s.available)
      const nowMs = Date.now()
      for (const s of onlyAvail) {
        const dt = new Date(s.datetime)
        const dtMs = dt.getTime()
        // Filtrar: só mostrar horários que são posteriores ao horário atual
        if (dtMs < nowMs) continue
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
  return nearest
    } catch (e: any) {
      showToast('error', e?.message || 'Falha ao buscar horários')
      return null
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
  async function openConfirmDialog(doctorId: string, iso: string) {
    // Pre-check: ensure there is no existing appointment for this doctor at this exact datetime
    try {
      // build query: exact match on doctor_id and scheduled_at
      const params = new URLSearchParams();
      params.set('doctor_id', `eq.${String(doctorId)}`);
      params.set('scheduled_at', `eq.${String(iso)}`);
      params.set('limit', '1');
      const existing = await listarAgendamentos(params.toString()).catch(() => [])
      if (existing && (existing as any).length) {
        showToast('error', 'Não é possível agendar: já existe uma consulta neste horário para o profissional selecionado.')
        return
      }
    } catch (err) {
      // If checking fails (auth or network), surface a friendly error and avoid opening the dialog to prevent accidental duplicates.
      console.warn('[ResultadosClient] falha ao checar conflitos de agendamento', err)
      showToast('error', 'Não foi possível verificar disponibilidade. Tente novamente em instantes.')
      return
    }

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
      // Final conflict check to avoid race conditions: query appointments for same doctor + scheduled_at
      try {
        const params = new URLSearchParams();
        params.set('doctor_id', `eq.${String(doctorId)}`);
        params.set('scheduled_at', `eq.${String(iso)}`);
        params.set('limit', '1');
        const existing = await listarAgendamentos(params.toString()).catch(() => [])
        if (existing && (existing as any).length) {
          showToast('error', 'Não é possível agendar: já existe uma consulta neste horário para o profissional selecionado.')
          setConfirmLoading(false)
          return
        }
      } catch (err) {
        console.warn('[ResultadosClient] falha ao checar conflito antes de criar agendamento', err)
        showToast('error', 'Falha ao verificar conflito de agendamento. Tente novamente.')
        setConfirmLoading(false)
        return
      }
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
        const parts = String(dateOnly).split('-').map(Number)
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
        const allowed = new Set((weekdayNames[weekdayNumber] || []).map(s => String(s).toLowerCase()))
        const matched = (disponibilidades || []).filter((d: any) => {
          try {
            const raw = String(d.weekday ?? d.weekday_name ?? d.day ?? d.day_of_week ?? '').toLowerCase()
            if (!raw) return false
            if (allowed.has(raw)) return true
            if (typeof d.weekday === 'number' && d.weekday === weekdayNumber) return true
            if (typeof d.day_of_week === 'number' && d.day_of_week === weekdayNumber) return true
            return false
          } catch (e) { return false }
        })

        if (matched && matched.length) {
          const windows = matched.map((d: any) => {
            const parseTime = (t?: string) => {
              if (!t) return { hh: 0, mm: 0, ss: 0 }
              const parts = String(t).split(':').map(Number)
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
                const lastBackendMs = backendSlotsInWindow.at(-1)
                let cursorMs = (lastBackendMs ?? 0) + perWindowStep * 60000
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
          const nowMs = Date.now()
          // Filtrar: só mostrar horários que são posteriores ao horário atual
          const futureOnly = merged.filter((s: any) => new Date(s.datetime).getTime() >= nowMs)
          const formatted = (futureOnly || []).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
          setMoreTimesSlots(formatted)
          return formatted
        } else {
          const nowMs = Date.now()
          // Filtrar: só mostrar horários que são posteriores ao horário atual
          const slots = (av.slots || []).filter((s:any) => new Date(s.datetime).getTime() >= nowMs).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
          setMoreTimesSlots(slots)
          return slots
        }
      } catch (e) {
        console.warn('[ResultadosClient] erro ao filtrar por disponibilidades', e)
        const nowMs = Date.now()
        // Filtrar: só mostrar horários que são posteriores ao horário atual
        const slots = (av.slots || []).filter((s:any) => new Date(s.datetime).getTime() >= nowMs).map((s:any) => ({ iso: s.datetime, label: new Date(s.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }))
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

  // Extrair bairros únicos dos médicos
  const bairrosDisponiveis = useMemo(() => {
    const neighborhoods = new Set<string>();
    (medicos || []).forEach((m: any) => {
      if (m.neighborhood) {
        neighborhoods.add(String(m.neighborhood))
      }
    })
    return Array.from(neighborhoods).sort()
  }, [medicos])

  // Filtro visual (bairro é o único filtro; quando sem dado, mantemos tudo)
  const profissionais = useMemo(() => {
    let filtered = (medicos || []).filter((m: any) => {
      // Se um bairro específico foi selecionado, filtrar rigorosamente
      if (bairro !== 'Todos') {
        // Se o médico não tem neighborhood, não incluir
        if (!m.neighborhood) return false
        // Se tem neighborhood, deve corresponder ao filtro
        if (String(m.neighborhood).toLowerCase() !== String(bairro).toLowerCase()) return false
      }
      return true
    })
    
    // Se um médico específico foi selecionado no dashboard, filtrar apenas por ele
    if (medicoFiltro) {
      filtered = filtered.filter((m: any) => {
        // Comparar nome completo com flexibilidade
        const nomeMedico = String(m.full_name || m.name || '').toLowerCase()
        const filtro = String(medicoFiltro).toLowerCase()
        return nomeMedico.includes(filtro) || filtro.includes(nomeMedico.split(' ')[0]) // comparar por primeiro nome também
      })
    }
    
    return filtered
  }, [medicos, bairro, medicoFiltro])

  // Paginação local para a lista de médicos
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Resetar para página 1 quando o conjunto de profissionais (filtro) ou itemsPerPage mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [profissionais, itemsPerPage])
  const totalPages = Math.max(1, Math.ceil((profissionais || []).length / itemsPerPage))
  const paginatedProfissionais = (profissionais || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const startItem = (profissionais || []).length ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = Math.min(currentPage * itemsPerPage, (profissionais || []).length)

  // Memoized map para calcular próximos 3 horários para cada médico
  const proximosHorariosPorMedico = useMemo(() => {
    const result: Record<string, Array<{ iso: string; label: string }>> = {}
    for (const id in agendaByDoctor) {
      const slots = agendaByDoctor[id]?.flatMap(d => d.horarios) || []
      result[id] = slots.slice(0, 3)
    }
    return result
  }, [agendaByDoctor])

  // Render
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:py-10 md:px-8">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`} role="alert">
            {toast.msg}
          </div>
        )}

        {/* Confirmation dialog shown when a user selects a slot */}
        <Dialog open={confirmOpen} onOpenChange={(open: boolean) => { if (!open) { setConfirmOpen(false); setPendingAppointment(null); } }}>
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
          <Dialog open={bookingSuccessOpen} onOpenChange={(open: boolean) => setBookingSuccessOpen(open)}>
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
          </Dialog>        {/* Hero section com barra de busca */}
        <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-6 sm:p-8 text-primary-foreground shadow-lg">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Encontre o profissional ideal</h1>
              <p className="text-sm sm:text-base text-primary-foreground/90 mt-1">Busque por nome, especialidade ou disponibilidade</p>
            </div>

            {/* Barra de busca principal */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder={especialidadeHero && especialidadeHero !== 'Veja mais' ? especialidadeHero : 'Buscar médico por nome ou especialidade'}
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="flex-1 h-11 rounded-full bg-primary-foreground/15 border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/60 focus:bg-primary-foreground/20"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  className="h-11 px-6 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={async () => {
                    setSearchQuery('')
                    setCurrentPage(1)
                    try {
                      setLoadingMedicos(true)
                      setMedicos([])
                      setAgendaByDoctor({})
                      setAgendasExpandida({})
                      // Manter a especialidade da URL se existir
                      const termo = (especialidadeHero && especialidadeHero !== 'Veja mais') ? especialidadeHero : (params?.get('q') || 'medico')
                      const list = await buscarMedicos(termo).catch(() => [])
                      setMedicos(Array.isArray(list) ? list : [])
                    } catch (e: any) {
                      showToast('error', e?.message || 'Falha ao buscar profissionais')
                    } finally {
                      setLoadingMedicos(false)
                    }
                  }}
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Barra de filtros secundários (agora fluída, sem sticky) */}
        <section className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 shadow-md backdrop-blur">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Segmented control: tipo da consulta */}
            <div className="sm:col-span-12">
              <div className="flex w-full overflow-hidden rounded-full border border-primary/25 bg-primary/5 shadow-sm ring-1 ring-primary/10">
                <Toggle
                  pressed={tipoConsulta === 'teleconsulta'}
                  onPressedChange={() => setTipoConsulta('teleconsulta')}
                  className="flex-1 rounded-none first:rounded-l-full px-4 py-2.5 text-sm font-medium transition data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-primary/10"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  Teleconsulta
                </Toggle>
                <Toggle
                  pressed={tipoConsulta === 'local'}
                  onPressedChange={() => setTipoConsulta('local')}
                  className="flex-1 rounded-none last:rounded-r-full px-4 py-2.5 text-sm font-medium transition data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-primary/10"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Consulta no local
                </Toggle>
              </div>
            </div>

            {/* divider visual */}
            <div className="sm:col-span-12 h-px bg-border/60 my-1" />

            {/* Bairro */}
            <div className="sm:col-span-6 lg:col-span-4">
              <Select value={bairro} onValueChange={setBairro}>
                <SelectTrigger className="h-10 w-full rounded-full border border-primary/30 bg-primary/5 text-primary hover:border-primary focus:ring-2 focus:ring-primary">
                  <SelectValue placeholder="Bairro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos os bairros</SelectItem>
                  {bairrosDisponiveis.map((b: string) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mais filtros / Voltar */}
            <div className="sm:col-span-4">
              <Button
                variant="outline"
                className="h-10 w-full rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Filter className="mr-2 h-4 w-4" />
                Mais filtros
              </Button>
            </div>

            {/* Voltar */}
            <div className="sm:col-span-12">
              <Button
                variant="ghost"
                className="w-full rounded-full text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => router.back()}
              >
                Voltar
                <ChevronRight className="ml-1 h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
        </section>

        {/* Lista de profissionais */}
        <section className="space-y-4">
          {loadingMedicos && (
            <Card className="flex items-center justify-center border border-dashed border-border bg-card/60 p-12 text-muted-foreground">
              Buscando profissionais...
            </Card>
          )}          {!loadingMedicos && paginatedProfissionais.map((medico) => {
            const id = String(medico.id)
            const agenda = agendaByDoctor[id]
            const isLoadingAgenda = !!agendaLoading[id]
            const atendeLocal = true
            const atendeTele = true
            const nome = medico.full_name || 'Profissional'
            const esp = (medico as any).specialty || medico.especialidade || '—'
            const crm = [medico.crm, (medico as any).crm_uf].filter(Boolean).join(' ')
            const endereco = [medico.street, medico.number].filter(Boolean).join(', ') || medico.street || '—'
            const cidade = medico.city || '—'
            const precoTipoConsulta = tipoConsulta === 'local' ? 'R$ —' : 'R$ —'
            
            // Usar os próximos 3 horários já memoizados
            const proximos3Horarios = proximosHorariosPorMedico[id] || []

            return (
              <Card
                key={id}
                className="flex flex-col gap-4 border border-border bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Header com Avatar, Nome, Especialidade e Botão Ver Perfil */}
                <div className="flex gap-4 items-start">
                  <Avatar className="h-20 w-20 border-2 border-primary/20 bg-primary/5 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">{nome}</h2>
                        <p className="text-sm text-primary font-medium">{esp}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10"
                        onClick={() => {
                          setMedicoSelecionado(medico)
                          setAbaDetalhe('experiencia')
                          if (!agendaByDoctor[id]) loadAgenda(id)
                        }}
                      >
                        Mais
                      </Button>
                    </div>
                    
                    {/* Rating e Info */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-medium text-primary">4.9</span>
                        <span className="text-xs text-muted-foreground">• 23 avaliações</span>
                      </div>
                    </div>

                    {/* CRM */}
                    <p className="text-xs text-muted-foreground">CRM: {crm || '—'}</p>
                  </div>
                </div>

                {/* Endereço */}
                {tipoConsulta === 'local' && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-foreground">{endereco}</p>
                      <p className="text-xs text-muted-foreground">{cidade}</p>
                    </div>
                  </div>
                )}

                {/* Tipo de Consulta */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/20 bg-primary/5">
                  {tipoConsulta === 'teleconsulta' ? (
                    <>
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Teleconsulta</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Consulta presencial</span>
                    </>
                  )}
                  <span className="ml-auto text-sm font-semibold text-primary">{precoTipoConsulta}</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={async () => {
                      setMoreTimesForDoctor(id)
                      void fetchSlotsForDate(id, moreTimesDate)
                    }}
                  >
                    Agendar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-full border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => {
                      setMoreTimesForDoctor(id)
                      void fetchSlotsForDate(id, moreTimesDate)
                    }}
                  >
                    Mais horários
                  </Button>
                </div>
              </Card>
            )
          })}

          {!loadingMedicos && !profissionais.length && (
            <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
              Nenhum profissional encontrado. Ajuste os filtros para ver outras opções.
            </Card>
          )}

          {/* Pagination controls */}
          {!loadingMedicos && profissionais.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-muted-foreground w-full sm:w-auto">
                <span>Itens por página:</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="h-9 w-full sm:w-28 min-w-[110px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Itens" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>Mostrando {startItem} a {endItem} de {profissionais.length}</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="hover:bg-primary! hover:text-white!">Primeira</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="hover:bg-primary! hover:text-white!">Anterior</Button>
                <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hover:bg-primary! hover:text-white!">Próxima</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="hover:bg-primary! hover:text-white!">Última</Button>
              </div>
            </div>
          )}
        </section>

        {/* Dialog de perfil completo (mantido e adaptado) */}
        <Dialog open={!!medicoSelecionado} onOpenChange={(open: boolean) => !open && setMedicoSelecionado(null)}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto border border-border bg-card p-0 sm:rounded-lg">
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

        {/* Dialog: Mostrar mais horários */}
        <Dialog open={!!moreTimesForDoctor} onOpenChange={(open: boolean) => { if (!open) { setMoreTimesForDoctor(null); setMoreTimesSlots([]); setMoreTimesException(null); } }}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl border border-border bg-card p-4 sm:p-6">
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
