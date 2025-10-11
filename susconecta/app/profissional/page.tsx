"use client";
import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { buscarPacientes, listarPacientes, buscarPacientePorId, type Paciente } from "@/lib/api";
import { useReports } from "@/hooks/useReports";
import { CreateReportData } from "@/types/report-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Clock, FileCheck, Upload, Download, Eye, History, Stethoscope, Pill, Activity, Search } from "lucide-react"
import { Calendar as CalendarIcon, FileText, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

const pacientes = [
  { nome: "Ana Souza", cpf: "123.456.789-00", idade: 42, statusLaudo: "Finalizado" },
  { nome: "Bruno Lima", cpf: "987.654.321-00", idade: 33, statusLaudo: "Pendente" },
  { nome: "Carla Menezes", cpf: "111.222.333-44", idade: 67, statusLaudo: "Rascunho" },
];

const medico = {
  nome: "Dr. Carlos Andrade",
  identificacao: "CRM 000000 • Cardiologia e Dermatologia",
  fotoUrl: "",
}


const colorsByType = {
  Rotina: "#4dabf7",
  Cardiologia: "#f76c6c",
  Otorrino: "#f7b84d",
  Pediatria: "#6cf78b",
  Dermatologia: "#9b59b6",
  Oftalmologia: "#2ecc71"
};

  // Helpers para normalizar dados de paciente (suporta schema antigo e novo)
  const getPatientName = (p: any) => p?.full_name ?? p?.nome ?? '';
  const getPatientCpf = (p: any) => p?.cpf ?? '';
  const getPatientSex = (p: any) => p?.sex ?? p?.sexo ?? '';
  const getPatientId = (p: any) => p?.id ?? '';
  const getPatientAge = (p: any) => {
    if (!p) return '';
    // Prefer birth_date (ISO) to calcular idade
    const bd = p?.birth_date ?? p?.data_nascimento ?? p?.birthDate;
    if (bd) {
      const d = new Date(bd);
      if (!isNaN(d.getTime())) {
        const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        return `${age}`;
      }
    }
    // Fallback para campo idade/idade_anterior
    return p?.idade ?? p?.age ?? '';
  };

  // Helpers para normalizar campos do laudo/relatório
  const getReportPatientName = (r: any) => r?.paciente?.full_name ?? r?.paciente?.nome ?? r?.patient?.full_name ?? r?.patient?.nome ?? r?.patient_name ?? r?.patient_full_name ?? '';
  const getReportPatientId = (r: any) => r?.paciente?.id ?? r?.patient?.id ?? r?.patient_id ?? r?.patientId ?? r?.patient_id_raw ?? r?.patient_id ?? r?.id ?? '';
  const getReportPatientCpf = (r: any) => r?.paciente?.cpf ?? r?.patient?.cpf ?? r?.patient_cpf ?? '';
  const getReportExecutor = (r: any) => r?.executante ?? r?.requested_by ?? r?.requestedBy ?? r?.created_by ?? r?.createdBy ?? r?.requested_by_name ?? r?.executor ?? '';
  const getReportExam = (r: any) => r?.exame ?? r?.exam ?? r?.especialidade ?? r?.cid_code ?? r?.report_type ?? '-';
  const getReportDate = (r: any) => r?.data ?? r?.created_at ?? r?.due_at ?? r?.report_date ?? '';
  const formatReportDate = (raw?: string) => {
    if (!raw) return '-';
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return raw;
    }
  };

