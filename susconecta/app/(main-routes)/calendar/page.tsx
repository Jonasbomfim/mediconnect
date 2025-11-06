"use client";

// Imports mantidos
import { useEffect, useState } from "react";

// --- Imports do EventManager (NOVO) - MANTIDOS ---
import { EventManager, type Event } from "@/components/features/general/event-manager";
import { v4 as uuidv4 } from 'uuid'; // Usado para IDs de fallback

// Imports mantidos
import { Button } from "@/components/ui/button";
import "./index.css";
import { ThreeDWallCalendar, CalendarEvent } from "@/components/ui/three-dwall-calendar"; // Calendário 3D mantido

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"calendar" | "3d">("calendar");
  const [threeDEvents, setThreeDEvents] = useState<CalendarEvent[]>([]);

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

  // --- NOVO ESTADO ---
  // Estado para alimentar o NOVO EventManager com dados da API
  const [managerEvents, setManagerEvents] = useState<Event[]>([]);
  const [managerLoading, setManagerLoading] = useState<boolean>(true);

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "c") setActiveTab("calendar");
      if (event.key === "3") setActiveTab("3d");
    });
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
          setThreeDEvents([]);
          setManagerEvents([]); // Limpa o novo calendário
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
          
          let color = "gray"; // Cor padrão
          if (obj.status === 'confirmed') color = 'green';
          if (obj.status === 'pending') color = 'orange';

          return {
            id: obj.id || uuidv4(), // Usa ID da API ou gera um
            title: title,
            description: `Agendamento para ${patient}. Status: ${obj.status || 'N/A'}.`, 
            startTime: start,
            endTime: end,
            color: color,
          };
        });
        setManagerEvents(newManagerEvents);
        setManagerLoading(false);
        // --- FIM DA LÓGICA ---

        // Convert to 3D calendar events (MANTIDO 100%)
        const threeDEvents: CalendarEvent[] = (arr || []).map((obj: any) => {
          const scheduled = obj.scheduled_at || obj.scheduledAt || obj.time || null;
          const patient = (patientsById[String(obj.patient_id)]?.full_name) || obj.patient_name || obj.patient_full_name || obj.patient || 'Paciente';
          const appointmentType = obj.appointment_type ?? obj.type ?? 'Consulta';
          const title = `${patient}: ${appointmentType}`.trim();
          return {
            id: obj.id || String(Date.now()),
            title,
            date: scheduled ? new Date(scheduled).toISOString() : new Date().toISOString(),
            status: obj.status || 'pending',
            patient,
            type: appointmentType,
          };
        });
        setThreeDEvents(threeDEvents);
      } catch (err) {
        console.warn('[AgendamentoPage] falha ao carregar agendamentos', err);
        setAppointments([]);
        setThreeDEvents([]);
        setManagerEvents([]); // Limpa o novo calendário
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

  const handleAddEvent = (event: CalendarEvent) => {
    setThreeDEvents((prev) => [...prev, event]);
  };

  const handleRemoveEvent = (id: string) => {
    setThreeDEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Tenta clicar no botão de filtro correspondente (procura por texto do botão)
  const clickFilter = (label: string) => {
    try {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
      const match = buttons.find((b) => b.textContent?.trim().toLowerCase().includes(label.toLowerCase()));
      if (match) match.click();
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-row bg-background">
      <div className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-10 p-6">
          <div className="flex flex-row justify-between items-center">
            {/* Todo o cabeçalho foi mantido */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === "calendar" ? "Calendário" : activeTab === "3d" ? "Calendário 3D" : "Lista de Espera"}
              </h1>
              <p className="text-muted-foreground">
                Navegue através dos atalhos: Calendário (C), Fila de espera (F) ou 3D (3).
              </p>
            </div>
            <div className="flex space-x-2 items-center">
              {/* Botões rápidos de filtros (acionam os triggers se existirem no DOM) */}
              <div className="hidden sm:flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => clickFilter("Cores")}>Cores</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => clickFilter("Tags")}>Tags</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => clickFilter("Categorias")}>Categorias</Button>
              </div>

              <div className="flex flex-row">
                <Button
                  type="button"
                  variant={"outline"}
                  className="bg-muted hover:bg-primary! hover:text-white! transition-colors rounded-l-[100px] rounded-r-none"
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendário
                </Button>

                <Button
                  type="button"
                  variant={"outline"}
                  className="bg-muted hover:bg-primary! hover:text-white! transition-colors rounded-r-[100px] rounded-l-none"
                  onClick={() => setActiveTab("3d")}
                >
                  3D
                </Button>
              </div>
            </div>
           </div>

          {/* --- AQUI ESTÁ A SUBSTITUIÇÃO --- */}
          {activeTab === "calendar" ? (
            <div className="flex w-full">
              {/* mostra loading até managerEvents ser preenchido (API integrada desde a entrada) */}
              <div className="w-full">
                {managerLoading ? (
                  <div className="flex items-center justify-center w-full min-h-[70vh]">
                    <div className="text-sm text-muted-foreground">Conectando ao calendário — carregando agendamentos...</div>
                  </div>
                ) : (
                  // EventManager ocupa a área principal e já recebe events da API
                  <div className="w-full min-h-[70vh]">
                    <EventManager events={managerEvents} className="compact-event-manager" />
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "3d" ? (
            // O calendário 3D (ThreeDWallCalendar) foi MANTIDO 100%
            <div className="flex w-full justify-center">
              <ThreeDWallCalendar
                events={threeDEvents}
                onAddEvent={handleAddEvent}
                onRemoveEvent={handleRemoveEvent}
              />
            </div>
          ) : null}
         </div>
       </div>
     </div>
   );
 }