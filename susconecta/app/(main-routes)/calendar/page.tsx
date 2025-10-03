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
import {
  mockAppointments,
  mockWaitingList,
} from "@/lib/mocks/appointment-mocks";
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
  const [appointments, setAppointments] = useState(mockAppointments);
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
    let events: EventInput[] = [];
    appointments.forEach((obj) => {
      const event: EventInput = {
        title: `${obj.patient}: ${obj.type}`,
        start: new Date(obj.time),
        end: new Date(new Date(obj.time).getTime() + obj.duration * 60 * 1000),
        color:
          obj.status === "confirmed"
            ? "#68d68a"
            : obj.status === "pending"
            ? "#ffe55f"
            : "#ff5f5fff",
      };
      events.push(event);
    });
    setRequestsList(events);
  }, [appointments]);

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
                <DropdownMenuTrigger className="bg-blue-600 hover:bg-blue-700 px-5 py-1 text-white rounded-sm">
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
            <div className="flex w-full">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={pt_br_locale}
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