const ProfissionalPage = () => {
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState('calendario');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  
  // Estados para edição de laudo
  const [isEditingLaudoForPatient, setIsEditingLaudoForPatient] = useState(false);
  const [patientForLaudo, setPatientForLaudo] = useState<any>(null);
  
  // Estados para o perfil do médico
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: "Dr. Carlos Andrade",
    email: user?.email || "carlos.andrade@hospital.com",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123 - Centro",
    cidade: "São Paulo",
    cep: "01234-567",
    crm: "CRM 000000",
    especialidade: "Cardiologia e Dermatologia",
    biografia: "Médico especialista em cardiologia e dermatologia com mais de 15 anos de experiência em tratamentos clínicos e cirúrgicos."
  });



  // Estados para campos principais da consulta
  const [consultaAtual, setConsultaAtual] = useState({
    patient_id: "",
    order_number: "",
    exam: "",
    diagnosis: "",
    conclusion: "",
    cid_code: "",
    content_html: "",
    content_json: {},
    status: "draft",
    requested_by: "",
    due_at: new Date().toISOString(),
    hide_date: true,
    hide_signature: true
  });
  
  const [events, setEvents] = useState<any[]>([
    
    {
      id: 1,
      title: "Ana Souza",
      type: "Cardiologia",
      time: "09:00",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "123.456.789-00",
      color: colorsByType.Cardiologia
    },
    {
      id: 2,
      title: "Bruno Lima",
      type: "Cardiologia",
      time: "10:30",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "987.654.321-00",
      color: colorsByType.Cardiologia
    },
    {
      id: 3,
      title: "Carla Menezes",
      type: "Dermatologia",
      time: "14:00",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "111.222.333-44",
      color: colorsByType.Dermatologia
    }
  ]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [step, setStep] = useState(1);
  const [newEvent, setNewEvent] = useState({ 
    title: "", 
    type: "", 
    time: "",
    pacienteId: "" 
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const handleSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("Laudo salvo!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  

  const handleEditarLaudo = (paciente: any) => {
    setPatientForLaudo(paciente);
    setIsEditingLaudoForPatient(true);
    setActiveSection('laudos');
  };

  
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentCalendarDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentCalendarDate(newDate);
  };

  const goToToday = () => {
    setCurrentCalendarDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Filtrar eventos do dia atual
  const getTodayEvents = () => {
    const today = currentCalendarDate.toISOString().split('T')[0];
    return events
      .filter(event => event.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getStatusColor = (type: string) => {
    return colorsByType[type as keyof typeof colorsByType] || "#4dabf7";
  };

  // Funções para o perfil
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    alert('Perfil atualizado com sucesso!');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };



  
  const handleDateClick = (arg: any) => {
    setSelectedDate(arg.dateStr);
    setNewEvent({ title: "", type: "", time: "", pacienteId: "" });
    setStep(1);
    setEditingEvent(null);
    setShowPopup(true);
  };

 
  const handleAddEvent = () => {
    const paciente = pacientes.find(p => p.nome === newEvent.title);
    const eventToAdd = {
      id: Date.now(),
      title: newEvent.title,
      type: newEvent.type,
      time: newEvent.time,
      date: selectedDate || currentCalendarDate.toISOString().split('T')[0],
      pacienteId: paciente ? paciente.cpf : "",
      color: colorsByType[newEvent.type as keyof typeof colorsByType] || "#4dabf7"
    };
    setEvents((prev) => [...prev, eventToAdd]);
    setShowPopup(false);
  };


  const handleEditEvent = () => {
    setEvents((prevEvents) =>
      prevEvents.map((ev) =>
        ev.id.toString() === editingEvent.id.toString()
          ? {
              ...ev,
              title: newEvent.title,
              type: newEvent.type,
              time: newEvent.time,
              color: colorsByType[newEvent.type as keyof typeof colorsByType] || "#4dabf7"
            }
          : ev
      )
    );
    setEditingEvent(null);
    setShowPopup(false);
    setShowActionModal(false);
  };

  
  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
    else editingEvent ? handleEditEvent() : handleAddEvent();
  };

  
  const handleEventClick = (clickInfo: any) => {
    setSelectedEvent(clickInfo.event);
    setShowActionModal(true);
  };


  const handleDeleteEvent = () => {
    if (!selectedEvent) return;
    setEvents((prevEvents) =>
      prevEvents.filter((ev: any) => ev.id.toString() !== selectedEvent.id.toString())
    );
    setShowActionModal(false);
  };

 
  const handleStartEdit = () => {
    if (!selectedEvent) return;
    setEditingEvent(selectedEvent);
    setNewEvent({
      title: selectedEvent.title,
      type: selectedEvent.extendedProps.type,
      time: selectedEvent.extendedProps.time,
      pacienteId: selectedEvent.extendedProps.pacienteId || ""
    });
    setStep(1);
    setShowActionModal(false);
    setShowPopup(true);
  };

 
  const renderEventContent = (eventInfo: any) => {
    const bg = eventInfo.event.backgroundColor || eventInfo.event.extendedProps?.color || "#4dabf7";

    return (
      <div
        className="flex items-center gap-1 text-xs p-1 rounded cursor-pointer"
        style={{
          backgroundColor: bg,
          color: "#fff",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}
        title={`${eventInfo.event.title} • ${eventInfo.event.extendedProps.type} • ${eventInfo.event.extendedProps.time}`}
      >
        <span className="truncate">{eventInfo.event.title}</span>
        <span>•</span>
        <span className="truncate">{eventInfo.event.extendedProps.type}</span>
        <span>•</span>
        <span>{eventInfo.event.extendedProps.time}</span>
      </div>
    );
  };

  
  const renderCalendarioSection = () => {
    const todayEvents = getTodayEvents();
    
    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Agenda do Dia</h2>
        </div>
        
        {/* Navegação de Data */}
        <div className="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg dark:bg-muted">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground"
            >
              <ChevronLeft className="h-4 w-4 hover:!text-white" />
            </Button>
            <h3 className="text-lg font-medium text-foreground">
              {formatDate(currentCalendarDate)}
            </h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground"
            >
              <ChevronRight className="h-4 w-4 hover:!text-white" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm hover:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground"
            >
              Hoje
            </Button>
          </div>
          <div className="text-sm text-gray-600 dark:text-muted-foreground">
            {todayEvents.length} consulta{todayEvents.length !== 1 ? 's' : ''} agendada{todayEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Pacientes do Dia */}
        <div className="space-y-4">
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-muted-foreground/50" />
              <p className="text-lg mb-2">Nenhuma consulta agendada para este dia</p>
              <p className="text-sm">Agenda livre para este dia</p>
            </div>
          ) : (
            todayEvents.map((appointment) => {
              const paciente = pacientes.find(p => p.nome === appointment.title);
              return (
                <div
                  key={appointment.id}
                  className="border-l-4 border-t border-r border-b p-4 rounded-lg shadow-sm bg-card border-border"
                  style={{ borderLeftColor: getStatusColor(appointment.type) }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: getStatusColor(appointment.type) }}
                      ></div>
                      <div>
                        <div className="font-medium flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500 dark:text-muted-foreground" />
                          {appointment.title}
                        </div>
                        {paciente && (
                          <div className="text-sm text-gray-600 dark:text-muted-foreground">
                            CPF: {getPatientCpf(paciente)} • {getPatientAge(paciente)} anos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-muted-foreground" />
                      <span className="font-medium">{appointment.time}</span>
                    </div>
                    <div className="flex items-center">
                      <div 
                        className="px-3 py-1 rounded-full text-sm font-medium text-white"
                        style={{ backgroundColor: getStatusColor(appointment.type) }}
                      >
                        {appointment.type}
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <div className="relative group">
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    );
  };

  
  
  
  const renderLaudosSection = () => (
    <div className="space-y-6">
      <LaudoManager 
        isEditingForPatient={isEditingLaudoForPatient}
        selectedPatientForLaudo={patientForLaudo}
        onClosePatientEditor={() => {
          setIsEditingLaudoForPatient(false);
          setPatientForLaudo(null);
        }}
      />
    </div>
  );

  // --- NOVO SISTEMA DE LAUDOS COMPLETO ---
  function LaudoManager({ isEditingForPatient, selectedPatientForLaudo, onClosePatientEditor }: { isEditingForPatient?: boolean; selectedPatientForLaudo?: any; onClosePatientEditor?: () => void }) {
    const [pacientesDisponiveis] = useState([
      { id: "95170038", nome: "Ana Souza", cpf: "123.456.789-00", idade: 42, sexo: "Feminino" },
      { id: "93203056", nome: "Bruno Lima", cpf: "987.654.321-00", idade: 33, sexo: "Masculino" },
      { id: "92953542", nome: "Carla Menezes", cpf: "111.222.333-44", idade: 67, sexo: "Feminino" },
    ]);

  const { reports, loadReports, loading: reportsLoading, createNewReport, updateExistingReport } = useReports();
    const [laudos, setLaudos] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<'todos'|'hoje'|'semana'|'mes'|'custom'>('mes');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

    // helper to check if a date string is in range
    const isInRange = (dateStr: string | undefined, range: 'todos'|'hoje'|'semana'|'mes'|'custom') => {
      if (range === 'todos') return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      if (range === 'hoje') {
        return d.toDateString() === now.toDateString();
      }
      if (range === 'semana') {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // sunday start
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return d >= start && d <= end;
      }
      // mes
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    };

    // When selectedRange changes (and isn't custom), compute start/end dates
    useEffect(() => {
      const now = new Date();
      if (selectedRange === 'todos') {
        setStartDate(null);
        setEndDate(null);
        return;
      }
      if (selectedRange === 'hoje') {
        const iso = now.toISOString().slice(0,10);
        setStartDate(iso);
        setEndDate(iso);
        return;
      }
      if (selectedRange === 'semana') {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // sunday
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        setStartDate(start.toISOString().slice(0,10));
        setEndDate(end.toISOString().slice(0,10));
        return;
      }
      if (selectedRange === 'mes') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(start.toISOString().slice(0,10));
        setEndDate(end.toISOString().slice(0,10));
        return;
      }
      // custom: leave startDate/endDate as-is
    }, [selectedRange]);

    const filteredLaudos = (laudos || []).filter(l => {
      // If a specific start/end date is set, use that range
      if (startDate && endDate) {
        const ds = getReportDate(l);
        if (!ds) return false;
        const d = new Date(ds);
        if (isNaN(d.getTime())) return false;
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return d >= start && d <= end;
      }
      // Fallback to selectedRange heuristics
      if (!selectedRange) return true;
      const ds = getReportDate(l);
      return isInRange(ds, selectedRange);
    });

    function DateRangeButtons() {
      return (
        <>
          <Button
            variant={selectedRange === 'todos' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('todos')}
            className="hover:bg-blue-50"
          >
            Todos
          </Button>
          <Button
            variant={selectedRange === 'hoje' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('hoje')}
            className="hover:bg-blue-50"
          >
            Hoje
          </Button>
          <Button
            variant={selectedRange === 'semana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('semana')}
            className="hover:bg-blue-50"
          >
            Semana
          </Button>
          <Button
            variant={selectedRange === 'mes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('mes')}
            className="hover:bg-blue-50"
          >
            Mês
          </Button>
        </>
      );
    }

    // carregar laudos ao montar
    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          await loadReports();
        } catch (e) {
          // erro tratado no hook
        }
        if (mounted) setLaudos(reports || []);
      })();
      return () => { mounted = false; };
    }, [loadReports]);

    // sincroniza quando reports mudarem no hook
    useEffect(() => {
      setLaudos(reports || []);
    }, [reports]);

  const [activeTab, setActiveTab] = useState("descobrir");
    const [laudoSelecionado, setLaudoSelecionado] = useState<any>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);




    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Gerenciamento de Laudo</h1>
              <p className="text-muted-foreground">Nesta seção você pode gerenciar todos os laudos gerados através da integração.</p>
            </div>
            <Button 
              onClick={() => setIsCreatingNew(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Laudo
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg shadow-md">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab("descobrir")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "descobrir"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              A descobrir
            </button>
          </div>

          {/* Filtros */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Input 
                  placeholder="Buscar paciente/pedido"
                  className="pl-10"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <CalendarIcon className="w-4 h-4" />
                  <Input type="date" value={startDate ?? ''} onChange={(e) => { setStartDate(e.target.value); setSelectedRange('custom'); }} className="p-1 text-sm" />
                  <span>-</span>
                  <Input type="date" value={endDate ?? ''} onChange={(e) => { setEndDate(e.target.value); setSelectedRange('custom'); }} className="p-1 text-sm" />
                </div>
              </div>

              <div className="flex gap-2">
                {/* date range buttons: Hoje / Semana / Mês */}
                <DateRangeButtons />
              </div>

              {/* Filtros e pesquisa removidos por solicitação */}

              <Button variant="default" size="sm" className="hover:bg-blue-600 dark:hover:bg-primary/90">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabela para desktop e cards empilháveis para mobile */}
          <div>
            {/* Desktop / tablet (md+) - tabela com scroll horizontal */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Executante/Solicitante</TableHead>
                    <TableHead>Exame/Classificação</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLaudos.map((laudo) => (
                    <TableRow key={laudo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {laudo.urgente && (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                          <span className="font-mono text-sm">
                            {getReportPatientName(laudo) || laudo.order_number || getShortId(laudo.id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatReportDate(getReportDate(laudo))}</div>
                          <div className="text-xs text-muted-foreground">{laudo?.hora || new Date(laudo?.data || laudo?.created_at || laudo?.due_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{laudo?.prazo ?? laudo?.due_at ? formatReportDate(laudo?.due_at ?? laudo?.prazo) : '-'}</div>
                          <div className="text-xs text-muted-foreground">{laudo?.prazo_hora ?? laudo?.due_time ?? '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="font-mono text-xs">{getReportPatientId(laudo) || '-'}</span>
                          </div>
                          <div className="font-medium">{getReportPatientName(laudo) || '—'}</div>
                          <div className="text-xs text-muted-foreground">{getReportPatientCpf(laudo) ? `CPF: ${getReportPatientCpf(laudo)}` : ''}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getReportExecutor(laudo) || '-'}</TableCell>
                      <TableCell className="text-sm">{getReportExam(laudo) || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setLaudoSelecionado(laudo);
                              setIsViewing(true);
                            }}
                            className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Laudo
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setPatientForLaudo(laudo);
                              setIsEditingLaudoForPatient(true);
                            }}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                            title="Editar laudo para este paciente"
                          >
                            <Edit className="w-4 h-4" />
                            Editar Laudo
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile - cards empilháveis */}
            <div className="md:hidden space-y-3">
              {filteredLaudos.map((laudo) => (
                <div key={laudo.id} className="bg-card p-4 rounded-lg border border-border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{getReportExam(laudo) || '-'}</div>
                          <div className="text-xs text-muted-foreground">{formatReportDate(getReportDate(laudo))} {laudo?.hora ? `• ${laudo.hora}` : ''}</div>
                        </div>
                        <div className="ml-3 text-xs font-mono text-muted-foreground">{getReportPatientName(laudo) ? getShortId(laudo.id) : ''}</div>
                      </div>
                      <div className="mt-2">
                        <div className="font-semibold">{getReportPatientName(laudo) || '—'}</div>
                        <div className="text-xs text-muted-foreground">{getReportPatientCpf(laudo) ? `CPF: ${getReportPatientCpf(laudo)}` : getReportPatientId(laudo) || '-'}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <div className="text-sm">{getReportExecutor(laudo) || '-'}</div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLaudoSelecionado(laudo);
                            setIsViewing(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setPatientForLaudo(laudo);
                            setIsEditingLaudoForPatient(true);
                          }}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                          title="Editar laudo"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualizador de Laudo */}
        {isViewing && laudoSelecionado && (
              <LaudoViewer laudo={laudoSelecionado} onClose={() => setIsViewing(false)} />
            )}

        {/* Editor para Novo Laudo */}
        {isCreatingNew && (
          <LaudoEditor
            pacientes={pacientesDisponiveis}
            onClose={() => setIsCreatingNew(false)}
            isNewLaudo={true}
            createNewReport={createNewReport}
            updateExistingReport={updateExistingReport}
            reloadReports={loadReports}
            onSaved={(r:any) => { setLaudoSelecionado(r); setIsViewing(true); }}
          />
        )}

        {/* Editor para Paciente Específico */}
        {isEditingForPatient && selectedPatientForLaudo && (
          <LaudoEditor
            pacientes={[selectedPatientForLaudo.paciente || selectedPatientForLaudo]}
            laudo={selectedPatientForLaudo}
            onClose={onClosePatientEditor || (() => {})}
            isNewLaudo={!selectedPatientForLaudo?.id}
            preSelectedPatient={selectedPatientForLaudo.paciente || selectedPatientForLaudo}
            createNewReport={createNewReport}
            updateExistingReport={updateExistingReport}
            reloadReports={loadReports}
            onSaved={(r:any) => { setLaudoSelecionado(r); setIsViewing(true); }}
          />
        )}
      </div>
    );
  }

  // Visualizador de Laudo (somente leitura)
  function LaudoViewer({ laudo, onClose }: { laudo: any; onClose: () => void }) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full h-full md:h-auto md:rounded-lg md:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Visualizar Laudo</h2>
              <p className="text-sm text-muted-foreground">
                Paciente: {getPatientName(laudo?.paciente) || getPatientName(laudo) || '—'} | CPF: {getReportPatientCpf(laudo) ?? laudo?.patient_cpf ?? '-'} | {laudo?.especialidade ?? laudo?.exame ?? '-'}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto bg-background border border-border rounded-lg p-6 shadow-sm">
              {/* Header do Laudo */}
              <div className="text-center mb-6">
                <h2 className="text-lg font-bold">LAUDO MÉDICO - {(laudo.especialidade ?? laudo.exame ?? '').toString().toUpperCase()}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Data: {formatReportDate(getReportDate(laudo))}
                </p>
              </div>

              {/* Dados do Paciente */}
                <div className="mb-6 p-4 bg-muted rounded">
                <h3 className="font-semibold mb-2">Dados do Paciente:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Nome:</strong> {getPatientName(laudo?.paciente) || getPatientName(laudo) || '-'}</p>
                  <p><strong>ID:</strong> {getPatientId(laudo?.paciente) ?? getPatientId(laudo) ?? '-'}</p>
                  <p><strong>CPF:</strong> {getPatientCpf(laudo?.paciente) ?? laudo?.patient_cpf ?? '-'}</p>
                  <p><strong>Idade:</strong> {getPatientAge(laudo?.paciente) ? `${getPatientAge(laudo?.paciente)} anos` : (getPatientAge(laudo) ? `${getPatientAge(laudo)} anos` : '-')}</p>
                  <p><strong>Sexo:</strong> {getPatientSex(laudo?.paciente) ?? getPatientSex(laudo) ?? '-'}</p>
                  <p><strong>CID:</strong> {laudo?.cid ?? laudo?.cid_code ?? '-'}</p>
                </div>
              </div>

              {/* Conteúdo do Laudo */}
              <div className="mb-6">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: ((laudo.conteudo ?? laudo.content_html ?? laudo.contentHtml ?? laudo.content) || '').toString().replace(/\n/g, '<br>') 
                  }}
                />
              </div>

              {/* Exame */}
              {((laudo.exame ?? laudo.exam ?? laudo.especialidade ?? laudo.report_type) || '').toString().length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-1">Exame / Especialidade:</h4>
                  <p className="text-sm">{laudo.exame ?? laudo.exam ?? laudo.especialidade ?? laudo.report_type}</p>
                </div>
              )}

              {/* Diagnóstico */}
              {((laudo.diagnostico ?? laudo.diagnosis) || '').toString().length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <h4 className="font-semibold mb-1">Diagnóstico:</h4>
                  <p className="text-sm font-bold">{laudo.diagnostico ?? laudo.diagnosis}</p>
                </div>
              )}

              {/* Conclusão */}
              {((laudo.conclusao ?? laudo.conclusion) || '').toString().length > 0 && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-950/20 rounded">
                  <h4 className="font-semibold mb-1">Conclusão:</h4>
                  <p className="text-sm font-bold">{laudo.conclusao ?? laudo.conclusion}</p>
                </div>
              )}

              {/* Diagnóstico e Conclusão */}
              {laudo.diagnostico && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <h4 className="font-semibold mb-1" style={{ color: '#EF4444' }}>Diagnóstico:</h4>
                  <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{laudo.diagnostico}</p>
                </div>
              )}

              {laudo.conclusao && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-950/20 rounded">
                  <h4 className="font-semibold mb-1" style={{ color: '#EF4444' }}>Conclusão:</h4>
                  <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{laudo.conclusao}</p>
                </div>
              )}

              {/* Assinatura */}
                <div className="mt-8 text-center border-t pt-4">
                <div className="h-16 mb-2"></div>
                {(() => {
                  const signatureName = laudo?.created_by_name ?? laudo?.createdByName ?? ((laudo?.created_by && user?.id && laudo.created_by === user.id) ? 'Squad-20' : medico.nome ?? 'Squad-20');
                  return (
                    <>
                      <p className="text-sm font-semibold">{signatureName}</p>
                      <p className="text-xs text-muted-foreground">CRM 000000 - {laudo.especialidade}</p>
                      <p className="text-xs text-muted-foreground mt-1">Data: {formatReportDate(getReportDate(laudo))}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Status: {laudo.status} | Executante: {laudo.executante}
              </div>
              <Button onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor de Laudo Avançado (para novos laudos)
  function LaudoEditor({ pacientes, laudo, onClose, isNewLaudo, preSelectedPatient, createNewReport, updateExistingReport, reloadReports, onSaved }: { pacientes?: any[]; laudo?: any; onClose: () => void; isNewLaudo?: boolean; preSelectedPatient?: any; createNewReport?: (data: any) => Promise<any>; updateExistingReport?: (id: string, data: any) => Promise<any>; reloadReports?: () => Promise<void>; onSaved?: (r:any) => void }) {
  // Import useToast at the top level of the component
  const { toast } = require('@/hooks/use-toast').useToast();
    const [activeTab, setActiveTab] = useState("editor");
    const [content, setContent] = useState(laudo?.conteudo || "");
    const [showPreview, setShowPreview] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(preSelectedPatient || null);
    const [listaPacientes, setListaPacientes] = useState<any[]>([]);
  // Novo: campos para solicitante e prazo
  const [solicitante, setSolicitante] = useState<string>(user?.id || "");
  const [prazoDate, setPrazoDate] = useState<string>("");
  const [prazoTime, setPrazoTime] = useState<string>("");

    // Pega token do usuário logado (passado explicitamente para listarPacientes)
    const { token } = useAuth();

    // Carregar pacientes reais do Supabase ao abrir o modal ou quando o token mudar
    useEffect(() => {
      async function fetchPacientes() {
        try {
          if (!token) {
            setListaPacientes([]);
            return;
          }
          const pacientes = await listarPacientes();
          setListaPacientes(pacientes || []);
        } catch (err) {
          console.warn('Erro ao carregar pacientes:', err);
          setListaPacientes([]);
        }
      }
      fetchPacientes();
    }, [token]);
    const [campos, setCampos] = useState({
      cid: laudo?.cid || "",
      diagnostico: laudo?.diagnostico || "",
      conclusao: laudo?.conclusao || "",
      exame: laudo?.exame || "",
      especialidade: laudo?.especialidade || "",
      mostrarData: true,
      mostrarAssinatura: true
    });
    const [imagens, setImagens] = useState<any[]>([]);
    const [templates] = useState([
      "Exame normal, sem alterações significativas",
      "Paciente em acompanhamento ambulatorial",
      "Recomenda-se retorno em 30 dias",
      "Alterações compatíveis com processo inflamatório",
      "Resultado dentro dos parâmetros de normalidade",
      "Recomendo seguimento com especialista"
    ]);


    const sigCanvasRef = useRef<any>(null);

    // Estado para imagem da assinatura
    const [assinaturaImg, setAssinaturaImg] = useState<string | null>(null);

    useEffect(() => {
      if (!sigCanvasRef.current) return;
      const handleEnd = () => {
        const url = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
        setAssinaturaImg(url);
      };
      const canvas = sigCanvasRef.current;
      if (canvas && canvas.canvas) {
        canvas.canvas.addEventListener('mouseup', handleEnd);
        canvas.canvas.addEventListener('touchend', handleEnd);
      }
      return () => {
        if (canvas && canvas.canvas) {
          canvas.canvas.removeEventListener('mouseup', handleEnd);
          canvas.canvas.removeEventListener('touchend', handleEnd);
        }
      };
    }, [sigCanvasRef]);

    const handleClearSignature = () => {
      if (sigCanvasRef.current) {
        sigCanvasRef.current.clear();
      }
      setAssinaturaImg(null);
    };

    // Carregar dados do laudo existente quando disponível (mais robusto: suporta vários nomes de campo)
    useEffect(() => {
      if (laudo && !isNewLaudo) {
        // Conteúdo: aceita 'conteudo', 'content_html', 'contentHtml', 'content'
        const contentValue = laudo.conteudo ?? laudo.content_html ?? laudo.contentHtml ?? laudo.content ?? "";
        setContent(contentValue);

        // Campos: use vários fallbacks
        const cidValue = laudo.cid ?? laudo.cid_code ?? '';
        const diagnosticoValue = laudo.diagnostico ?? laudo.diagnosis ?? '';
        const conclusaoValue = laudo.conclusao ?? laudo.conclusion ?? '';
        const exameValue = laudo.exame ?? laudo.exam ?? laudo.especialidade ?? '';
        const especialidadeValue = laudo.especialidade ?? laudo.exame ?? laudo.exam ?? '';
        const mostrarDataValue = typeof laudo.hide_date === 'boolean' ? !laudo.hide_date : true;
        const mostrarAssinaturaValue = typeof laudo.hide_signature === 'boolean' ? !laudo.hide_signature : true;

        setCampos({
          cid: cidValue,
          diagnostico: diagnosticoValue,
          conclusao: conclusaoValue,
          exame: exameValue,
          especialidade: especialidadeValue,
          mostrarData: mostrarDataValue,
          mostrarAssinatura: mostrarAssinaturaValue
        });

        // Paciente: não sobrescrever se já existe preSelectedPatient ou pacienteSelecionado
        if (!pacienteSelecionado) {
          const pacienteFromLaudo = laudo.paciente ?? laudo.patient ?? null;
          if (pacienteFromLaudo) {
            setPacienteSelecionado(pacienteFromLaudo);
          } else if (laudo.patient_id && listaPacientes && listaPacientes.length) {
            const found = listaPacientes.find(p => String(p.id) === String(laudo.patient_id));
            if (found) setPacienteSelecionado(found);
          }
        }

        // preencher solicitante/prazo quando existe laudo (edição)
        const possibleName = laudo.requested_by_name ?? laudo.requester_name ?? laudo.requestedByName ?? laudo.executante_name ?? laudo.executante?.nome ?? laudo.requested_by ?? laudo.created_by_name ?? user?.id ?? "";
        setSolicitante(possibleName);

        const dueRaw = laudo.due_at ?? laudo.prazo ?? laudo.dueDate ?? laudo.data ?? null;
        if (dueRaw) {
          try {
            const d = new Date(dueRaw);
            if (!isNaN(d.getTime())) {
              setPrazoDate(d.toISOString().slice(0,10));
              setPrazoTime(d.toTimeString().slice(0,5));
            }
          } catch (e) {
            // ignore invalid date
          }
        }

        // assinatura: aceitar vários campos possíveis
        const sig = laudo.assinaturaImg ?? laudo.signature_image ?? laudo.signature ?? laudo.sign_image ?? null;
        if (sig) setAssinaturaImg(sig);
      }
    }, [laudo, isNewLaudo, pacienteSelecionado, listaPacientes, user]);

    // Histórico para desfazer/refazer
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Atualiza histórico ao digitar
    useEffect(() => {
      if (history[historyIndex] !== content) {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, content]);
        setHistoryIndex(newHistory.length);
      }
      // eslint-disable-next-line
    }, [content]);

    const handleUndo = () => {
      if (historyIndex > 0) {
        setContent(history[historyIndex - 1]);
        setHistoryIndex(historyIndex - 1);
      }
    };
    const handleRedo = () => {
      if (historyIndex < history.length - 1) {
        setContent(history[historyIndex + 1]);
        setHistoryIndex(historyIndex + 1);
      }
    };

    // Formatação avançada
    const formatText = (type: string, value?: any) => {
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      let formattedText = "";
      switch(type) {
        case "bold":
          formattedText = selectedText ? `**${selectedText}**` : "**texto em negrito**";
          break;
        case "italic":
          formattedText = selectedText ? `*${selectedText}*` : "*texto em itálico*";
          break;
        case "underline":
          formattedText = selectedText ? `__${selectedText}__` : "__texto sublinhado__";
          break;
        case "list-ul":
          formattedText = selectedText ? selectedText.split('\n').map(l => `• ${l}`).join('\n') : "• item da lista";
          break;
        case "list-ol":
          formattedText = selectedText ? selectedText.split('\n').map((l,i) => `${i+1}. ${l}`).join('\n') : "1. item da lista";
          break;
        case "indent":
          formattedText = selectedText ? selectedText.split('\n').map(l => `    ${l}`).join('\n') : "    ";
          break;
        case "outdent":
          formattedText = selectedText ? selectedText.split('\n').map(l => l.replace(/^\s{1,4}/, "")).join('\n') : "";
          break;
        case "align-left":
          formattedText = selectedText ? `[left]${selectedText}[/left]` : "[left]Texto à esquerda[/left]";
          break;
        case "align-center":
          formattedText = selectedText ? `[center]${selectedText}[/center]` : "[center]Texto centralizado[/center]";
          break;
        case "align-right":
          formattedText = selectedText ? `[right]${selectedText}[/right]` : "[right]Texto à direita[/right]";
          break;
        case "align-justify":
          formattedText = selectedText ? `[justify]${selectedText}[/justify]` : "[justify]Texto justificado[/justify]";
          break;
        case "font-size":
          formattedText = selectedText ? `[size=${value}]${selectedText}[/size]` : `[size=${value}]Texto tamanho ${value}[/size]`;
          break;
        case "font-family":
          formattedText = selectedText ? `[font=${value}]${selectedText}[/font]` : `[font=${value}]${value}[/font]`;
          break;
        case "font-color":
          formattedText = selectedText ? `[color=${value}]${selectedText}[/color]` : `[color=${value}]${value}[/color]`;
          break;
        default:
          return;
      }
      const newText = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
      setContent(newText);
    };

    const insertTemplate = (template: string) => {
      setContent((prev: string) => prev ? `${prev}\n\n${template}` : template);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagens(prev => [...prev, {
            id: Date.now() + Math.random(),
            name: file.name,
            url: e.target?.result,
            type: file.type
          }]);
        };
        reader.readAsDataURL(file);
      });
    };

    const processContent = (content: string) => {
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/__(.*?)__/g, '<u>$1</u>')
        .replace(/\[left\]([\s\S]*?)\[\/left\]/g, '<div style="text-align:left">$1</div>')
        .replace(/\[center\]([\s\S]*?)\[\/center\]/g, '<div style="text-align:center">$1</div>')
        .replace(/\[right\]([\s\S]*?)\[\/right\]/g, '<div style="text-align:right">$1</div>')
        .replace(/\[justify\]([\s\S]*?)\[\/justify\]/g, '<div style="text-align:justify">$1</div>')
        .replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/g, '<span style="font-size:$1px">$2</span>')
        .replace(/\[font=([^\]]+)\]([\s\S]*?)\[\/font\]/g, '<span style="font-family:$1">$2</span>')
        .replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/g, '<span style="color:$1">$2</span>')
        .replace(/{{sexo_paciente}}/g, pacienteSelecionado?.sexo || laudo?.paciente?.sexo || '[SEXO]')
        .replace(/{{diagnostico}}/g, campos.diagnostico || '[DIAGNÓSTICO]')
        .replace(/{{conclusao}}/g, campos.conclusao || '[CONCLUSÃO]')
        .replace(/\n/g, '<br>');
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-none md:rounded-lg shadow-xl w-full h-full md:h-auto md:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between p-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isNewLaudo ? "Novo Laudo Médico" : "Editar Laudo Existente"}
                </h2>
                {isNewLaudo ? (
                  <p className="text-sm text-muted-foreground">
                    Crie um novo laudo selecionando um paciente
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Paciente: {getPatientName(pacienteSelecionado) || getPatientName(laudo?.paciente) || getPatientName(laudo) || '-'} | CPF: {getReportPatientCpf(laudo) ?? laudo?.patient_cpf ?? '-'} | {laudo?.especialidade}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Seleção de Paciente (apenas para novos laudos) */}
            {isNewLaudo && (
              <div className="px-4 pb-4">
                {!pacienteSelecionado ? (
                  <div className="bg-muted border border-border rounded-lg p-4">
                    <Label htmlFor="select-paciente" className="text-sm font-medium mb-2 block">
                      Selecionar Paciente *
                    </Label>
                    <Select onValueChange={(value) => {
                      const paciente = listaPacientes.find(p => p.id === value);
                      if (paciente) setPacienteSelecionado(paciente);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha um paciente para criar o laudo" />
                      </SelectTrigger>
                      <SelectContent>
                        {listaPacientes.map((paciente) => (
                          <SelectItem key={paciente.id} value={paciente.id}>
                            {paciente.full_name} {paciente.cpf ? `- CPF: ${paciente.cpf}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-primary">{getPatientName(pacienteSelecionado)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getPatientCpf(pacienteSelecionado) ? `CPF: ${getPatientCpf(pacienteSelecionado)} | ` : ''}
                          {pacienteSelecionado?.birth_date ? `Nascimento: ${pacienteSelecionado.birth_date}` : (getPatientAge(pacienteSelecionado) ? `Idade: ${getPatientAge(pacienteSelecionado)} anos` : '')}
                          {getPatientSex(pacienteSelecionado) ? ` | Sexo: ${getPatientSex(pacienteSelecionado)}` : ''}
                        </div>
                    </div>
                    {!preSelectedPatient && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPacienteSelecionado(null)}
                      >
                        Trocar Paciente
                      </Button>
                    )}
                  </div>
                )}
                {/* Novos campos: Solicitante e Prazo */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="solicitante">Solicitante (ID)</Label>
                    <Input id="solicitante" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Nome ou ID do solicitante (opcional)" />
                    <p className="text-xs text-muted-foreground mt-1">Se vazio, o usuário logado será usado como solicitante.</p>
                  </div>
                  <div>
                    <Label htmlFor="prazoDate">Prazo do Laudo</Label>
                    <div className="flex gap-2">
                      <Input id="prazoDate" type="date" value={prazoDate} onChange={(e) => setPrazoDate(e.target.value)} />
                      <Input id="prazoTime" type="time" value={prazoTime} onChange={(e) => setPrazoTime(e.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Defina a data e hora do prazo (opcional).</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {/* Informações tab removed - only Editor/Imagens/Campos/Pré-visualização remain */}
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "editor"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-blue-900"
              }`}
              style={{
                backgroundColor: activeTab === "editor" ? undefined : "transparent"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "editor") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "editor") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab("imagens")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "imagens"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-blue-900"
              }`}
              style={{
                backgroundColor: activeTab === "imagens" ? undefined : "transparent"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "imagens") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "imagens") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Imagens ({imagens.length})
            </button>
            <button
              onClick={() => setActiveTab("campos")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "campos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-blue-900"
              }`}
              style={{
                backgroundColor: activeTab === "campos" ? undefined : "transparent"
              }}
              onMouseEnter={(e) => {
                if (activeTab !== "campos") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== "campos") {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Campos
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                showPreview
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-600 dark:text-muted-foreground dark:hover:text-foreground dark:hover:bg-blue-900"
              }`}
              style={{
                backgroundColor: !showPreview ? "transparent" : undefined
              }}
              onMouseEnter={(e) => {
                if (!showPreview) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
              onMouseLeave={(e) => {
                if (!showPreview) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#4B5563";
                }
              }}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {showPreview ? "Ocultar" : "Pré-visualização"}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel */}
            <div className="flex-1 flex flex-col">
              {/* 'Informações' section removed to keep editor-only experience */}

              {activeTab === "editor" && (
                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="p-3 border-b border-border">
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Tamanho da fonte */}
                      <label className="text-xs mr-1">Tamanho</label>
                      <input
                        type="number"
                        min={8}
                        max={32}
                        defaultValue={14}
                        onBlur={e => formatText('font-size', e.target.value)}
                        className="w-14 border rounded px-1 py-0.5 text-xs mr-2"
                        title="Tamanho da fonte"
                      />
                      {/* Família da fonte */}
                      <label className="text-xs mr-1">Fonte</label>
                      <select
                        defaultValue={'Arial'}
                        onBlur={e => formatText('font-family', e.target.value)}
                        className="border rounded px-1 py-0.5 text-xs mr-2 bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                        style={{ minWidth: 140, fontWeight: 500 }}
                        title="Família da fonte"
                      >
                        <option value="Arial" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Arial</option>
                        <option value="Helvetica" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Helvetica</option>
                        <option value="Times New Roman" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Times New Roman</option>
                        <option value="Courier New" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Courier New</option>
                        <option value="Verdana" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Verdana</option>
                        <option value="Georgia" style={{ color: '#222', background: '#fff', fontWeight: 600 }}>Georgia</option>
                      </select>
                      {/* Cor da fonte */}
                      <label className="text-xs mr-1">Cor</label>
                      <input
                        type="color"
                        defaultValue="#222222"
                        onBlur={e => formatText('font-color', e.target.value)}
                        className="w-6 h-6 border rounded mr-2"
                        title="Cor da fonte"
                      />
                      {/* Alinhamento */}
                      <Button variant="outline" size="sm" onClick={() => formatText('align-left')} title="Alinhar à esquerda" className="px-1"><svg width="16" height="16" fill="none"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-center')} title="Centralizar" className="px-1"><svg width="16" height="16" fill="none"><rect x="4" y="4" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-right')} title="Alinhar à direita" className="px-1"><svg width="16" height="16" fill="none"><rect x="6" y="4" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="4" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-justify')} title="Justificar" className="px-1"><svg width="16" height="16" fill="none"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="12" height="2" rx="1" fill="currentColor"/></svg></Button>
                      {/* Listas */}
                      <Button variant="outline" size="sm" onClick={() => formatText('list-ol')} title="Lista numerada" className="px-1">1.</Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('list-ul')} title="Lista com marcadores" className="px-1">•</Button>
                      {/* Recuo */}
                      <Button variant="outline" size="sm" onClick={() => formatText('indent')} title="Aumentar recuo" className="px-1">→</Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('outdent')} title="Diminuir recuo" className="px-1">←</Button>
                      {/* Desfazer/Refazer */}
                      <Button variant="outline" size="sm" onClick={handleUndo} title="Desfazer" className="px-1">↺</Button>
                      <Button variant="outline" size="sm" onClick={handleRedo} title="Refazer" className="px-1">↻</Button>
                      {/* Negrito, itálico, sublinhado */}
                      <Button variant="outline" size="sm" onClick={() => formatText("bold") } title="Negrito" className="hover:bg-blue-50 dark:hover:bg-accent"><strong>B</strong></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText("italic") } title="Itálico" className="hover:bg-blue-50 dark:hover:bg-accent"><em>I</em></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText("underline") } title="Sublinhado" className="hover:bg-blue-50 dark:hover:bg-accent"><u>U</u></Button>
                    </div>

                    {/* Templates */}
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Frases rápidas:</p>
                      <div className="flex flex-wrap gap-1">
                        {templates.map((template, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1 px-2"
                            onClick={() => insertTemplate(template)}
                          >
                            {template.substring(0, 30)}...
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Editor */}
                  <div className="flex-1 p-4 overflow-auto max-h-[500px]">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Digite o conteúdo do laudo aqui. Use ** para negrito, * para itálico, <u></u> para sublinhado."
                      className="h-full min-h-[400px] resize-none scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100"
                      style={{ maxHeight: 400, overflow: 'auto' }}
                    />
                  </div>
                </div>
              )}

              {activeTab === "imagens" && (
                <div className="flex-1 p-4">
                  <div className="mb-4">
                    <Label htmlFor="upload-images">Upload de Imagens</Label>
                    <Input
                      id="upload-images"
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {imagens.map((img) => (
                      <div key={img.id} className="border border-border rounded-lg p-2">
                        {img.type.startsWith('image/') ? (
                          <img 
                            src={img.url} 
                            alt={img.name}
                            className="w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 truncate">{img.name}</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full mt-1"
                          onClick={() => setImagens(prev => prev.filter(i => i.id !== img.id))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "campos" && (
                <div className="flex-1 p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  <div>
                    <Label htmlFor="cid">CID</Label>
                    <Input
                      id="cid"
                      value={campos.cid}
                      onChange={(e) => setCampos(prev => ({ ...prev, cid: e.target.value }))}
                      placeholder="Ex: M25.5, I10, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="exame">Exame</Label>
                    <Input
                      id="exame"
                      value={campos.exame}
                      onChange={(e) => setCampos(prev => ({ ...prev, exame: e.target.value }))}
                      placeholder="Exame realizado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diagnostico">Diagnóstico</Label>
                    <Textarea
                      id="diagnostico"
                      value={campos.diagnostico}
                      onChange={(e) => setCampos(prev => ({ ...prev, diagnostico: e.target.value }))}
                      placeholder="Diagnóstico principal"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="conclusao">Conclusão</Label>
                    <Textarea
                      id="conclusao"
                      value={campos.conclusao}
                      onChange={(e) => setCampos(prev => ({ ...prev, conclusao: e.target.value }))}
                      placeholder="Conclusão do laudo"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="mostrar-data"
                        checked={campos.mostrarData}
                        onChange={(e) => setCampos(prev => ({ ...prev, mostrarData: e.target.checked }))}
                      />
                      <Label htmlFor="mostrar-data">Mostrar data no laudo</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="mostrar-assinatura"
                        checked={campos.mostrarAssinatura}
                        onChange={(e) => setCampos(prev => ({ ...prev, mostrarAssinatura: e.target.checked }))}
                      />
                      <Label htmlFor="mostrar-assinatura">Mostrar assinatura no laudo</Label>
                    </div>
                  </div>
                  {/* Assinatura Digital removida dos campos */}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            {showPreview && (
              <div className="w-1/2 border-l border-border bg-muted/20">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Pré-visualização do Laudo</h3>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <div className="bg-background border border-border rounded-lg p-6 shadow-sm">
                    {/* Header do Laudo */}
                    <div className="text-center mb-6">
                      <h2 className="text-lg font-bold">
                        LAUDO MÉDICO {campos.especialidade ? `- ${campos.especialidade.toUpperCase()}` : ''}
                      </h2>
                      {campos.exame && (
                        <h3 className="text-md font-semibold mt-2">{campos.exame}</h3>
                      )}
                      {campos.cid && (
                        <h3 className="text-md font-semibold mt-2">CID: {campos.cid}</h3>
                      )}
                      {campos.diagnostico && (
                        <h3 className="text-md font-semibold mt-2">Diagnóstico: {campos.diagnostico}</h3>
                      )}
                      {campos.conclusao && (
                        <h3 className="text-md font-semibold mt-2">Conclusão: {campos.conclusao}</h3>
                      )}
                      {campos.mostrarData && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Data: {new Date().toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    {/* Dados do Paciente */}
                    {(isNewLaudo ? pacienteSelecionado : laudo?.paciente) && (
                      <div className="mb-4 p-3 bg-muted rounded">
                        <h3 className="font-semibold mb-2">Dados do Paciente:</h3>
                        {isNewLaudo && pacienteSelecionado ? (
                          <>
                            <p><strong>Nome:</strong> {getPatientName(pacienteSelecionado)}</p>
                            <p><strong>ID:</strong> {getPatientId(pacienteSelecionado)}</p>
                            <p><strong>CPF:</strong> {getPatientCpf(pacienteSelecionado)}</p>
                            <p><strong>Idade:</strong> {getPatientAge(pacienteSelecionado)} anos</p>
                            <p><strong>Sexo:</strong> {getPatientSex(pacienteSelecionado)}</p>
                            <p><strong>CID:</strong> {campos.cid || '---'}</p>
                            <p><strong>Diagnóstico:</strong> {campos.diagnostico || '---'}</p>
                            <p><strong>Conclusão:</strong> {campos.conclusao || '---'}</p>
                          </>
                        ) : (
                          <>
                            <p><strong>Nome:</strong> {getPatientName(laudo?.paciente)}</p>
                            <p><strong>ID:</strong> {getPatientId(laudo?.paciente)}</p>
                            <p><strong>CPF:</strong> {getPatientCpf(laudo?.paciente)}</p>
                            <p><strong>Idade:</strong> {getPatientAge(laudo?.paciente)} anos</p>
                            <p><strong>Sexo:</strong> {getPatientSex(laudo?.paciente)}</p>
                            <p><strong>CID:</strong> {campos.cid || laudo?.cid || '---'}</p>
                            <p><strong>Diagnóstico:</strong> {campos.diagnostico || laudo?.diagnostico || '---'}</p>
                            <p><strong>Conclusão:</strong> {campos.conclusao || laudo?.conclusao || '---'}</p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Conteúdo */}
                    <div className="mb-4">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: processContent(content) 
                        }}
                      />
                    </div>

                    {/* Imagens */}
                    {imagens.length > 0 && (
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Imagens:</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {imagens.map((img) => (
                            <img 
                              key={img.id}
                              src={img.url} 
                              alt={img.name}
                              className="w-full h-32 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assinatura Digital em tempo real */}
                    {campos.mostrarAssinatura && (
                      <div className="mt-8 text-center">
                          {assinaturaImg && assinaturaImg.length > 30 ? (
                            <img src={assinaturaImg} alt="Assinatura Digital" className="mx-auto h-16 object-contain mb-2" />
                          ) : (
                            <div className="h-16 mb-2 text-xs text-muted-foreground">Assine no campo ao lado para visualizar aqui.</div>
                          )}
                          <div className="border-b border-border mb-2"></div>
                          <p className="text-sm">{user?.name ? user.name : 'Squad-20'}</p>
                          <p className="text-xs text-muted-foreground">CRM 000000</p>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Este editor permite escrever relatórios de forma livre, com formatação de texto rica.
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  Cancelar
                </Button>
                {/* botão 'Salvar Rascunho' removido por não ser utilizado */}
                <Button
                  variant="default"
                  onClick={async () => {
                    try {
                      const userId = user?.id || '00000000-0000-0000-0000-000000000001';
                      // compor due_at a partir dos campos de data/hora, se fornecidos
                      let composedDueAt = undefined;
                      if (prazoDate) {
                        // if time not provided, default to 23:59
                        const t = prazoTime || '23:59';
                        composedDueAt = new Date(`${prazoDate}T${t}:00`).toISOString();
                      }

                      const payload = {
                        patient_id: pacienteSelecionado?.id,
                        order_number: '',
                        exam: campos.exame || '',
                        diagnosis: campos.diagnostico || '',
                        conclusion: campos.conclusao || '',
                        cid_code: campos.cid || '',
                        content_html: content,
                        content_json: {},
                        // status intentionally omitted — não enviar 'draft'
                        requested_by: solicitante || userId,
                        due_at: composedDueAt ?? new Date().toISOString(),
                        hide_date: !campos.mostrarData,
                        hide_signature: !campos.mostrarAssinatura,
                      };

                        if (isNewLaudo) {
                          if (createNewReport) {
                            const created = await createNewReport(payload as any);
                            if (onSaved) onSaved(created);
                          }
                        } else {
                          // Atualizar laudo existente: confirmar e enviar apenas diff
                          const targetId = laudo?.id ?? laudo?.order_number ?? null;
                          if (!targetId) throw new Error('ID do laudo ausente, não é possível atualizar');

                          // Montar objeto contendo somente campos alterados
                          const original = laudo || {};
                          const candidate: any = {
                            patient_id: payload.patient_id,
                            order_number: payload.order_number,
                            exam: payload.exam,
                            diagnosis: payload.diagnosis,
                            conclusion: payload.conclusion,
                            cid_code: payload.cid_code,
                            content_html: payload.content_html,
                            // content_json intentionally left as full replacement if changed
                            // status omitted on purpose
                            requested_by: payload.requested_by,
                            due_at: payload.due_at,
                            hide_date: payload.hide_date,
                            hide_signature: payload.hide_signature,
                          };

                          const diff: any = {};
                          for (const k of Object.keys(candidate)) {
                            const val = candidate[k];
                            const origVal = original[k];
                            // Considerar string/undefined equivalence
                            if (typeof val === 'string') {
                              if ((origVal ?? '') !== (val ?? '')) diff[k] = val;
                            } else if (typeof val === 'boolean') {
                              if (origVal !== val) diff[k] = val;
                            } else if (val !== undefined && val !== null) {
                              if (JSON.stringify(origVal) !== JSON.stringify(val)) diff[k] = val;
                            }
                          }

                          if (Object.keys(diff).length === 0) {
                            toast({ title: 'Nada a atualizar', description: 'Nenhuma alteração detectada.', variant: 'default' });
                          } else {
                            const ok = window.confirm('Deseja realmente atualizar este laudo? As alterações serão enviadas ao servidor.');
                            if (!ok) return;
                            if (updateExistingReport) {
                              const updated = await updateExistingReport(String(targetId), diff as any);
                              if (onSaved) onSaved(updated);
                            }
                          }
                        }

                      if (reloadReports) {
                        await reloadReports();
                      }

                      toast({
                        title: isNewLaudo ? 'Laudo criado com sucesso!' : 'Laudo atualizado com sucesso!',
                        description: isNewLaudo ? 'O laudo foi liberado e salvo.' : 'As alterações foram salvas.',
                        variant: 'default',
                      });
                      onClose();
                    } catch (err) {
                      toast({
                        title: isNewLaudo ? 'Erro ao criar laudo' : 'Erro ao atualizar laudo',
                        description: (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err) || 'Tente novamente.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  {isNewLaudo ? "Liberar Laudo" : "Atualizar Laudo"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  const renderComunicacaoSection = () => (
    <div className="bg-card shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Comunicação com o Paciente</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatário</Label>
            <Select>
              <SelectTrigger id="destinatario" className="hover:border-primary focus:border-primary cursor-pointer">
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                {pacientes.map((paciente) => (
                  <SelectItem 
                    key={paciente.cpf} 
                    value={paciente.nome} 
                    className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground"
                  >
                    {paciente.nome} - {paciente.cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoMensagem">Tipo de mensagem</Label>
            <Select>
              <SelectTrigger id="tipoMensagem" className="hover:border-primary focus:border-primary cursor-pointer">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                <SelectItem value="lembrete" className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground">Lembrete de Consulta</SelectItem>
                <SelectItem value="resultado" className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground">Resultado de Exame</SelectItem>
                <SelectItem value="instrucao" className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground">Instruções Pós-Consulta</SelectItem>
                <SelectItem value="outro" className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground dark:focus:bg-primary dark:focus:text-primary-foreground">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="dataEnvio">Data de envio</Label>
            <p id="dataEnvio" className="text-sm text-muted-foreground">03/09/2025</p>
          </div>
          <div>
            <Label htmlFor="statusEntrega">Status da entrega</Label>
            <p id="statusEntrega" className="text-sm text-muted-foreground">Pendente</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Resposta do paciente</Label>
          <div className="border rounded-md p-3 bg-muted/40 space-y-2">
            <p className="text-sm">"Ok, obrigado pelo lembrete!"</p>
            <p className="text-xs text-muted-foreground">03/09/2025 14:30</p>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave}>Registrar Comunicação</Button>
        </div>
      </div>
    </div>
  );

  
  const renderPerfilSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        {!isEditingProfile ? (
          <Button onClick={() => setIsEditingProfile(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} className="flex items-center gap-2">
              Salvar
            </Button>
            <Button variant="outline" onClick={handleCancelEdit} className="hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border text-foreground pb-2">Informações Pessoais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <p className="p-2 bg-muted rounded text-muted-foreground">{profileData.nome}</p>
            <span className="text-xs text-muted-foreground">Este campo não pode ser alterado</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditingProfile ? (
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            {isEditingProfile ? (
              <Input
                id="telefone"
                value={profileData.telefone}
                onChange={(e) => handleProfileChange('telefone', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.telefone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <p className="p-2 bg-muted rounded text-muted-foreground">{profileData.crm}</p>
            <span className="text-xs text-muted-foreground">Este campo não pode ser alterado</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="especialidade">Especialidade</Label>
            {isEditingProfile ? (
              <Input
                id="especialidade"
                value={profileData.especialidade}
                onChange={(e) => handleProfileChange('especialidade', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.especialidade}</p>
            )}
          </div>
        </div>

        {/* Endereço e Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border text-foreground pb-2">Endereço e Contato</h3>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            {isEditingProfile ? (
              <Input
                id="endereco"
                value={profileData.endereco}
                onChange={(e) => handleProfileChange('endereco', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.endereco}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            {isEditingProfile ? (
              <Input
                id="cidade"
                value={profileData.cidade}
                onChange={(e) => handleProfileChange('cidade', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.cidade}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            {isEditingProfile ? (
              <Input
                id="cep"
                value={profileData.cep}
                onChange={(e) => handleProfileChange('cep', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded text-foreground">{profileData.cep}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="biografia">Biografia</Label>
            {isEditingProfile ? (
              <Textarea
                id="biografia"
                value={profileData.biografia}
                onChange={(e) => handleProfileChange('biografia', e.target.value)}
                rows={4}
                placeholder="Descreva sua experiência profissional..."
              />
            ) : (
              <p className="p-2 bg-muted/50 rounded min-h-[100px] text-foreground">{profileData.biografia}</p>
            )}
          </div>
        </div>
      </div>

      {/* Foto do Perfil */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Foto do Perfil</h3>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-lg">
              {profileData.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {isEditingProfile && (
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Alterar Foto
              </Button>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG (máx. 2MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'calendario':
        return renderCalendarioSection();
  case 'pacientes':
    return (
      <section className="bg-card shadow-md rounded-lg border border-border p-6">
        <h2 className="text-2xl font-bold mb-4">Pacientes</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Status do Laudo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.cpf}>
                  <TableCell>{paciente.nome}</TableCell>
                  <TableCell>{paciente.cpf}</TableCell>
                  <TableCell>{paciente.idade}</TableCell>
                  <TableCell>{paciente.statusLaudo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    );
      case 'laudos':
        return renderLaudosSection();
      case 'comunicacao':
        return renderComunicacaoSection();
      case 'perfil':
        return renderPerfilSection();
      default:
        return renderCalendarioSection();
    }
  };

  return (
    <ProtectedRoute requiredUserType={["profissional"]}>
      <div className="container mx-auto px-4 py-8">
        <header className="bg-card shadow-md rounded-lg border border-border p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={medico.fotoUrl} alt={medico.nome} />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Conta do profissional</p>
              <h2 className="text-lg font-semibold leading-none truncate">{medico.nome}</h2>
              <p className="text-sm text-muted-foreground truncate">{medico.identificacao}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">Logado como: {user.email}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SimpleThemeToggle />
            <Button asChild variant="default" className="mr-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1 rounded shadow-sm shadow-blue-500/10 border border-primary">
              <Link href="/" aria-label="Início">Início</Link>
            </Button>
            <Button 
              variant="outline" 
              onClick={logout}
              className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer dark:hover:bg-red-600 dark:hover:text-white"
            >
              Sair
            </Button>
          </div>
        </header>
      
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {}
        <aside className="md:sticky md:top-8 h-fit">
          <nav className="bg-card shadow-md rounded-lg border border-border p-3 space-y-1">
            <Button 
              variant={activeSection === 'calendario' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('calendario')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </Button>
            <Button 
              variant={activeSection === 'pacientes' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('pacientes')}
            >
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </Button>
            <Button 
              variant={activeSection === 'laudos' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('laudos')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Laudos
            </Button>
            <Button 
              variant={activeSection === 'comunicacao' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('comunicacao')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comunicação
            </Button>
            <Button 
              variant={activeSection === 'perfil' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('perfil')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Meu Perfil
            </Button>
          </nav>
        </aside>

        <main>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Área do Profissional de Saúde</h1>
          </div>
          <p className="mb-8">Bem-vindo à sua área exclusiva.</p>

          {renderActiveSection()}
        </main>
      </div>

      {}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-card border border-border p-6 rounded-lg w-96">

            {step === 1 && (
              <>
                <h3 className="text-lg font-semibold mb-2">Selecionar Paciente</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Data: {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não selecionada'}
                </p>
                <Select
                  value={newEvent.title}
                  onValueChange={(value) => setNewEvent({ ...newEvent, title: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome}>
                        {paciente.nome} - {paciente.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setShowPopup(false)}
                    variant="outline"
                    className="flex-1 hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.title}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tipo da Consulta</h3>
                <Select
                  value={newEvent.type}
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(colorsByType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.type}
                    className="flex-1"
                  >
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-lg font-semibold mb-4">Horário da Consulta</h3>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setStep(2)}
                    variant="outline"
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!newEvent.time}
                    className="flex-1"
                  >
                    {editingEvent ? "Salvar" : "Agendar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {}
      {showActionModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-card border border-border p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-2">
              Consulta de {selectedEvent.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedEvent.extendedProps.type} às {selectedEvent.extendedProps.time}
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleStartEdit}
                className="flex-1 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleDeleteEvent}
                variant="destructive"
                className="flex-1 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>

            <Button
              onClick={() => setShowActionModal(false)}
              variant="outline"
              className="w-full mt-2 hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
};

const getShortId = (id?: string) => {
  if (!id) return '-';
  try {
    return id.length > 10 ? `${id.slice(0, 8)}...` : id;
  } catch (e) {
    return id;
  }
};

export default ProfissionalPage;