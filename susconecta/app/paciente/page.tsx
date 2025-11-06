'use client'

import type { ReactNode } from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LogOut, Calendar, FileText, MessageCircle, UserCog, Home, Clock, FolderOpen, ChevronLeft, ChevronRight, MapPin, Stethoscope } from 'lucide-react'
import { SimpleThemeToggle } from '@/components/ui/simple-theme-toggle'
import { UploadAvatar } from '@/components/ui/upload-avatar'
import Link from 'next/link'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buscarPacientes, buscarPacientePorUserId, getUserInfo, listarAgendamentos, buscarMedicosPorIds, buscarMedicos, atualizarPaciente, buscarPacientePorId, getDoctorById } from '@/lib/api'
import { buscarRelatorioPorId, listarRelatoriosPorMedico } from '@/lib/reports'
import { ENV_CONFIG } from '@/lib/env-config'
import { listarRelatoriosPorPaciente } from '@/lib/reports'
// reports are rendered statically for now
// Simulação de internacionalização básica
const strings = {
  dashboard: 'Dashboard',
  consultas: 'Consultas',
  exames: 'Exames & Laudos',
  mensagens: 'Mensagens',
  perfil: 'Perfil',
  sair: 'Sair',
  proximaConsulta: 'Próxima Consulta',
  ultimosExames: 'Últimos Exames',
  mensagensNaoLidas: 'Mensagens Não Lidas',
  agendar: 'Agendar',
  reagendar: 'Reagendar',
  cancelar: 'Cancelar',
  detalhes: 'Detalhes',
  adicionarCalendario: 'Adicionar ao calendário',
  visualizarLaudo: 'Visualizar Laudo',
  download: 'Download',
  compartilhar: 'Compartilhar',
  inbox: 'Caixa de Entrada',
  enviarMensagem: 'Enviar Mensagem',
  salvar: 'Salvar',
  editarPerfil: 'Editar Perfil',
  consentimentos: 'Consentimentos',
  notificacoes: 'Preferências de Notificação',
  vazio: 'Nenhum dado encontrado.',
  erro: 'Ocorreu um erro. Tente novamente.',
  carregando: 'Carregando...',
  sucesso: 'Salvo com sucesso!',
  erroSalvar: 'Erro ao salvar.',
}

