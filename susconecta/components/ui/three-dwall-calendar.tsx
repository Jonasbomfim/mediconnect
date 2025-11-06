"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Calendar, Clock, User } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export type CalendarEvent = {
  id: string
  title: string
  date: string // ISO
  status?: 'confirmed' | 'pending' | 'cancelled' | string
  patient?: string
  type?: string
}

interface ThreeDWallCalendarProps {
  events: CalendarEvent[]
  onAddEvent?: (e: CalendarEvent) => void
  onRemoveEvent?: (id: string) => void
  panelWidth?: number
  panelHeight?: number
  columns?: number
}

export function ThreeDWallCalendar({
  events,
  onAddEvent,
  onRemoveEvent,
  panelWidth = 160,
  panelHeight = 120,
  columns = 7,
}: ThreeDWallCalendarProps) {
  const [dateRef, setDateRef] = React.useState<Date>(new Date())
  const [title, setTitle] = React.useState("")
  const [newDate, setNewDate] = React.useState("")
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const wallRef = React.useRef<HTMLDivElement | null>(null)

  // 3D tilt state
  const [tiltX, setTiltX] = React.useState(18)
  const [tiltY, setTiltY] = React.useState(0)
  const isDragging = React.useRef(false)
  const dragStart = React.useRef<{ x: number; y: number } | null>(null)
  const hasDragged = React.useRef(false)
  const clickStart = React.useRef<{ x: number; y: number } | null>(null)

  // month days
  const days = eachDayOfInterval({
    start: startOfMonth(dateRef),
    end: endOfMonth(dateRef),
  })

  const eventsForDay = (d: Date) =>
    events.filter((ev) => format(new Date(ev.date), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : []

  const handleDayClick = (day: Date) => {
    console.log('Day clicked:', format(day, 'dd/MM/yyyy'))
    setSelectedDay(day)
    setIsDialogOpen(true)
  }

  // Add event handler
  const handleAdd = () => {
    if (!title.trim() || !newDate) return
    onAddEvent?.({
      id: uuidv4(),
      title: title.trim(),
      date: new Date(newDate).toISOString(),
    })
    setTitle("")
    setNewDate("")
  }

  // wheel tilt
  const onWheel = (e: React.WheelEvent) => {
    setTiltX((t) => Math.max(0, Math.min(50, t + e.deltaY * 0.02)))
    setTiltY((t) => Math.max(-45, Math.min(45, t + e.deltaX * 0.05)))
  }

  // drag tilt
  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    hasDragged.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    
    // Se moveu mais de 5 pixels, considera como drag
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDragged.current = true
    }
    
    setTiltY((t) => Math.max(-60, Math.min(60, t + dx * 0.1)))
    setTiltX((t) => Math.max(0, Math.min(60, t - dy * 0.1)))
    dragStart.current = { x: e.clientX, y: e.clientY }
  }
  
  const onPointerUp = () => {
    isDragging.current = false
    dragStart.current = null
    // Reset hasDragged após um curto delay para permitir o clique ser processado
    setTimeout(() => {
      hasDragged.current = false
    }, 100)
  }

  const gap = 12
  const rowCount = Math.ceil(days.length / columns)
  const wallCenterRow = (rowCount - 1) / 2

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center justify-between flex-wrap">
        <div className="flex gap-2 items-center">
          <Button onClick={() => setDateRef((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            Mês Anterior
          </Button>
          <div className="font-semibold text-lg">{format(dateRef, "MMMM yyyy", { locale: ptBR })}</div>
          <Button onClick={() => setDateRef((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            Próximo Mês
          </Button>
          {/* Botão Pacientes de hoje */}
          <Button 
            variant="outline" 
            onClick={() => {
              setSelectedDay(new Date())
              setIsDialogOpen(true)
            }}
          >
            Pacientes de hoje
          </Button>
        </div>
        
        {/* Legenda de cores */}
        <div className="flex gap-3 items-center text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 dark:bg-green-600"></div>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-yellow-500 dark:bg-yellow-600"></div>
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-600"></div>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-600"></div>
            <span>Outros</span>
          </div>
        </div>
      </div>

      {/* Wall container */}
      <div className="relative">
        <div className="absolute top-2 left-2 z-10 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-muted-foreground border border-border">
          💡 Arraste para rotacionar • Scroll para inclinar
        </div>
        <div
          ref={wallRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="w-full overflow-auto"
          style={{ perspective: 1200, maxWidth: 1100 }}
        >
        <div
          className="mx-auto"
          style={{
            width: Math.max(700, columns * (panelWidth + gap)),
            transformStyle: "preserve-3d",
            transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
            transition: "transform 120ms linear",
          }}
        >
          <div
            className="relative"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${columns}, ${panelWidth}px)`,
              gridAutoRows: `${panelHeight}px`,
              gap: `${gap}px`,
              transformStyle: "preserve-3d",
              padding: gap,
            }}
          >
            {days.map((day, idx) => {
              const row = Math.floor(idx / columns)
              const rowOffset = row - wallCenterRow
              const z = Math.max(-80, 40 - Math.abs(rowOffset) * 20)
              const dayEvents = eventsForDay(day)

              return (
                <div
                  key={day.toISOString()}
                  className="relative cursor-pointer"
                  style={{
                    transform: `translateZ(${z}px)`,
                    zIndex: Math.round(100 - Math.abs(rowOffset)),
                  }}
                  onPointerDown={(e) => {
                    clickStart.current = { x: e.clientX, y: e.clientY }
                  }}
                  onPointerUp={(e) => {
                    if (clickStart.current) {
                      const dx = Math.abs(e.clientX - clickStart.current.x)
                      const dy = Math.abs(e.clientY - clickStart.current.y)
                      // Se moveu menos de 5 pixels, é um clique
                      if (dx < 5 && dy < 5) {
                        e.stopPropagation()
                        handleDayClick(day)
                      }
                      clickStart.current = null
                    }
                  }}
                >
                  <Card className="h-full overflow-visible hover:shadow-lg transition-shadow">
                    <CardContent className="p-2 h-full flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-medium">{format(day, "d")}</div>
                        <div className="text-[9px] text-muted-foreground">
                          {dayEvents.length > 0 && `${dayEvents.length} ${dayEvents.length === 1 ? 'paciente' : 'pacientes'}`}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground mb-1">{format(day, "EEE", { locale: ptBR })}</div>

                      {/* events */}
                      <div className="relative flex-1 min-h-0">
                        {dayEvents.map((ev, i) => {
                          // Calcular tamanho da bolinha baseado na quantidade de eventos
                          const eventCount = dayEvents.length
                          const ballSize = eventCount <= 3 ? 20 : 
                                         eventCount <= 6 ? 16 : 
                                         eventCount <= 10 ? 14 : 
                                         eventCount <= 15 ? 12 : 10
                          
                          const spacing = ballSize + 4
                          const maxPerRow = Math.floor((panelWidth - 16) / spacing)
                          const col = i % maxPerRow
                          const row = Math.floor(i / maxPerRow)
                          const left = 4 + (col * spacing)
                          const top = 4 + (row * spacing)
                          
                          // Cores baseadas no status
                          const getStatusColor = () => {
                            switch(ev.status) {
                              case 'confirmed': return 'bg-green-500 dark:bg-green-600'
                              case 'pending': return 'bg-yellow-500 dark:bg-yellow-600'
                              case 'cancelled': return 'bg-red-500 dark:bg-red-600'
                              default: return 'bg-blue-500 dark:bg-blue-600'
                            }
                          }
                          
                          return (
                            <HoverCard key={ev.id} openDelay={100}>
                              <HoverCardTrigger asChild>
                                <div
                                  className={`absolute rounded-full ${getStatusColor()} flex items-center justify-center text-white cursor-pointer shadow-sm hover:shadow-md hover:scale-110 transition-all`}
                                  style={{ 
                                    left, 
                                    top, 
                                    width: ballSize, 
                                    height: ballSize,
                                    fontSize: Math.max(6, ballSize / 3),
                                    transform: `translateZ(15px)` 
                                  }}
                                >
                                  •
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 p-3" side="top">
                                <div className="space-y-2">
                                  <div className="font-semibold text-sm">{ev.title}</div>
                                  {ev.patient && ev.type && (
                                    <div className="text-xs space-y-1">
                                      <div><span className="font-medium">Paciente:</span> {ev.patient}</div>
                                      <div><span className="font-medium">Tipo:</span> {ev.type}</div>
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {format(new Date(ev.date), "PPP 'às' p", { locale: ptBR })}
                                  </div>
                                  {ev.status && (
                                    <div className="text-xs">
                                      <span className="font-medium">Status:</span>{' '}
                                      <span className={
                                        ev.status === 'confirmed' ? 'text-green-600 dark:text-green-400' :
                                        ev.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                                        ev.status === 'cancelled' ? 'text-red-600 dark:text-red-400' :
                                        ''
                                      }>
                                        {ev.status === 'confirmed' ? 'Confirmado' : 
                                         ev.status === 'pending' ? 'Pendente' : 
                                         ev.status === 'cancelled' ? 'Cancelado' : ev.status}
                                      </span>
                                    </div>
                                  )}
                                  {onRemoveEvent && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
                                      onClick={() => onRemoveEvent(ev.id)}
                                    >
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Remover
                                    </Button>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Dialog de detalhes do dia */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            {/* Navegação de dias */}
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDay((prev) => prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1) : new Date())}
                aria-label="Dia anterior"
              >
                &#x276E;
              </Button>
              <DialogTitle className="text-xl">
                {selectedDay && format(selectedDay, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDay((prev) => prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1) : new Date())}
                aria-label="Próximo dia"
              >
                &#x276F;
              </Button>
            </div>
            <DialogDescription>
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'paciente agendado' : 'pacientes agendados'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedDayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum paciente agendado para este dia
              </div>
            ) : (
              selectedDayEvents.map((ev) => {
                const getStatusColor = () => {
                  switch(ev.status) {
                    case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }
                }
                
                const getStatusText = () => {
                  switch(ev.status) {
                    case 'confirmed': return 'Confirmado'
                    case 'pending': return 'Pendente'
                    case 'cancelled': return 'Cancelado'
                    default: return ev.status || 'Sem status'
                  }
                }
                
                return (
                  <Card key={ev.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <h3 className="font-semibold">{ev.patient || ev.title}</h3>
                          </div>
                          
                          {ev.type && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{ev.type}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{format(new Date(ev.date), "HH:mm", { locale: ptBR })}</span>
                          </div>
                          
                          <Badge className={getStatusColor()}>
                            {getStatusText()}
                          </Badge>
                        </div>
                        
                        {onRemoveEvent && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemoveEvent(ev.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add event form */}
      <div className="flex gap-2 items-center">
        <Input placeholder="Nome do paciente" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
        <Button onClick={handleAdd}>Adicionar Paciente</Button>
      </div>
    </div>
  )
}
