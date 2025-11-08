"use client";

// Imports mantidos
import { useEffect, useState } from "react";

// --- Imports do EventManager (NOVO) - MANTIDOS ---
import { EventManager, type Event } from "@/components/features/general/event-manager";
import { v4 as uuidv4 } from 'uuid'; // Usado para IDs de fallback

// Imports mantidos
import "./index.css";

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  // REMOVIDO: abas e 3D → não há mais alternância de abas
  // const [activeTab, setActiveTab] = useState<"calendar" | "3d">("calendar");

  // REMOVIDO: estados do 3D e formulário do paciente (eram usados pelo 3D)
  // const [threeDEvents, setThreeDEvents] = useState<CalendarEvent[]>([]);
  // const [showPatientForm, setShowPatientForm] = useState(false);

  // --- NOVO ESTADO ---
  // Estado para alimentar o NOVO EventManager com dados da API
  const [managerEvents, setManagerEvents] = useState<Event[]>([]);
  const [managerLoading, setManagerLoading] = useState<boolean>(true);

  // Padroniza idioma da página para pt-BR (afeta componentes que usam o lang do documento)
  useEffect(() => {
    try {
      // Atributos no <html>
      document.documentElement.lang = "pt-BR";
      document.documentElement.setAttribute("xml:lang", "pt-BR");
      document.documentElement.setAttribute("data-lang", "pt-BR");
      // Cookie de locale (usado por apps com i18n)
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `NEXT_LOCALE=pt-BR; Path=/; Max-Age=${oneYear}; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setManagerLoading(true);
        const api = await import('@/lib/api');
        const arr = await api.listarAgendamentos('select=*&order=scheduled_at.desc&limit=500').catch(() => []);
        if (!mounted) return;
        if (!arr || !arr.length) {
          setAppointments([]);
          // REMOVIDO: setThreeDEvents([])
          setManagerEvents([]);
          setManagerLoading(false);
          return;
        }

  const patientIds = Array.from(new Set(arr.map((a: any) => a.patient_id).filter(Boolean)));
  const patients = (patientIds && patientIds.length) ? await api.buscarPacientesPorIds(patientIds) : [];
  const patientsById: Record<string, any> = {};
  (patients || []).forEach((p: any) => { if (p && p.id) patientsById[String(p.id)] = p; });

  // Tentar enriquecer com médicos/profissionais quando houver doctor_id
  const doctorIds = Array.from(new Set(arr.map((a: any) => a.doctor_id).filter(Boolean)));
  const doctors = (doctorIds && doctorIds.length) ? await api.buscarMedicosPorIds(doctorIds) : [];
  const doctorsById: Record<string, any> = {};
  (doctors || []).forEach((d: any) => { if (d && d.id) doctorsById[String(d.id)] = d; });

        setAppointments(arr || []);

        // --- LÓGICA DE TRANSFORMAÇÃO PARA O NOVO EVENTMANAGER ---
        const newManagerEvents: Event[] = (arr || []).map((obj: any) => {
          const scheduled = obj.scheduled_at || obj.scheduledAt || obj.time || null;
          const start = scheduled ? new Date(scheduled) : new Date();
          const duration = Number(obj.duration_minutes ?? obj.duration ?? 30) || 30;
          const end = new Date(start.getTime() + duration * 60 * 1000);

          const patient = (patientsById[String(obj.patient_id)]?.full_name) || obj.patient_name || obj.patient_full_name || obj.patient || 'Paciente';
          const title = `${patient}: ${obj.appointment_type ?? obj.type ?? ''}`.trim();

          // Mapeamento de cores padronizado
          const status = String(obj.status || "").toLowerCase();
          let color: Event["color"] = "blue";
          if (status === "confirmed" || status === "confirmado") color = "green";
          else if (status === "pending" || status === "pendente") color = "orange";
          else if (status === "canceled" || status === "cancelado" || status === "cancelled") color = "red";
          else if (status === "requested" || status === "solicitado") color = "blue";

          const professional = (doctorsById[String(obj.doctor_id)]?.full_name) || obj.doctor_name || obj.professional_name || obj.professional || obj.executante || 'Profissional';
          const appointmentType = obj.appointment_type || obj.type || obj.appointmentType || '';
          const insurance = obj.insurance_provider || obj.insurance || obj.convenio || obj.insuranceProvider || null;
          const completedAt = obj.completed_at || obj.completedAt || null;
          const cancelledAt = obj.cancelled_at || obj.cancelledAt || null;
          const cancellationReason = obj.cancellation_reason || obj.cancellationReason || obj.cancel_reason || null;

          return {
            id: obj.id || uuidv4(),
            title,
            description: `Agendamento para ${patient}. Status: ${obj.status || 'N/A'}.`,
            startTime: start,
            endTime: end,
            color,
            // Campos adicionais para visualização detalhada
            patientName: patient,
            professionalName: professional,
            appointmentType,
            status: obj.status || null,
            insuranceProvider: insurance,
            completedAt,
            cancelledAt,
            cancellationReason,
          };
        });
        setManagerEvents(newManagerEvents);
        setManagerLoading(false);
        // --- FIM DA LÓGICA ---

        // REMOVIDO: conversão para 3D e setThreeDEvents
      } catch (err) {
        console.warn('[AgendamentoPage] falha ao carregar agendamentos', err);
        setAppointments([]);
        // REMOVIDO: setThreeDEvents([])
        setManagerEvents([]);
        setManagerLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Handlers mantidos
  const handleSaveAppointment = (appointment: any) => {
    if (appointment.id) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? appointment : a))
      );
    } else {
      const newAppointment = {
        ...appointment,
        id: Date.now().toString(),
      };
      setAppointments((prev) => [...prev, newAppointment]);
    }
  };

  // Mapeia cor do calendário -> status da API
  const statusFromColor = (color?: string) => {
    switch ((color || "").toLowerCase()) {
      case "green": return "confirmed";
      case "orange": return "pending";
      case "red": return "canceled";
      default: return "requested";
    }
  };

  // Componente auxiliar: legenda dinâmica que lista as cores/statuss presentes nos agendamentos
  function DynamicLegend({ events }: { events: Event[] }) {
    // Mapa de classes para cores conhecidas
    const colorClassMap: Record<string, string> = {
      blue: "bg-blue-500 ring-blue-500/20",
      green: "bg-green-500 ring-green-500/20",
      orange: "bg-orange-500 ring-orange-500/20",
      red: "bg-red-500 ring-red-500/20",
      purple: "bg-purple-500 ring-purple-500/20",
      pink: "bg-pink-500 ring-pink-500/20",
      teal: "bg-teal-400 ring-teal-400/20",
    }

    const hashToColor = (s: string) => {
      // gera cor hex simples a partir de hash da string
      let h = 0
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
      const c = (h & 0x00ffffff).toString(16).toUpperCase()
      return "#" + "00000".substring(0, 6 - c.length) + c
    }

    // Agrupa por cor e coleta os status associados
    const entries = new Map<string, Set<string>>()
    for (const ev of events) {
      const col = (ev.color || "blue").toString()
      const st = (ev.status || statusFromColor(ev.color) || "").toString().toLowerCase()
      if (!entries.has(col)) entries.set(col, new Set())
      if (st) entries.get(col)!.add(st)
    }

    // Painel principal: sempre exibe os 3 status primários (Solicitado, Confirmado, Cancelado)
    const statusDisplay = (s: string) => {
      switch (s) {
        case "requested":
        case "request":
        case "solicitado":
          return "Solicitado"
        case "confirmed":
        case "confirmado":
          return "Confirmado"
        case "canceled":
        case "cancelled":
        case "cancelado":
          return "Cancelado"
        case "pending":
        case "pendente":
          return "Pendente"
        case "governo":
        case "government":
          return "Governo"
        default:
          return s.charAt(0).toUpperCase() + s.slice(1)
      }
    }

    // Ordem preferencial para exibição (tenta manter Solicitação/Confirmado/Cancelado em primeiro)
    const priorityList = [
      'solicitado','requested',
      'confirmed','confirmado',
      'pending','pendente',
      'canceled','cancelled','cancelado',
      'governo','government'
    ]

    const items = Array.from(entries.entries()).map(([col, statuses]) => {
      const statusArr = Array.from(statuses)
      let priority = 999
      for (const s of statusArr) {
        const idx = priorityList.indexOf(s)
        if (idx >= 0) priority = Math.min(priority, idx)
      }
      // if none matched, leave priority high so they appear after known statuses
      return { col, statuses: statusArr, priority }
    })

    items.sort((a, b) => a.priority - b.priority || a.col.localeCompare(b.col))

    // Separar itens extras (fora os três principais) para renderizar depois
    const primaryColors = new Set(['blue', 'green', 'red'])
    const extras = items.filter(i => !primaryColors.has(i.col.toLowerCase()))

    return (
      <div className="max-w-full sm:max-w-[520px] rounded-lg border border-slate-700 bg-gradient-to-b from-card/70 to-card/50 px-3 py-2 shadow-md flex items-center gap-4 text-sm overflow-x-auto whitespace-nowrap">
        {/* Bloco grande com os três status principais sempre visíveis e responsivos */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-blue-500 ring-1 ring-white/6" />
            <span className="text-foreground text-xs sm:text-sm font-medium">Solicitado</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 ring-1 ring-white/6" />
            <span className="text-foreground text-xs sm:text-sm font-medium">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500 ring-1 ring-white/6" />
            <span className="text-foreground text-xs sm:text-sm font-medium">Cancelado</span>
          </div>
        </div>

        {/* Itens extras detectados dinamicamente (menores) */}
        {extras.length > 0 && (
          <div className="flex items-center gap-3 ml-3 flex-wrap">
            {extras.map(({ col, statuses }) => {
              const statusList = statuses.map(statusDisplay).filter(Boolean).join(', ')
              const cls = colorClassMap[col.toLowerCase()]
              return (
                <div key={col} className="flex items-center gap-2">
                  {cls ? (
                    <span aria-hidden className={`h-2 w-2 rounded-full ${cls} ring-1`} />
                  ) : (
                    <span aria-hidden className="h-2 w-2 rounded-full ring-1" style={{ backgroundColor: hashToColor(col) }} />
                  )}
                  <span className="text-foreground text-xs">{statusList || col}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Envia atualização para a API e atualiza UI
  const handleEventUpdate = async (id: string, partial: Partial<Event>) => {
    try {
      const payload: any = {};
      if (partial.startTime) payload.scheduled_at = partial.startTime.toISOString();
      if (partial.startTime && partial.endTime) {
        const minutes = Math.max(1, Math.round((partial.endTime.getTime() - partial.startTime.getTime()) / 60000));
        payload.duration_minutes = minutes;
      }
      if (partial.color) payload.status = statusFromColor(partial.color);
      if (typeof partial.description === "string") payload.notes = partial.description;

      if (Object.keys(payload).length) {
        const api = await import('@/lib/api');
        await api.atualizarAgendamento(id, payload);
      }

      // Otimista: reflete mudanças locais
      setManagerEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...partial } : e)));
    } catch (e) {
      console.warn("[Calendário] Falha ao atualizar agendamento na API:", e);
    }
  };

  return (
    <div className="bg-background">
      <div className="w-full">
  <div className="w-full max-w-full mx-0 flex flex-col gap-0 p-0 pl-4 sm:pl-6">
          <div className="relative flex items-center justify-between gap-0 p-0 py-2 sm:py-0">
            <div>
              <h1 className="text-lg font-semibold text-foreground m-0 p-0">Calendário</h1>
              <p className="text-muted-foreground m-0 p-0 text-xs">Navegue através do atalho: Calendário (C).</p>
            </div>

            {/* legenda dinâmica: mostra as cores presentes nos agendamentos do dia atual */}
            <div className="sm:absolute sm:top-2 sm:right-2 mt-2 sm:mt-0 z-40">
              <DynamicLegend events={managerEvents} />
            </div>
          </div>

          <div className="w-full m-0 p-0">
            {managerLoading ? (
              <div className="flex items-center justify-center w-full min-h-[70vh] m-0 p-0">
                <div className="text-xs text-muted-foreground">Conectando ao calendário — carregando agendamentos...</div>
              </div>
            ) : (
              <div className="w-full min-h-[80vh] m-0 p-0">
                <EventManager events={managerEvents} className="compact-event-manager" onEventUpdate={handleEventUpdate} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}