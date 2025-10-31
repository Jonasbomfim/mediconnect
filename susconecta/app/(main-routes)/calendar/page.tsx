"use client";

// Imports mantidos
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// --- Imports do FullCalendar (ANTIGO) - REMOVIDOS ---
// import pt_br_locale from "@fullcalendar/core/locales/pt-br";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import { EventInput } from "@fullcalendar/core/index.js";

// --- Imports do EventManager (NOVO) - ADICIONADOS ---
import { EventManager, type Event } from "@/components/event-manager";
import { v4 as uuidv4 } from 'uuid';

// Imports mantidos
import { Sidebar } from "@/components/dashboard/sidebar";
import { PagesHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { mockWaitingList } from "@/lib/mocks/appointment-mocks";
import "./index.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThreeDWallCalendar, CalendarEvent } from "@/components/ui/three-dwall-calendar"; // Calendário 3D mantido

const ListaEspera = dynamic(
  () => import("@/components/agendamento/ListaEspera"),
  { ssr: false }
);

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState(mockWaitingList);
  const [activeTab, setActiveTab] = useState<"calendar" | "espera" | "3d">("calendar");
  
  // O 'requestsList' do FullCalendar foi removido.
  // const [requestsList, setRequestsList] = useState<EventInput[]>(); 
  
  const [threeDEvents, setThreeDEvents] = useState<CalendarEvent[]>([]);

  // --- Dados de Exemplo para o NOVO Calendário ---
  // (Colado do exemplo do 21st.dev)
  const demoEvents: Event[] = [
    {
      id: uuidv4(),
      title: "Team Standup",
      description: "Daily sync with the engineering team.",
      startTime: new Date(2025, 9, 20, 9, 0, 0), // Mês 9 = Outubro
      endTime: new Date(2025, 9, 20, 9, 30, 0),
      color: "blue",
    },
    {
      id: uuidv4(),
      title: "Code Review",
      description: "Review PRs for the new feature.",
      startTime: new Date(2025, 9, 21, 14, 0, 0),
      endTime: new Date(2025, 9, 21, 15, 0, 0),
      color: "green",
    },
    {
      id: uuidv4(),
      title: "Client Presentation",
      description: "Present the new designs to the client.",
      startTime: new Date(2025, 9, 22, 11, 0, 0),
      endTime: new Date(2025, 9, 22, 12, 0, 0),
      color: "orange",
    },
    {
      id: uuidv4(),
      title: "Sprint Planning",
      description: "Plan the next sprint tasks.",
      startTime: new Date(2025, 9, 23, 10, 0, 0),
      endTime: new Date(2025, 9, 23, 11, 30, 0),
      color: "purple",
    },
    {
      id: uuidv4(),
      title: "Doctor Appointment",
      description: "Annual check-up.",
      startTime: new Date(2025, 9, 24, 16, 0, 0),
      endTime: new Date(2025, 9, 24, 17, 0, 0),
      color: "red",
    },
    {
      id: uuidv4(),
      title: "Deploy to Production",
      description: "Deploy the new release.",
      startTime: new Date(2025, 9, 25, 15, 0, 0),
      endTime: new Date(2025, 9, 25, 16, 0, 0),
      color: "teal",
    },
    {
      id: uuidv4(),
      title: "Product Design Review",
      description: "Review the new product design mockups.",
      startTime: new Date(2025, 9, 20, 13, 0, 0),
      endTime: new Date(2025, 9, 20, 14, 30, 0),
      color: "pink",
    },
    {
      id: uuidv4(),
      title: "Gym Session",
      description: "Leg day.",
      startTime: new Date(2025, 9, 20, 18, 0, 0),
      endTime: new Date(2025, 9, 20, 19, 0, 0),
      color: "gray",
    },
  ];
  // --- Fim dos Dados de Exemplo ---

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "c") {
        setActiveTab("calendar");
      }
      if (event.key === "f") {
        setActiveTab("espera");
      }
      if (event.key === "3") {
        setActiveTab("3d");
      }
    });
  }, []);

  useEffect(() => {
    // Este useEffect foi mantido, pois ele busca dados para o Calendário 3D
    let mounted = true;
    (async () => {
      try {
        const api = await import('@/lib/api');
        const arr = await api.listarAgendamentos('select=*&order=scheduled_at.desc&limit=500').catch(() => []);
        if (!mounted) return;
        if (!arr || !arr.length) {
          setAppointments([]);
          // setRequestsList([]); // Removido
          setThreeDEvents([]);
          return;
        }

        const patientIds = Array.from(new Set(arr.map((a: any) => a.patient_id).filter(Boolean)));
        const patients = (patientIds && patientIds.length) ? await api.buscarPacientesPorIds(patientIds) : [];
        const patientsById: Record<string, any> = {};
        (patients || []).forEach((p: any) => { if (p && p.id) patientsById[String(p.id)] = p; });

        setAppointments(arr || []);

        // --- Mapeamento para o FullCalendar (ANTIGO) - REMOVIDO ---
        // const events: EventInput[] = (arr || []).map((obj: any) => {
        //   ...
        // });
        // setRequestsList(events || []);

        // Convert to 3D calendar events (MANTIDO)
        const threeDEvents: CalendarEvent[] = (arr || []).map((obj: any) => {
          const scheduled = obj.scheduled_at || obj.scheduledAt || obj.time || null;
          const patient = (patientsById[String(obj.patient_id)]?.full_name) || obj.patient_name || obj.patient_full_name || obj.patient || 'Paciente';
          const title = `${patient}: ${obj.appointment_type ?? obj.type ?? ''}`.trim();
          return {
            id: obj.id || String(Date.now()),
            title,
            date: scheduled ? new Date(scheduled).toISOString() : new Date().toISOString(),
          };
        });
        setThreeDEvents(threeDEvents);
      } catch (err) {
        console.warn('[AgendamentoPage] falha ao carregar agendamentos', err);
        setAppointments([]);
        // setRequestsList([]); // Removido
        setThreeDEvents([]);
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

  const handleNotifyPatient = (patientId: string) => {
    console.log(`Notificando paciente ${patientId}`);
  };

  const handleAddEvent = (event: CalendarEvent) => {
    setThreeDEvents((prev) => [...prev, event]);
  };

  const handleRemoveEvent = (id: string) => {
    setThreeDEvents((prev) => prev.filter((e) => e.id !== id));
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
            <div className="flex space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="bg-primary hover:bg-primary/90 px-5 py-1 text-primary-foreground rounded-sm">
                  Opções &#187;
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <Link href={"/agenda"}>
                    <DropdownMenuItem>Agendamento</DropdownMenuItem>
                  </Link>
                  <Link href={"/procedimento"}>
                    <DropdownMenuItem>Procedimento</DropdownMenuItem>
                  </Link>
                  <Link href={"/financeiro"}>
                    <DropdownMenuItem>Financeiro</DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-row">
                <Button
                  variant={"outline"}
                  className="bg-muted hover:!bg-primary hover:!text-white transition-colors rounded-l-[100px] rounded-r-[0px]"
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendário
                </Button>

                <Button
                  variant={"outline"}
                  className="bg-muted hover:!bg-primary hover:!text-white transition-colors rounded-none"
                  onClick={() => setActiveTab("3d")}
                >
                  3D
                </Button>

                <Button
                  variant={"outline"}
                  className="bg-muted hover:!bg-primary hover:!text-white transition-colors rounded-r-[100px] rounded-l-[0px]"
                  onClick={() => setActiveTab("espera")}
                >
                  Lista de espera
                </Button>
              </div>
            </div>
          </div>

          {/* --- AQUI ESTÁ A MUDANÇA --- */}
          {activeTab === "calendar" ? (
            <div className="flex w-full">
              {/* O FullCalendar antigo foi substituído por este */}
              <EventManager events={demoEvents} />
            </div>
          ) : activeTab === "3d" ? (
            // O calendário 3D foi mantido intacto
            <div className="flex w-full">
              <ThreeDWallCalendar
                events={threeDEvents}
                onAddEvent={handleAddEvent}
                onRemoveEvent={handleRemoveEvent}
              />
            </div>
          ) : (
            // A Lista de Espera foi mantida intacta
            <ListaEspera
              patients={waitingList}
              onNotify={handleNotifyPatient}
              onAddToWaitlist={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}