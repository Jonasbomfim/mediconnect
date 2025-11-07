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

          return {
            id: obj.id || uuidv4(),
            title,
            description: `Agendamento para ${patient}. Status: ${obj.status || 'N/A'}.`,
            startTime: start,
            endTime: end,
            color,
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
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 sm:gap-10 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            {/* Cabeçalho simplificado (sem 3D) */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Calendário</h1>
              <p className="text-muted-foreground">
                Navegue através do atalho: Calendário (C).
              </p>
            </div>
            {/* REMOVIDO: botões de abas Calendário/3D */}
          </div>

          {/* Legenda de status (aplica-se ao EventManager) */}
          <div className="rounded-md border bg-card/60 p-2 sm:p-3 -mt-2 sm:-mt-4 overflow-x-auto">
            <div className="flex flex-nowrap items-center gap-4 sm:gap-6 text-xs sm:text-sm whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
                <span className="text-foreground">Solicitado</span>
              </div>
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-3 w-3 rounded-full bg-green-500 ring-2 ring-green-500/30" />
                <span className="text-foreground">Confirmado</span>
              </div>
              {/* Novo: Cancelado (vermelho) */}
              <div className="flex items-center gap-2">
                <span aria-hidden className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/30" />
                <span className="text-foreground">Cancelado</span>
              </div>
            </div>
          </div>

          {/* Apenas o EventManager */}
          <div className="flex w-full">
            <div className="w-full">
              {managerLoading ? (
                <div className="flex items-center justify-center w-full min-h-[60vh] sm:min-h-[70vh]">
                  <div className="text-sm text-muted-foreground">Conectando ao calendário — carregando agendamentos...</div>
                </div>
              ) : (
                <div className="w-full min-h-[60vh] sm:min-h-[70vh]">
                  <EventManager
                    events={managerEvents}
                    className="compact-event-manager"
                    onEventUpdate={handleEventUpdate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REMOVIDO: PatientRegistrationForm (era acionado pelo 3D) */}
      </div>
    </div>
  );
}