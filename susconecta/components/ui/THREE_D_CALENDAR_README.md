# 3D Wall Calendar Component

## 📦 Componente Integrado

Um calendário interativo 3D com efeitos de parede para visualização de eventos.

## 🎯 Localização

- **Componente**: `components/ui/three-dwall-calendar.tsx`
- **Página**: `app/(main-routes)/calendar/page.tsx`

## 🚀 Funcionalidades

- ✅ Visualização 3D interativa com efeito de perspectiva
- ✅ Controle de rotação via mouse (drag) e scroll
- ✅ Navegação entre meses
- ✅ Adição e remoção de eventos
- ✅ Visualização de eventos por dia
- ✅ Popover com detalhes do evento
- ✅ Hover card para preview rápido
- ✅ Suporte a localização pt-BR
- ✅ Design responsivo

## 🎮 Como Usar

### Na Página de Calendário

Acesse a página de calendário e clique no botão **"3D"** ou pressione a tecla **"3"** para alternar para a visualização 3D.

### Atalhos de Teclado

- **C**: Calendário tradicional (FullCalendar)
- **3**: Calendário 3D
- **F**: Fila de espera

### Interação 3D

- **Arrastar (drag)**: Rotaciona o calendário
- **Scroll do mouse**: Ajusta a inclinação vertical/horizontal
- **Clique nos eventos**: Abre detalhes com opção de remover

## 📝 API do Componente

```tsx
interface CalendarEvent {
  id: string
  title: string
  date: string // ISO format
}

interface ThreeDWallCalendarProps {
  events: CalendarEvent[]
  onAddEvent?: (e: CalendarEvent) => void
  onRemoveEvent?: (id: string) => void
  panelWidth?: number  // default: 160
  panelHeight?: number // default: 120
  columns?: number     // default: 7
}
```

## 🔧 Dependências Instaladas

- `uuid` - Geração de IDs únicos
- `date-fns` - Manipulação de datas
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-hover-card` - Hover cards
- `lucide-react` - Ícones

## 🎨 Personalização

O componente utiliza as variáveis CSS do tema shadcn/ui:
- `bg-blue-500` / `dark:bg-blue-600` para eventos
- Componentes shadcn/ui: `Card`, `Button`, `Input`, `Popover`, `HoverCard`

## 📱 Responsividade

O calendário ajusta automaticamente:
- 7 colunas para desktop (padrão)
- Scroll horizontal para telas menores
- Cards responsivos com overflow visível

## 🔄 Integração com Backend

Os eventos são convertidos automaticamente dos agendamentos do sistema:

```tsx
// Conversão automática de agendamentos para eventos 3D
const threeDEvents: CalendarEvent[] = appointments.map((obj: any) => ({
  id: obj.id || String(Date.now()),
  title: `${patient}: ${appointment_type}`,
  date: new Date(scheduled_at).toISOString(),
}))
```

## ✨ Exemplo de Uso

```tsx
import { ThreeDWallCalendar, CalendarEvent } from "@/components/ui/three-dwall-calendar"

export default function MyPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])

  const handleAddEvent = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event])
  }

  const handleRemoveEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <ThreeDWallCalendar
      events={events}
      onAddEvent={handleAddEvent}
      onRemoveEvent={handleRemoveEvent}
    />
  )
}
```

## 🐛 Troubleshooting

### Eventos não aparecem
- Verifique se o formato da data está em ISO (`new Date().toISOString()`)
- Confirme que o array `events` está sendo passado corretamente

### Rotação não funciona
- Certifique-se de que o navegador suporta `transform-style: preserve-3d`
- Verifique se não há conflitos de CSS sobrescrevendo as propriedades 3D

### Performance
- Limite o número de eventos por dia para melhor performance
- Considere virtualização para calendários com muitos meses

---

**Data de Integração**: 30 de outubro de 2025  
**Versão**: 1.0.0
