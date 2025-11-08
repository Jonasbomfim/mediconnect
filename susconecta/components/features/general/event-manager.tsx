"use client"

import React, { useState, useCallback, useMemo, useEffect } from "react"
import { buscarAgendamentoPorId, buscarPacientesPorIds, buscarMedicosPorIds } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Clock, Grid3x3, List, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  color: string
  category?: string
  attendees?: string[]
  tags?: string[]
  // Additional appointment fields (optional)
  patientName?: string
  professionalName?: string
  appointmentType?: string
  status?: string
  insuranceProvider?: string | null
  completedAt?: string | Date | null
  cancelledAt?: string | Date | null
  cancellationReason?: string | null
}

export interface EventManagerProps {
  events?: Event[]
  onEventCreate?: (event: Omit<Event, "id">) => void
  onEventUpdate?: (id: string, event: Partial<Event>) => void
  onEventDelete?: (id: string) => void
  categories?: string[]
  colors?: { name: string; value: string; bg: string; text: string }[]
  defaultView?: "month" | "week" | "day" | "list"
  className?: string
  availableTags?: string[]
}

const defaultColors = [
  { name: "Blue", value: "blue", bg: "bg-blue-500", text: "text-blue-700" },
  { name: "Green", value: "green", bg: "bg-green-500", text: "text-green-700" },
  { name: "Purple", value: "purple", bg: "bg-purple-500", text: "text-purple-700" },
  { name: "Orange", value: "orange", bg: "bg-orange-500", text: "text-orange-700" },
  { name: "Pink", value: "pink", bg: "bg-pink-500", text: "text-pink-700" },
  { name: "Red", value: "red", bg: "bg-red-500", text: "text-red-700" },
]

// Locale/timezone padrão BR
const LOCALE = "pt-BR"
const TIMEZONE = "America/Sao_Paulo"