export default function PacientePage() {
  const { logout, user } = useAuth()
  const [tab, setTab] = useState<'dashboard'|'consultas'|'exames'|'perfil'>('dashboard')

  // Simulação de loaders, empty states e erro
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{type: 'success'|'error', msg: string}|null>(null)

  const handleLogout = async () => {
    setLoading(true)
    setError('')
    try {
      await logout()
    } catch {
      setError(strings.erro)
    } finally {
      setLoading(false)
    }
  }

  // Estado para edição do perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState<any>({
    nome: '',
    email: user?.email || '',
    telefone: '',
    endereco: '',
    cidade: '',
    cep: '',
    biografia: '',
    id: undefined,
    foto_url: undefined,
  })
  const [patientId, setPatientId] = useState<string | null>(null)

  // Load authoritative patient row for the logged-in user (prefer user_id lookup)
  useEffect(() => {
    let mounted = true
    const uid = user?.id ?? null
    const uemail = user?.email ?? null
    if (!uid && !uemail) return

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')

        // 1) exact lookup by user_id on patients table
        let paciente: any = null
        if (uid) paciente = await buscarPacientePorUserId(uid)

        // 2) fallback: search patients by email and prefer a row that has user_id equal to auth id
        if (!paciente && uemail) {
          try {
            const results = await buscarPacientes(uemail)
            if (results && results.length) {
              paciente = results.find((r: any) => String(r.user_id) === String(uid)) || results[0]
            }
          } catch (e) {
            console.warn('[PacientePage] buscarPacientes falhou', e)
          }
        }

        // 3) fallback: use getUserInfo() (auth profile) if available
        if (!paciente) {
          try {
            const info = await getUserInfo().catch(() => null)
            const p = info?.profile ?? null
            if (p) {
              // map auth profile to our local shape (best-effort)
              paciente = {
                full_name: p.full_name ?? undefined,
                email: p.email ?? undefined,
                phone_mobile: p.phone ?? undefined,
              }
            }
          } catch (e) {
            // ignore
          }
        }

        if (paciente && mounted) {
          try { if ((paciente as any).id) setPatientId(String((paciente as any).id)) } catch {}
          const getFirst = (obj: any, keys: string[]) => {
            if (!obj) return undefined
            for (const k of keys) {
              const v = obj[k]
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
            }
            return undefined
          }

          const nome = getFirst(paciente, ['full_name','fullName','name','nome','social_name']) || ''
          const telefone = getFirst(paciente, ['phone_mobile','phone','telefone','mobile']) || ''
          const rua = getFirst(paciente, ['street','logradouro','endereco','address'])
          const numero = getFirst(paciente, ['number','numero'])
          const bairro = getFirst(paciente, ['neighborhood','bairro'])
          const endereco = rua ? (numero ? `${rua}, ${numero}` : rua) + (bairro ? ` - ${bairro}` : '') : ''
          const cidade = getFirst(paciente, ['city','cidade','localidade']) || ''
          const cep = getFirst(paciente, ['cep','postal_code','zip']) || ''
          const biografia = getFirst(paciente, ['biography','bio','notes']) || ''
          const emailFromRow = getFirst(paciente, ['email']) || uemail || ''

          if (process.env.NODE_ENV !== 'production') console.debug('[PacientePage] paciente row', paciente)

          setProfileData({ nome, email: emailFromRow, telefone, endereco, cidade, cep, biografia })
        }
      } catch (err) {
        console.warn('[PacientePage] erro ao carregar paciente', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [user?.id, user?.email])

  // Load authoritative patient row for the logged-in user (prefer user_id lookup)
  useEffect(() => {
    let mounted = true
    const uid = user?.id ?? null
    const uemail = user?.email ?? null
    if (!uid && !uemail) return

    async function loadProfile() {
      try {
        setLoading(true)
        setError('')

        let paciente: any = null
        if (uid) paciente = await buscarPacientePorUserId(uid)

        if (!paciente && uemail) {
          try {
            const res = await buscarPacientes(uemail)
            if (res && res.length) paciente = res.find((r:any) => String((r as any).user_id) === String(uid)) || res[0]
          } catch (e) {
            console.warn('[PacientePage] busca por email falhou', e)
          }
        }

        if (paciente && mounted) {
          try { if ((paciente as any).id) setPatientId(String((paciente as any).id)) } catch {}
          const getFirst = (obj: any, keys: string[]) => {
            if (!obj) return undefined
            for (const k of keys) {
              const v = obj[k]
              if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
            }
            return undefined
          }

          const nome = getFirst(paciente, ['full_name','fullName','name','nome','social_name']) || profileData.nome
          const telefone = getFirst(paciente, ['phone_mobile','phone','telefone','mobile']) || profileData.telefone
          const rua = getFirst(paciente, ['street','logradouro','endereco','address'])
          const numero = getFirst(paciente, ['number','numero'])
          const bairro = getFirst(paciente, ['neighborhood','bairro'])
          const endereco = rua ? (numero ? `${rua}, ${numero}` : rua) + (bairro ? ` - ${bairro}` : '') : profileData.endereco
          const cidade = getFirst(paciente, ['city','cidade','localidade']) || profileData.cidade
          const cep = getFirst(paciente, ['cep','postal_code','zip']) || profileData.cep
          const biografia = getFirst(paciente, ['biography','bio','notes']) || profileData.biografia || ''
          const emailFromRow = getFirst(paciente, ['email']) || user?.email || profileData.email

          if (process.env.NODE_ENV !== 'production') console.debug('[PacientePage] paciente row', paciente)

          setProfileData((prev: any) => ({ ...prev, nome, email: emailFromRow, telefone, endereco, cidade, cep, biografia }))
        }
      } catch (err) {
        console.warn('[PacientePage] erro ao carregar paciente', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email])

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }))
  }
  const handleSaveProfile = async () => {
    if (!patientId) {
      setToast({ type: 'error', msg: 'Paciente não identificado. Não foi possível salvar.' })
      setIsEditingProfile(false)
      return
    }
    setLoading(true)
    try {
      const payload: any = {}
      if (profileData.email) payload.email = profileData.email
      if (profileData.telefone) payload.phone_mobile = profileData.telefone
      if (profileData.endereco) payload.street = profileData.endereco
      if (profileData.cidade) payload.city = profileData.cidade
      if (profileData.cep) payload.cep = profileData.cep
      if (profileData.biografia) payload.notes = profileData.biografia

      await atualizarPaciente(String(patientId), payload)

      // refresh patient row
      const refreshed = await buscarPacientePorId(String(patientId)).catch(() => null)
      if (refreshed) {
        const getFirst = (obj: any, keys: string[]) => {
          if (!obj) return undefined
          for (const k of keys) {
            const v = obj[k]
            if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
          }
          return undefined
        }
        const nome = getFirst(refreshed, ['full_name','fullName','name','nome','social_name']) || profileData.nome
        const telefone = getFirst(refreshed, ['phone_mobile','phone','telefone','mobile']) || profileData.telefone
        const rua = getFirst(refreshed, ['street','logradouro','endereco','address'])
        const numero = getFirst(refreshed, ['number','numero'])
        const bairro = getFirst(refreshed, ['neighborhood','bairro'])
        const endereco = rua ? (numero ? `${rua}, ${numero}` : rua) + (bairro ? ` - ${bairro}` : '') : profileData.endereco
        const cidade = getFirst(refreshed, ['city','cidade','localidade']) || profileData.cidade
        const cep = getFirst(refreshed, ['cep','postal_code','zip']) || profileData.cep
        const biografia = getFirst(refreshed, ['biography','bio','notes']) || profileData.biografia || ''
        const emailFromRow = getFirst(refreshed, ['email']) || profileData.email
        const foto = getFirst(refreshed, ['foto_url','avatar_url','fotoUrl']) || profileData.foto_url
        setProfileData((prev:any) => ({ ...prev, nome, email: emailFromRow, telefone, endereco, cidade, cep, biografia, foto_url: foto }))
      }

      setIsEditingProfile(false)
      setToast({ type: 'success', msg: strings.sucesso })
    } catch (err: any) {
      console.warn('[PacientePage] erro ao atualizar paciente', err)
      setToast({ type: 'error', msg: err?.message || strings.erroSalvar })
    } finally {
      setLoading(false)
    }
  }
  const handleCancelEdit = () => {
    setIsEditingProfile(false)
  }
  function DashboardCards() {
    const [nextAppt, setNextAppt] = useState<string | null>(null)
    const [examsCount, setExamsCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      let mounted = true
      async function load() {
        if (!patientId) {
          setNextAppt(null)
          setExamsCount(null)
          return
        }
        setLoading(true)
        try {
          // Load appointments for this patient (upcoming)
          const q = `patient_id=eq.${encodeURIComponent(String(patientId))}&order=scheduled_at.asc&limit=200`
          const ags = await listarAgendamentos(q).catch(() => [])
          if (!mounted) return
          const now = Date.now()
          // find the first appointment with scheduled_at >= now
          const upcoming = (ags || []).map((a: any) => ({ ...a, _sched: a.scheduled_at ? new Date(a.scheduled_at).getTime() : null }))
            .filter((a: any) => a._sched && a._sched >= now)
            .sort((x: any, y: any) => Number(x._sched) - Number(y._sched))
          if (upcoming && upcoming.length) {
            setNextAppt(new Date(upcoming[0]._sched).toLocaleDateString('pt-BR'))
          } else {
            setNextAppt(null)
          }

          // Load reports/laudos and compute count matching the Laudos session rules
          const reports = await listarRelatoriosPorPaciente(String(patientId)).catch(() => [])
          if (!mounted) return
          let count = 0
          try {
            if (!Array.isArray(reports) || reports.length === 0) {
              count = 0
            } else {
              // Use the same robust doctor-resolution strategy as ExamesLaudos so
              // the card matches the list: try buscarMedicosPorIds, then per-id
              // getDoctorById and finally a REST fallback by user_id.
              const ids = Array.from(new Set((reports as any[]).map((r:any) => r.doctor_id || r.created_by || r.doctor).filter(Boolean).map(String)))
              if (ids.length === 0) {
                // fallback: count reports that have any direct doctor reference
                count = (reports as any[]).filter((r:any) => !!(r && (r.doctor_id || r.created_by || r.doctor || r.user_id))).length
              } else {
                const docs = await buscarMedicosPorIds(ids).catch(() => [])
                const map: Record<string, any> = {}
                for (const d of docs || []) {
                  if (!d) continue
                  try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                  try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = map[String(d.user_id)] || d } catch {}
                }

                // Try per-id fallback using getDoctorById for any unresolved ids
                const unresolved = ids.filter(i => !map[i])
                if (unresolved.length) {
                  for (const u of unresolved) {
                    try {
                      const d = await getDoctorById(String(u)).catch(() => null)
                      if (d) {
                        try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                        try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d } catch {}
                      }
                    } catch (e) {
                      // ignore per-id failure
                    }
                  }
                }

                // REST fallback: try lookup by user_id for still unresolved ids
                const stillUnresolved = ids.filter(i => !map[i])
                if (stillUnresolved.length) {
                  for (const u of stillUnresolved) {
                    try {
                      const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) : null
                      const headers: Record<string,string> = { apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Accept: 'application/json' }
                      if (token) headers.Authorization = `Bearer ${token}`
                      const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/doctors?user_id=eq.${encodeURIComponent(String(u))}&limit=1`
                      const res = await fetch(url, { method: 'GET', headers })
                      if (!res || res.status >= 400) continue
                      const rows = await res.json().catch(() => [])
                      if (rows && Array.isArray(rows) && rows.length) {
                        const d = rows[0]
                        if (d) {
                          try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                          try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d } catch {}
                        }
                      }
                    } catch (e) {
                      // ignore network errors
                    }
                  }
                }

                // Count only reports whose referenced doctor record has user_id
                count = (reports as any[]).filter((r:any) => {
                  const maybeId = String(r.doctor_id || r.created_by || r.doctor || '')
                  const doc = map[maybeId]
                  return !!(doc && (doc.user_id || (doc as any).user_id))
                }).length
              }
            }
          } catch (e) {
            count = Array.isArray(reports) ? reports.length : 0
          }
          if (!mounted) return
          setExamsCount(count)
        } catch (e) {
          console.warn('[DashboardCards] erro ao carregar dados', e)
          if (!mounted) return
          setNextAppt(null)
          setExamsCount(null)
        } finally {
          if (mounted) setLoading(false)
        }
      }
      load()
      return () => { mounted = false }
    }, [])

    return (
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        <Card className="group rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm shadow-sm transition hover:shadow-md">
          <div className="flex h-40 w-full flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-6 w-6" aria-hidden />
            </div>
            {/* rótulo e número com mesma fonte e mesmo tamanho (harmônico) */}
            <span className="text-lg md:text-xl font-semibold text-muted-foreground tracking-wide">
              {strings.proximaConsulta}
            </span>
            <span className="text-lg md:text-xl font-semibold text-foreground" aria-live="polite">
              {loading ? strings.carregando : (nextAppt ?? '-')}
            </span>
          </div>
        </Card>

        <Card className="group rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-sm shadow-sm transition hover:shadow-md">
          <div className="flex h-40 w-full flex-col items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <span className="text-lg md:text-xl font-semibold text-muted-foreground tracking-wide">
              {strings.ultimosExames}
            </span>
            <span className="text-lg md:text-xl font-semibold text-foreground" aria-live="polite">
              {loading ? strings.carregando : (examsCount !== null ? String(examsCount) : '-')}
            </span>
          </div>
        </Card>
      </div>
    )
  }

  // Consultas fictícias
  const [currentDate, setCurrentDate] = useState(new Date())

  // helper: produce a local YYYY-MM-DD key (uses local timezone, not toISOString UTC)
  const localDateKey = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const consultasFicticias = [
    {
      id: 1,
      medico: "Dr. Carlos Andrade",
      especialidade: "Cardiologia",
      local: "Clínica Coração Feliz",
      data: localDateKey(new Date()),
      hora: "09:00",
      status: "Confirmada"
    },
    {
      id: 2,
      medico: "Dra. Fernanda Lima",
      especialidade: "Dermatologia",
      local: "Clínica Pele Viva",
      data: localDateKey(new Date()),
      hora: "14:30",
      status: "Pendente"
    },
    {
      id: 3,
      medico: "Dr. João Silva",
      especialidade: "Ortopedia",
      local: "Hospital Ortopédico",
      data: (() => { let d = new Date(); d.setDate(d.getDate()+1); return localDateKey(d) })(),
      hora: "11:00",
      status: "Cancelada"
    },
  ];

  function formatDatePt(date: Date) {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function navigateDate(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  }
  function goToToday() {
    setCurrentDate(new Date());
  }

  const todayStr = localDateKey(currentDate)
  const consultasDoDia = consultasFicticias.filter(c => c.data === todayStr);

  function Consultas() {
    const router = useRouter()
    const [tipoConsulta, setTipoConsulta] = useState<'teleconsulta' | 'presencial'>('teleconsulta')
    const [especialidade, setEspecialidade] = useState('cardiologia')
    const [localizacao, setLocalizacao] = useState('')
    const hoverPrimaryClass = "transition duration-200 hover:bg-[#2563eb] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 active:scale-[0.97]"
    const activeToggleClass = "w-full transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 active:scale-[0.97] bg-[#2563eb] text-white hover:bg-[#2563eb] hover:text-white"
    const inactiveToggleClass = "w-full transition duration-200 bg-slate-50 text-[#2563eb] border border-[#2563eb]/30 hover:bg-slate-100 hover:text-[#2563eb] dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:border-white/20"
    const hoverPrimaryIconClass = "rounded-xl bg-white text-[#1e293b] border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition duration-200 hover:bg-[#2563eb] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:shadow-none dark:hover:bg-[#2563eb] dark:hover:text-white"
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(currentDate); selectedDate.setHours(0, 0, 0, 0);
    const isSelectedDateToday = selectedDate.getTime() === today.getTime()

    // Appointments state (loaded when component mounts)
    const [appointments, setAppointments] = useState<any[] | null>(null)
    const [loadingAppointments, setLoadingAppointments] = useState(false)
    const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

    useEffect(() => {
      let mounted = true
      if (!patientId) {
        setAppointmentsError('Paciente não identificado. Faça login novamente.')
        return
      }

      async function loadAppointments() {
        try {
          setLoadingAppointments(true)
          setAppointmentsError(null)
          setAppointments(null)

          // Try `eq.` first, then fallback to `in.(id)` which some views expect
          const baseEncoded = encodeURIComponent(String(patientId))
          const queriesToTry = [
            `patient_id=eq.${baseEncoded}&order=scheduled_at.asc&limit=200`,
            `patient_id=in.(${baseEncoded})&order=scheduled_at.asc&limit=200`,
          ];

          let rows: any[] = []
          for (const q of queriesToTry) {
            try {
              // Debug: also fetch raw response to inspect headers/response body in the browser
              try {
                const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) : null
                const headers: Record<string,string> = {
                  apikey: ENV_CONFIG.SUPABASE_ANON_KEY,
                  Accept: 'application/json',
                }
                if (token) headers.Authorization = `Bearer ${token}`
                const rawUrl = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/appointments?${q}`
                console.debug('[Consultas][debug] GET', rawUrl, 'Headers(masked):', { ...headers, Authorization: headers.Authorization ? `${String(headers.Authorization).slice(0,6)}...${String(headers.Authorization).slice(-6)}` : undefined })
                const rawRes = await fetch(rawUrl, { method: 'GET', headers })
                const rawText = await rawRes.clone().text().catch(() => '')
                console.debug('[Consultas][debug] raw response', { url: rawUrl, status: rawRes.status, bodyPreview: (typeof rawText === 'string' && rawText.length > 0) ? rawText.slice(0, 200) : rawText })
              } catch (dbgErr) {
                console.debug('[Consultas][debug] não foi possível capturar raw response', dbgErr)
              }

              const r = await listarAgendamentos(q)
              if (r && Array.isArray(r) && r.length) {
                rows = r
                break
              }
              // if r is empty array, continue to next query format
            } catch (e) {
              // keep trying next format
              console.debug('[Consultas] tentativa listarAgendamentos falhou para query', q, e)
            }
          }

          if (!mounted) return
          if (!rows || rows.length === 0) {
            // no appointments found for this patient using either filter
            setAppointments([])
            return
          }

          const doctorIds = Array.from(new Set(rows.map((r: any) => r.doctor_id).filter(Boolean)))
          const doctorsMap: Record<string, any> = {}
          if (doctorIds.length) {
            try {
              const docs = await buscarMedicosPorIds(doctorIds).catch(() => [])
              for (const d of docs || []) doctorsMap[d.id] = d
            } catch (e) {
              // ignore
            }
          }

          const mapped = (rows || []).map((a: any) => {
            const sched = a.scheduled_at ? new Date(a.scheduled_at) : null
            const doc = a.doctor_id ? doctorsMap[String(a.doctor_id)] : null
            return {
              id: a.id,
              medico: doc?.full_name || a.doctor_id || '---',
              especialidade: doc?.specialty || '',
              local: a.location || a.place || '',
              data: sched ? localDateKey(sched) : '',
              hora: sched ? sched.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
              status: a.status ? String(a.status) : 'Pendente',
            }
          })

          setAppointments(mapped)
        } catch (err: any) {
          console.warn('[Consultas] falha ao carregar agendamentos', err)
          if (!mounted) return
          setAppointmentsError(err?.message ?? 'Falha ao carregar agendamentos.')
          setAppointments([])
        } finally {
          if (mounted) setLoadingAppointments(false)
        }
      }

      loadAppointments()
      return () => { mounted = false }
    }, [])

    // Monta a URL de resultados com os filtros atuais
    const buildResultadosHref = () => {
      const qs = new URLSearchParams()
      qs.set('tipo', tipoConsulta) // 'teleconsulta' | 'presencial'
      if (especialidade) qs.set('especialidade', especialidade)
      if (localizacao) qs.set('local', localizacao)
      // indicate navigation origin so destination can alter UX (e.g., show modal instead of redirect)
      qs.set('origin', 'paciente')
      return `/paciente/resultados?${qs.toString()}`
    }

    // derived lists for the page (computed after appointments state is declared)
    const _dialogSource = (appointments !== null ? appointments : consultasFicticias)
    const _todaysAppointments = (_dialogSource || []).filter((c: any) => c.data === todayStr)

    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <section className="bg-linear-to-br from-card to-card/95 shadow-lg rounded-2xl border border-primary/10 p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <header className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-foreground">Agende sua próxima consulta</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">Escolha o formato ideal, selecione a especialidade e encontre o profissional perfeito para você.</p>
            </header>

            <div className="space-y-6 rounded-2xl border border-primary/15 bg-linear-to-r from-primary/5 to-primary/10 p-8 shadow-sm">
              <div className="flex justify-center">
                <Button asChild className="w-full md:w-auto px-10 py-3 bg-primary text-white hover:bg-primary/90! hover:text-white! transition-all duration-200 font-semibold text-base rounded-lg shadow-md hover:shadow-lg active:scale-95">
                  <Link href={buildResultadosHref()} prefetch={false}>
                    Pesquisar Médicos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Consultas Agendadas Section */}
        <section className="bg-card shadow-md rounded-lg border border-border p-6">
          <div className="space-y-6">
            <header>
              <h2 className="text-3xl font-bold text-foreground mb-2">Suas Consultas Agendadas</h2>
              <p className="text-muted-foreground">Gerencie suas consultas confirmadas, pendentes ou canceladas.</p>
            </header>

            {/* Date Navigation */}
            <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 p-6 sm:flex-row sm:items-center sm:justify-between shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('prev') }}
                  aria-label="Dia anterior"
                  className={`group shadow-sm hover:bg-primary! hover:text-white! hover:border-primary! transition-all ${hoverPrimaryIconClass}`}
                >
                  <ChevronLeft className="h-5 w-5 transition group-hover:text-white" />
                </Button>
                <span className="text-base sm:text-lg font-semibold text-foreground min-w-fit">{formatDatePt(currentDate)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('next') }}
                  aria-label="Próximo dia"
                  className={`group shadow-sm hover:bg-primary! hover:text-white! hover:border-primary! transition-all ${hoverPrimaryIconClass}`}
                >
                  <ChevronRight className="h-5 w-5 transition group-hover:text-white" />
                </Button>
                {isSelectedDateToday && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    disabled
                    className="border border-border/50 text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97] hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
                  >
                    Hoje
                  </Button>
                )}
              </div>
              <div className="text-sm font-medium text-muted-foreground bg-background/50 px-4 py-2 rounded-lg">
                <span className="text-primary font-semibold">{_todaysAppointments.length}</span> consulta{_todaysAppointments.length !== 1 ? 's' : ''} agendada{_todaysAppointments.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Appointments List */}
            <div className="flex flex-col gap-6">
              {loadingAppointments ? (
                <div className="text-center py-10 text-muted-foreground">Carregando consultas...</div>
              ) : appointmentsError ? (
                <div className="text-center py-10 text-red-600">{appointmentsError}</div>
              ) : (
                (() => {
                  const todays = _todaysAppointments
                  if (!todays || todays.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 px-4">
                        <div className="rounded-full bg-primary/10 p-4 mb-4">
                          <Calendar className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-xl font-bold text-foreground mb-2">Nenhuma consulta agendada para este dia</p>
                        <p className="text-base text-muted-foreground text-center max-w-sm">Use a busca acima para marcar uma nova consulta ou navegue entre os dias.</p>
                      </div>
                    )
                  }
                  return todays.map((consulta: any) => (
                    <div
                      key={consulta.id}
                      className="rounded-2xl border border-primary/15 bg-card shadow-md hover:shadow-xl transition-all duration-300 p-6 hover:border-primary/30 hover:bg-card/95"
                    >
                      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1.2fr] items-start">
                        {/* Doctor Info */}
                        <div className="flex items-start gap-4 min-w-0">
                          <span
                            className="mt-2 h-4 w-4 shrink-0 rounded-full shadow-sm"
                            style={{ backgroundColor: consulta.status === 'Confirmada' ? '#10b981' : consulta.status === 'Pendente' ? '#f59e0b' : '#ef4444' }}
                            aria-hidden
                          />
                          <div className="space-y-3 min-w-0">
                            <div className="font-bold flex items-center gap-2.5 text-foreground text-lg leading-tight">
                              <Stethoscope className="h-5 w-5 text-primary shrink-0" />
                              <span className="truncate">{consulta.medico}</span>
                            </div>
                            <p className="text-sm text-muted-foreground wrap-break-word leading-relaxed">
                              <span className="font-medium text-foreground/70">{consulta.especialidade}</span>
                              <span className="mx-1.5">•</span>
                              <span>{consulta.local}</span>
                            </p>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center justify-start gap-2.5 text-foreground">
                          <Clock className="h-5 w-5 text-primary shrink-0" />
                          <span className="font-bold text-lg">{consulta.hora}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center justify-start">
                          <span className={`px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-md transition-all ${
                            consulta.status === 'Confirmada' 
                              ? 'bg-linear-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20' 
                              : consulta.status === 'Pendente' 
                              ? 'bg-linear-to-r from-amber-500 to-amber-600 shadow-amber-500/20' 
                              : 'bg-linear-to-r from-red-500 to-red-600 shadow-red-500/20'
                          }`}>
                            {consulta.status}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="border border-primary/30 text-primary bg-primary/5 hover:bg-primary! hover:text-white! hover:border-primary! transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 text-xs font-semibold flex-1"
                          >
                            Detalhes
                          </Button>
                          {consulta.status !== 'Cancelada' && (
                            <Button 
                              type="button" 
                              size="sm" 
                              className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary! hover:text-white! hover:border-primary! transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 text-xs font-semibold flex-1"
                            >
                              Reagendar
                            </Button>
                          )}
                          {consulta.status !== 'Cancelada' && (
                            <Button
                              type="button"
                              size="sm"
                              className="border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive! hover:text-white! hover:border-destructive! transition-all duration-200 focus-visible:ring-2 focus-visible:ring-destructive/40 active:scale-95 text-xs font-semibold flex-1"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </section>
      </div>
    )
  }

  // Selected report state
  const [selectedReport, setSelectedReport] = useState<any | null>(null)

  function ExamesLaudos() {
    const [reports, setReports] = useState<any[] | null>(null)
    const [loadingReports, setLoadingReports] = useState(false)
    const [reportsError, setReportsError] = useState<string | null>(null)
    const [reportDoctorName, setReportDoctorName] = useState<string | null>(null)
  const [doctorsMap, setDoctorsMap] = useState<Record<string, any>>({})
  const [resolvingDoctors, setResolvingDoctors] = useState(false)
  const [reportsPage, setReportsPage] = useState<number>(1)
  const [reportsPerPage, setReportsPerPage] = useState<number>(5)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [remoteMatch, setRemoteMatch] = useState<any | null>(null)
  const [searchingRemote, setSearchingRemote] = useState<boolean>(false)

  // derived filtered list based on search term
  const filteredReports = useMemo(() => {
    if (!reports || !Array.isArray(reports)) return []
    const qRaw = String(searchTerm || '').trim()
    const q = qRaw.toLowerCase()

    // If we have a remote-match result for this query, prefer it. remoteMatch
    // may be a single report (for id-like queries) or an array (for doctor-name search).
  const hexOnlyRaw = String(qRaw).replace(/[^0-9a-fA-F]/g, '')
  // defensive: compute length via explicit number conversion to avoid any
  // accidental transpilation/patch artifacts that could turn a comparison
  // into an unexpected call. This avoids runtime "8 is not a function".
  const hexLenRaw = (typeof hexOnlyRaw === 'string') ? hexOnlyRaw.length : (Number(hexOnlyRaw) || 0)
  const looksLikeId = hexLenRaw >= 8
    if (remoteMatch) {
      if (Array.isArray(remoteMatch)) return remoteMatch
      return [remoteMatch]
    }

    if (!q) return reports
    return reports.filter((r: any) => {
      try {
        const id = r.id ? String(r.id).toLowerCase() : ''
        const title = String(reportTitle(r) || '').toLowerCase()
        const exam = String(r.exam || r.exame || r.report_type || r.especialidade || '').toLowerCase()
        const date = String(r.report_date || r.created_at || r.data || '').toLowerCase()
        const notes = String(r.content || r.body || r.conteudo || r.notes || r.observacoes || '').toLowerCase()
        const cid = String(r.cid || r.cid_code || r.cidCode || r.cie || '').toLowerCase()
        const diagnosis = String(r.diagnosis || r.diagnostico || r.diagnosis_text || r.diagnostico_text || '').toLowerCase()
        const conclusion = String(r.conclusion || r.conclusao || r.conclusion_text || r.conclusao_text || '').toLowerCase()
        const orderNumber = String(r.order_number || r.orderNumber || r.numero_pedido || '').toLowerCase()

        // patient fields
        const patientName = String(
          r?.paciente?.full_name || r?.paciente?.nome || r?.patient?.full_name || r?.patient?.nome || r?.patient_name || r?.patient_full_name || ''
        ).toLowerCase()

        // requester/executor fields
        const requestedBy = String(r.requested_by_name || r.requested_by || r.requester_name || r.requester || '').toLowerCase()
        const executor = String(r.executante || r.executante_name || r.executor || r.executor_name || '').toLowerCase()

        // try to resolve doctor name from map when available
        const maybeId = r?.doctor_id || r?.created_by || r?.doctor || null
        const doctorName = maybeId ? String(doctorsMap[String(maybeId)]?.full_name || doctorsMap[String(maybeId)]?.name || '').toLowerCase() : ''

        // build search corpus
        const corpus = [id, title, exam, date, notes, cid, diagnosis, conclusion, orderNumber, patientName, requestedBy, executor, doctorName].join(' ')
        return corpus.includes(q)
      } catch (e) {
        return false
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchTerm, doctorsMap, remoteMatch])

  // When the search term looks like an id, attempt a direct fetch using the reports API
  useEffect(() => {
    let mounted = true
    const q = String(searchTerm || '').trim()
    if (!q) {
      setRemoteMatch(null)
      setSearchingRemote(false)
      return
    }
  // heuristic: id-like strings contain many hex characters (UUID-like) —
  // avoid calling RegExp.test/match to sidestep any env/type issues here.
  const hexOnly = String(q).replace(/[^0-9a-fA-F]/g, '')
  // defensive length computation as above
  const hexLen = (typeof hexOnly === 'string') ? hexOnly.length : (Number(hexOnly) || 0)
  const looksLikeId = hexLen >= 8
  // If it looks like an id, try the single-report lookup. Otherwise, if it's a
  // textual query, try searching doctors by full_name and then fetch reports
  // authored/requested by those doctors.
  ;(async () => {
      try {
        setSearchingRemote(true)
        setRemoteMatch(null)

        if (looksLikeId && q) { // Adicionada verificação para q não ser vazio
          const r = await buscarRelatorioPorId(q).catch(() => null)
          if (!mounted) return
          if (r) setRemoteMatch(r)
          return
        }

        // textual search: try to find doctors whose full_name matches the query
        // and then fetch reports for those doctors. Only run for reasonably
        // long queries to avoid excessive network calls.
        if (q.length >= 2) {
          const docs = await buscarMedicos(q).catch(() => [])
          if (!mounted) return
            if (docs && Array.isArray(docs) && docs.length) {
            // fetch reports for matching doctors in parallel. Some report rows
            // reference the doctor's account `user_id` in `requested_by` while
            // others reference the doctor's record `id`. Try both per doctor.
            const promises = docs.map(async (d: any) => {
              try {
                const byId = await listarRelatoriosPorMedico(String(d.id)).catch(() => [])
                if (Array.isArray(byId) && byId.length) return byId
                // fallback: if the doctor record has a user_id, try that too
                if (d && (d.user_id || d.userId)) {
                  const byUser = await listarRelatoriosPorMedico(String(d.user_id || d.userId)).catch(() => [])
                  if (Array.isArray(byUser) && byUser.length) return byUser
                }
                return []
              } catch (e) {
                return []
              }
            })
            const arrays = await Promise.all(promises)
            if (!mounted) return
            const combined = ([] as any[]).concat(...arrays)
            // dedupe by report id
            const seen = new Set<string>()
            const unique: any[] = []
            for (const rr of combined) {
              try {
                const rid = String(rr.id)
                if (!seen.has(rid)) {
                  seen.add(rid)
                  unique.push(rr)
                }
              } catch (e) {
                // skip malformed item
              }
            }
            if (unique.length) setRemoteMatch(unique)
            else setRemoteMatch(null)
            return
          }
        }

        // nothing useful found
        if (mounted) setRemoteMatch(null)
      } catch (e) {
        if (mounted) setRemoteMatch(null)
      } finally {
        if (mounted) setSearchingRemote(false)
      }
    })()

    return () => { mounted = false }
  }, [searchTerm])

    // Helper to derive a human-friendly title for a report/laudo
    const reportTitle = (rep: any, preferDoctorName?: string | null) => {
      if (!rep) return 'Laudo'
      // prefer a resolved doctor name when we have a map
      try {
        const maybeId = rep?.doctor_id ?? rep?.created_by ?? rep?.doctor ?? null
        if (maybeId) {
          const doc = doctorsMap[String(maybeId)]
          if (doc) {
            const name = doc.full_name || doc.name || doc.fullName || doc.doctor_name || null
            if (name) return String(name)
          }
        }
      } catch (e) {
        // ignore
      }
      // Try common fields that may contain the doctor's/author name first
      const tryKeys = [
        'doctor_name', 'doctor_full_name', 'doctorFullName', 'doctorName',
        'requested_by_name', 'requested_by', 'requester_name', 'requester',
        'created_by_name', 'created_by', 'executante', 'executante_name',
        'title', 'name', 'report_name', 'report_title'
      ]
      for (const k of tryKeys) {
        const v = rep[k]
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
      }
      if (preferDoctorName) return preferDoctorName
      return 'Laudo'
    }

    // When reports are loaded, try to resolve doctor records for display
    useEffect(() => {
      let mounted = true
      if (!reports || !Array.isArray(reports) || reports.length === 0) return
      ;(async () => {
        try {
          setResolvingDoctors(true)
          const ids = Array.from(new Set(reports.map((r: any) => r.doctor_id || r.created_by || r.doctor).filter(Boolean).map(String)))
          if (ids.length === 0) return
          const docs = await buscarMedicosPorIds(ids).catch(() => [])
          if (!mounted) return
          const map: Record<string, any> = {}
          // index returned docs by both their id and user_id (some reports store user_id)
          for (const d of docs || []) {
            if (!d) continue
            try {
              if (d.id !== undefined && d.id !== null) map[String(d.id)] = d
            } catch {}
            try {
              if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d
            } catch {}
          }

          // attempt per-id fallback for any unresolved ids (try getDoctorById)
          const unresolved = ids.filter(i => !map[i])
          if (unresolved.length) {
            for (const u of unresolved) {
              try {
                const d = await getDoctorById(String(u)).catch(() => null)
                if (d) {
                  if (d.id !== undefined && d.id !== null) map[String(d.id)] = d
                  if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d
                }
              } catch (e) {
                // ignore per-id failure
              }
            }
          }

          // final fallback: try lookup by user_id (direct REST using baseHeaders)
          const stillUnresolved = ids.filter(i => !map[i])
          if (stillUnresolved.length) {
            for (const u of stillUnresolved) {
              try {
                const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) : null
                const headers: Record<string,string> = { apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Accept: 'application/json' }
                if (token) headers.Authorization = `Bearer ${token}`
                const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/doctors?user_id=eq.${encodeURIComponent(String(u))}&limit=1`
                const res = await fetch(url, { method: 'GET', headers })
                if (!res || res.status >= 400) continue
                const rows = await res.json().catch(() => [])
                if (rows && Array.isArray(rows) && rows.length) {
                  const d = rows[0]
                  if (d) {
                    if (d.id !== undefined && d.id !== null) map[String(d.id)] = d
                    if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d
                  }
                }
              } catch (e) {
                // ignore network errors
              }
            }
          }

          setDoctorsMap(map)
          // After resolving doctor records, filter out reports whose doctor
          // record doesn't have a user_id (doctor_userid). If a report's
          // referenced doctor lacks user_id, we hide that laudo.
          try {
            const filtered = (reports || []).filter((r: any) => {
              const maybeId = String(r?.doctor_id || r?.created_by || r?.doctor || '')
              const doc = map[maybeId]
              return !!(doc && (doc.user_id || (doc as any).user_id))
            })
            // Only update when different to avoid extra cycles
            if (Array.isArray(filtered) && filtered.length !== (reports || []).length) {
              setReports(filtered)
            }
          } catch (e) {
            // ignore filtering errors
          }
          setResolvingDoctors(false)
        } catch (e) {
          // ignore resolution errors
          setResolvingDoctors(false)
        }
      })()
      return () => { mounted = false }
    }, [reports])

    useEffect(() => {
      let mounted = true
      if (!patientId) return
      setLoadingReports(true)
      setReportsError(null)

      ;(async () => {
        try {
          const res = await listarRelatoriosPorPaciente(String(patientId)).catch(() => [])
          if (!mounted) return

          // If no reports, set empty and return
          if (!Array.isArray(res) || res.length === 0) {
            setReports([])
            return
          }

          // Resolve referenced doctor ids and only keep reports whose
          // referenced doctor record has a truthy user_id (i.e., created by a doctor)
          try {
            setResolvingDoctors(true)
            const ids = Array.from(new Set((res as any[]).map((r:any) => r.doctor_id || r.created_by || r.doctor).filter(Boolean).map(String)))
            const map: Record<string, any> = {}
            if (ids.length) {
              const docs = await buscarMedicosPorIds(ids).catch(() => [])
              for (const d of docs || []) {
                if (!d) continue
                try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = map[String(d.user_id)] || d } catch {}
              }

              // per-id fallback
              const unresolved = ids.filter(i => !map[i])
              if (unresolved.length) {
                for (const u of unresolved) {
                  try {
                    const d = await getDoctorById(String(u)).catch(() => null)
                    if (d) {
                      try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                      try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d } catch {}
                    }
                  } catch (e) {
                    // ignore
                  }
                }
              }

              // REST fallback by user_id
              const stillUnresolved = ids.filter(i => !map[i])
              if (stillUnresolved.length) {
                for (const u of stillUnresolved) {
                  try {
                    const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) : null
                    const headers: Record<string,string> = { apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Accept: 'application/json' }
                    if (token) headers.Authorization = `Bearer ${token}`
                    const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/doctors?user_id=eq.${encodeURIComponent(String(u))}&limit=1`
                    const r = await fetch(url, { method: 'GET', headers })
                    if (!r || r.status >= 400) continue
                    const rows = await r.json().catch(() => [])
                    if (rows && Array.isArray(rows) && rows.length) {
                      const d = rows[0]
                      if (d) {
                        try { if (d.id !== undefined && d.id !== null) map[String(d.id)] = d } catch {}
                        try { if (d.user_id !== undefined && d.user_id !== null) map[String(d.user_id)] = d } catch {}
                      }
                    }
                  } catch (e) {
                    // ignore
                  }
                }
              }
            }

            // Now filter reports to only those whose referenced doctor has user_id
            const filtered = (res || []).filter((r: any) => {
              const maybeId = String(r?.doctor_id || r?.created_by || r?.doctor || '')
              const doc = map[maybeId]
              return !!(doc && (doc.user_id || (doc as any).user_id))
            })

            // Update doctorsMap and reports
            setDoctorsMap(map)
            setReports(filtered)
            setResolvingDoctors(false)
            return
          } catch (e) {
            // If resolution fails, fall back to setting raw results
            console.warn('[ExamesLaudos] falha ao resolver médicos para filtragem', e)
            setReports(Array.isArray(res) ? res : [])
            setResolvingDoctors(false)
            return
          }
        } catch (err) {
          console.warn('[ExamesLaudos] erro ao carregar laudos', err)
          if (!mounted) return
          setReportsError('Falha ao carregar laudos.')
        } finally {
          if (mounted) setLoadingReports(false)
        }
      })()

      return () => { mounted = false }
    }, [])

    // When a report is selected, try to fetch doctor name if we have an id
    useEffect(() => {
      let mounted = true
      if (!selectedReport) {
        setReportDoctorName(null)
        return
      }
      const maybeDoctorId = selectedReport.doctor_id || selectedReport.created_by || null
      if (!maybeDoctorId) {
        setReportDoctorName(null)
        return
      }
      (async () => {
        try {
          const docs = await buscarMedicosPorIds([String(maybeDoctorId)]).catch(() => [])
          if (!mounted) return
          if (docs && docs.length) {
            const doc0: any = docs[0]
            setReportDoctorName(doc0.full_name || doc0.name || doc0.fullName || null)
            return
          }

          // fallback: try single-id lookup
          try {
            const d = await getDoctorById(String(maybeDoctorId)).catch(() => null)
            if (d && mounted) {
              setReportDoctorName(d.full_name || d.name || d.fullName || null)
              return
            }
          } catch (e) {
            // ignore
          }

          // final fallback: query doctors by user_id
          try {
            const token = (typeof window !== 'undefined') ? (localStorage.getItem('auth_token') || localStorage.getItem('token') || sessionStorage.getItem('auth_token') || sessionStorage.getItem('token')) : null
            const headers: Record<string,string> = { apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Accept: 'application/json' }
            if (token) headers.Authorization = `Bearer ${token}`
            const url = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/doctors?user_id=eq.${encodeURIComponent(String(maybeDoctorId))}&limit=1`
            const res = await fetch(url, { method: 'GET', headers })
            if (res && res.status < 400) {
              const rows = await res.json().catch(() => [])
              if (rows && Array.isArray(rows) && rows.length) {
                const d = rows[0]
                if (d && mounted) setReportDoctorName(d.full_name || d.name || d.fullName || null)
              }
            }
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore
        }
      })()
      return () => { mounted = false }
    }, [])

    // reset pagination when reports change
    useEffect(() => {
      setReportsPage(1)
    }, [reports])

    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-6">Laudos</h2>

        <div className="space-y-3">
          {/* Search box: allow searching by id, doctor, exam, date or text */}
          <div className="mb-4 flex items-center gap-2">
            <Input placeholder="Pesquisar laudo, médico, exame, data ou id" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setReportsPage(1) }} />
            {searchTerm && (
              <Button variant="ghost" onClick={() => { setSearchTerm(''); setReportsPage(1) }}>Limpar</Button>
            )}
          </div>
          {loadingReports ? (
            <div className="text-center py-8 text-muted-foreground">{strings.carregando}</div>
          ) : reportsError ? (
            <div className="text-center py-8 text-red-600">{reportsError}</div>
          ) : (!reports || reports.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum laudo encontrado para este paciente.</div>
            ) : (filteredReports.length === 0) ? (
              searchingRemote ? (
                <div className="text-center py-8 text-muted-foreground">Buscando laudo...</div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Nenhum laudo corresponde à pesquisa.</div>
              )
            ) : (
            (() => {
              const total = Array.isArray(filteredReports) ? filteredReports.length : 0
              // enforce a maximum of 5 laudos per page
              const perPage = Math.max(1, Math.min(reportsPerPage || 5, 5))
              const totalPages = Math.max(1, Math.ceil(total / perPage))
              // keep page inside bounds
              const page = Math.min(Math.max(1, reportsPage), totalPages)
              const start = (page - 1) * perPage
              const end = start + perPage
              const pageItems = (filteredReports || []).slice(start, end)

              return (
                <>
                  {pageItems.map((r) => (
              <div key={r.id || JSON.stringify(r)} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-5">
                <div>
                  {(() => {
                    const maybeId = r?.doctor_id || r?.created_by || r?.doctor || null
                    if (resolvingDoctors && maybeId && !doctorsMap[String(maybeId)]) {
                      return <div className="font-medium text-muted-foreground text-lg md:text-xl">{strings.carregando}</div>
                    }
                    return <div className="font-medium text-foreground text-lg md:text-xl">{reportTitle(r)}</div>
                  })()}
                  <div className="text-base md:text-base text-muted-foreground mt-1">Data: {new Date(r.report_date || r.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" className="hover:bg-primary! hover:text-white! transition-colors" onClick={async () => { setSelectedReport(r); }}>{strings.visualizarLaudo}</Button>
                  <Button variant="secondary" className="hover:bg-primary! hover:text-white! transition-colors" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(r)); setToast({ type: 'success', msg: 'Laudo copiado.' }) } catch { setToast({ type: 'error', msg: 'Falha ao copiar.' }) } }}>{strings.compartilhar}</Button>
                </div>
              </div>
                  ))}

                  {/* Pagination controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">Mostrando {Math.min(start+1, total)}–{Math.min(end, total)} de {total}</div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReportsPage(p => Math.max(1, p-1))} disabled={page <= 1} className="px-3">Anterior</Button>
                      <div className="text-sm text-muted-foreground">{page} / {totalPages}</div>
                      <Button size="sm" variant="outline" onClick={() => setReportsPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="px-3">Próxima</Button>
                    </div>
                  </div>
                </>
              )
            })()
          )}
        </div>
 
        <Dialog open={!!selectedReport} onOpenChange={open => !open && setSelectedReport(null)}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedReport && (
                    (() => {
                      const looksLikeIdStr = (s: any) => {
                        try {
                          const hexOnly = String(s || '').replace(/[^0-9a-fA-F]/g, '');
                          const len = (typeof hexOnly === 'string') ? hexOnly.length : (Number(hexOnly) || 0);
                          return len >= 8;
                        } catch { return false; }
                      };
                      const maybeId = selectedReport?.doctor_id || selectedReport?.created_by || selectedReport?.doctor || null;
                      const derived = reportDoctorName ? reportTitle(selectedReport, reportDoctorName) : reportTitle(selectedReport);

                      if (looksLikeIdStr(derived)) {
                        return <span className="font-semibold text-xl md:text-2xl text-muted-foreground">{strings.carregando}</span>;
                      }
                      if (resolvingDoctors && maybeId && !doctorsMap[String(maybeId)]) {
                        return <span className="font-semibold text-xl md:text-2xl text-muted-foreground">{strings.carregando}</span>;
                      }
                      return <span className="font-semibold text-xl md:text-2xl">{derived}</span>;
                    })()
                  )}
                </DialogTitle>
                <DialogDescription className="sr-only">Detalhes do laudo</DialogDescription>
                <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                  {selectedReport && (
                    <>
                      <div className="text-sm text-muted-foreground">Data: {new Date(selectedReport.report_date || selectedReport.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                      {reportDoctorName && <div className="text-sm text-muted-foreground">Profissional: <strong className="text-foreground">{reportDoctorName}</strong></div>}

                      {/* Standardized laudo sections */}
                      {(() => {
                        const cid = selectedReport.cid ?? selectedReport.cid_code ?? selectedReport.cidCode ?? selectedReport.cie ?? '-';
                        const exam = selectedReport.exam ?? selectedReport.exame ?? selectedReport.especialidade ?? selectedReport.report_type ?? '-';
                        const diagnosis = selectedReport.diagnosis ?? selectedReport.diagnostico ?? selectedReport.diagnosis_text ?? selectedReport.diagnostico_text ?? '';
                        const conclusion = selectedReport.conclusion ?? selectedReport.conclusao ?? selectedReport.conclusion_text ?? selectedReport.conclusao_text ?? '';
                        const notesHtml = selectedReport.content_html ?? selectedReport.conteudo_html ?? selectedReport.contentHtml ?? null;
                        const notesText = selectedReport.content ?? selectedReport.body ?? selectedReport.conteudo ?? selectedReport.notes ?? selectedReport.observacoes ?? '';
                        return (
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-muted-foreground">CID</div>
                              <div className="text-foreground">{cid || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Exame</div>
                              <div className="text-foreground">{exam || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Diagnóstico</div>
                              <div className="whitespace-pre-line text-foreground">{diagnosis || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Conclusão</div>
                              <div className="whitespace-pre-line text-foreground">{conclusion || '-'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Notas do Profissional</div>
                              {notesHtml ? (
                                <div className="prose max-w-none p-2 bg-muted rounded" dangerouslySetInnerHTML={{ __html: String(notesHtml) }} />
                              ) : (
                                <div className="whitespace-pre-line text-foreground p-2 bg-muted rounded">{notesText || '-'}</div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      {selectedReport.doctor_signature && (
                        <div className="mt-4 text-sm text-muted-foreground">Assinatura: <Image src={selectedReport.doctor_signature} alt="assinatura" width={40} height={40} className="inline-block h-10 w-auto" /></div>
                      )}
                    </>
                  )}
                </div>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  className="transition duration-200 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>
      </section>
    )
  }

  

  function Perfil() {
    const hasAddress = Boolean(profileData.endereco || profileData.cidade || profileData.cep)
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
          {!isEditingProfile ? (
            <Button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2">
              Editar Perfil
            </Button>
          ) : (
              <div className="flex gap-2">
              <Button onClick={handleSaveProfile} className="flex items-center gap-2">Salvar</Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                className="transition duration-200 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground"
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b border-border text-foreground pb-2">Informações Pessoais</h3>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <p className="p-2 bg-muted rounded text-muted-foreground">{profileData.nome}</p>
              <span className="text-xs text-muted-foreground">Este campo não pode ser alterado</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditingProfile ? (
                <Input id="email" type="email" value={profileData.email} onChange={e => handleProfileChange('email', e.target.value)} />
              ) : (
                <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              {isEditingProfile ? (
                <Input id="telefone" value={profileData.telefone} onChange={e => handleProfileChange('telefone', e.target.value)} />
              ) : (
                <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.telefone}</p>
              )}
            </div>
          </div>
          {/* Endereço e Contato (render apenas se existir algum dado) */}
          {hasAddress && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b border-border text-foreground pb-2">Endereço</h3>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                {isEditingProfile ? (
                  <Input id="endereco" value={profileData.endereco} onChange={e => handleProfileChange('endereco', e.target.value)} />
                ) : (
                  <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.endereco}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                {isEditingProfile ? (
                  <Input id="cidade" value={profileData.cidade} onChange={e => handleProfileChange('cidade', e.target.value)} />
                ) : (
                  <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.cidade}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                {isEditingProfile ? (
                  <Input id="cep" value={profileData.cep} onChange={e => handleProfileChange('cep', e.target.value)} />
                ) : (
                  <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.cep}</p>
                )}
              </div>
              {/* Biografia removed: not used */}
            </div>
          )}
        </div>
        {/* Foto do Perfil */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Foto do Perfil</h3>
          <UploadAvatar
            userId={profileData.id}
            currentAvatarUrl={profileData.foto_url}
            onAvatarChange={(newUrl) => handleProfileChange('foto_url', newUrl)}
            userName={profileData.nome}
          />
        </div>
      </div>
    )
  }

  // Renderização principal
  return (
    <ProtectedRoute requiredUserType={["paciente"]}>
      <div className="container mx-auto px-4 py-8">
        {/* Header com informações do paciente */}
        <header className="sticky top-0 z-40 bg-card shadow-md rounded-lg border border-border p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-white font-bold">{profileData.nome?.charAt(0) || 'P'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-muted-foreground">Conta do paciente</span>
              <span className="font-bold text-lg leading-none">{profileData.nome || 'Paciente'}</span>
              <span className="text-sm text-muted-foreground truncate">{profileData.email || 'Email não disponível'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SimpleThemeToggle />
            <Button asChild variant="outline" className="hover:bg-primary! hover:text-white! hover:border-primary! transition-colors">
              <Link href="/">
                <Home className="h-4 w-4 mr-1" /> Início
              </Link>
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              aria-label={strings.sair} 
              disabled={loading} 
              className="text-destructive border-destructive hover:bg-destructive! hover:text-white! hover:border-destructive! transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1" /> {strings.sair}
            </Button>
          </div>
        </header>

        {/* Layout com sidebar e conteúdo */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar vertical - sticky */}
          <aside className="sticky top-24 h-fit">
            <nav aria-label="Navegação do dashboard" className="bg-card shadow-md rounded-lg border border-border p-3 space-y-1 z-30">
              <Button
                variant={tab==='dashboard'?'default':'ghost'}
                aria-current={tab==='dashboard'}
                onClick={()=>setTab('dashboard')}
                className={`w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer`}
              >
                <Calendar className="mr-2 h-4 w-4" />{strings.dashboard}
              </Button>
              <Button
                variant={tab==='consultas'?'default':'ghost'}
                aria-current={tab==='consultas'}
                onClick={()=>setTab('consultas')}
                className={`w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer`}
              >
                <Calendar className="mr-2 h-4 w-4" />{strings.consultas}
              </Button>
              <Button
                variant={tab==='exames'?'default':'ghost'}
                aria-current={tab==='exames'}
                onClick={()=>setTab('exames')}
                className={`w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer`}
              >
                <FileText className="mr-2 h-4 w-4" />{strings.exames}
              </Button>
              
              <Button
                variant={tab==='perfil'?'default':'ghost'}
                aria-current={tab==='perfil'}
                onClick={()=>setTab('perfil')}
                className={`w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer`}
              >
                <UserCog className="mr-2 h-4 w-4" />{strings.perfil}
              </Button>
            </nav>
          </aside>
          
          {/* Conteúdo principal */}
          <main className="flex-1 w-full">
            {/* Toasts de feedback */}
            {toast && (
              <div className={`fixed top-24 right-4 z-50 px-4 py-2 rounded shadow-lg ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`} role="alert">{toast.msg}</div>
            )}

            {/* Loader global */}
            {loading && <div className="flex-1 flex items-center justify-center"><span>{strings.carregando}</span></div>}
            {error && <div className="flex-1 flex items-center justify-center text-red-600"><span>{error}</span></div>}

            {/* Conteúdo principal */}
            {!loading && !error && (
              <>
                {tab==='dashboard' && <DashboardCards />}
                {tab==='consultas' && <Consultas />}
                {tab==='exames' && <ExamesLaudos />}
                {tab==='perfil' && <Perfil />}
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}