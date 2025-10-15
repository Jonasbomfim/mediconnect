"use client"

import React, { useMemo, useState } from 'react'
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

type TipoConsulta = 'teleconsulta' | 'local'

type Medico = {
  id: number
  nome: string
  especialidade: string
  crm: string
  categoriaHero: string
  avaliacao: number
  avaliacaoQtd: number
  convenios: string[]
  endereco?: string
  bairro?: string
  cidade?: string
  precoLocal?: string
  precoTeleconsulta?: string
  atendeLocal: boolean
  atendeTele: boolean
  agenda: {
    label: string
    data: string
    horarios: string[]
  }[]
  experiencia: string[]
  planosSaude: string[]
  consultorios: { nome: string; endereco: string; telefone: string }[]
  servicos: { nome: string; preco: string }[]
  opinioes: { id: number; paciente: string; data: string; nota: number; comentario: string }[]
}

type MedicoBase = Omit<Medico, 'experiencia' | 'planosSaude' | 'consultorios' | 'servicos' | 'opinioes'> &
  Partial<Pick<Medico, 'experiencia' | 'planosSaude' | 'consultorios' | 'servicos' | 'opinioes'>>;

const especialidadesHero = ['Psicólogo', 'Médico clínico geral', 'Pediatra', 'Dentista', 'Ginecologista', 'Veja mais']

// NOTE: keep this mock local to component to avoid cross-file references
const medicosMock: Medico[] = [
  {
    id: 1,
    nome: 'Paula Pontes',
    especialidade: 'Psicóloga clínica',
    crm: 'CRP SE 19/4244',
    categoriaHero: 'Psicólogo',
    avaliacao: 4.9,
    avaliacaoQtd: 23,
    convenios: ['Amil', 'Unimed'],
    endereco: 'Av. Doutor José Machado de Souza, 200 - Jardins',
    bairro: 'Jardins',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 180',
    precoTeleconsulta: 'R$ 160',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '10:00', '11:00', '12:00', '13:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['11:00', '12:00', '13:00', '14:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ],
    experiencia: ['Atendimento clínico há 8 anos'],
    planosSaude: ['Amil'],
    consultorios: [],
    servicos: [],
    opinioes: []
  }
]

