'use client'

import { useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Toggle } from '@/components/ui/toggle'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TipoConsulta = 'teleconsulta' | 'local'

type Medico = {
  id: number
  nome: string
  especialidade: string
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
}

const especialidadesHero = ['Psicólogo', 'Médico clínico geral', 'Pediatra', 'Dentista', 'Ginecologista', 'Veja mais']

const medicosMock: Medico[] = [
  {
    id: 1,
    nome: 'Paula Pontes',
    especialidade: 'Psicóloga',
    avaliacao: 4.9,
    avaliacaoQtd: 23,
    convenios: ['Amil', 'Unimed'],
    endereco: 'Av. Doutor José Machado de Souza, 200 - Jardins',
    bairro: 'Jardins',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 180',
    precoTeleconsulta: 'R$ 160',
    atendeLocal: true,
    atendeTele: true
  },
  {
    id: 2,
    nome: 'Dr. Carlos Andrade',
    especialidade: 'Cardiologista',
    avaliacao: 4.8,
    avaliacaoQtd: 128,
    convenios: ['SulAmérica', 'Bradesco Saúde'],
    endereco: 'Rua Sergipe, 88 - Centro Médico Jardins',
    bairro: 'Centro',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 320',
    precoTeleconsulta: 'R$ 290',
    atendeLocal: true,
    atendeTele: true
  },
  {
    id: 3,
    nome: 'Dra. Fernanda Lima',
    especialidade: 'Dermatologista',
    avaliacao: 5,
    avaliacaoQtd: 210,
    convenios: ['Amil', 'Particular'],
    precoTeleconsulta: 'R$ 250',
    atendeLocal: false,
    atendeTele: true
  },
  {
    id: 4,
    nome: 'Dr. João Silva',
    especialidade: 'Ortopedista',
    avaliacao: 4.7,
    avaliacaoQtd: 96,
    convenios: ['Unimed', 'Bradesco Saúde'],
    endereco: 'Av. Beira Mar, 1450 - Farolândia',
    bairro: 'Farolândia',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 310',
    atendeLocal: true,
    atendeTele: false
  }
]

export default function ResultadosPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>(
    params.get('tipo') === 'presencial' ? 'local' : 'teleconsulta'
  )
  const [especialidadeHero, setEspecialidadeHero] = useState<string>(params.get('especialidade') || 'Psicólogo')
  const [convenio, setConvenio] = useState<string>('Todos')
  const [bairro, setBairro] = useState<string>('Todos')

  const profissionais = useMemo(() => {
    return medicosMock.filter(medico => {
      if (tipoConsulta === 'local' && !medico.atendeLocal) return false
      if (tipoConsulta === 'teleconsulta' && !medico.atendeTele) return false
      if (convenio !== 'Todos' && !medico.convenios.includes(convenio)) return false
      if (bairro !== 'Todos' && medico.bairro !== bairro) return false
      if (especialidadeHero !== 'Veja mais' && medico.especialidade !== especialidadeHero) return false
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
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{medico.nome}</h2>
                  <Badge className="rounded-full bg-primary/10 text-primary">{medico.especialidade}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    {medico.avaliacao.toFixed(1)} • {medico.avaliacaoQtd} avaliações
                  </span>
                  <span>{medico.convenios.join(', ')}</span>
                </div>
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
                <Button variant="ghost" className="h-11 rounded-full text-primary hover:bg-primary/10">
                  Ver mais horários
                </Button>
              </div>
            </Card>
          ))}

          {!profissionais.length && (
            <Card className="flex flex-col items-center justify-center gap-3 border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
              Nenhum profissional encontrado. Ajuste os filtros para ver outras opções.
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
