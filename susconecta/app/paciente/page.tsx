'use client'

import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LogOut, Calendar, FileText, MessageCircle, UserCog, Home, Clock, FolderOpen, ChevronLeft, ChevronRight, MapPin, Stethoscope } from 'lucide-react'
import { SimpleThemeToggle } from '@/components/simple-theme-toggle'
import { UploadAvatar } from '@/components/ui/upload-avatar'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buscarPacientes, buscarPacientePorUserId, getUserInfo, listarAgendamentos, buscarMedicosPorIds, atualizarPaciente, buscarPacientePorId } from '@/lib/api'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

          // Load reports/laudos count
          const reports = await listarRelatoriosPorPaciente(String(patientId)).catch(() => [])
          if (!mounted) return
          setExamsCount(Array.isArray(reports) ? reports.length : 0)
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
    }, [patientId])

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="flex flex-col items-center justify-center p-4">
          <Calendar className="mb-2 text-primary" aria-hidden />
          <span className="font-semibold">{strings.proximaConsulta}</span>
          <span className="text-2xl">{loading ? '...' : (nextAppt ?? '-')}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4">
          <FileText className="mb-2 text-primary" aria-hidden />
          <span className="font-semibold">{strings.ultimosExames}</span>
          <span className="text-2xl">{loading ? '...' : (examsCount !== null ? String(examsCount) : '-')}</span>
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
    const [mostrarAgendadas, setMostrarAgendadas] = useState(false)
    const hoverPrimaryClass = "transition duration-200 hover:bg-[#2563eb] hover:text-white focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 active:scale-[0.97]"
    const activeToggleClass = "w-full transition duration-200 focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 active:scale-[0.97] bg-[#2563eb] text-white hover:bg-[#2563eb] hover:text-white"
    const inactiveToggleClass = "w-full transition duration-200 bg-slate-50 text-[#2563eb] border border-[#2563eb]/30 hover:bg-slate-100 hover:text-[#2563eb] dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:border-white/20"
    const hoverPrimaryIconClass = "rounded-xl bg-white text-[#1e293b] border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition duration-200 hover:bg-[#2563eb] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:shadow-none dark:hover:bg-[#2563eb] dark:hover:text-white"
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(currentDate); selectedDate.setHours(0, 0, 0, 0);
  const isSelectedDateToday = selectedDate.getTime() === today.getTime()

  

    // Appointments state (loaded when "Ver consultas agendadas" is opened)
    const [appointments, setAppointments] = useState<any[] | null>(null)
    const [loadingAppointments, setLoadingAppointments] = useState(false)
    const [appointmentsError, setAppointmentsError] = useState<string | null>(null)

    useEffect(() => {
      let mounted = true
      if (!mostrarAgendadas) return
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
    }, [mostrarAgendadas, patientId])

    // Monta a URL de resultados com os filtros atuais
    const buildResultadosHref = () => {
      const qs = new URLSearchParams()
      qs.set('tipo', tipoConsulta) // 'teleconsulta' | 'presencial'
      if (especialidade) qs.set('especialidade', especialidade)
      if (localizacao) qs.set('local', localizacao)
      // indicate navigation origin so destination can alter UX (e.g., show modal instead of redirect)
      qs.set('origin', 'paciente')
      return `/resultados?${qs.toString()}`
    }

    // derived lists for the "Ver consultas agendadas" dialog (computed after appointments state is declared)
    const _dialogSource = (appointments !== null ? appointments : consultasFicticias)
    const _todaysAppointments = (_dialogSource || []).filter((c: any) => c.data === todayStr)

    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h2 className="text-3xl font-semibold text-foreground">Agende sua próxima consulta</h2>
            <p className="text-muted-foreground">Escolha o formato ideal, selecione a especialidade e encontre o profissional perfeito para você.</p>
          </header>

          <div className="space-y-6 rounded-lg border border-border bg-muted/40 p-6">
            {/* Remover campos de especialidade e localização, deixar só o botão centralizado */}
            <div className="flex justify-center">
              <Button asChild className={`w-full md:w-40 ${hoverPrimaryClass}`}>
                <Link href={buildResultadosHref()} prefetch={false}>
                  Pesquisar
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="transition duration-200 bg-[#2563eb] text-white border border-[#2563eb]/40 rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:bg-[#1e40af] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 dark:bg-[#2563eb] dark:text-white dark:border-[#2563eb]/50 dark:hover:bg-[#1e40af]"
              onClick={() => setMostrarAgendadas(true)}
            >
              Ver consultas agendadas
            </Button>
          </div>
        </div>

        <Dialog open={mostrarAgendadas} onOpenChange={open => setMostrarAgendadas(open)}>
    <DialogContent className="max-w-3xl space-y-6 sm:max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-foreground">Consultas agendadas</DialogTitle>
              <DialogDescription>Gerencie suas consultas confirmadas, pendentes ou canceladas.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('prev') }}
                  aria-label="Dia anterior"
                  className={`group shadow-sm ${hoverPrimaryIconClass}`}
                >
                  <ChevronLeft className="h-4 w-4 transition group-hover:text-white" />
                </Button>
                <span className="text-lg font-medium text-foreground">{formatDatePt(currentDate)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('next') }}
                  aria-label="Próximo dia"
                  className={`group shadow-sm ${hoverPrimaryIconClass}`}
                >
                  <ChevronRight className="h-4 w-4 transition group-hover:text-white" />
                </Button>
                {isSelectedDateToday && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    disabled
                    className="border border-border text-foreground focus-visible:ring-2 focus-visible:ring-[#2563eb]/60 active:scale-[0.97] hover:bg-transparent hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground"
                  >
                    Hoje
                  </Button>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {`${_todaysAppointments.length} consulta${_todaysAppointments.length !== 1 ? 's' : ''} agendada${_todaysAppointments.length !== 1 ? 's' : ''}`}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 sm:pr-2 pb-6">
              {loadingAppointments && mostrarAgendadas ? (
                <div className="text-center py-10 text-muted-foreground">Carregando consultas...</div>
              ) : appointmentsError ? (
                <div className="text-center py-10 text-red-600">{appointmentsError}</div>
              ) : (
                // prefer appointments (client-loaded) when present; fallback to fictitious list
                (() => {
                  const todays = _todaysAppointments
                  if (!todays || todays.length === 0) {
                    return (
                      <div className="text-center py-10 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-60" />
                        <p className="text-lg font-medium">Nenhuma consulta agendada para este dia</p>
                        <p className="text-sm">Use a busca para marcar uma nova consulta.</p>
                      </div>
                    )
                  }
                  return todays.map((consulta: any) => (
                    <div
                      key={consulta.id}
                      className="rounded-xl border border-black/5 dark:border-white/10 bg-card shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-none p-5"
                    >
                      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)] items-start">
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: consulta.status === 'Confirmada' ? '#22c55e' : consulta.status === 'Pendente' ? '#fbbf24' : '#ef4444' }}
                          />
                          <div className="space-y-1">
                            <div className="font-medium flex items-center gap-2 text-foreground">
                              <Stethoscope className="h-4 w-4 text-muted-foreground" />
                              {consulta.medico}
                            </div>
                            <p className="text-sm text-muted-foreground break-words">
                              {consulta.especialidade} • {consulta.local}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-foreground">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{consulta.hora}</span>
                        </div>

                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${consulta.status === 'Confirmada' ? 'bg-green-600' : consulta.status === 'Pendente' ? 'bg-yellow-500' : 'bg-red-600'}`}>
                            {consulta.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border border-[#2563eb]/40 text-[#2563eb] hover:bg-transparent hover:text-[#2563eb] focus-visible:ring-2 focus-visible:ring-[#2563eb]/40 active:scale-[0.97]"
                          >
                            Detalhes
                          </Button>
                          {consulta.status !== 'Cancelada' && (
                            <Button type="button" variant="secondary" size="sm" className={hoverPrimaryClass}>
                              Reagendar
                            </Button>
                          )}
                          {consulta.status !== 'Cancelada' && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="transition duration-200 hover:bg-[#dc2626] focus-visible:ring-2 focus-visible:ring-[#dc2626]/60 active:scale-[0.97]"
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

            <DialogFooter className="justify-center border-t border-border pt-4 mt-2">
              <Button variant="outline" onClick={() => { setMostrarAgendadas(false) }} className="w-full sm:w-auto">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    )
  }

  // Selected report state
  const [selectedReport, setSelectedReport] = useState<any | null>(null)

  function ExamesLaudos() {
    const [reports, setReports] = useState<any[] | null>(null)
    const [loadingReports, setLoadingReports] = useState(false)
    const [reportsError, setReportsError] = useState<string | null>(null)
    const [reportDoctorName, setReportDoctorName] = useState<string | null>(null)

    useEffect(() => {
      let mounted = true
      if (!patientId) return
      setLoadingReports(true)
      setReportsError(null)
      listarRelatoriosPorPaciente(String(patientId))
        .then(res => {
          if (!mounted) return
          setReports(Array.isArray(res) ? res : [])
        })
        .catch(err => {
          console.warn('[ExamesLaudos] erro ao carregar laudos', err)
          if (!mounted) return
          setReportsError('Falha ao carregar laudos.')
        })
        .finally(() => { if (mounted) setLoadingReports(false) })

      return () => { mounted = false }
    }, [patientId])

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
          }
        } catch (e) {
          // ignore
        }
      })()
      return () => { mounted = false }
    }, [selectedReport])

    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-6">Laudos</h2>

        <div className="space-y-3">
          {loadingReports ? (
            <div className="text-center py-8 text-muted-foreground">{strings.carregando}</div>
          ) : reportsError ? (
            <div className="text-center py-8 text-red-600">{reportsError}</div>
          ) : (!reports || reports.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum laudo encontrado para este paciente.</div>
          ) : (
            reports.map((r) => (
              <div key={r.id || JSON.stringify(r)} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-4">
                <div>
                  <div className="font-medium text-foreground">{r.title || r.name || r.report_name || 'Laudo'}</div>
                  <div className="text-sm text-muted-foreground">Data: {new Date(r.report_date || r.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" className="hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground" onClick={async () => { setSelectedReport(r); }}>{strings.visualizarLaudo}</Button>
                  <Button variant="secondary" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(r)); setToast({ type: 'success', msg: 'Laudo copiado.' }) } catch { setToast({ type: 'error', msg: 'Falha ao copiar.' }) } }}>{strings.compartilhar}</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={!!selectedReport} onOpenChange={open => !open && setSelectedReport(null)}>
          <DialogContent>
              <DialogHeader>
                <DialogTitle>Laudo Médico</DialogTitle>
                <DialogDescription>
                  {selectedReport && (
                    <>
                      <div className="mb-2">
                        <div className="font-semibold text-lg">{selectedReport.title || selectedReport.name || 'Laudo'}</div>
                        <div className="text-sm text-muted-foreground">Data: {new Date(selectedReport.report_date || selectedReport.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                        {reportDoctorName && <div className="text-sm text-muted-foreground">Profissional: <strong className="text-foreground">{reportDoctorName}</strong></div>}
                      </div>

                      {/* Standardized laudo sections: CID, Exame, Diagnóstico, Conclusão, Notas (prefer HTML when available) */}
                      {(() => {
                        const cid = selectedReport.cid ?? selectedReport.cid_code ?? selectedReport.cidCode ?? selectedReport.cie ?? '-'
                        const exam = selectedReport.exam ?? selectedReport.exame ?? selectedReport.especialidade ?? selectedReport.report_type ?? '-'
                        const diagnosis = selectedReport.diagnosis ?? selectedReport.diagnostico ?? selectedReport.diagnosis_text ?? selectedReport.diagnostico_text ?? ''
                        const conclusion = selectedReport.conclusion ?? selectedReport.conclusao ?? selectedReport.conclusion_text ?? selectedReport.conclusao_text ?? ''
                        const notesHtml = selectedReport.content_html ?? selectedReport.conteudo_html ?? selectedReport.contentHtml ?? null
                        const notesText = selectedReport.content ?? selectedReport.body ?? selectedReport.conteudo ?? selectedReport.notes ?? selectedReport.observacoes ?? ''
                        return (
                          <div className="space-y-3 mb-4">
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
                        )
                      })()}
                      {/* Optional: doctor signature or footer */}
                      {selectedReport.doctor_signature && (
                        <div className="mt-4 text-sm text-muted-foreground">Assinatura: <img src={selectedReport.doctor_signature} alt="assinatura" className="inline-block h-10" /></div>
                      )}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedReport(null)}>Fechar</Button>
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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Header só com título e botão de sair */}
        <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" aria-hidden />
            <span className="font-bold">Portal do Paciente</span>
            <Button asChild variant="outline" className="ml-4 hover:!bg-primary hover:!text-white hover:!border-primary transition-colors">
              <Link href="/">
                <Home className="h-4 w-4 mr-1" /> Início
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <SimpleThemeToggle />
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              aria-label={strings.sair} 
              disabled={loading} 
              className="ml-2 bg-background hover:!bg-destructive hover:!text-white hover:!border-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" /> {strings.sair}
            </Button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar vertical */}
          <nav aria-label="Navegação do dashboard" className="w-56 bg-card border-r flex flex-col py-6 px-2 gap-2">
            <Button
              variant={tab==='dashboard'?'secondary':'ghost'}
              aria-current={tab==='dashboard'}
              onClick={()=>setTab('dashboard')}
              className={`justify-start hover:!bg-primary hover:!text-white transition-colors ${tab==='dashboard' ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Calendar className="mr-2 h-5 w-5" />{strings.dashboard}
            </Button>
            <Button
              variant={tab==='consultas'?'secondary':'ghost'}
              aria-current={tab==='consultas'}
              onClick={()=>setTab('consultas')}
              className={`justify-start hover:!bg-primary hover:!text-white transition-colors ${tab==='consultas' ? 'bg-primary/10 text-primary' : ''}`}
            >
              <Calendar className="mr-2 h-5 w-5" />{strings.consultas}
            </Button>
            <Button
              variant={tab==='exames'?'secondary':'ghost'}
              aria-current={tab==='exames'}
              onClick={()=>setTab('exames')}
              className={`justify-start hover:!bg-primary hover:!text-white transition-colors ${tab==='exames' ? 'bg-primary/10 text-primary' : ''}`}
            >
              <FileText className="mr-2 h-5 w-5" />{strings.exames}
            </Button>
            
            <Button
              variant={tab==='perfil'?'secondary':'ghost'}
              aria-current={tab==='perfil'}
              onClick={()=>setTab('perfil')}
              className={`justify-start hover:!bg-primary hover:!text-white transition-colors ${tab==='perfil' ? 'bg-primary/10 text-primary' : ''}`}
            >
              <UserCog className="mr-2 h-5 w-5" />{strings.perfil}
            </Button>
          </nav>
          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0 p-4 max-w-4xl mx-auto w-full">
            {/* Toasts de feedback */}
            {toast && (
              <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`} role="alert">{toast.msg}</div>
            )}

            {/* Loader global */}
            {loading && <div className="flex-1 flex items-center justify-center"><span>{strings.carregando}</span></div>}
            {error && <div className="flex-1 flex items-center justify-center text-red-600"><span>{error}</span></div>}

            {/* Conteúdo principal */}
            {!loading && !error && (
              <main className="flex-1">
                {tab==='dashboard' && <DashboardCards />}
                {tab==='consultas' && <Consultas />}
                {tab==='exames' && <ExamesLaudos />}
                
                {tab==='perfil' && <Perfil />}
              </main>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}