export default function ResultadosClient() {
  const params = useSearchParams()
  const router = useRouter()
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>(
    params?.get('tipo') === 'presencial' ? 'local' : 'teleconsulta'
  )
  const [especialidadeHero, setEspecialidadeHero] = useState<string>(params?.get('especialidade') || 'Psicólogo')
  const [convenio, setConvenio] = useState<string>('Todos')
  const [bairro, setBairro] = useState<string>('Todos')
  const [agendasExpandida, setAgendasExpandida] = useState<Record<number, boolean>>({})
  const [medicoSelecionado, setMedicoSelecionado] = useState<Medico | null>(null)
  const [abaDetalhe, setAbaDetalhe] = useState('experiencia')

  const profissionais = useMemo(() => {
    return medicosMock.filter(medico => {
      if (tipoConsulta === 'local' && !medico.atendeLocal) return false
      if (tipoConsulta === 'teleconsulta' && !medico.atendeTele) return false
      if (convenio !== 'Todos' && !medico.convenios.includes(convenio)) return false
      if (bairro !== 'Todos' && medico.bairro !== bairro) return false
      if (especialidadeHero !== 'Veja mais' && medico.categoriaHero !== especialidadeHero) return false
      if (especialidadeHero === 'Veja mais' && medico.categoriaHero !== 'Veja mais') return false
      return true
    })
  }, [bairro, convenio, especialidadeHero, tipoConsulta])

  const toggleBase =
    'rounded-full px-4 py-[10px] text-sm font-medium transition hover:bg-primary hover:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.97]'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
        <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold md:text-3xl">Resultados da procura</h1>
              <p className="text-sm text-primary-foreground/80">Qual especialização você deseja?</p>
            </div>
            <Button
              variant="outline"
              className="rounded-full border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary"
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

        <section className="sticky top-0 z-30 flex flex-wrap gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur">
          <Toggle
            pressed={tipoConsulta === 'teleconsulta'}
            onPressedChange={() => setTipoConsulta('teleconsulta')}
            className={cn(toggleBase, tipoConsulta === 'teleconsulta' ? 'bg-primary text-primary-foreground' : 'border border-primary/40 text-primary')}
          >
            <Globe className="mr-2 h-4 w-4" />
            Teleconsulta
          </Toggle>
          <Toggle
            pressed={tipoConsulta === 'local'}
            onPressedChange={() => setTipoConsulta('local')}
            className={cn(toggleBase, tipoConsulta === 'local' ? 'bg-primary text-primary-foreground' : 'border border-primary/40 text-primary')}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Consulta no local
          </Toggle>

          <Select value={convenio} onValueChange={setConvenio}>
            <SelectTrigger className="h-10 min-w-[180px] rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
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
            <SelectTrigger className="h-10 min-w-[160px] rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
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
            className="rounded-full border border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Filter className="mr-2 h-4 w-4" />
            Mais filtros
          </Button>

          <Button
            variant="ghost"
            className="ml-auto rounded-full text-primary hover:bg-primary/10"
            onClick={() => router.back()}
          >
            Voltar
            <ChevronRight className="ml-1 h-4 w-4 rotate-180" />
          </Button>
        </section>

        <section className="space-y-4">
          {profissionais.map(medico => (
            <Card
              key={medico.id}
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
                    <h2 className="text-lg font-semibold text-foreground">{medico.nome}</h2>
                    <Badge className="rounded-full bg-primary/10 text-primary">{medico.especialidade}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {medico.avaliacao.toFixed(1)} • {medico.avaliacaoQtd} avaliações
                    </span>
                    <span>{medico.crm}</span>
                    <span>{medico.convenios.join(', ')}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="ml-auto h-fit rounded-full text-primary hover:bg-primary/10"
                  onClick={() => {
                    setMedicoSelecionado(medico)
                    setAbaDetalhe('experiencia')
                  }}
                >
                  Ver perfil completo
                </Button>
              </div>

              {tipoConsulta === 'local' && medico.atendeLocal && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    {medico.endereco}
                  </span>
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-muted-foreground">{medico.cidade}</span>
                    <span className="text-sm font-semibold text-primary">{medico.precoLocal}</span>
                  </div>
                </div>
              )}

              {tipoConsulta === 'teleconsulta' && medico.atendeTele && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-primary">
                  <span className="inline-flex items-center gap-2 font-medium">
                    <Globe className="h-4 w-4" />
                    Teleconsulta
                  </span>
                  <span className="text-sm font-semibold">{medico.precoTeleconsulta}</span>
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

              <div className="flex flex-wrap gap-3 pt-2">
                <Button className="h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Agendar consulta</Button>
                <Button variant="outline" className="h-11 rounded-full border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground">
                  Enviar mensagem
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 rounded-full text-primary hover:bg-primary/10"
                  onClick={() =>
                    setAgendasExpandida(prev => ({
                      ...prev,
                      [medico.id]: !prev[medico.id]
                    }))
                  }
                >
                  {agendasExpandida[medico.id] ? 'Ocultar horários' : 'Mostrar mais horários'}
                </Button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <div className="grid min-w-[360px] grid-cols-4 gap-3">
                  {medico.agenda.map(coluna => {
                    const horarios = agendasExpandida[medico.id] ? coluna.horarios : coluna.horarios.slice(0, 3)
                    return (
                      <div key={`${medico.id}-${coluna.label}`} className="rounded-2xl border border-border p-3 text-center">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{coluna.label}</p>
                        <p className="text-[10px] text-muted-foreground">{coluna.data}</p>
                        <div className="mt-3 flex flex-col gap-2">
                          {horarios.length ? (
                            horarios.map(horario => (
                              <button
                                key={horario}
                                type="button"
                                className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                              >
                                {horario}
                              </button>
                            ))
                          ) : (
                            <span className="rounded-lg border border-dashed border-border px-2 py-3 text-[11px] text-muted-foreground">
                              Sem horários
                            </span>
                          )}
                          {!agendasExpandida[medico.id] && coluna.horarios.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">+{coluna.horarios.length - 3} horários</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          ))}

          {!profissionais.length && (
            <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
              Nenhum profissional encontrado. Ajuste os filtros para ver outras opções.
            </Card>
          )}
        </section>

        <Dialog open={!!medicoSelecionado} onOpenChange={open => !open && setMedicoSelecionado(null)}>
          <DialogContent className="max-h-[90vh] w-full max-w-5xl overflow-y-auto border border-border bg-card p-0">
            {medicoSelecionado && (
              <>
                <DialogHeader className="border-b border-border px-6 py-4">
                  <DialogTitle className="text-2xl font-semibold text-foreground">
                    {medicoSelecionado.nome}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {medicoSelecionado.especialidade} • {medicoSelecionado.crm}
                  </p>
                </DialogHeader>

                <div className="flex flex-col gap-6 px-6 py-5">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      {medicoSelecionado.avaliacao.toFixed(1)} ({medicoSelecionado.avaliacaoQtd} avaliações)
                    </span>
                    <span>{medicoSelecionado.planosSaude.join(' • ')}</span>
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
                        Opiniões ({medicoSelecionado.opinioes.length})
                      </TabsTrigger>
                      <TabsTrigger value="agenda" className="rounded-full px-4 py-2 data-[state=active]:bg-card data-[state=active]:text-primary">
                        Agenda
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="experiencia" className="space-y-3 text-sm text-muted-foreground">
                      {medicoSelecionado.experiencia.map((linha, index) => (
                        <p key={index}>{linha}</p>
                      ))}
                    </TabsContent>

                    <TabsContent value="planos" className="flex flex-wrap gap-2">
                      {medicoSelecionado.planosSaude.map(plano => (
                        <span key={plano} className="rounded-full border border-primary/30 bg-primary/5 px-4 py-1 text-xs font-medium text-primary">
                          {plano}
                        </span>
                      ))}
                    </TabsContent>

                    <TabsContent value="consultorios" className="space-y-3 text-sm text-muted-foreground">
                      {medicoSelecionado.consultorios.length ? (
                        medicoSelecionado.consultorios.map((consultorio, index) => (
                          <div key={index} className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="font-medium text-foreground">{consultorio.nome}</p>
                            <p>{consultorio.endereco}</p>
                            <p className="text-xs text-muted-foreground">Telefone: {consultorio.telefone}</p>
                          </div>
                        ))
                      ) : (
                        <p>Atendimento exclusivamente por teleconsulta.</p>
                      )}
                    </TabsContent>

                    <TabsContent value="servicos" className="space-y-3 text-sm text-muted-foreground">
                      {medicoSelecionado.servicos.map(servico => (
                        <div key={servico.nome} className="flex items-center justify-between rounded-xl border border-border bg-card/70 px-4 py-3">
                          <span>{servico.nome}</span>
                          <span className="font-semibold text-primary">{servico.preco}</span>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="opinioes" className="space-y-3">
                      {medicoSelecionado.opinioes.map(opiniao => (
                        <div key={opiniao.id} className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between text-foreground">
                            <span className="font-semibold">{opiniao.paciente}</span>
                            <span className="text-xs text-muted-foreground">{opiniao.data}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-primary">
                            {Array.from({ length: opiniao.nota }).map((_, index) => (
                              <Star key={index} className="h-4 w-4 fill-primary text-primary" />
                            ))}
                          </div>
                          <p className="mt-2 text-muted-foreground">{opiniao.comentario}</p>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="agenda" className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Escolha o melhor horário disponível para sua consulta.
                      </p>
                      <div className="overflow-x-auto">
                        <div className="grid min-w-[420px] grid-cols-4 gap-3">
                          {medicoSelecionado.agenda.map(coluna => (
                            <div key={coluna.label} className="rounded-2xl border border-border bg-muted/30 p-3 text-center text-sm">
                              <p className="font-semibold text-foreground">{coluna.label}</p>
                              <p className="text-xs text-muted-foreground">{coluna.data}</p>
                              <div className="mt-3 flex flex-col gap-2">
                                {coluna.horarios.length ? (
                                  coluna.horarios.map(horario => (
                                    <button
                                      key={horario}
                                      type="button"
                                      className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                                    >
                                      {horario}
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
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