export function EventManager({
  events: initialEvents = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = ["Meeting", "Task", "Reminder", "Personal"],
  colors = defaultColors,
  defaultView = "month",
  className,
  availableTags = ["Important", "Urgent", "Work", "Personal", "Team", "Client"],
}: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"month" | "week" | "day" | "list">(defaultView)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null)
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    description: "",
    color: colors[0].value,
    category: categories[0],
    tags: [],
  })

  const [searchQuery, setSearchQuery] = useState("")

  // Dialog: lista completa de pacientes do dia
  const [dayDialogEvents, setDayDialogEvents] = useState<Event[] | null>(null)
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false)
  const openDayDialog = useCallback((eventsForDay: Event[]) => {
    // ordena por horário antes de abrir
    const ordered = [...eventsForDay].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    setDayDialogEvents(ordered)
    setIsDayDialogOpen(true)
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }
      return true
    })
  }, [events, searchQuery])

  const hasActiveFilters = false

  const clearFilters = () => {
    setSearchQuery("")
  }

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return

    const event: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    }

    setEvents((prev) => [...prev, event])
    onEventCreate?.(event)
    setIsDialogOpen(false)
    setIsCreating(false)
    setNewEvent({
      title: "",
      description: "",
      color: colors[0].value,
      category: categories[0],
      tags: [],
    })
  }, [newEvent, colors, categories, onEventCreate])

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? selectedEvent : e)))
    onEventUpdate?.(selectedEvent.id, selectedEvent)
    setIsDialogOpen(false)
    setSelectedEvent(null)
  }, [selectedEvent, onEventUpdate])

  const handleDeleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== id))
      onEventDelete?.(id)
      setIsDialogOpen(false)
      setSelectedEvent(null)
    },
    [onEventDelete],
  )

  const handleDragStart = useCallback((event: Event) => {
    setDraggedEvent(event)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null)
  }, [])

  const handleDrop = useCallback(
    (date: Date, hour?: number) => {
      if (!draggedEvent) return

      const duration = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime()
      const newStartTime = new Date(date)
      if (hour !== undefined) {
        newStartTime.setHours(hour, 0, 0, 0)
      }
      const newEndTime = new Date(newStartTime.getTime() + duration)

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      }

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)))
      onEventUpdate?.(draggedEvent.id, updatedEvent)
      setDraggedEvent(null)
    },
    [draggedEvent, onEventUpdate],
  )

  const navigateDate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev)
        if (view === "month") {
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1))
        } else if (view === "week") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7))
        } else if (view === "day") {
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1))
        }
        return newDate
      })
    },
    [view],
  )

  const getColorClasses = useCallback(
    (colorValue: string) => {
      const color = colors.find((c) => c.value === colorValue)
      return color || colors[0]
    },
    [colors],
  )

  // Força lang/cookie pt-BR no documento (reforço local)
  useEffect(() => {
    try {
      document.documentElement.lang = "pt-BR"
      document.documentElement.setAttribute("xml:lang", "pt-BR")
      document.documentElement.setAttribute("data-lang", "pt-BR")
      const oneYear = 60 * 60 * 24 * 365
      document.cookie = `NEXT_LOCALE=pt-BR; Path=/; Max-Age=${oneYear}; SameSite=Lax`
    } catch {}
  }, [])

  // Quando um evento é selecionado para visualização, buscar dados completos do agendamento
  // para garantir que patient/professional/tags/attendees/status estejam preenchidos.
  useEffect(() => {
    if (!selectedEvent || isCreating) return
    let cancelled = false

    const enrich = async () => {
      try {
        const full = await buscarAgendamentoPorId(selectedEvent.id).catch(() => null)
        if (cancelled || !full) return

        // Tentar resolver nomes de paciente e profissional a partir de IDs quando possível
        let patientName = selectedEvent.patientName
        if ((!patientName || patientName === "—") && full.patient_id) {
          const pList = await buscarPacientesPorIds([full.patient_id as any]).catch(() => [])
          if (pList && pList.length) patientName = (pList[0] as any).full_name || (pList[0] as any).fullName || (pList[0] as any).name
        }

        let professionalName = selectedEvent.professionalName
        if ((!professionalName || professionalName === "—") && full.doctor_id) {
          const dList = await buscarMedicosPorIds([full.doctor_id as any]).catch(() => [])
          if (dList && dList.length) professionalName = (dList[0] as any).full_name || (dList[0] as any).fullName || (dList[0] as any).name
        }

        const merged: Event = {
          ...selectedEvent,
          // priorizar valores vindos do backend quando existirem
          title: ((full as any).title as any) || selectedEvent.title,
          description: ((full as any).notes as any) || ((full as any).patient_notes as any) || selectedEvent.description,
          patientName: patientName || selectedEvent.patientName,
          professionalName: professionalName || selectedEvent.professionalName,
          appointmentType: ((full as any).appointment_type as any) || selectedEvent.appointmentType,
          status: ((full as any).status as any) || selectedEvent.status,
          insuranceProvider: ((full as any).insurance_provider as any) ?? selectedEvent.insuranceProvider,
          completedAt: ((full as any).completed_at as any) ?? selectedEvent.completedAt,
          cancelledAt: ((full as any).cancelled_at as any) ?? selectedEvent.cancelledAt,
          cancellationReason: ((full as any).cancellation_reason as any) ?? selectedEvent.cancellationReason,
          attendees: ((full as any).attendees as any) || ((full as any).participants as any) || selectedEvent.attendees,
          tags: ((full as any).tags as any) || selectedEvent.tags,
        }

        if (!cancelled) setSelectedEvent(merged)
      } catch (err) {
        // não bloquear UI em caso de falha
        console.warn('[EventManager] Falha ao enriquecer agendamento:', err)
      }
    }

    enrich()

    return () => {
      cancelled = true
    }
  }, [selectedEvent, isCreating])

  // Remove trechos redundantes como "Status: requested." que às vezes vêm concatenados na descrição
  const sanitizeDescription = (d?: string | null) => {
    if (!d) return null
    try {
      // Remove qualquer segmento "Status: ..." seguido opcionalmente de ponto
      const cleaned = String(d).replace(/Status:\s*[^\.\n]+\.?/gi, "").trim()
      return cleaned || null
    } catch (e) {
      return d
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-semibold sm:text-2xl">
            {view === "month" &&
              currentDate.toLocaleDateString(LOCALE, {
                month: "long",
                year: "numeric",
                timeZone: TIMEZONE,
              })}
            {view === "week" &&
              `Semana de ${currentDate.toLocaleDateString(LOCALE, {
                month: "short",
                day: "numeric",
                timeZone: TIMEZONE,
              })}`}
            {view === "day" &&
              currentDate.toLocaleDateString(LOCALE, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
                timeZone: TIMEZONE,
              })}
            {view === "list" && "Todos os eventos"}
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateDate("prev")} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateDate("next")} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mês
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Semana
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Dia
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Lista
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-lg border bg-background p-1">
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className="h-8"
            >
              <Calendar className="h-4 w-4" />
              <span className="ml-1">Mês</span>
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
              <span className="ml-1">Semana</span>
            </Button>
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className="h-8"
            >
              <Clock className="h-4 w-4" />
              <span className="ml-1">Dia</span>
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="ml-1">Lista</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative flex-1">
          <div className="flex items-center">
            {/* Lupa minimalista à esquerda (somente ícone) */}
            <button
              type="button"
              aria-label="Buscar"
              className="flex items-center justify-center h-10 w-10 p-0 text-muted-foreground bg-transparent border-0"
              onClick={() => {
                const el = document.querySelector<HTMLInputElement>('input[placeholder="Buscar eventos..."]')
                el?.focus()
              }}
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Input central com altura consistente e foco visível */}
            <Input
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "flex-1 h-10 px-3 border border-border focus:ring-2 focus:ring-primary/20 outline-none",
                searchQuery ? "rounded-l-md rounded-r-none" : "rounded-md"
              )}
            />

            {/* Botão limpar discreto à direita (aparece somente com query) */}
            {searchQuery ? (
              <button
                type="button"
                aria-label="Limpar busca"
                className="flex items-center justify-center h-10 w-10 p-0 text-muted-foreground bg-transparent border-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Calendar Views - Pass filteredEvents instead of events */}
      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={(event) => handleDragStart(event)}
          onDragEnd={() => handleDragEnd()}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
          openDayDialog={openDayDialog}
        />
      )}

      {/* Dialog com todos os pacientes do dia */}
      <Dialog open={isDayDialogOpen} onOpenChange={setIsDayDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pacientes do dia</DialogTitle>
            <DialogDescription>Todos os agendamentos do dia selecionado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {dayDialogEvents?.map((ev) => (
              <div
                key={ev.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedEvent(ev)
                  setIsDialogOpen(true)
                  setIsDayDialogOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedEvent(ev)
                    setIsDialogOpen(true)
                    setIsDayDialogOpen(false)
                  }
                }}
                className="flex items-start gap-3 p-2 border-b last:border-b-0 rounded-md cursor-pointer hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className={cn("mt-1 h-3 w-3 rounded-full", getColorClasses(ev.color).bg)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{ev.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {ev.startTime.toLocaleTimeString(LOCALE,{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:TIMEZONE})}
                      {" - "}
                      {ev.endTime.toLocaleTimeString(LOCALE,{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:TIMEZONE})}
                    </div>
                  </div>
                  {ev.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">{ev.description}</div>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ev.category && <Badge variant="secondary" className="text-[11px] h-5">{ev.category}</Badge>}
                    {ev.tags?.map((t) => (
                      <Badge key={t} variant="outline" className="text-[11px] h-5">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {!dayDialogEvents?.length && (
              <div className="py-6 text-center text-sm text-muted-foreground">Nenhum evento</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={(event) => handleDragStart(event)}
          onDragEnd={() => handleDragEnd()}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          onDragStart={(event) => handleDragStart(event)}
          onDragEnd={() => handleDragEnd()}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === "list" && (
        <ListView
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event)
            setIsDialogOpen(true)
          }}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent className="w-full max-w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Criar Evento" : "Detalhes do Agendamento"}</DialogTitle>
            <DialogDescription>
              {isCreating ? "Adicione um novo evento ao seu calendário" : "Visualizar e editar detalhes do agendamento"}
            </DialogDescription>
          </DialogHeader>

          {/* Dialog content: form when creating; read-only view when viewing */}
          {isCreating ? (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={newEvent.title ?? ""}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Título do evento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description ?? ""}
                    onChange={(e) => setNewEvent((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do evento"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Início</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={
                        newEvent.startTime
                          ? new Date(newEvent.startTime.getTime() - newEvent.startTime.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, startTime: new Date(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">Fim</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={
                        newEvent.endTime
                          ? new Date(newEvent.endTime.getTime() - newEvent.endTime.getTimezoneOffset() * 60000)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => setNewEvent((prev) => ({ ...prev, endTime: new Date(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setIsCreating(false)
                    setSelectedEvent(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent}>Criar</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Read-only compact view: title + stacked details + descrição abaixo */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold">{selectedEvent?.title || "—"}</h3>
                </div>

                <div className="p-3 sm:p-4 rounded-md border bg-card/5 text-sm text-muted-foreground">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-[12px] text-muted-foreground">Profissional</div>
                      <div className="mt-1 text-sm font-medium break-words">{selectedEvent?.professionalName || "—"}</div>
                    </div>

                    <div>
                      <div className="text-[12px] text-muted-foreground">Paciente</div>
                      <div className="mt-1 text-sm font-medium break-words">{selectedEvent?.patientName || "—"}</div>
                    </div>

                    <div>
                      <div className="text-[12px] text-muted-foreground">Tipo</div>
                      <div className="mt-1 text-sm font-medium break-words">{selectedEvent?.appointmentType || "—"}</div>
                    </div>

                    <div>
                      <div className="text-[12px] text-muted-foreground">Status</div>
                      <div className="mt-1 text-sm font-medium break-words">{selectedEvent?.status || "—"}</div>
                    </div>

                    <div>
                      <div className="text-[12px] text-muted-foreground">Data</div>
                      <div className="mt-1 text-sm font-medium break-words">{(() => {
                        const formatDate = (d?: string | Date) => {
                          if (!d) return "—"
                          try {
                            const dt = d instanceof Date ? d : new Date(d)
                            if (isNaN(dt.getTime())) return "—"
                            return dt.toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIMEZONE })
                          } catch (e) {
                            return "—"
                          }
                        }
                        return formatDate(selectedEvent?.startTime)
                      })()}</div>
                    </div>

                    {selectedEvent?.completedAt && (
                      <div>
                        <div className="text-[12px] text-muted-foreground">Concluído em</div>
                        <div className="mt-1 text-sm font-medium break-words">{(() => {
                          const dt = selectedEvent.completedAt
                          try {
                            const d = dt instanceof Date ? dt : new Date(dt as any)
                            return isNaN(d.getTime()) ? "—" : d.toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIMEZONE })
                          } catch { return "—" }
                        })()}</div>
                      </div>
                    )}

                    {selectedEvent?.cancelledAt && (
                      <div>
                        <div className="text-[12px] text-muted-foreground">Cancelado em</div>
                        <div className="mt-1 text-sm font-medium break-words">{(() => {
                          const dt = selectedEvent.cancelledAt
                          try {
                            const d = dt instanceof Date ? dt : new Date(dt as any)
                            return isNaN(d.getTime()) ? "—" : d.toLocaleString(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIMEZONE })
                          } catch { return "—" }
                        })()}</div>
                        <div className="text-[12px] text-muted-foreground mt-2">Motivo do cancelamento</div>
                        <div className="mt-1 text-sm font-medium break-words">{selectedEvent?.cancellationReason || "—"}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Observações</Label>
                  <div className="min-h-[80px] sm:min-h-[120px] p-3 rounded-md border bg-muted/5 text-sm text-muted-foreground whitespace-pre-wrap">
                    {sanitizeDescription(selectedEvent?.description) ?? "—"}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false)
                      setIsCreating(false)
                      setSelectedEvent(null)
                    }}
                  >
                    Fechar
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// EventCard component with hover effect
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = "default",
}: {
  event: Event
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  getColorClasses: (color: string) => { bg: string; text: string }
  variant?: "default" | "compact" | "detailed"
}) {
  const [isHovered, setIsHovered] = useState(false)
  const colorClasses = getColorClasses(event.color)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: TIMEZONE,
    })
  }

  const getDuration = () => {
    const diff = event.endTime.getTime() - event.startTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (variant === "compact") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer"
      >
        <div
          className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium transition-all duration-300",
            colorClasses.bg,
            "text-white truncate animate-in fade-in slide-in-from-top-1",
            isHovered && "scale-105 shadow-lg z-10",
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
            <Card className="border-2 p-3 shadow-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{event.title}</h4>
                  <div className={cn("h-3 w-3 rounded-full flex-shrink-0", colorClasses.bg)} />
                </div>
                {event.description && <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (variant === "detailed") {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={() => onEventClick(event)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "cursor-pointer rounded-lg p-3 transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-2",
          isHovered && "scale-[1.03] shadow-2xl ring-2 ring-white/50",
        )}
      >
        <div className="font-semibold">{event.title}</div>
        {event.description && <div className="mt-1 text-sm opacity-90 line-clamp-2">{event.description}</div>}
        <div className="mt-2 flex items-center gap-2 text-xs opacity-80">
          <Clock className="h-3 w-3" />
          {formatTime(event.startTime)} - {formatTime(event.endTime)}
        </div>
        {isHovered && (
          <div className="mt-2 flex flex-wrap gap-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {event.category && (
              <Badge variant="secondary" className="text-xs">
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={() => onEventClick(event)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <div
        className={cn(
          "cursor-pointer rounded px-2 py-1 text-xs font-medium transition-all duration-300",
          colorClasses.bg,
          "text-white animate-in fade-in slide-in-from-left-1",
          isHovered && "scale-105 shadow-lg z-10",
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <Card className="border-2 p-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold leading-tight">{event.title}</h4>
                <div className={cn("h-4 w-4 rounded-full flex-shrink-0", colorClasses.bg)} />
              </div>
              {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px]">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {event.category && (
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Month View Component
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
  openDayDialog,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date) => void
  getColorClasses: (color: string) => { bg: string; text: string }
  openDayDialog: (eventsForDay: Event[]) => void
}) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const days = []
  const currentDay = new Date(startDate)

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      )
    })
  }

  return (
    // Permitir que popovers absolutos saiam do grid do mês sem serem cortados
    <Card className="overflow-visible">
      <div className="grid grid-cols-7 border-b">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          // dedup por título para evitar repetidos
          const uniqueMap = new Map<string, Event>()
          dayEvents.forEach((ev) => {
            const k = (ev.title || "").trim().toLowerCase()
            if (!uniqueMap.has(k)) uniqueMap.set(k, ev)
          })
          const uniqueEvents = Array.from(uniqueMap.values())
          const eventsToShow = uniqueEvents.slice(0, 3)
          const moreCount = Math.max(0, uniqueEvents.length - 3)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={cn(
                "min-h-20 border-b border-r p-1 transition-colors last:border-r-0 sm:min-h-24 sm:p-2",
                !isCurrentMonth && "bg-muted/30",
                "hover:bg-accent/50",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              {/* Número do dia padronizado (sem destaque azul no 'hoje') */}
              <div className="mb-1 text-xs sm:text-sm">{day.getDate()}</div>

              <div className="space-y-1">
                {eventsToShow.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {moreCount > 0 && (
                  <div className="text-[10px] sm:text-xs">
                    <button
                      type="button"
                      onClick={() => openDayDialog(uniqueEvents)}
                      className="text-primary underline"
                    >
                      +{moreCount} mais
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Week View Component (simplified and stable)
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour?: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    return day
  })

  const getEventsForDay = (date: Date) =>
    events.filter((event) => {
      const d = new Date(event.startTime)
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      )
    })

  return (
    <Card className="overflow-auto">
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="border-r p-2 text-center text-xs font-medium last:border-r-0 sm:text-sm">
            <span className="hidden sm:inline">{day.toLocaleDateString(LOCALE, { weekday: "short", timeZone: TIMEZONE })}</span>
            <span className="sm:hidden">{day.toLocaleDateString(LOCALE, { weekday: "narrow", timeZone: TIMEZONE })}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          return (
            <div key={idx} className="min-h-40 border-r p-2 last:border-r-0">
              <div className="space-y-2">
                {dayEvents.map((ev) => (
                  <div key={ev.id} className="mb-2">
                    <EventCard
                      event={ev}
                      onEventClick={onEventClick}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="compact"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// Day View Component (simple hourly lanes)
function DayView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}: {
  currentDate: Date
  events: Event[]
  onEventClick: (event: Event) => void
  onDragStart: (event: Event) => void
  onDragEnd: () => void
  onDrop: (date: Date, hour?: number) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getEventsForHour = (hour: number) =>
    events.filter((event) => {
      const d = new Date(event.startTime)
      return (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === currentDate.getDate() &&
        d.getHours() === hour
      )
    })

  return (
    <Card className="overflow-auto">
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour)
          return (
            <div key={hour} className="flex border-b last:border-b-0" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(currentDate, hour)}>
              <div className="w-14 flex-shrink-0 border-r p-2 text-xs text-muted-foreground sm:w-20 sm:p-3 sm:text-sm">
                {hour.toString().padStart(2, "0")}:00
              </div>
              <div className="min-h-16 flex-1 p-1 transition-colors hover:bg-accent/50 sm:min-h-20 sm:p-2">
                <div className="space-y-2">
                  {hourEvents.map((event) => (
                    <EventCard key={event.id} event={event} onEventClick={onEventClick} onDragStart={onDragStart} onDragEnd={onDragEnd} getColorClasses={getColorClasses} variant="detailed" />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// List View Component
function ListView({
  events,
  onEventClick,
  getColorClasses,
}: {
  events: Event[]
  onEventClick: (event: Event) => void
  getColorClasses: (color: string) => { bg: string; text: string }
}) {
  const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const groupedEvents = sortedEvents.reduce(
    (acc, event) => {
      const dateKey = event.startTime.toLocaleDateString(LOCALE, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: TIMEZONE,
      })
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  return (
    <Card className="p-3 sm:p-4">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color)
                return (
                  <div key={event.id} onClick={() => onEventClick(event)} className="group cursor-pointer rounded-lg border bg-card p-3 transition-all hover:shadow-md hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-2 duration-300 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={cn("mt-1 h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3", colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors sm:text-base truncate">
                              {event.title}
                            </h4>
                            {event.description && (
                              <p className="mt-1 text-xs text-muted-foreground sm:text-sm line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {event.category && (
                              <Badge variant="secondary" className="text-xs">
                                {event.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground sm:gap-4 sm:text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.startTime.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIMEZONE })}
                            {" - "}
                            {event.endTime.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TIMEZONE })}
                          </div>
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] h-4 sm:text-xs sm:h-5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {sortedEvents.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground sm:text-base">Nenhum evento encontrado</div>
        )}
      </div>
    </Card>
  )
}
