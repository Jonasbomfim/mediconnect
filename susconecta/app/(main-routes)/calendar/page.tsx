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

const ListaEspera = dynamic(
  () => import("@/components/agendamento/ListaEspera"),
  { ssr: false }
);

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [waitingList, setWaitingList] = useState(mockWaitingList);
  const [activeTab, setActiveTab] = useState<"calendar" | "espera">("calendar");
  const [requestsList, setRequestsList] = useState<EventInput[]>();

  useEffect(() => {
    document.addEventListener("keydown", (event) => {
      if (event.key === "c") {
        setActiveTab("calendar");
      }
      if (event.key === "f") {
        setActiveTab("espera");
      }
    });
  }, []);

  useEffect(() => {
    // Fetch real appointments and map to calendar events
    let mounted = true;
    (async () => {
      try {
        // listarAgendamentos accepts a query string; request a reasonable limit and order
        const arr = await (await import('@/lib/api')).listarAgendamentos('select=*&order=scheduled_at.desc&limit=500').catch(() => []);
        if (!mounted) return;
        if (!arr || !arr.length) {
          setAppointments([]);
          setRequestsList([]);
          return;
        }

        // Batch-fetch patient names for display
        const patientIds = Array.from(new Set(arr.map((a: any) => a.patient_id).filter(Boolean)));
        const patients = (patientIds && patientIds.length) ? await (await import('@/lib/api')).buscarPacientesPorIds(patientIds) : [];
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
      } catch (err) {
        console.warn('[AgendamentoPage] falha ao carregar agendamentos', err);
        setAppointments([]);
        setRequestsList([]);
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

  return (
    <div className="flex flex-row bg-background">
      <div className="flex w-full flex-col">
        <div className="flex w-full flex-col gap-10 p-6">
          <div className="flex flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{activeTab === "calendar" ? "Calendário" : "Lista de Espera"}</h1>
              <p className="text-muted-foreground">
                Navegue através dos atalhos: Calendário (C) ou Fila de espera
                (F).
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
                  className="bg-muted hover:bg-muted/80 hover:text-foreground rounded-l-[100px] rounded-r-[0px]"
                  onClick={() => setActiveTab("calendar")}
                >
                  Calendário
                </Button>

                <Button
                  variant={"outline"}
                  className="bg-muted hover:bg-muted/80 hover:text-foreground rounded-r-[100px] rounded-l-[0px]"
                  onClick={() => setActiveTab("espera")}
                >
                  Lista de espera
                </Button>
              </div>
            </div>
          </div>

          {activeTab === "calendar" ? (
            <div className="flex w-full flex-col">
              {/* Cabeçalho do calendário */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                        const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                        if (calendarApi) calendarApi.prev();
                      }}
                  >
                    &lt;
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                        const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                        if (calendarApi) calendarApi.today();
                      }}
                  >
                    Hoje
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                        const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                        if (calendarApi) calendarApi.next();
                      }}
                  >
                    &gt;
                  </Button>
                  <span className="ml-4 text-xl font-semibold" id="calendar-title"></span>
                </div>
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Button
                    variant="outline"
                    className="rounded-[8px] px-4"
                    onClick={() => {
                      const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                      if (calendarApi) calendarApi.changeView('dayGridMonth');
                    }}
                  >
                    Mês
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-[8px] px-4"
                    onClick={() => {
                      const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                      if (calendarApi) calendarApi.changeView('timeGridWeek');
                    }}
                  >
                    Semana
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-[8px] px-4"
                    onClick={() => {
                      const calendarApi = (document.querySelector('.fc') as any)?.__fullCalendar;
                      if (calendarApi) calendarApi.changeView('timeGridDay');
                    }}
                  >
                    Dia
                  </Button>
                </div>
              </div>
              {/* Calendário em si */}
              <div className="rounded-lg border bg-white dark:bg-card p-2 shadow">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={pt_br_locale}
                  events={requestsList}
                  headerToolbar={false}
                  height="auto"
                  datesSet={(info) => {
                    // Atualiza o título do calendário para ficar igual ao Google Calendar
                    const title = info.view.title.charAt(0).toUpperCase() + info.view.title.slice(1);
                    const el = document.getElementById('calendar-title');
                    if (el) el.textContent = title;
                  }}
                  dayMaxEvents={3}
                  dayMaxEventRows={3}
                  eventDisplay="block"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }}
                  eventContent={function(arg) {
                    // Mostra horário e nome do paciente, igual ao Google Calendar
                    const time = arg.timeText ? <b>{arg.timeText}</b> : null;
                    return (
                      <div className="flex flex-col text-xs">
                        <span>{time} {arg.event.title}</span>
                      </div>
                    );
                  }}
                  dateClick={(info) => {
                    // Ao clicar em um dia, muda para o modo dia igual ao Google Calendar
                    info.view.calendar.changeView("timeGridDay", info.dateStr);
                  }}
                  selectable={true}
                  selectMirror={true}
                />
              </div>
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
