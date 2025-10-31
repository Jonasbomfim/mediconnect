"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import pt_br_locale from "@fullcalendar/core/locales/pt-br";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import { EventInput } from "@fullcalendar/core/index.js";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PagesHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { mockWaitingList } from "@/lib/mocks/appointment-mocks";
import "./index.css";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThreeDWallCalendar, CalendarEvent } from "@/components/ui/three-dwall-calendar";

const ListaEspera = dynamic(
  () => import("@/components/agendamento/ListaEspera"),
  { ssr: false }
);

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState(mockWaitingList);
  const [activeTab, setActiveTab] = useState<"calendar" | "espera" | "3d">("calendar");
  const [requestsList, setRequestsList] = useState<EventInput[]>();
  const [threeDEvents, setThreeDEvents] = useState<CalendarEvent[]>([]);

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
    // Fetch real appointments and map to calendar events
    let mounted = true;
    (async () => {
      try {
        // listarAgendamentos accepts a query string; request a reasonable limit and order
        const api = await import('@/lib/api');
        const arr = await api.listarAgendamentos('select=*&order=scheduled_at.desc&limit=500').catch(() => []);
        if (!mounted) return;
        if (!arr || !arr.length) {
          setAppointments([]);
          setRequestsList([]);
          setThreeDEvents([]);
          return;
        }

        // Batch-fetch patient names for display
        const patientIds = Array.from(new Set(arr.map((a: any) => a.patient_id).filter(Boolean)));
        const patients = (patientIds && patientIds.length) ? await api.buscarPacientesPorIds(patientIds) : [];
        const patientsById: Record<string, any> = {};
        (patients || []).forEach((p: any) => { if (p && p.id) patientsById[String(p.id)] = p; });

        setAppointments(arr || []);

        const events: EventInput[] = (arr || []).map((obj: any) => {
          const scheduled = obj.scheduled_at || obj.scheduledAt || obj.time || null;
          const start = scheduled ? new Date(scheduled) : null;
          const duration = Number(obj.duration_minutes ?? obj.duration ?? 30) || 30;
          const patient = (patientsById[String(obj.patient_id)]?.full_name) || obj.patient_name || obj.patient_full_name || obj.patient || 'Paciente';
          const title = `${patient}: ${obj.appointment_type ?? obj.type ?? ''}`.trim();
          const color = obj.status === 'confirmed' ? '#68d68a' : obj.status === 'pending' ? '#ffe55f' : '#ff5f5fff';
          return {
            title,
            start: start || new Date(),
            end: start ? new Date(start.getTime() + duration * 60 * 1000) : undefined,
            color,
            extendedProps: { raw: obj },
          } as EventInput;
        });
        setRequestsList(events || []);

        // Convert to 3D calendar events
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
        setRequestsList([]);
        setThreeDEvents([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // mantive para caso a lógica de salvar consulta passe a funcionar
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
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {activeTab === "calendar" ? "Calendário" : activeTab === "3d" ? "Calendário 3D" : "Lista de Espera"}
              </h1>
              <p className="text-muted-foreground">
                Navegue através dos atalhos: Calendário (C), Fila de espera (F) ou 3D (3).
              </p>
            </div>
            <div className="flex space-x-2">
              {/* <Link href={"/agenda"}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Agenda
                </Button>
              </Link> */}
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

          {activeTab === "calendar" ? (
            <div className="flex w-full">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={pt_br_locale}
                timeZone={"America/Sao_Paulo"}
                events={requestsList}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                dateClick={(info) => {
                  info.view.calendar.changeView("timeGridDay", info.dateStr);
                }}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                dayMaxEventRows={3}
              />
            </div>
          ) : activeTab === "3d" ? (
            <div className="flex w-full justify-center">
              <ThreeDWallCalendar
                events={threeDEvents}
                onAddEvent={handleAddEvent}
                onRemoveEvent={handleRemoveEvent}
              />
            </div>
          ) : (
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
