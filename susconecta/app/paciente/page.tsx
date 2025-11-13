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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, LogOut, Calendar, FileText, MessageCircle, UserCog, Home, Clock, FolderOpen, ChevronLeft, ChevronRight, MapPin, Stethoscope } from 'lucide-react'
import { SimpleThemeToggle } from '@/components/ui/simple-theme-toggle'
import { UploadAvatar } from '@/components/ui/upload-avatar'
import { useAvatarUrl } from '@/hooks/useAvatarUrl'
import Link from 'next/link'
import ProtectedRoute from '@/components/shared/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buscarPacientes, buscarPacientePorUserId, getUserInfo, listarAgendamentos, buscarMedicosPorIds, buscarMedicos, atualizarPaciente, buscarPacientePorId, getDoctorById, atualizarAgendamento, deletarAgendamento, addDeletedAppointmentId, listarTodosMedicos } from '@/lib/api'
import { CalendarRegistrationForm } from '@/components/features/forms/calendar-registration-form'
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

  // Hook para carregar automaticamente o avatar do paciente
  const { avatarUrl: retrievedAvatarUrl } = useAvatarUrl(patientId)

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

  // Sincroniza a URL do avatar recuperada com o profileData
  useEffect(() => {
    if (retrievedAvatarUrl) {
      setProfileData((prev: any) => ({
        ...prev,
        foto_url: retrievedAvatarUrl
      }))
    }
  }, [retrievedAvatarUrl])

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
    const router = useRouter()
    const [nextAppt, setNextAppt] = useState<string | null>(null)
    const [examsCount, setExamsCount] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [medicos, setMedicos] = useState<any[]>([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [especialidades, setEspecialidades] = useState<string[]>([])
    const [especialidadesLoading, setEspecialidadesLoading] = useState(true)

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

    // Carregar especialidades únicas dos médicos ao montar
    useEffect(() => {
      let mounted = true
      setEspecialidadesLoading(true)
      ;(async () => {
        try {
          console.log('[DashboardCards] Carregando especialidades...')
          const todos = await listarTodosMedicos().catch((err) => {
            console.error('[DashboardCards] Erro ao buscar médicos:', err)
            return []
          })
          console.log('[DashboardCards] Médicos carregados:', todos?.length || 0, todos)
          if (!mounted) return
          
          // Mapeamento de correções para especialidades com encoding errado
          const specialtyFixes: Record<string, string> = {
            'Cl\u00EDnica Geral': 'Clínica Geral',
            'Cl\u00E3nica Geral': 'Clínica Geral',
            'Cl?nica Geral': 'Clínica Geral',
            'Cl©nica Geral': 'Clínica Geral',
            'Cl\uFFFDnica Geral': 'Clínica Geral',
          };
          
          let specs: string[] = []
          if (Array.isArray(todos) && todos.length > 0) {
            // Extrai TODAS as especialidades únicas do campo specialty
            specs = Array.from(new Set(
              todos
                .map((m: any) => {
                  let spec = m.specialty || m.speciality || ''
                  // Aplica correções conhecidas
                  for (const [wrong, correct] of Object.entries(specialtyFixes)) {
                    spec = String(spec).replace(new RegExp(wrong, 'g'), correct)
                  }
                  // Normaliza caracteres UTF-8 e limpa
                  try {
                    const normalized = String(spec || '').normalize('NFC').trim()
                    return normalized
                  } catch (e) {
                    return String(spec || '').trim()
                  }
                })
                .filter((s: string) => s && s.length > 0)
            ))
          }
          
          console.log('[DashboardCards] Especialidades encontradas:', specs)
          setEspecialidades(specs.length > 0 ? specs.sort() : [])
        } catch (e) {
          console.error('[DashboardCards] erro ao carregar especialidades', e)
          if (mounted) setEspecialidades([])
        } finally {
          if (mounted) setEspecialidadesLoading(false)
        }
      })()
      return () => { mounted = false }
    }, [])

    // Debounced search por médico
    useEffect(() => {
      let mounted = true
      const term = String(searchQuery || '').trim()
      const handle = setTimeout(async () => {
        if (!mounted) return
        if (!term || term.length < 2) {
          setMedicos([])
          return
        }
        try {
          setSearchLoading(true)
          const results = await buscarMedicos(term).catch(() => [])
          if (!mounted) return
          setMedicos(Array.isArray(results) ? results : [])
        } catch (e) {
          if (mounted) setMedicos([])
        } finally {
          if (mounted) setSearchLoading(false)
        }
      }, 300)
      return () => { mounted = false; clearTimeout(handle) }
    }, [searchQuery])

    const handleSearchMedico = (medico: any) => {
      const qs = new URLSearchParams()
      qs.set('tipo', 'teleconsulta')
      if (medico?.full_name) qs.set('medico', medico.full_name)
      if (medico?.specialty) qs.set('especialidade', medico.specialty || medico.especialidade || '')
      qs.set('origin', 'paciente')
      router.push(`/paciente/resultados?${qs.toString()}`)
      setSearchQuery('')
      setMedicos([])
    }

    const handleEspecialidadeClick = (especialidade: string) => {
      const qs = new URLSearchParams()
      qs.set('tipo', 'teleconsulta')
      qs.set('especialidade', especialidade)
      qs.set('origin', 'paciente')
      router.push(`/paciente/resultados?${qs.toString()}`)
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Section com Busca */}
        <section className="rounded-2xl sm:rounded-3xl bg-linear-to-br from-primary to-primary/90 p-4 sm:p-6 md:p-8 text-primary-foreground shadow-lg">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <div className="text-center space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Encontre especialistas e clínicas</h2>
              <p className="text-sm sm:text-base md:text-lg opacity-90">Busque por médico, especialidade ou localização</p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Input
                placeholder="Buscar médico, especialidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 rounded-xl bg-white text-foreground placeholder:text-muted-foreground text-sm sm:text-base border-0 shadow-md"
              />
              {searchQuery && medicos.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-border shadow-lg z-50 max-h-64 overflow-y-auto">
                  {medicos.map((medico) => (
                    <button
                      key={medico.id}
                      onClick={() => handleSearchMedico(medico)}
                      className="w-full text-left px-4 py-3 sm:py-4 hover:bg-primary/10 border-b border-border/50 last:border-0 transition-colors text-foreground text-sm sm:text-base"
                    >
                      <div className="font-semibold">{medico.full_name || 'Médico'}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{medico.specialty || medico.especialidade || ''}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Especialidades */}
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base font-semibold opacity-90">Especialidades populares</p>
              {especialidadesLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-10 w-24 bg-white/20 rounded-full animate-pulse"></div>
                  ))}
                </div>
              ) : especialidades && especialidades.length > 0 ? (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {especialidades.map((esp) => (
                    <button
                      key={esp}
                      onClick={() => handleEspecialidadeClick(esp)}
                      className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-xs sm:text-sm transition-colors border border-white/30 whitespace-nowrap"
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-75">Nenhuma especialidade disponível</p>
              )}
            </div>
          </div>
        </section>

        {/* Cards com Informações */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-4 md:grid-cols-2">
          <Card className="group rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 md:p-5 backdrop-blur-sm shadow-sm transition hover:shadow-md">
            <div className="flex h-32 sm:h-36 md:h-40 w-full flex-col items-center justify-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Calendar className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden />
              </div>
              <span className="text-base sm:text-lg md:text-lg font-semibold text-muted-foreground tracking-wide">
                {strings.proximaConsulta}
              </span>
              <span className="text-base sm:text-lg md:text-xl font-semibold text-foreground" aria-live="polite">
                {loading ? strings.carregando : (nextAppt ?? '-')}
              </span>
            </div>
          </Card>

          <Card className="group rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 md:p-5 backdrop-blur-sm shadow-sm transition hover:shadow-md">
            <div className="flex h-32 sm:h-36 md:h-40 w-full flex-col items-center justify-center gap-2 sm:gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden />
              </div>
              <span className="text-base sm:text-lg md:text-lg font-semibold text-muted-foreground tracking-wide">
                {strings.ultimosExames}
              </span>
              <span className="text-base sm:text-lg md:text-xl font-semibold text-foreground" aria-live="polite">
                {loading ? strings.carregando : (examsCount !== null ? String(examsCount) : '-')}
              </span>
            </div>
          </Card>
        </div>
      </div>
    )
  }

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
    const hoverPrimaryClass = "hover-primary-blue focus-visible:ring-2 focus-visible:ring-blue-500/60 active:scale-[0.97]"
    const activeToggleClass = "w-full transition duration-200 focus-visible:ring-2 focus-visible:ring-blue-500/60 active:scale-[0.97] bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
    const inactiveToggleClass = "w-full transition duration-200 bg-slate-50 text-blue-500 border border-blue-500/30 hover:bg-blue-50 hover:text-blue-500 dark:bg-white/5 dark:text-white dark:hover:bg-blue-500/20 dark:border-white/20"
    const hoverPrimaryIconClass = "rounded-xl bg-white text-slate-900 border border-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover-primary-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:shadow-none"
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(currentDate); selectedDate.setHours(0, 0, 0, 0);
    const isSelectedDateToday = selectedDate.getTime() === today.getTime()

  // Appointments state (loaded when component mounts)
  const [appointments, setAppointments] = useState<any[] | null>(null)
  const [doctorsMap, setDoctorsMap] = useState<Record<string, any>>({}) // Store doctor info by ID
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null)
    // expanded appointment id for inline details (kept for possible fallback)
    const [expandedId, setExpandedId] = useState<number | null>(null)
    // selected appointment for modal details
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

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
          }).filter((consulta: any) => {
            // Filter out cancelled appointments (those with cancelled_at set OR status='cancelled')
            const raw = rows.find((r: any) => String(r.id) === String(consulta.id));
            if (!raw) return false;
            
            // Check cancelled_at field
            const cancelled = raw.cancelled_at;
            if (cancelled && cancelled !== '' && cancelled !== 'null') return false;
            
            // Check status field
            if (raw.status && String(raw.status).toLowerCase() === 'cancelled') return false;
            
            return true;
          })

          setDoctorsMap(doctorsMap)
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

    // helper: present a localized label for appointment status
    const statusLabel = (s: any) => {
      const raw = (s === null || s === undefined) ? '' : String(s)
      const key = raw.toLowerCase()
      const map: Record<string,string> = {
        'requested': 'Solicitado',
        'request': 'Solicitado',
        'confirmed': 'Confirmado',
        'confirmada': 'Confirmada',
        'confirmado': 'Confirmado',
        'completed': 'Concluído',
        'concluído': 'Concluído',
        'cancelled': 'Cancelado',
        'cancelada': 'Cancelada',
        'cancelado': 'Cancelado',
        'pending': 'Pendente',
        'pendente': 'Pendente',
        'checked_in': 'Registrado',
        'in_progress': 'Em andamento',
        'no_show': 'Não compareceu'
      }
      return map[key] || raw
    }

    // map an appointment (row) to the CalendarRegistrationForm's formData shape
  const mapAppointmentToFormData = (appointment: any) => {
      // Use the raw appointment with all fields: doctor_id, scheduled_at, appointment_type, etc.
      const schedIso = appointment.scheduled_at || (appointment.data && appointment.hora ? `${appointment.data}T${appointment.hora}` : null) || null
      const baseDate = schedIso ? new Date(schedIso) : new Date()
      const appointmentDate = schedIso ? baseDate.toISOString().split('T')[0] : ''
      const startTime = schedIso ? baseDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : (appointment.hora || '')
      const duration = appointment.duration_minutes ?? appointment.duration ?? 30
      
      // Get doctor name from doctorsMap if available
      const docName = appointment.medico || (appointment.doctor_id ? doctorsMap[String(appointment.doctor_id)]?.full_name : null) || appointment.doctor_name || appointment.professional_name || '---'
      
      return {
        id: appointment.id,
        patientName: docName,
        patientId: null,
        doctorId: appointment.doctor_id ?? null,
        professionalName: docName,
        appointmentDate,
        startTime,
        endTime: '',
        status: appointment.status || undefined,
        appointmentType: appointment.appointment_type || appointment.type || (appointment.local ? 'presencial' : 'teleconsulta'),
        duration_minutes: duration,
        notes: appointment.notes || '',
      }
    }

    

    return (
      <div className="space-y-6">
        {/* Consultas Agendadas Section */}
        <section className="bg-card shadow-md rounded-lg border border-border p-4 sm:p-5 md:p-6">
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <header>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">Suas Consultas Agendadas</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Gerencie suas consultas confirmadas, pendentes ou canceladas.</p>
            </header>

            {/* Date Navigation */}
            <div className="flex flex-col gap-2 sm:gap-3 rounded-2xl border border-primary/20 bg-linear-to-r from-primary/5 to-primary/10 p-3 sm:p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('prev') }}
                  aria-label="Dia anterior"
                  className={`shadow-sm hover:bg-primary! hover:text-white! hover:border-primary! transition-all p-1.5 sm:p-2`}
                >
                  <ChevronLeft className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-xs sm:text-sm md:text-base font-semibold text-foreground flex-1 sm:flex-none line-clamp-1">{formatDatePt(currentDate)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={(e: any) => { e.stopPropagation(); e.preventDefault(); navigateDate('next') }}
                  aria-label="Próximo dia"
                  className={`shadow-sm hover:bg-primary! hover:text-white! hover:border-primary! transition-all p-1.5 sm:p-2`}
                >
                  <ChevronRight className="h-4 w-4 sm:h-4 sm:w-4" />
                </Button>
                {isSelectedDateToday && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    disabled
                    className="border border-border/50 text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97] hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground text-xs px-2 py-1 h-auto"
                  >
                    Hoje
                  </Button>
                )}
              </div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1.5 rounded-lg w-fit">
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
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-3 sm:px-4">
                        <div className="rounded-full bg-primary/10 p-3 sm:p-4 mb-3 sm:mb-4">
                          <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                        </div>
                        <p className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">Nenhuma consulta agendada para este dia</p>
                        <p className="text-sm sm:text-base text-muted-foreground text-center max-w-sm">Use a busca acima para marcar uma nova consulta ou navegue entre os dias.</p>
                      </div>
                    )
                  }
                  return todays.map((consulta: any) => (
                    <div
                      key={consulta.id}
                      className="rounded-2xl border border-primary/15 bg-card shadow-md hover:shadow-xl transition-all duration-300 p-4 sm:p-5 md:p-6 hover:border-primary/30 hover:bg-card/95"
                    >
                      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_1fr_1.2fr] items-start">
                        {/* Doctor Info */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <span
                            className="mt-1 sm:mt-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0 rounded-full shadow-sm"
                            style={{ backgroundColor: (consulta.status === 'Confirmada' || consulta.status === 'confirmed') ? '#10b981' : '#ef4444' }}
                            aria-hidden
                          />
                          <div className="space-y-2 sm:space-y-3 min-w-0">
                            <div className="font-bold flex items-center gap-1.5 sm:gap-2.5 text-foreground text-sm sm:text-base md:text-lg leading-tight">
                              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                              <span className="truncate">{consulta.medico}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground wrap-break-word leading-relaxed">
                              <span className="font-medium text-foreground/70">{consulta.especialidade}</span>
                              <span className="mx-1 sm:mx-1.5">•</span>
                              <span>{consulta.local}</span>
                            </p>
                          </div>
                        </div>

                        {/* Time */}
                        <div className="flex items-center justify-start gap-2 sm:gap-2.5 text-foreground">
                          <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                          <span className="font-bold text-sm sm:text-base md:text-lg">{consulta.hora}</span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center justify-start">
                          <span className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full text-xs font-bold text-white shadow-md transition-all ${
                            consulta.status === 'Confirmada' || consulta.status === 'confirmed'
                              ? 'bg-linear-to-r from-green-500 to-green-600 shadow-green-500/20' 
                              : 'bg-linear-to-r from-red-500 to-red-600 shadow-red-500/20'
                          }`}>
                            {statusLabel(consulta.status)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-stretch gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="border border-primary/30 text-primary bg-primary/5 hover:bg-primary! hover:text-white! hover:border-primary! transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 text-xs sm:text-xs font-semibold flex-1"
                            onClick={() => setSelectedAppointment(consulta)}
                          >
                            Detalhes
                          </Button>
                          {/* Reagendar removed by request */}
                          {consulta.status !== 'Cancelada' && consulta.status !== 'cancelled' && (
                            <Button
                              type="button"
                              size="sm"
                              className="border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive! hover:text-white! hover:border-destructive! transition-all duration-200 focus-visible:ring-2 focus-visible:ring-destructive/40 active:scale-95 text-xs sm:text-xs font-semibold flex-1"
                              onClick={async () => {
                                try {
                                  const ok = typeof window !== 'undefined' ? window.confirm('Deseja realmente cancelar esta consulta?') : true
                                  if (!ok) return

                                  // Prefer PATCH to mark appointment as cancelled (safer under RLS)
                                  try {
                                    await atualizarAgendamento(consulta.id, {
                                      cancelled_at: new Date().toISOString(),
                                      status: 'cancelled',
                                      cancellation_reason: 'Cancelado pelo paciente'
                                    })
                                  } catch (patchErr) {
                                    // Fallback: try hard delete if server allows it
                                    try {
                                      await deletarAgendamento(consulta.id)
                                    } catch (delErr) {
                                      // Re-throw original patch error if both fail
                                      throw patchErr || delErr
                                    }
                                  }

                                  // remove from local list so UI updates immediately
                                  setAppointments((prev) => {
                                    if (!prev) return prev
                                    return prev.filter((a: any) => String(a.id) !== String(consulta.id))
                                  })
                                  // if modal open for this appointment, close it
                                  if (selectedAppointment && String(selectedAppointment.id) === String(consulta.id)) setSelectedAppointment(null)
                                  // Optionally persist to deleted cache to help client-side filtering
                                  try { addDeletedAppointmentId(consulta.id) } catch(e) {}
                                  setToast({ type: 'success', msg: 'Consulta cancelada.' })
                                } catch (err: any) {
                                  console.error('[Consultas] falha ao cancelar agendamento', err)
                                  try { setToast({ type: 'error', msg: err?.message || 'Falha ao cancelar a consulta.' }) } catch (e) {}
                                }
                              }}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>

                        {/* Inline detalhes removed: modal will show details instead */}

                      </div>
                    </div>
                  ))
                })()
              )}
            </div>
          </div>
        </section>

        

        <Dialog open={!!selectedAppointment} onOpenChange={open => !open && setSelectedAppointment(null)}>
          <DialogContent className="w-full sm:mx-auto sm:my-8 max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden sm:p-6 p-4">
            <DialogHeader>
              <DialogTitle>Detalhes da Consulta</DialogTitle>
              <DialogDescription className="sr-only">Detalhes da consulta</DialogDescription>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 max-h-[70vh] overflow-y-auto text-sm text-foreground">
                {selectedAppointment ? (
                  <>
                    <div className="space-y-3">
                      <div><span className="font-medium">Profissional:</span> {selectedAppointment.medico || '-'}</div>
                      <div><span className="font-medium">Especialidade:</span> {selectedAppointment.especialidade || '-'}</div>
                    </div>

                    <div className="space-y-3">
                      <div><span className="font-medium">Data:</span> {(function(d:any,h:any){ try{ const dt = new Date(String(d) + 'T' + String(h||'00:00')); return formatDatePt(dt) }catch(e){ return String(d||'-') } })(selectedAppointment.data, selectedAppointment.hora)}</div>
                      <div><span className="font-medium">Hora:</span> {selectedAppointment.hora || '-'}</div>
                      <div><span className="font-medium">Status:</span> {statusLabel(selectedAppointment.status) || '-'}</div>
                    </div>
                  </>
                ) : (
                  <div>Carregando...</div>
                )}
              </div>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center mt-4">
              <div className="flex w-full sm:w-auto justify-between sm:justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedAppointment(null)} className="transition duration-200 hover:bg-primary/10 hover:text-primary min-w-[110px]">
                  Fechar
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reagendar feature removed */}

      </div>
    )
  }

  // Selected report state
  const [selectedReport, setSelectedReport] = useState<any | null>(null)

  function ExamesLaudos() {
    const router = useRouter()
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'custom'>('newest')
  const [filterDate, setFilterDate] = useState<string>('')

  // derived filtered list based on search term and date filters
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

    // Start with all reports or filtered by search
    let filtered = !q ? reports : reports.filter((r: any) => {
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

    // Apply date filter if specified
    if (filterDate) {
      const filterDateObj = new Date(filterDate)
      filterDateObj.setHours(0, 0, 0, 0)
      
      filtered = filtered.filter((r: any) => {
        const reportDateObj = new Date(r.report_date || r.created_at || Date.now())
        reportDateObj.setHours(0, 0, 0, 0)
        return reportDateObj.getTime() === filterDateObj.getTime()
      })
    }

    // Apply sorting
    const sorted = [...filtered]
    if (sortOrder === 'newest') {
      sorted.sort((a: any, b: any) => {
        const dateA = new Date(a.report_date || a.created_at || 0).getTime()
        const dateB = new Date(b.report_date || b.created_at || 0).getTime()
        return dateB - dateA // Newest first
      })
    } else if (sortOrder === 'oldest') {
      sorted.sort((a: any, b: any) => {
        const dateA = new Date(a.report_date || a.created_at || 0).getTime()
        const dateB = new Date(b.report_date || b.created_at || 0).getTime()
        return dateA - dateB // Oldest first
      })
    }

    return sorted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports, searchTerm, doctorsMap, remoteMatch, sortOrder, filterDate])

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

    return (<>
      <section className="bg-card shadow-md rounded-lg border border-border p-3 sm:p-4 md:p-6">
        <h2 className="text-xl sm:text-2xl md:text-2xl font-bold mb-4 sm:mb-5 md:mb-6">Laudos</h2>

        <div className="space-y-3">
          {/* Search box: allow searching by id, doctor, exam, date or text */}
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input placeholder="Pesquisar laudo, médico, exame, data ou id" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setReportsPage(1) }} className="text-xs sm:text-sm" />
            {searchTerm && (
              <Button variant="ghost" onClick={() => { setSearchTerm(''); setReportsPage(1) }} className="text-xs sm:text-sm w-full sm:w-auto">Limpar</Button>
            )}
          </div>

          {/* Date filter and sort controls */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap">
            {/* Sort buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm"
                variant={sortOrder === 'newest' ? 'default' : 'outline'}
                onClick={() => { setSortOrder('newest'); setReportsPage(1) }}
                className="text-xs sm:text-sm"
              >
                Mais Recente
              </Button>
              <Button 
                size="sm"
                variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                onClick={() => { setSortOrder('oldest'); setReportsPage(1) }}
                className="text-xs sm:text-sm"
              >
                Mais Antigo
              </Button>
            </div>

            {/* Date picker */}
            <div className="flex gap-2 items-center">
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); setReportsPage(1) }}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 border border-border rounded bg-background"
              />
              {filterDate && (
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => { setFilterDate(''); setReportsPage(1) }}
                  className="text-xs sm:text-sm"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
          
          {loadingReports ? (
            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">{strings.carregando}</div>
          ) : reportsError ? (
            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-red-600">{reportsError}</div>
          ) : (!reports || reports.length === 0) ? (
            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">Nenhum laudo encontrado para este paciente.</div>
            ) : (filteredReports.length === 0) ? (
              searchingRemote ? (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">Buscando laudo...</div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">Nenhum laudo corresponde à pesquisa.</div>
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
              <div key={r.id || JSON.stringify(r)} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-3 sm:p-4 md:p-5 gap-3 md:gap-0">
                <div className="min-w-0">
                  {(() => {
                    const maybeId = r?.doctor_id || r?.created_by || r?.doctor || null
                    if (resolvingDoctors && maybeId && !doctorsMap[String(maybeId)]) {
                      return <div className="font-medium text-xs sm:text-base md:text-lg text-muted-foreground">{strings.carregando}</div>
                    }
                    return <div className="font-medium text-foreground text-sm sm:text-lg md:text-lg truncate">{reportTitle(r)}</div>
                  })()}
                  <div className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Data: {new Date(r.report_date || r.created_at || Date.now()).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2 w-full md:w-auto flex-col sm:flex-row">
                  <Button variant="outline" className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm w-full md:w-auto" onClick={async () => { router.push(`/laudos/${r.id}`); }}>{strings.visualizarLaudo}</Button>
                  <Button variant="secondary" className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm w-full md:w-auto" onClick={async () => { try { await navigator.clipboard.writeText(JSON.stringify(r)); setToast({ type: 'success', msg: 'Laudo copiado.' }) } catch { setToast({ type: 'error', msg: 'Falha ao copiar.' }) } }}>{strings.compartilhar}</Button>
                </div>
              </div>
                  ))}

                  {/* Pagination controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2 mt-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">Mostrando {Math.min(start+1, total)}–{Math.min(end, total)} de {total}</div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReportsPage(p => Math.max(1, p-1))} disabled={page <= 1} className="px-2 sm:px-3 text-xs sm:text-sm">Anterior</Button>
                      <div className="text-xs sm:text-sm text-muted-foreground">{page} / {totalPages}</div>
                      <Button size="sm" variant="outline" onClick={() => setReportsPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages} className="px-2 sm:px-3 text-xs sm:text-sm">Próxima</Button>
                    </div>
                  </div>
                </>
              )
            })()
          )}
        </div>
 
        </section>

        {/* Modal removed - now using dedicated page /app/laudos/[id] */}
    </>
    )
  }

  

  function Perfil() {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-5 md:gap-6 px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-10">
        {/* Header com Título e Botão */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold">Meu Perfil</h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">Bem-vindo à sua área exclusiva.</p>
          </div>
          {!isEditingProfile ? (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto whitespace-nowrap text-xs sm:text-sm"
              onClick={() => setIsEditingProfile(true)}
            >
               Editar Perfil
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                onClick={handleSaveProfile}
              >
                ✓ Salvar
              </Button>
              <Button 
                variant="outline"
                className="text-xs sm:text-sm"
                onClick={handleCancelEdit}
              >
                ✕ Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Grid de 3 colunas (2 + 1) */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {/* Coluna Esquerda - Informações Pessoais */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Informações Pessoais */}
            <div className="border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg md:text-lg font-semibold mb-3 sm:mb-4">Informações Pessoais</h3>

              <div className="space-y-3 sm:space-y-4">
                {/* Nome Completo */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    Nome Completo
                  </Label>
                  <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground font-medium">
                    {profileData.nome || "Não preenchido"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este campo não pode ser alterado
                  </p>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    Email
                  </Label>
                  <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground">
                    {profileData.email || "Não preenchido"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este campo não pode ser alterado
                  </p>
                </div>

                {/* Telefone */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    Telefone
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileData.telefone || ""}
                      onChange={(e) => handleProfileChange('telefone', e.target.value)}
                      className="mt-2 text-xs sm:text-sm"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  ) : (
                    <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground">
                      {profileData.telefone || "Não preenchido"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Endereço e Contato */}
            <div className="border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg md:text-lg font-semibold mb-3 sm:mb-4">Endereço e Contato</h3>

              <div className="space-y-3 sm:space-y-4">
                {/* Logradouro */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    Logradouro
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileData.endereco || ""}
                      onChange={(e) => handleProfileChange('endereco', e.target.value)}
                      className="mt-2 text-xs sm:text-sm"
                      placeholder="Rua, avenida, etc."
                    />
                  ) : (
                    <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground">
                      {profileData.endereco || "Não preenchido"}
                    </div>
                  )}
                </div>

                {/* Cidade */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    Cidade
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileData.cidade || ""}
                      onChange={(e) => handleProfileChange('cidade', e.target.value)}
                      className="mt-2 text-xs sm:text-sm"
                      placeholder="São Paulo"
                    />
                  ) : (
                    <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground">
                      {profileData.cidade || "Não preenchido"}
                    </div>
                  )}
                </div>

                {/* CEP */}
                <div>
                  <Label className="text-xs sm:text-sm md:text-sm font-medium text-muted-foreground">
                    CEP
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      value={profileData.cep || ""}
                      onChange={(e) => handleProfileChange('cep', e.target.value)}
                      className="mt-2 text-xs sm:text-sm"
                      placeholder="00000-000"
                    />
                  ) : (
                    <div className="mt-2 p-2 sm:p-3 bg-muted rounded text-xs sm:text-sm md:text-base text-foreground">
                      {profileData.cep || "Não preenchido"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Foto do Perfil */}
          <div>
            <div className="border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <h3 className="text-base sm:text-lg md:text-lg font-semibold mb-3 sm:mb-4">Foto do Perfil</h3>

              {isEditingProfile ? (
                <div className="space-y-3 sm:space-y-4">
                  <UploadAvatar
                    userId={profileData.id}
                    currentAvatarUrl={profileData.foto_url || "/avatars/01.png"}
                    onAvatarChange={(newUrl) => handleProfileChange('foto_url', newUrl)}
                    userName={profileData.nome}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 sm:gap-4">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
                    <AvatarImage src={profileData.foto_url} alt={profileData.nome || 'Avatar'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg sm:text-xl md:text-2xl font-bold">
                      {profileData.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PC'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center space-y-2">
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                      {profileData.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PC'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderização principal
  return (
    <ProtectedRoute requiredUserType={["paciente"]}>
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {/* Header com informações do paciente */}
        <header className="sticky top-0 z-40 bg-card shadow-md rounded-lg border border-border p-3 sm:p-4 md:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 md:h-12 md:w-12">
              <AvatarImage src={profileData.foto_url} alt={profileData.nome || 'Avatar'} />
              <AvatarFallback className="bg-primary text-white font-bold text-sm sm:text-base">{profileData.nome?.charAt(0) || 'P'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm md:text-sm text-muted-foreground">Conta do paciente</span>
              <span className="font-bold text-sm sm:text-base md:text-lg leading-none">{profileData.nome || 'Paciente'}</span>
              <span className="text-xs sm:text-sm md:text-sm text-muted-foreground truncate">{profileData.email || 'Email não disponível'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <SimpleThemeToggle />
            <Button asChild variant="outline" className="hover:bg-primary! hover:text-white! hover:border-primary! transition-colors flex-1 sm:flex-none text-xs sm:text-sm">
              <Link href="/">
                <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Início
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
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr] gap-4 sm:gap-5 md:gap-6">
          {/* Sidebar vertical - sticky */}
          <aside className="sticky top-24 h-fit md:top-24">
            <nav aria-label="Navegação do dashboard" className="bg-card shadow-md rounded-lg border border-border p-1.5 sm:p-2 md:p-3 z-30">
              <div className="grid grid-cols-2 md:grid-cols-1 gap-1 sm:gap-1.5">
                <Button
                  variant={tab==='dashboard'?'default':'ghost'}
                  aria-current={tab==='dashboard'}
                  onClick={()=>setTab('dashboard')}
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 transition-colors hover:bg-primary! hover:text-white! cursor-pointer text-xs px-1.5 sm:px-3 py-1.5 sm:py-2 h-auto`}
                  title="Dashboard"
                >
                  <Calendar className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 flex-shrink-0" /><span className="text-xs sm:text-sm">{strings.dashboard}</span>
                </Button>
                <Button
                  variant={tab==='consultas'?'default':'ghost'}
                  aria-current={tab==='consultas'}
                  onClick={()=>setTab('consultas')}
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 transition-colors hover:bg-primary! hover:text-white! cursor-pointer text-xs px-1.5 sm:px-3 py-1.5 sm:py-2 h-auto`}
                  title="Consultas"
                >
                  <Calendar className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 flex-shrink-0" /><span className="text-xs sm:text-sm">{strings.consultas}</span>
                </Button>
                <Button
                  variant={tab==='exames'?'default':'ghost'}
                  aria-current={tab==='exames'}
                  onClick={()=>setTab('exames')}
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 transition-colors hover:bg-primary! hover:text-white! cursor-pointer text-xs px-1.5 sm:px-3 py-1.5 sm:py-2 h-auto`}
                  title="Exames"
                >
                  <FileText className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 flex-shrink-0" /><span className="text-xs sm:text-sm">{strings.exames}</span>
                </Button>
                <Button
                  variant={tab==='perfil'?'default':'ghost'}
                  aria-current={tab==='perfil'}
                  onClick={()=>setTab('perfil')}
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 transition-colors hover:bg-primary! hover:text-white! cursor-pointer text-xs px-1.5 sm:px-3 py-1.5 sm:py-2 h-auto`}
                  title="Perfil"
                >
                  <UserCog className="h-4 w-4 sm:h-4 sm:w-4 md:h-4 md:w-4 flex-shrink-0" /><span className="text-xs sm:text-sm">{strings.perfil}</span>
                </Button>
              </div>
            </nav>
          </aside>
          
          {/* Conteúdo principal */}
          <main className="flex-1 w-full">
            {/* Toasts de feedback */}
            {toast && (
              <div className={`fixed top-24 right-2 sm:right-4 z-50 px-3 sm:px-4 py-2 rounded shadow-lg text-xs sm:text-sm ${toast.type==='success'?'bg-green-600 text-white':'bg-red-600 text-white'}`} role="alert">{toast.msg}</div>
            )}

            {/* Loader global */}
            {loading && <div className="flex-1 flex items-center justify-center"><span className="text-xs sm:text-sm">{strings.carregando}</span></div>}
            {error && <div className="flex-1 flex items-center justify-center text-red-600"><span className="text-xs sm:text-sm">{error}</span></div>}

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