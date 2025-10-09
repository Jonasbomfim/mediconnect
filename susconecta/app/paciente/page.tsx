'use client'
// import { useAuth } from '@/hooks/useAuth' // removido duplicado

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, LogOut, Calendar, FileText, MessageCircle, UserCog, Home, Clock, FolderOpen, ChevronLeft, ChevronRight, MapPin, Stethoscope } from 'lucide-react'
import { SimpleThemeToggle } from '@/components/simple-theme-toggle'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [tab, setTab] = useState<'dashboard'|'consultas'|'exames'|'mensagens'|'perfil'>('dashboard')

  // Simulação de loaders, empty states e erro
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{type: 'success'|'error', msg: string}|null>(null)

  // Acessibilidade: foco visível e ordem de tabulação garantidos por padrão nos botões e inputs

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
  const [profileData, setProfileData] = useState({
    nome: "Maria Silva Santos",
    email: user?.email || "paciente@example.com",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123",
    cidade: "São Paulo",
    cep: "01234-567",
    biografia: "Paciente desde 2020. Histórico de consultas e exames regulares.",
  })

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }
  const handleSaveProfile = () => {
    setIsEditingProfile(false)
    setToast({ type: 'success', msg: strings.sucesso })
  }
  const handleCancelEdit = () => {
    setIsEditingProfile(false)
  }
  function DashboardCards() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex flex-col items-center justify-center p-4">
          <Calendar className="mb-2 text-primary" aria-hidden />
          <span className="font-semibold">{strings.proximaConsulta}</span>
          <span className="text-2xl">12/10/2025</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4">
          <FileText className="mb-2 text-primary" aria-hidden />
          <span className="font-semibold">{strings.ultimosExames}</span>
          <span className="text-2xl">2</span>
        </Card>
        <Card className="flex flex-col items-center justify-center p-4">
          <MessageCircle className="mb-2 text-primary" aria-hidden />
          <span className="font-semibold">{strings.mensagensNaoLidas}</span>
          <span className="text-2xl">1</span>
        </Card>
  </div>
    )
  }

  // Consultas fictícias
  const [currentDate, setCurrentDate] = useState(new Date())
  const consultasFicticias = [
    {
      id: 1,
      medico: "Dr. Carlos Andrade",
      especialidade: "Cardiologia",
      local: "Clínica Coração Feliz",
      data: new Date().toISOString().split('T')[0],
      hora: "09:00",
      status: "Confirmada"
    },
    {
      id: 2,
      medico: "Dra. Fernanda Lima",
      especialidade: "Dermatologia",
      local: "Clínica Pele Viva",
      data: new Date().toISOString().split('T')[0],
      hora: "14:30",
      status: "Pendente"
    },
    {
      id: 3,
      medico: "Dr. João Silva",
      especialidade: "Ortopedia",
      local: "Hospital Ortopédico",
      data: (() => { let d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split('T')[0] })(),
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

  const todayStr = currentDate.toISOString().split('T')[0];
  const consultasDoDia = consultasFicticias.filter(c => c.data === todayStr);

  function Consultas() {
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

    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <header className="text-center space-y-2">
            <h2 className="text-3xl font-semibold text-foreground">Agende sua próxima consulta</h2>
            <p className="text-muted-foreground">Escolha o formato ideal, selecione a especialidade e encontre o profissional perfeito para você.</p>
          </header>

          <div className="space-y-6 rounded-lg border border-border bg-muted/40 p-6">
            <div className="space-y-3">
              <Label>Tipo de consulta</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  className={tipoConsulta === 'teleconsulta' ? activeToggleClass : inactiveToggleClass}
                  aria-pressed={tipoConsulta === 'teleconsulta'}
                  onClick={() => setTipoConsulta('teleconsulta')}
                >
                  Teleconsulta
                </Button>
                <Button
                  type="button"
                  className={tipoConsulta === 'presencial' ? activeToggleClass : inactiveToggleClass}
                  aria-pressed={tipoConsulta === 'presencial'}
                  onClick={() => setTipoConsulta('presencial')}
                >
                  Consulta no local
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Select value={especialidade} onValueChange={setEspecialidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiologia">Cardiologia</SelectItem>
                    <SelectItem value="pediatria">Pediatria</SelectItem>
                    <SelectItem value="dermatologia">Dermatologia</SelectItem>
                    <SelectItem value="ortopedia">Ortopedia</SelectItem>
                    <SelectItem value="ginecologia">Ginecologia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Localização (opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={localizacao}
                    onChange={event => setLocalizacao(event.target.value)}
                    placeholder="Cidade ou estado"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <Button className={`w-full md:w-auto md:self-start ${hoverPrimaryClass}`}>Pesquisar</Button>
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              className="transition duration-200 bg-white text-[#1e293b] border border-black/10 rounded-md shadow-[0_2px_6px_rgba(0,0,0,0.03)] hover:bg-[#2563eb] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:hover:bg-[#2563eb] dark:hover:text-white"
              onClick={() => setMostrarAgendadas(true)}
            >
              Ver consultas agendadas
            </Button>
          </div>
        </div>

        <Dialog open={mostrarAgendadas} onOpenChange={open => setMostrarAgendadas(open)}>
          <DialogContent className="max-w-3xl space-y-6 sm:max-h-[85vh] overflow-hidden">
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
                  onClick={() => navigateDate('prev')}
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
                  onClick={() => navigateDate('next')}
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
                {consultasDoDia.length} consulta{consultasDoDia.length !== 1 ? 's' : ''} agendada{consultasDoDia.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1 sm:pr-2">
              {consultasDoDia.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-60" />
                  <p className="text-lg font-medium">Nenhuma consulta agendada para este dia</p>
                  <p className="text-sm">Use a busca para marcar uma nova consulta.</p>
                </div>
              ) : (
                consultasDoDia.map(consulta => (
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
              )}
            </div>

            <DialogFooter className="justify-center border-t border-border pt-4 mt-2">
              <Button variant="outline" onClick={() => setMostrarAgendadas(false)} className="w-full sm:w-auto">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    )
  }

  // Exames e laudos fictícios
  const examesFicticios = [
    {
      id: 1,
      nome: "Hemograma Completo",
      data: "2025-09-20",
      status: "Disponível",
      prontuario: "Paciente apresenta hemograma dentro dos padrões de normalidade. Sem alterações significativas.",
    },
    {
      id: 2,
      nome: "Raio-X de Tórax",
      data: "2025-08-10",
      status: "Disponível",
      prontuario: "Exame radiológico sem evidências de lesões pulmonares. Estruturas cardíacas normais.",
    },
    {
      id: 3,
      nome: "Eletrocardiograma",
      data: "2025-07-05",
      status: "Disponível",
      prontuario: "Ritmo sinusal, sem arritmias. Exame dentro da normalidade.",
    },
  ];

  const laudosFicticios = [
    {
      id: 1,
      nome: "Laudo Hemograma Completo",
      data: "2025-09-21",
      status: "Assinado",
      laudo: "Hemoglobina, hematócrito, leucócitos e plaquetas dentro dos valores de referência. Sem anemias ou infecções detectadas.",
    },
    {
      id: 2,
      nome: "Laudo Raio-X de Tórax",
      data: "2025-08-11",
      status: "Assinado",
      laudo: "Radiografia sem alterações. Parênquima pulmonar preservado. Ausência de derrame pleural.",
    },
    {
      id: 3,
      nome: "Laudo Eletrocardiograma",
      data: "2025-07-06",
      status: "Assinado",
      laudo: "ECG normal. Não há sinais de isquemia ou sobrecarga.",
    },
  ];

  const [exameSelecionado, setExameSelecionado] = useState<null | typeof examesFicticios[0]>(null)
  const [laudoSelecionado, setLaudoSelecionado] = useState<null | typeof laudosFicticios[0]>(null)

  function ExamesLaudos() {
    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-6">Exames</h2>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Meus Exames</h3>
          <div className="space-y-3">
            {examesFicticios.map(exame => (
              <div key={exame.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-4">
                <div>
                  <div className="font-medium text-foreground">{exame.nome}</div>
                  <div className="text-sm text-muted-foreground">Data: {new Date(exame.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" onClick={() => setExameSelecionado(exame)}>Ver Prontuário</Button>
                  <Button variant="secondary">Download</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-6">Laudos</h2>
        <div>
          <h3 className="text-lg font-semibold mb-2">Meus Laudos</h3>
          <div className="space-y-3">
            {laudosFicticios.map(laudo => (
              <div key={laudo.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-4">
                <div>
                  <div className="font-medium text-foreground">{laudo.nome}</div>
                  <div className="text-sm text-muted-foreground">Data: {new Date(laudo.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  <Button variant="outline" onClick={() => setLaudoSelecionado(laudo)}>Visualizar</Button>
                  <Button variant="secondary">Compartilhar</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Prontuário Exame */}
        <Dialog open={!!exameSelecionado} onOpenChange={open => !open && setExameSelecionado(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Prontuário do Exame</DialogTitle>
              <DialogDescription>
                {exameSelecionado && (
                  <>
                    <div className="font-semibold mb-2">{exameSelecionado.nome}</div>
                    <div className="text-sm text-muted-foreground mb-4">Data: {new Date(exameSelecionado.data).toLocaleDateString('pt-BR')}</div>
                    <div className="mb-4 whitespace-pre-line">{exameSelecionado.prontuario}</div>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setExameSelecionado(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Visualizar Laudo */}
        <Dialog open={!!laudoSelecionado} onOpenChange={open => !open && setLaudoSelecionado(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Laudo Médico</DialogTitle>
              <DialogDescription>
                {laudoSelecionado && (
                  <>
                    <div className="font-semibold mb-2">{laudoSelecionado.nome}</div>
                    <div className="text-sm text-muted-foreground mb-4">Data: {new Date(laudoSelecionado.data).toLocaleDateString('pt-BR')}</div>
                    <div className="mb-4 whitespace-pre-line">{laudoSelecionado.laudo}</div>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLaudoSelecionado(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    )
  }

  // Mensagens fictícias recebidas do médico
  const mensagensFicticias = [
    {
      id: 1,
      medico: "Dr. Carlos Andrade",
      data: "2025-10-06T15:30:00",
      conteudo: "Olá Maria, seu exame de hemograma está normal. Parabéns por manter seus exames em dia!",
      lida: false
    },
    {
      id: 2,
      medico: "Dra. Fernanda Lima",
      data: "2025-09-21T10:15:00",
      conteudo: "Maria, seu laudo de Raio-X já está disponível no sistema. Qualquer dúvida, estou à disposição.",
      lida: true
    },
    {
      id: 3,
      medico: "Dr. João Silva",
      data: "2025-08-12T09:00:00",
      conteudo: "Bom dia! Lembre-se de agendar seu retorno para acompanhamento da ortopedia.",
      lida: true
    },
  ];

  function Mensagens() {
    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-6">Mensagens Recebidas</h2>
        <div className="space-y-3">
          {mensagensFicticias.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-muted-foreground/50" />
              <p className="text-lg mb-2">Nenhuma mensagem recebida</p>
              <p className="text-sm">Você ainda não recebeu mensagens dos seus médicos.</p>
            </div>
          ) : (
            mensagensFicticias.map(msg => (
              <div key={msg.id} className={`flex flex-col md:flex-row md:items-center md:justify-between bg-muted rounded p-4 border ${!msg.lida ? 'border-primary' : 'border-transparent'}`}>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {msg.medico}
                    {!msg.lida && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary text-white">Nova</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">{new Date(msg.data).toLocaleString('pt-BR')}</div>
                  <div className="text-foreground whitespace-pre-line">{msg.conteudo}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    )
  }

  function Perfil() {
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
              <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
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
          {/* Endereço e Contato */}
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
            <div className="space-y-2">
              <Label htmlFor="biografia">Biografia</Label>
              {isEditingProfile ? (
                <Textarea id="biografia" value={profileData.biografia} onChange={e => handleProfileChange('biografia', e.target.value)} rows={4} placeholder="Conte um pouco sobre você..." />
              ) : (
                <p className="p-2 bg-muted/50 rounded min-h-[100px] text-foreground">{profileData.biografia}</p>
              )}
            </div>
          </div>
        </div>
        {/* Foto do Perfil */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Foto do Perfil</h3>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-lg">
                {profileData.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditingProfile && (
              <div className="space-y-2">
                <Button variant="outline" size="sm">Alterar Foto</Button>
                <p className="text-xs text-muted-foreground">Formatos aceitos: JPG, PNG (máx. 2MB)</p>
              </div>
            )}
          </div>
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
            <Button asChild variant="outline" className="ml-4">
              <Link href="/">
                <Home className="h-4 w-4 mr-1" /> Início
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <SimpleThemeToggle />
            <Button onClick={handleLogout} variant="destructive" aria-label={strings.sair} disabled={loading} className="ml-2"><LogOut className="h-4 w-4" /> {strings.sair}</Button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          {/* Sidebar vertical */}
          <nav aria-label="Navegação do dashboard" className="w-56 bg-card border-r flex flex-col py-6 px-2 gap-2">
            <Button variant={tab==='dashboard'?'secondary':'ghost'} aria-current={tab==='dashboard'} onClick={()=>setTab('dashboard')} className="justify-start"><Calendar className="mr-2 h-5 w-5" />{strings.dashboard}</Button>
            <Button variant={tab==='consultas'?'secondary':'ghost'} aria-current={tab==='consultas'} onClick={()=>setTab('consultas')} className="justify-start"><Calendar className="mr-2 h-5 w-5" />{strings.consultas}</Button>
            <Button variant={tab==='exames'?'secondary':'ghost'} aria-current={tab==='exames'} onClick={()=>setTab('exames')} className="justify-start"><FileText className="mr-2 h-5 w-5" />{strings.exames}</Button>
            <Button variant={tab==='mensagens'?'secondary':'ghost'} aria-current={tab==='mensagens'} onClick={()=>setTab('mensagens')} className="justify-start"><MessageCircle className="mr-2 h-5 w-5" />{strings.mensagens}</Button>
            <Button variant={tab==='perfil'?'secondary':'ghost'} aria-current={tab==='perfil'} onClick={()=>setTab('perfil')} className="justify-start"><UserCog className="mr-2 h-5 w-5" />{strings.perfil}</Button>
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
                {tab==='mensagens' && <Mensagens />}
                {tab==='perfil' && <Perfil />}
              </main>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}