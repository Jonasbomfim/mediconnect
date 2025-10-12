'use client'

import { useMemo, useState } from 'react'
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

const medicosBase: MedicoBase[] = [
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
    ]
  },
  {
    id: 2,
    nome: 'Marcos Vieira',
    especialidade: 'Psicólogo comportamental',
    crm: 'CRP SE 24/1198',
    categoriaHero: 'Psicólogo',
    avaliacao: 4.7,
    avaliacaoQtd: 31,
    convenios: ['SulAmérica', 'Bradesco Saúde'],
    endereco: 'Rua Juarez Távora, 155 - São José',
    bairro: 'São José',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 190',
    precoTeleconsulta: 'R$ 150',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['14:00', '16:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['10:00', '11:00', '12:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:00', '10:30'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 3,
    nome: 'Julia Azevedo',
    especialidade: 'Psicóloga infantil',
    crm: 'CRP SE 23/4476',
    categoriaHero: 'Psicólogo',
    avaliacao: 4.95,
    avaliacaoQtd: 45,
    convenios: ['NotreDame Intermédica', 'Particular'],
    precoTeleconsulta: 'R$ 140',
    atendeLocal: false,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:30', '11:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['08:30', '10:00', '11:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 4,
    nome: 'Rafael Sousa',
    especialidade: 'Neuropsicólogo',
    crm: 'CRP BA 03/8874',
    categoriaHero: 'Psicólogo',
    avaliacao: 4.82,
    avaliacaoQtd: 52,
    convenios: ['Amil', 'Particular'],
    endereco: 'Rua Riachão, 77 - Centro',
    bairro: 'Centro',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 210',
    atendeLocal: true,
    atendeTele: false,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '13:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:00', '12:00'] },
      { label: 'Dom.', data: '12 Out', horarios: ['09:30'] }
    ]
  },
  {
    id: 5,
    nome: 'Lucas Amorim',
    especialidade: 'Clínico geral',
    crm: 'CRM SE 5122',
    categoriaHero: 'Médico clínico geral',
    avaliacao: 4.88,
    avaliacaoQtd: 98,
    convenios: ['Amil', 'Bradesco Saúde'],
    endereco: 'Av. Beira Mar, 402 - Coroa do Meio',
    bairro: 'Coroa do Meio',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 220',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00', '11:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:30', '14:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:30', '12:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 6,
    nome: 'Dr. João Silva',
    especialidade: 'Ortopedista',
    crm: 'CRM RJ 90876',
    categoriaHero: 'Veja mais',
    avaliacao: 4.7,
    avaliacaoQtd: 96,
    convenios: ['Unimed', 'Bradesco Saúde'],
    endereco: 'Av. Beira Mar, 1450 - Farolândia',
    bairro: 'Farolândia',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 310',
    atendeLocal: true,
    atendeTele: false,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 7,
    nome: 'Dra. Beatriz Moura',
    especialidade: 'Ginecologista',
    crm: 'CRM BA 52110',
    categoriaHero: 'Veja mais',
    avaliacao: 4.95,
    avaliacaoQtd: 186,
    convenios: ['NotreDame Intermédica', 'Particular', 'Amil'],
    endereco: 'Rua Tobias Barreto, 512 - Bairro São José',
    bairro: 'São José',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 280',
    precoTeleconsulta: 'R$ 240',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['14:00', '15:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '11:00', '16:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:30', '12:30'] },
      { label: 'Dom.', data: '12 Out', horarios: ['11:30'] }
    ]
  },
  {
    id: 8,
    nome: 'Dr. André Lemos',
    especialidade: 'Gastroenterologista',
    crm: 'CRM SE 9033',
    categoriaHero: 'Veja mais',
    avaliacao: 4.75,
    avaliacaoQtd: 105,
    convenios: ['SulAmérica', 'Unimed'],
    endereco: 'Rua Arauá, 22 - Centro',
    bairro: 'Centro',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 340',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['13:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:00', '11:00', '15:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:30', '10:15'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 9,
    nome: 'Dra. Fernanda Lima',
    especialidade: 'Médico clínico geral',
    crm: 'CRM SE 7890',
    categoriaHero: 'Médico clínico geral',
    avaliacao: 4.9,
    avaliacaoQtd: 110,
    convenios: ['Amil', 'Unimed', 'Bradesco Saúde'],
    endereco: 'Av. Rio de Janeiro, 300 - São José',
    bairro: 'São José',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 250',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00', '11:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:30', '14:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:30', '12:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 10,
    nome: 'Dra. Helena Castro',
    especialidade: 'Pediatra geral',
    crm: 'CRM SE 7812',
    categoriaHero: 'Pediatra',
    avaliacao: 4.92,
    avaliacaoQtd: 134,
    convenios: ['Amil', 'Unimed', 'SulAmérica'],
    endereco: 'Rua José Hipólito, 98 - Suíssa',
    bairro: 'Suíssa',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 260',
    precoTeleconsulta: 'R$ 220',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00', '11:30'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:30', '10:00', '14:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:30', '11:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 11,
    nome: 'Dr. Vinícius Prado',
    especialidade: 'Pediatra neonatologista',
    crm: 'CRM SE 6331',
    categoriaHero: 'Pediatra',
    avaliacao: 4.85,
    avaliacaoQtd: 89,
    convenios: ['Bradesco Saúde', 'NotreDame Intermédica'],
    endereco: 'Av. Augusto Franco, 2220 - Siqueira Campos',
    bairro: 'Siqueira Campos',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 280',
    atendeLocal: true,
    atendeTele: false,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:00', '11:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:00'] },
      { label: 'Dom.', data: '12 Out', horarios: ['09:30'] }
    ]
  },
  {
    id: 12,
    nome: 'Dra. Marina Salles',
    especialidade: 'Pediatra emergencista',
    crm: 'CRM BA 85660',
    categoriaHero: 'Pediatra',
    avaliacao: 4.78,
    avaliacaoQtd: 57,
    convenios: ['Particular', 'Amil'],
    precoTeleconsulta: 'R$ 210',
    atendeLocal: false,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['13:00', '15:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:30', '12:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 13,
    nome: 'Dr. Caio Moura',
    especialidade: 'Pediatra pneumologista',
    crm: 'CRM SE 7345',
    categoriaHero: 'Pediatra',
    avaliacao: 4.91,
    avaliacaoQtd: 102,
    convenios: ['SulAmérica', 'Unimed'],
    endereco: 'Av. Hermes Fontes, 445 - Salgado Filho',
    bairro: 'Salgado Filho',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 270',
    precoTeleconsulta: 'R$ 230',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['10:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '11:00', '16:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:30', '11:30'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 14,
    nome: 'Dra. Patrícia Freire',
    especialidade: 'Cirurgiã-dentista',
    crm: 'CRO SE 2133',
    categoriaHero: 'Dentista',
    avaliacao: 4.9,
    avaliacaoQtd: 176,
    convenios: ['OdontoPrev', 'Amil Dental'],
    endereco: 'Rua Itabaiana, 410 - Centro',
    bairro: 'Centro',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 200',
    precoTeleconsulta: 'R$ 160',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00', '13:30'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:30', '10:00', '14:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:30', '11:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 15,
    nome: 'Dr. Henrique Assis',
    especialidade: 'Implantodontista',
    crm: 'CRO SE 1450',
    categoriaHero: 'Dentista',
    avaliacao: 4.83,
    avaliacaoQtd: 94,
    convenios: ['SulAmérica Odonto', 'Particular'],
    endereco: 'Av. Jorge Amado, 321 - Atalaia',
    bairro: 'Atalaia',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 350',
    atendeLocal: true,
    atendeTele: false,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '11:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:30'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 16,
    nome: 'Dra. Lívia Teles',
    especialidade: 'Ortodontista',
    crm: 'CRO BA 11567',
    categoriaHero: 'Dentista',
    avaliacao: 4.88,
    avaliacaoQtd: 140,
    convenios: ['Uniodonto', 'Amil Dental', 'Particular'],
    precoTeleconsulta: 'R$ 120',
    atendeLocal: false,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['17:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '10:30', '15:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['08:30', '09:30'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 17,
    nome: 'Dr. Pablo Menezes',
    especialidade: 'Endodontista',
    crm: 'CRO SE 2099',
    categoriaHero: 'Dentista',
    avaliacao: 4.76,
    avaliacaoQtd: 83,
    convenios: ['OdontoPrev', 'SulAmérica Odonto'],
    endereco: 'Rua Cedro, 70 - Grageru',
    bairro: 'Grageru',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 230',
    precoTeleconsulta: 'R$ 190',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:00', '13:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:30'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 18,
    nome: 'Dra. Beatriz Moura',
    especialidade: 'Ginecologista obstetra',
    crm: 'CRM BA 52110',
    categoriaHero: 'Ginecologista',
    avaliacao: 4.95,
    avaliacaoQtd: 186,
    convenios: ['NotreDame Intermédica', 'Particular', 'Amil'],
    endereco: 'Rua Tobias Barreto, 512 - São José',
    bairro: 'São José',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 280',
    precoTeleconsulta: 'R$ 240',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['14:00', '15:00'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '11:00', '16:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:30', '12:30'] },
      { label: 'Dom.', data: '12 Out', horarios: ['11:30'] }
    ]
  },
  {
    id: 19,
    nome: 'Dra. Camila Albuquerque',
    especialidade: 'Ginecologista endocrinologista',
    crm: 'CRM SE 6774',
    categoriaHero: 'Ginecologista',
    avaliacao: 4.89,
    avaliacaoQtd: 122,
    convenios: ['SulAmérica', 'Unimed'],
    endereco: 'Av. Gonçalo Prado Rollemberg, 167 - São José',
    bairro: 'São José',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 300',
    atendeLocal: true,
    atendeTele: false,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: [] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:00', '09:30', '15:00'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 20,
    nome: 'Dra. Renata Figueiredo',
    especialidade: 'Ginecologista minimamente invasiva',
    crm: 'CRM PE 112233',
    categoriaHero: 'Ginecologista',
    avaliacao: 4.94,
    avaliacaoQtd: 208,
    convenios: ['Amil', 'Bradesco Saúde', 'Particular'],
    precoTeleconsulta: 'R$ 260',
    atendeLocal: false,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['09:00', '10:30'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['08:30', '11:00', '14:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['09:45'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  },
  {
    id: 21,
    nome: 'Dr. Eduardo Fontes',
    especialidade: 'Ginecologista mastologista',
    crm: 'CRM SE 7012',
    categoriaHero: 'Ginecologista',
    avaliacao: 4.8,
    avaliacaoQtd: 95,
    convenios: ['NotreDame Intermédica', 'SulAmérica'],
    endereco: 'Rua Teófilo Dantas, 55 - Centro',
    bairro: 'Centro',
    cidade: 'Aracaju • SE',
    precoLocal: 'R$ 310',
    atendeLocal: true,
    atendeTele: true,
    agenda: [
      { label: 'Hoje', data: '9 Out', horarios: ['08:30'] },
      { label: 'Amanhã', data: '10 Out', horarios: ['09:00', '11:00', '16:30'] },
      { label: 'Sáb.', data: '11 Out', horarios: ['10:00', '12:00'] },
      { label: 'Dom.', data: '12 Out', horarios: [] }
    ]
  }
]

const medicosMock: Medico[] = medicosBase.map((medico, index) => ({
  ...medico,
  experiencia:
    medico.experiencia ??
    [
      'Especialista com atuação reconhecida pelo respectivo conselho profissional.',
      'Formação continuada em instituições nacionais e internacionais.',
      'Atendimento humanizado com foco em resultados sustentáveis.'
    ],
  planosSaude:
    medico.planosSaude ?? medico.convenios ?? ['Amil', 'Unimed', 'SulAmérica'],
  consultorios:
    medico.consultorios ??
    (medico.endereco
      ? [
          {
            nome: 'Clínica principal',
            endereco: `${medico.endereco}${medico.cidade ? ` — ${medico.cidade}` : ''}`,
            telefone: '(79) 4002-8922'
          }
        ]
      : []),
  servicos:
    medico.servicos ??
    [
      {
        nome: 'Consulta inicial',
        preco: medico.precoLocal ?? medico.precoTeleconsulta ?? 'Sob consulta'
      },
      { nome: 'Retorno em até 30 dias', preco: 'R$ 150' }
    ],
  opinioes:
    medico.opinioes ??
    [
      {
        id: index * 2 + 1,
        paciente: 'Ana P.',
        data: '01/09/2025',
        nota: 5,
        comentario: 'Profissional muito atencioso e detalhista.'
      },
      {
        id: index * 2 + 2,
        paciente: 'Marcos L.',
        data: '18/08/2025',
        nota: 4,
        comentario: 'Explicações claras e ambiente acolhedor.'
      }
    ]
}))

export default function ResultadosPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [tipoConsulta, setTipoConsulta] = useState<TipoConsulta>(
    params.get('tipo') === 'presencial' ? 'local' : 'teleconsulta'
  )
  const [especialidadeHero, setEspecialidadeHero] = useState<string>(params.get('especialidade') || 'Psicólogo')
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
