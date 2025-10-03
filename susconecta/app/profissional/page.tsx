"use client";

import React, { useState, useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { buscarPacientes } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  // Estados para relatórios médicos
  const [relatorioMedico, setRelatorioMedico] = useState({
    pacienteNome: "",
    pacienteCpf: "",
    pacienteIdade: "",
    profissionalNome: medico.nome,
    profissionalCrm: medico.identificacao,
    motivoRelatorio: "",
    historicoClinico: "",
    sinaisSintomas: "",
    examesRealizados: "",
    resultadosExames: "",
    diagnosticos: "",
    prognostico: "",
    tratamentosRealizados: "",
    recomendacoes: "",
    dataRelatorio: new Date().toISOString().split('T')[0]
  });
  const [relatoriosMedicos, setRelatoriosMedicos] = useState<any[]>([]);
  const [editandoRelatorio, setEditandoRelatorio] = useState<any>(null);

  // Estados para funcionalidades do prontuário
  const [consultasRegistradas, setConsultasRegistradas] = useState<any[]>([]);
  const [historicoMedico, setHistoricoMedico] = useState<any[]>([]);
  const [prescricoesMedicas, setPrescricoesMedicas] = useState<any[]>([]);
  const [examesSolicitados, setExamesSolicitados] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [evolucaoQuadro, setEvolucaoQuadro] = useState<any[]>([]);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [abaProntuarioAtiva, setAbaProntuarioAtiva] = useState('nova-consulta');

  // Estados para campos principais da consulta
  const [consultaAtual, setConsultaAtual] = useState({
    dataConsulta: new Date().toISOString().split('T')[0],
    anamnese: "",
    exameFisico: "",
    hipotesesDiagnosticas: "",
    condutaMedica: "",
    prescricoes: "",
    retornoAgendado: "",
    cid10: ""
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

  const handleAbrirProntuario = (paciente: any) => {
    setPacienteSelecionado(paciente);
    
    const pacienteLaudo = document.getElementById('pacienteLaudo') as HTMLInputElement;
    if (pacienteLaudo) pacienteLaudo.value = paciente.nome;
    
    const destinatario = document.getElementById('destinatario') as HTMLInputElement;
    if (destinatario) destinatario.value = `${paciente.nome} - ${paciente.cpf}`;
    
    const prontuarioSection = document.getElementById('prontuario-paciente');
    if (prontuarioSection) {
      prontuarioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFecharProntuario = () => {
    setPacienteSelecionado(null);
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

  // Funções para relatórios médicos
  const handleRelatorioChange = (field: string, value: string) => {
    setRelatorioMedico(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalvarRelatorio = () => {
    if (!relatorioMedico.pacienteNome || !relatorioMedico.motivoRelatorio) {
      alert('Por favor, preencha pelo menos o nome do paciente e o motivo do relatório.');
      return;
    }

    const novoRelatorio = {
      ...relatorioMedico,
      id: Date.now(),
      dataGeracao: new Date().toLocaleString()
    };

    if (editandoRelatorio) {
      setRelatoriosMedicos(prev => 
        prev.map(rel => rel.id === editandoRelatorio.id ? novoRelatorio : rel)
      );
      setEditandoRelatorio(null);
      alert('Relatório médico atualizado com sucesso!');
    } else {
      setRelatoriosMedicos(prev => [novoRelatorio, ...prev]);
      alert('Relatório médico salvo com sucesso!');
    }

    // Limpar formulário
    setRelatorioMedico({
      pacienteNome: "",
      pacienteCpf: "",
      pacienteIdade: "",
      profissionalNome: medico.nome,
      profissionalCrm: medico.identificacao,
      motivoRelatorio: "",
      historicoClinico: "",
      sinaisSintomas: "",
      examesRealizados: "",
      resultadosExames: "",
      diagnosticos: "",
      prognostico: "",
      tratamentosRealizados: "",
      recomendacoes: "",
      dataRelatorio: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditarRelatorio = (relatorio: any) => {
    setRelatorioMedico(relatorio);
    setEditandoRelatorio(relatorio);
  };

  const handleExcluirRelatorio = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este relatório médico?')) {
      setRelatoriosMedicos(prev => prev.filter(rel => rel.id !== id));
      alert('Relatório médico excluído com sucesso!');
    }
  };

  const handleCancelarEdicaoRelatorio = () => {
    setEditandoRelatorio(null);
    setRelatorioMedico({
      pacienteNome: "",
      pacienteCpf: "",
      pacienteIdade: "",
      profissionalNome: medico.nome,
      profissionalCrm: medico.identificacao,
      motivoRelatorio: "",
      historicoClinico: "",
      sinaisSintomas: "",
      examesRealizados: "",
      resultadosExames: "",
      diagnosticos: "",
      prognostico: "",
      tratamentosRealizados: "",
      recomendacoes: "",
      dataRelatorio: new Date().toISOString().split('T')[0]
    });
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
                            CPF: {paciente.cpf} • {paciente.idade} anos
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary text-primary hover:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (paciente) {
                              handleAbrirProntuario(paciente);
                              setActiveSection('prontuario');
                            }
                          }}
                        >
                          <FolderOpen className="h-4 w-4 hover:!text-white" />
                        </Button>
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

  
  function PacientesSection({
    handleAbrirProntuario,
    setActiveSection,
  }: {
    handleAbrirProntuario: (paciente: any) => void;
    setActiveSection: (section: string) => void;
  }) {
    return (
      <div className="bg-card shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Gerenciamento de Pacientes</h2>
        


        {/* Tabela de pacientes padrão */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Pacientes Recentes</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Status do laudo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.cpf}>
                  <TableCell className="font-medium">{paciente.nome}</TableCell>
                  <TableCell>{paciente.cpf}</TableCell>
                  <TableCell>{paciente.idade}</TableCell>
                  <TableCell>{paciente.statusLaudo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative group">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-primary text-primary hover:bg-blue-50 cursor-pointer mr-2 dark:hover:bg-primary dark:hover:text-white"
                          onClick={() => {
                            handleAbrirProntuario(paciente);
                            setActiveSection('prontuario');
                          }}
                        >
                          <FolderOpen className="h-4 w-4 hover:!text-white" />
                        </Button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                        </div>
                      </div>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  
  const renderProntuarioSection = () => (
    <div className="space-y-6">
      <div className="bg-card shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Prontuário do Paciente</h2>
        
        {/* Informações do Paciente Selecionado */}
        {pacienteSelecionado && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-primary">Dados do Paciente</h3>
              <div className="flex items-center gap-2">
                <Select
                  value={pacienteSelecionado.nome}
                  onValueChange={(value) => {
                    const paciente = pacientes.find(p => p.nome === value);
                    if (paciente) {
                      setPacienteSelecionado(paciente);
                    }
                  }}
                >
                  <SelectTrigger className="w-48 h-8 text-xs bg-card border-primary/30 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-blue-50 dark:hover:bg-primary dark:hover:text-primary-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{paciente.nome}</span>
                          <span className="text-xs opacity-70">({paciente.idade} anos)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFecharProntuario}
                  className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6 p-0 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-primary">Nome:</span>
                <p className="text-primary/80">{pacienteSelecionado.nome}</p>
              </div>
              <div>
                <span className="font-medium text-primary">CPF:</span>
                <p className="text-primary/80">{pacienteSelecionado.cpf}</p>
              </div>
              <div>
                <span className="font-medium text-primary">Idade:</span>
                <p className="text-primary/80">{pacienteSelecionado.idade} anos</p>
              </div>
            </div>
          </div>
        )}

        {/* Seletor de Paciente */}
        {!pacienteSelecionado && (
          <div className="space-y-6">
            <div className="bg-gray-50 border rounded-lg p-6 dark:bg-muted">
              <div className="text-center mb-6">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">Selecionar Paciente</h3>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Escolha um paciente para visualizar o prontuário completo</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <Label htmlFor="seletorPaciente" className="block text-sm font-medium text-foreground mb-2">
                  Escolha o paciente:
                </Label>
                <Select
                  onValueChange={(value) => {
                    const paciente = pacientes.find(p => p.nome === value);
                    if (paciente) {
                      setPacienteSelecionado(paciente);
                    }
                  }}
                >
                  <SelectTrigger id="seletorPaciente" className="w-full cursor-pointer">
                    <SelectValue placeholder="Selecione um paciente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-blue-50 cursor-pointer dark:hover:bg-primary dark:hover:text-primary-foreground">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-1">
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-xs opacity-70">CPF: {paciente.cpf} • {paciente.idade} anos</p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Cards de pacientes para seleção rápida */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4">Ou selecione rapidamente:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.cpf}
                    onClick={() => setPacienteSelecionado(paciente)}
                    className="border rounded-lg p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{paciente.nome}</p>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground">CPF: {paciente.cpf}</p>
                        <p className="text-sm text-gray-600 dark:text-muted-foreground">{paciente.idade} anos</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        paciente.statusLaudo === 'Finalizado' 
                          ? 'bg-green-200/80 dark:bg-green-900/50 text-green-900 dark:text-green-200 border border-green-300 dark:border-green-800' 
                          : paciente.statusLaudo === 'Pendente'
                          ? 'bg-yellow-200/80 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {paciente.statusLaudo}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs de Navegação do Prontuário */}
        {pacienteSelecionado && (
          <div className="border-b border-border mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'nova-consulta',nome: 'Nova Consulta', icone: Plus },
                { id: 'consultas', nome: 'Consultas', icone: Stethoscope },
                { id: 'historico', nome: 'Histórico Médico', icone: History },
                { id: 'prescricoes', nome: 'Prescrições', icone: Pill },
                { id: 'exames', nome: 'Exames', icone: FileText },
                { id: 'diagnosticos', nome: 'Diagnósticos', icone: ClipboardList },
                { id: 'evolucao', nome: 'Evolução', icone: Activity },
                { id: 'anexos', nome: 'Anexos', icone: Upload }
              ].map((aba) => {
                const Icone = aba.icone;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaProntuarioAtiva(aba.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                      abaProntuarioAtiva === aba.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 hover:text-foreground hover:border-border dark:text-muted-foreground'
                    }`}
                  >
                    <Icone className="h-4 w-4" />
                    {aba.nome}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Conteúdo das Abas */}
        {pacienteSelecionado && (
          <div className="min-h-[400px]">
            {abaProntuarioAtiva === 'nova-consulta' && renderNovaConsultaTab()}
            {abaProntuarioAtiva === 'consultas' && renderConsultasTab()}
            {abaProntuarioAtiva === 'historico' && renderHistoricoTab()}
            {abaProntuarioAtiva === 'prescricoes' && renderPrescricoesTab()}
            {abaProntuarioAtiva === 'exames' && renderExamesTab()}
            {abaProntuarioAtiva === 'diagnosticos' && renderDiagnosticosTab()}
            {abaProntuarioAtiva === 'evolucao' && renderEvolucaoTab()}
            {abaProntuarioAtiva === 'anexos' && renderAnexosTab()}
          </div>
        )}
      </div>
    </div>
  );

  // Função para alterar campos da consulta atual
  const handleConsultaChange = (field: string, value: string) => {
    setConsultaAtual(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar a consulta
  const handleSalvarConsulta = () => {
    if (!consultaAtual.anamnese || !consultaAtual.exameFisico) {
      alert('Por favor, preencha os campos que são obrigatórios.');
      return;
    }

    const novaConsulta = {
      ...consultaAtual,
      id: Date.now(),
      paciente: pacienteSelecionado?.nome,
      dataCriacao: new Date().toLocaleString(),
      profissional: medico.nome
    };

    setConsultasRegistradas(prev => [novaConsulta, ...prev]);
    
    setConsultaAtual({
      dataConsulta: new Date().toISOString().split('T')[0],
      anamnese: "",
      exameFisico: "",
      hipotesesDiagnosticas: "",
      condutaMedica: "",
      prescricoes: "",
      retornoAgendado: "",
      cid10: ""
    });

    alert('Consulta registrada com sucesso!');
  };

  // Funções para renderizar cada aba do prontuário
  const renderNovaConsultaTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registrar Nova Consulta</h3>
        <div className="flex gap-2">
          <Button className="cursor-pointer" variant="outline" onClick={() => {
            setConsultaAtual({
              dataConsulta: new Date().toISOString().split('T')[0],
              anamnese: "",
              exameFisico: "",
              hipotesesDiagnosticas: "",
              condutaMedica: "",
              prescricoes: "",
              retornoAgendado: "",
              cid10: ""
            });
          }}>
            Limpar Formulário
          </Button>
          <Button onClick={handleSalvarConsulta} className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Salvar Consulta
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6">
        {/* Data da Consulta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dataConsulta" className="text-sm font-medium text-foreground">
              Data da Consulta *
            </Label>
            <Input
              id="dataConsulta"
              type="date"
              value={consultaAtual.dataConsulta}
              onChange={(e) => handleConsultaChange('dataConsulta', e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cid10" className="text-sm font-medium text-foreground">
              CID-10
            </Label>
            <Input
              id="cid10"
              value={consultaAtual.cid10}
              onChange={(e) => handleConsultaChange('cid10', e.target.value)}
              placeholder="Ex: I10, E11, etc."
              className="w-full"
            />
          </div>
        </div>

        {/* Anamnese */}
        <div className="space-y-2">
          <Label htmlFor="anamnese" className="text-sm font-medium text-foreground">
            Anamnese *
          </Label>
          <Textarea
            id="anamnese"
            value={consultaAtual.anamnese}
            onChange={(e) => handleConsultaChange('anamnese', e.target.value)}
            placeholder="Descreva a história clínica do paciente, queixas principais, histórico da doença atual..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Exame Físico */}
        <div className="space-y-2">
          <Label htmlFor="exameFisico" className="text-sm font-medium text-foreground">
            Exame Físico *
          </Label>
          <Textarea
            id="exameFisico"
            value={consultaAtual.exameFisico}
            onChange={(e) => handleConsultaChange('exameFisico', e.target.value)}
            placeholder="Descreva os achados do exame físico: sinais vitais, inspeção, palpação, ausculta, percussão..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Hipóteses Diagnósticas */}
        <div className="space-y-2">
          <Label htmlFor="hipotesesDiagnosticas" className="text-sm font-medium text-foreground">
            Hipóteses Diagnósticas
          </Label>
          <Textarea
            id="hipotesesDiagnosticas"
            value={consultaAtual.hipotesesDiagnosticas}
            onChange={(e) => handleConsultaChange('hipotesesDiagnosticas', e.target.value)}
            placeholder="Liste as principais hipóteses diagnósticas em ordem de probabilidade..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Conduta Médica */}
        <div className="space-y-2">
          <Label htmlFor="condutaMedica" className="text-sm font-medium text-foreground">
            Conduta Médica
          </Label>
          <Textarea
            id="condutaMedica"
            value={consultaAtual.condutaMedica}
            onChange={(e) => handleConsultaChange('condutaMedica', e.target.value)}
            placeholder="Descreva a conduta médica adotada, orientações gerais, solicitação de exames complementares..."
            rows={3}
            className="w-full"
          />
        </div>

        {/* Prescrições */}
        <div className="space-y-2">
          <Label htmlFor="prescricoes" className="text-sm font-medium text-foreground">
            Prescrições
          </Label>
          <Textarea
            id="prescricoes"
            value={consultaAtual.prescricoes}
            onChange={(e) => handleConsultaChange('prescricoes', e.target.value)}
            placeholder="Liste as prescrições: medicamentos, dosagens, frequência, duração do tratamento..."
            rows={4}
            className="w-full"
          />
        </div>

        {/* Retorno Agendado */}
        <div className="space-y-2">
          <Label htmlFor="retornoAgendado" className="text-sm font-medium text-foreground">
            Retorno Agendado
          </Label>
          <Input
            id="retornoAgendado"
            type="date"
            value={consultaAtual.retornoAgendado}
            onChange={(e) => handleConsultaChange('retornoAgendado', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Informações do Registro */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Paciente:</span>
              <p>{pacienteSelecionado?.nome}</p>
            </div>
            <div>
              <span className="font-medium">Profissional:</span>
              <p>{medico.nome}</p>
            </div>
            <div>
              <span className="font-medium">Data do Registro:</span>
              <p>{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultas Anteriores do Paciente */}
      {consultasRegistradas.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h4 className="text-lg font-medium mb-4">Consultas Anteriores</h4>
          <div className="space-y-3">
            {consultasRegistradas
              .filter(consulta => consulta.paciente === pacienteSelecionado?.nome)
              .slice(0, 3)
              .map((consulta) => (
                <div key={consulta.id} className="border rounded-lg p-3 hover:shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">
                        Consulta de {new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Registrada em: {consulta.dataCriacao}
                      </p>
                    </div>
                    {consulta.cid10 && (
                      <span className="px-2 py-1 bg-blue-200/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs rounded-full border border-blue-300 dark:border-blue-800">
                        {consulta.cid10}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-foreground">
                    <p><strong>Anamnese:</strong> {consulta.anamnese.substring(0, 100)}...</p>
                    {consulta.hipotesesDiagnosticas && (
                      <p><strong>Diagnóstico:</strong> {consulta.hipotesesDiagnosticas.substring(0, 80)}...</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConsultasTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Registro de Consultas</h3>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Consulta Cardiológica</h4>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">27/09/2025 - 09:00</p>
            </div>
            <span className="px-2 py-1 bg-green-200/80 dark:bg-green-900/50 text-green-900 dark:text-green-200 text-xs rounded-full border border-green-300 dark:border-green-800">Finalizada</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Motivo:</span>
              <p>Dor no peito e falta de ar</p>
            </div>
            <div>
              <span className="font-medium">Duração:</span>
              <p>45 minutos</p>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Observações:</span>
            <p className="text-sm mt-1">Paciente relatou melhora dos sintomas após início do tratamento. Pressão arterial controlada.</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Consulta Dermatológica</h4>
              <p className="text-sm text-muted-foreground">15/09/2025 - 14:30</p>
            </div>
            <span className="px-2 py-1 bg-blue-200/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs rounded-full border border-blue-300 dark:border-blue-800">Retorno Agendado</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Motivo:</span>
              <p>Avaliação de lesão cutânea</p>
            </div>
            <div>
              <span className="font-medium">Duração:</span>
              <p>30 minutos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoricoTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Histórico Médico Completo</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Adicionar Registro
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Condições Pré-existentes</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Hipertensão arterial (diagnosticada em 2020)</li>
            <li>Diabetes tipo 2 (diagnosticada em 2018)</li>
            <li>Histórico familiar de doenças cardiovasculares</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Cirurgias Anteriores</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Apendicectomia</span>
              <span className="text-muted-foreground">15/03/2010</span>
            </div>
            <div className="flex justify-between">
              <span>Colecistectomia laparoscópica</span>
              <span className="text-muted-foreground">22/08/2019</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Alergias e Reações Adversas</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-200/80 dark:bg-red-900/50 text-red-900 dark:text-red-200 text-xs rounded border border-red-300 dark:border-red-800">Alergia</span>
              <span>Penicilina - reação cutânea</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-200/80 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 text-xs rounded border border-yellow-300 dark:border-yellow-800">Intolerância</span>
              <span>Lactose - sintomas gastrintestinais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrescricoesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Prescrições Médicas</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Prescrição
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Prescrição Atual</h4>
              <p className="text-sm text-muted-foreground">Prescrita em 27/09/2025</p>
            </div>
            <span className="px-2 py-1 bg-green-200/80 dark:bg-green-900/50 text-green-900 dark:text-green-200 text-xs rounded-full border border-green-300 dark:border-green-800">Ativa</span>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">Losartana 50mg</p>
                  <p className="text-sm text-muted-foreground">1 comprimido pela manhã</p>
                  <p className="text-sm text-muted-foreground">Duração: 30 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">Metformina 850mg</p>
                  <p className="text-sm text-muted-foreground">1 comprimido após café e jantar</p>
                  <p className="text-sm text-muted-foreground">Duração: 60 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Prescrições Anteriores</h4>
              <p className="text-sm text-muted-foreground">Histórico de medicamentos</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Sinvastatina 20mg</p>
                <p className="text-muted-foreground">Prescrita em 15/08/2025 - Finalizada</p>
              </div>
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderExamesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Exames Solicitados</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Exames Pendentes</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
              <div>
                <p className="font-medium text-foreground">Ecocardiograma</p>
                <p className="text-sm text-muted-foreground">Solicitado em 25/09/2025</p>
                <p className="text-sm text-muted-foreground">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-yellow-200/80 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 text-xs rounded-full border border-yellow-300 dark:border-yellow-800">Pendente</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
              <div>
                <p className="font-medium text-foreground">Hemograma Completo</p>
                <p className="text-sm text-muted-foreground">Solicitado em 27/09/2025</p>
                <p className="text-sm text-muted-foreground">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-blue-200/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs rounded-full border border-blue-300 dark:border-blue-800">Agendado</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Resultados Disponíveis</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
              <div>
                <p className="font-medium text-foreground">Glicemia de Jejum</p>
                <p className="text-sm text-muted-foreground">Realizado em 20/09/2025</p>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Resultado: 95 mg/dL (Normal)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiagnosticosTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Diagnósticos</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Novo Diagnóstico
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 text-foreground">Diagnósticos Ativos</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">Hipertensão Arterial Sistêmica</p>
                  <p className="text-sm text-muted-foreground">CID-10: I10</p>
                  <p className="text-sm text-muted-foreground">Diagnosticado em: 15/03/2020</p>
                  <p className="text-sm mt-1 text-foreground">Status: Controlada com medicação</p>
                </div>
                <span className="px-2 py-1 bg-red-200/80 dark:bg-red-900/50 text-red-900 dark:text-red-200 text-xs rounded-full border border-red-300 dark:border-red-800">Ativo</span>
              </div>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-foreground">Diabetes Mellitus Tipo 2</p>
                  <p className="text-sm text-muted-foreground">CID-10: E11</p>
                  <p className="text-sm text-muted-foreground">Diagnosticado em: 10/08/2018</p>
                  <p className="text-sm mt-1 text-foreground">Status: Controlada com dieta e medicação</p>
                </div>
                <span className="px-2 py-1 bg-orange-200/80 dark:bg-orange-900/50 text-orange-900 dark:text-orange-200 text-xs rounded-full border border-orange-300 dark:border-orange-800">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3 text-foreground">Histórico de Diagnósticos</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium text-foreground">Gastrite Aguda</p>
                <p className="text-muted-foreground">CID-10: K29.0 - Resolvido em 2023</p>
              </div>
              <span className="px-2 py-1 bg-gray-200/80 dark:bg-gray-900/50 text-gray-900 dark:text-gray-200 text-xs rounded-full border border-gray-300 dark:border-gray-800">Resolvido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvolucaoTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Evolução do Quadro</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Evolução
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Evolução Recente</h4>
              <p className="text-sm text-muted-foreground">27/09/2025 - 09:15</p>
            </div>
            <span className="px-2 py-1 bg-blue-200/80 dark:bg-blue-900/50 text-blue-900 dark:text-blue-200 text-xs rounded-full border border-blue-300 dark:border-blue-800">Melhora</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-foreground"><strong>Subjetivo:</strong> Paciente relatou diminuição significativa da dor no peito e melhora da capacidade respiratória.</p>
            <p className="text-sm text-foreground"><strong>Objetivo:</strong> PA: 130/80 mmHg, FC: 72 bpm, ausculta cardíaca sem alterações.</p>
            <p className="text-sm text-foreground"><strong>Avaliação:</strong> Resposta positiva ao tratamento iniciado, pressão arterial em níveis aceitáveis.</p>
            <p className="text-sm text-foreground"><strong>Plano:</strong> Manter medicação atual, retorno em 30 dias.</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium text-foreground">Evolução Anterior</h4>
              <p className="text-sm text-muted-foreground">15/09/2025 - 14:45</p>
            </div>
            <span className="px-2 py-1 bg-yellow-200/80 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-200 text-xs rounded-full border border-yellow-300 dark:border-yellow-800">Estável</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm"><strong>Subjetivo:</strong> Paciente apresentou episódios esporádicos de dor torácica leve.</p>
            <p className="text-sm"><strong>Objetivo:</strong> Exame físico sem alterações significativas.</p>
            <p className="text-sm"><strong>Plano:</strong> Ajuste da medicação e solicitação de exames complementares.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnexosTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Anexos (Exames, Imagens)</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          Adicionar Anexo
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Exames de Imagem</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Radiografia de Tórax</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">20/09/2025</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-3 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">ECG</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">15/09/2025</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Eye className="h-3 w-3 mr-1" />
                  Visualizar
                </Button>
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Laudos e Documentos</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Laudo de Ecocardiograma</p>
                  <p className="text-xs text-gray-600 dark:text-muted-foreground">10/08/2025 - Dr. Carlos Andrade</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Relatório de Consulta Especializada</p>
                  <p className="text-xs text-gray-600">05/09/2025 - Cardiologia</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer hover:bg-blue-50 dark:hover:bg-accent dark:hover:text-accent-foreground">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  
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

    const [laudos] = useState([
      { 
        id: "306494942", 
        data: "29/07/2025", 
        prazo: "29/07/2025", 
        paciente: { id: "95170038", nome: "Ana Souza", cpf: "123.456.789-00", idade: 42, sexo: "Feminino" },
        executante: "Carlos Andrade",
        exame: "Ecocardiograma",
        status: "Entregue",
        urgente: true,
        especialidade: "Cardiologia",
        conteudo: `**ECOCARDIOGRAMA TRANSTORÁCICO**

**Dados do Paciente:**
Nome: Ana Souza
Idade: 42 anos
Sexo: Feminino

**Indicação Clínica:**
Investigação de sopro cardíaco

**Técnica:**
Ecocardiograma transtorácico bidimensional com Doppler colorido e espectral.

**Resultados:**
- Átrio esquerdo: dimensões normais
- Ventrículo esquerdo: função sistólica preservada, FEVE = 65%
- Valvas cardíacas: sem alterações significativas
- Pericárdio: sem derrame

**Conclusão:**
Exame ecocardiográfico dentro dos limites da normalidade.

**CID:** I25.9`,
        cid: "I25.9",
        diagnostico: "Exame ecocardiográfico normal",
        conclusao: "Função cardíaca preservada, sem alterações estruturais significativas."
      },
      { 
        id: "306463987", 
        data: "29/07/2025", 
        prazo: "29/07/2025", 
        paciente: { id: "93203056", nome: "Bruno Lima", cpf: "987.654.321-00", idade: 33, sexo: "Masculino" },
        executante: "Carlos Andrade",
        exame: "Eletrocardiograma",
        status: "Entregue",
        urgente: true,
        especialidade: "Cardiologia",
        conteudo: `**ELETROCARDIOGRAMA DE REPOUSO**

**Dados do Paciente:**
Nome: Bruno Lima
Idade: 33 anos
Sexo: Masculino

**Indicação Clínica:**
Dor precordial atípica

**Técnica:**
Eletrocardiograma de 12 derivações em repouso.

**Resultados:**
- Ritmo: sinusal regular
- Frequência cardíaca: 72 bpm
- Eixo elétrico: normal
- Intervalos PR, QRS e QT: dentro dos limites normais
- Ondas Q patológicas: ausentes
- Alterações de ST-T: não observadas

**Conclusão:**
Eletrocardiograma normal.

**CID:** Z01.8`,
        cid: "Z01.8",
        diagnostico: "ECG normal",
        conclusao: "Traçado eletrocardiográfico dentro dos parâmetros de normalidade."
      },
      { 
        id: "306452545", 
        data: "29/07/2025", 
        prazo: "29/07/2025", 
        paciente: { id: "92953542", nome: "Carla Menezes", cpf: "111.222.333-44", idade: 67, sexo: "Feminino" },
        executante: "Carlos Andrade",
        exame: "Dermatoscopia",
        status: "Entregue",
        urgente: true,
        especialidade: "Dermatologia",
        conteudo: `**DERMATOSCOPIA DIGITAL**

**Dados do Paciente:**
Nome: Carla Menezes
Idade: 67 anos
Sexo: Feminino

**Indicação Clínica:**
Avaliação de lesão pigmentada em dorso

**Técnica:**
Dermatoscopia digital com magnificação de 10x e 20x.

**Localização:**
Região dorsal, região escapular direita

**Achados Dermatoscópicos:**
- Lesão melanocítica benigna
- Padrão reticular típico
- Bordas regulares e simétricas
- Pigmentação homogênea
- Ausência de estruturas atípicas

**Conclusão:**
Nevo melanocítico benigno. Seguimento clínico recomendado.

**CID:** D22.5`,
        cid: "D22.5",
        diagnostico: "Nevo melanocítico benigno",
        conclusao: "Lesão benigna, recomenda-se acompanhamento dermatológico de rotina."
      },
    ]);

    const [activeTab, setActiveTab] = useState("entregue");
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
            <button
              onClick={() => setActiveTab("liberado")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "liberado"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Liberado
            </button>
            <button
              onClick={() => setActiveTab("entregue")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "entregue"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Entregue
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
                  <span>01/07/2025</span>
                  <span>-</span>
                  <span>31/07/2025</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">Hoje</Button>
                <Button variant="outline" size="sm">Semana</Button>
                <Button variant="default" size="sm">Mês</Button>
              </div>

              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtros
              </Button>

              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-1" />
                Pesquisar
              </Button>

              <Button variant="default" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
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
                {laudos.map((laudo) => (
                  <TableRow key={laudo.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {laudo.urgente && (
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                        <span className="font-mono text-sm">{laudo.id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{laudo.data}</div>
                        <div className="text-xs text-muted-foreground">11:48</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{laudo.prazo}</div>
                        <div className="text-xs text-muted-foreground">11:48</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="font-mono text-xs">{laudo.paciente.id}</span>
                        </div>
                        <div className="font-medium">{laudo.paciente.nome}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{laudo.executante}</TableCell>
                    <TableCell className="text-sm">{laudo.exame || "-"}</TableCell>
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
          />
        )}

        {/* Editor para Paciente Específico */}
        {isEditingForPatient && selectedPatientForLaudo && (
          <LaudoEditor 
            pacientes={[selectedPatientForLaudo.paciente || selectedPatientForLaudo]} 
            laudo={selectedPatientForLaudo.conteudo ? selectedPatientForLaudo : null}
            onClose={onClosePatientEditor || (() => {})} 
            isNewLaudo={!selectedPatientForLaudo.conteudo}
            preSelectedPatient={selectedPatientForLaudo.paciente || selectedPatientForLaudo}
          />
        )}
      </div>
    );
  }

  // Visualizador de Laudo (somente leitura)
  function LaudoViewer({ laudo, onClose }: { laudo: any; onClose: () => void }) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">Visualizar Laudo</h2>
              <p className="text-sm text-muted-foreground">
                Paciente: {laudo.paciente.nome} | Pedido: {laudo.id} | {laudo.especialidade}
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
                <h2 className="text-lg font-bold">LAUDO MÉDICO - {laudo.especialidade.toUpperCase()}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Data: {laudo.data}
                </p>
              </div>

              {/* Dados do Paciente */}
              <div className="mb-6 p-4 bg-muted rounded">
                <h3 className="font-semibold mb-2">Dados do Paciente:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p><strong>Nome:</strong> {laudo.paciente.nome}</p>
                  <p><strong>ID:</strong> {laudo.paciente.id}</p>
                  <p><strong>CPF:</strong> {laudo.paciente.cpf}</p>
                  <p><strong>Idade:</strong> {laudo.paciente.idade} anos</p>
                  <p><strong>Sexo:</strong> {laudo.paciente.sexo}</p>
                  <p><strong>CID:</strong> {laudo.cid}</p>
                </div>
              </div>

              {/* Conteúdo do Laudo */}
              <div className="mb-6">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: laudo.conteudo.replace(/\n/g, '<br>') 
                  }}
                />
              </div>

              {/* Diagnóstico e Conclusão */}
              {laudo.diagnostico && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">Diagnóstico:</h4>
                  <p className="text-sm">{laudo.diagnostico}</p>
                </div>
              )}

              {laudo.conclusao && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-950/20 rounded">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">Conclusão:</h4>
                  <p className="text-sm">{laudo.conclusao}</p>
                </div>
              )}

              {/* Assinatura */}
              <div className="mt-8 text-center border-t pt-4">
                <div className="h-16 mb-2"></div>
                <p className="text-sm font-semibold">Dr. Carlos Andrade</p>
                <p className="text-xs text-muted-foreground">CRM 000000 - {laudo.especialidade}</p>
                <p className="text-xs text-muted-foreground mt-1">Data: {laudo.data}</p>
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
  function LaudoEditor({ pacientes, laudo, onClose, isNewLaudo, preSelectedPatient }: { pacientes?: any[]; laudo?: any; onClose: () => void; isNewLaudo?: boolean; preSelectedPatient?: any }) {
    const [activeTab, setActiveTab] = useState("editor");
    const [content, setContent] = useState(laudo?.conteudo || "");
    const [showPreview, setShowPreview] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(preSelectedPatient || null);
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

    // Carregar dados do laudo existente quando disponível
    useEffect(() => {
      if (laudo && !isNewLaudo) {
        setContent(laudo.conteudo || "");
        setCampos({
          cid: laudo.cid || "",
          diagnostico: laudo.diagnostico || "",
          conclusao: laudo.conclusao || "",
          exame: laudo.exame || "",
          especialidade: laudo.especialidade || "",
          mostrarData: true,
          mostrarAssinatura: true
        });
        setPacienteSelecionado(laudo.paciente);
      }
    }, [laudo, isNewLaudo]);

    const formatText = (type: string) => {
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
          formattedText = selectedText ? `<u>${selectedText}</u>` : "<u>texto sublinhado</u>";
          break;
        case "list":
          formattedText = selectedText ? `• ${selectedText}` : "• item da lista";
          break;
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
        .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
        .replace(/{{sexo_paciente}}/g, pacienteSelecionado?.sexo || laudo?.paciente?.sexo || '[SEXO]')
        .replace(/{{diagnostico}}/g, campos.diagnostico || '[DIAGNÓSTICO]')
        .replace(/{{conclusao}}/g, campos.conclusao || '[CONCLUSÃO]')
        .replace(/\n/g, '<br>');
    };

    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
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
                    Paciente: {laudo?.paciente?.nome} | Pedido: {laudo?.id} | {laudo?.especialidade}
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
                      const paciente = pacientes?.find(p => p.id === value);
                      if (paciente) setPacienteSelecionado(paciente);
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Escolha um paciente para criar o laudo" />
                      </SelectTrigger>
                      <SelectContent>
                        {pacientes?.map((paciente) => (
                          <SelectItem key={paciente.id} value={paciente.id}>
                            {paciente.nome} - CPF: {paciente.cpf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-primary">{pacienteSelecionado.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        CPF: {pacienteSelecionado.cpf} | Idade: {pacienteSelecionado.idade} anos | Sexo: {pacienteSelecionado.sexo}
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
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {isNewLaudo && (
              <button
                onClick={() => setActiveTab("info")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "info"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4 inline mr-1" />
                Informações
              </button>
            )}
            <button
              onClick={() => setActiveTab("editor")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "editor"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Editor
            </button>
            <button
              onClick={() => setActiveTab("imagens")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "imagens"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1" />
              Imagens ({imagens.length})
            </button>
            <button
              onClick={() => setActiveTab("campos")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "campos"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Campos
            </button>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                showPreview
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-blue-50 dark:hover:bg-gray-700"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1" />
              {showPreview ? "Ocultar" : "Pré-visualização"}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel */}
            <div className="flex-1 flex flex-col">
              {activeTab === "info" && isNewLaudo && (
                <div className="flex-1 p-4 space-y-4">
                  {!pacienteSelecionado ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Selecione um paciente primeiro</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Informações do Exame</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="especialidade">Especialidade *</Label>
                            <Select onValueChange={(value) => setCampos(prev => ({ ...prev, especialidade: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a especialidade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                                <SelectItem value="Dermatologia">Dermatologia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="tipo-exame">Tipo de Exame *</Label>
                            <Input
                              id="tipo-exame"
                              value={campos.exame}
                              onChange={(e) => setCampos(prev => ({ ...prev, exame: e.target.value }))}
                              placeholder="Ex: Ecocardiograma, Dermatoscopia, etc."
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Dados do Paciente</h3>
                        <div className="bg-muted border border-border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Nome:</span> {pacienteSelecionado.nome}
                            </div>
                            <div>
                              <span className="font-medium">ID:</span> {pacienteSelecionado.id}
                            </div>
                            <div>
                              <span className="font-medium">CPF:</span> {pacienteSelecionado.cpf}
                            </div>
                            <div>
                              <span className="font-medium">Idade:</span> {pacienteSelecionado.idade} anos
                            </div>
                            <div>
                              <span className="font-medium">Sexo:</span> {pacienteSelecionado.sexo}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={() => setActiveTab("editor")}
                          disabled={!campos.especialidade || !campos.exame}
                        >
                          Continuar para Editor
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "editor" && (
                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="p-3 border-b border-border">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText("bold")}
                        title="Negrito"
                      >
                        <strong>B</strong>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText("italic")}
                        title="Itálico"
                      >
                        <em>I</em>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText("underline")}
                        title="Sublinhado"
                      >
                        <u>U</u>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => formatText("list")}
                        title="Lista"
                      >
                        •
                      </Button>
                      
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
                  <div className="flex-1 p-4">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Digite o conteúdo do laudo aqui. Use ** para negrito, * para itálico, <u></u> para sublinhado."
                      className="h-full min-h-[400px] resize-none"
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
                <div className="flex-1 p-4 space-y-4">
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

                  {/* Assinatura Digital */}
                  <div>
                    <Label>Assinatura Digital</Label>
                    <div className="mt-2 p-4 border border-border rounded-lg bg-muted">
                      <SignatureCanvas
                        ref={sigCanvasRef}
                        penColor="#000"
                        backgroundColor="#fff"
                        canvasProps={{ 
                          width: 400, 
                          height: 150, 
                          className: "border rounded bg-background"
                        }}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sigCanvasRef.current?.clear()}
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>
                  </div>
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
                            <p><strong>Nome:</strong> {pacienteSelecionado.nome}</p>
                            <p><strong>ID:</strong> {pacienteSelecionado.id}</p>
                            <p><strong>CPF:</strong> {pacienteSelecionado.cpf}</p>
                            <p><strong>Idade:</strong> {pacienteSelecionado.idade} anos</p>
                            <p><strong>Sexo:</strong> {pacienteSelecionado.sexo}</p>
                            {campos.cid && <p><strong>CID:</strong> {campos.cid}</p>}
                          </>
                        ) : (
                          <>
                            <p><strong>Nome:</strong> {laudo?.paciente?.nome}</p>
                            <p><strong>ID:</strong> {laudo?.paciente?.id}</p>
                            {campos.cid && <p><strong>CID:</strong> {campos.cid}</p>}
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

                    {/* Assinatura */}
                    {campos.mostrarAssinatura && (
                      <div className="mt-8 text-center">
                        <div className="h-16 border-b border-border mb-2"></div>
                        <p className="text-sm">Dr. Carlos Andrade</p>
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
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button variant="outline">
                  Salvar Rascunho
                </Button>
                <Button variant="default">
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
            <Input 
              id="destinatario" 
              placeholder="Nome do Paciente ou CPF" 
              disabled 
              className="bg-muted cursor-not-allowed text-muted-foreground disabled:text-foreground"
            />
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

  // Função para renderizar a seção de relatórios médicos
  const renderRelatoriosMedicosSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Relatórios Médicos</h2>
        {editandoRelatorio && (
          <Button variant="outline" onClick={handleCancelarEdicaoRelatorio}>
            Cancelar Edição
          </Button>
        )}
      </div>

      {/* Formulário de Relatório Médico */}
      <div className="bg-card shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          {editandoRelatorio ? 'Editar Relatório Médico' : 'Novo Relatório Médico'}
        </h3>
        
        <div className="grid gap-6">
          {/* Identificação do Profissional */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Identificação do Profissional</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profissionalNome">Nome do Profissional</Label>
                <Input
                  id="profissionalNome"
                  value={relatorioMedico.profissionalNome}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissionalCrm">CRM e Especialidade</Label>
                <Input
                  id="profissionalCrm"
                  value={relatorioMedico.profissionalCrm}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Identificação do Paciente */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Identificação do Paciente</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pacienteNome">Nome do Paciente *</Label>
                <Select
                  value={relatorioMedico.pacienteNome}
                  onValueChange={(value) => {
                    const pacienteSelecionado = pacientes.find(p => p.nome === value);
                    handleRelatorioChange('pacienteNome', value);
                    if (pacienteSelecionado) {
                      handleRelatorioChange('pacienteCpf', pacienteSelecionado.cpf);
                      handleRelatorioChange('pacienteIdade', pacienteSelecionado.idade.toString());
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome}>
                        {paciente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pacienteCpf">CPF do Paciente</Label>
                <Input
                  id="pacienteCpf"
                  value={relatorioMedico.pacienteCpf}
                  onChange={(e) => handleRelatorioChange('pacienteCpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pacienteIdade">Idade</Label>
                <Input
                  id="pacienteIdade"
                  type="number"
                  value={relatorioMedico.pacienteIdade}
                  onChange={(e) => handleRelatorioChange('pacienteIdade', e.target.value)}
                  placeholder="Idade do paciente"
                />
              </div>
            </div>
          </div>

          {/* Informações do Relatório */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Informações do Relatório</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="motivoRelatorio">Motivo do Relatório *</Label>
                <Textarea
                  id="motivoRelatorio"
                  value={relatorioMedico.motivoRelatorio}
                  onChange={(e) => handleRelatorioChange('motivoRelatorio', e.target.value)}
                  placeholder="Descreva o motivo para a elaboração deste relatório médico..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataRelatorio">Data do Relatório</Label>
                <Input
                  id="dataRelatorio"
                  type="date"
                  value={relatorioMedico.dataRelatorio}
                  onChange={(e) => handleRelatorioChange('dataRelatorio', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="historicoClinico">Histórico Clínico Conciso</Label>
              <Textarea
                id="historicoClinico"
                value={relatorioMedico.historicoClinico}
                onChange={(e) => handleRelatorioChange('historicoClinico', e.target.value)}
                placeholder="Resumo do histórico clínico relevante do paciente..."
                rows={4}
              />
            </div>
          </div>

          {/* Sinais, Sintomas e Exames */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Sinais, Sintomas e Exames</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sinaisSintomas">Sinais e Sintomas</Label>
                <Textarea
                  id="sinaisSintomas"
                  value={relatorioMedico.sinaisSintomas}
                  onChange={(e) => handleRelatorioChange('sinaisSintomas', e.target.value)}
                  placeholder="Descreva os sinais e sintomas observados..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examesRealizados">Exames Realizados</Label>
                <Textarea
                  id="examesRealizados"
                  value={relatorioMedico.examesRealizados}
                  onChange={(e) => handleRelatorioChange('examesRealizados', e.target.value)}
                  placeholder="Liste os exames realizados..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resultadosExames">Resultados Relevantes dos Exames</Label>
              <Textarea
                id="resultadosExames"
                value={relatorioMedico.resultadosExames}
                onChange={(e) => handleRelatorioChange('resultadosExames', e.target.value)}
                placeholder="Descreva os resultados mais relevantes dos exames..."
                rows={3}
              />
            </div>
          </div>

          {/* Diagnósticos e Prognóstico */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Diagnósticos e Prognóstico</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosticos">Diagnóstico(s)</Label>
                <Textarea
                  id="diagnosticos"
                  value={relatorioMedico.diagnosticos}
                  onChange={(e) => handleRelatorioChange('diagnosticos', e.target.value)}
                  placeholder="Informe o(s) diagnóstico(s) estabelecido(s)..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prognostico">Prognóstico (quando cabível)</Label>
                <Textarea
                  id="prognostico"
                  value={relatorioMedico.prognostico}
                  onChange={(e) => handleRelatorioChange('prognostico', e.target.value)}
                  placeholder="Descreva o prognóstico, se aplicável..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Tratamentos e Recomendações */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-primary border-b pb-2">Tratamentos e Recomendações</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tratamentosRealizados">Tratamentos já Realizados</Label>
                <Textarea
                  id="tratamentosRealizados"
                  value={relatorioMedico.tratamentosRealizados}
                  onChange={(e) => handleRelatorioChange('tratamentosRealizados', e.target.value)}
                  placeholder="Descreva os tratamentos já realizados..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recomendacoes">Recomendações Objetivas</Label>
                <Textarea
                  id="recomendacoes"
                  value={relatorioMedico.recomendacoes}
                  onChange={(e) => handleRelatorioChange('recomendacoes', e.target.value)}
                  placeholder="Informe as recomendações objetivas..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={handleCancelarEdicaoRelatorio}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarRelatorio} className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              {editandoRelatorio ? 'Atualizar Relatório' : 'Salvar Relatório'}
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Relatórios Existentes */}
      <div className="bg-card shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Relatórios Médicos Salvos</h3>
        
        {relatoriosMedicos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg mb-2">Nenhum relatório médico encontrado</p>
            <p className="text-sm">Os relatórios salvos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-4">
            {relatoriosMedicos.map((relatorio) => (
              <div key={relatorio.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{relatorio.pacienteNome}</h4>
                    <p className="text-sm text-muted-foreground">CPF: {relatorio.pacienteCpf} • Idade: {relatorio.pacienteIdade} anos</p>
                    <p className="text-sm text-muted-foreground">Data do relatório: {new Date(relatorio.dataRelatorio).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground/70">Gerado em: {relatorio.dataGeracao}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarRelatorio(relatorio)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleExcluirRelatorio(relatorio.id)}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-primary">Motivo:</span>
                    <p className="text-foreground mt-1">{relatorio.motivoRelatorio}</p>
                  </div>
                  
                  {relatorio.diagnosticos && (
                    <div>
                      <span className="font-medium text-primary">Diagnóstico(s):</span>
                      <p className="text-foreground mt-1">{relatorio.diagnosticos}</p>
                    </div>
                  )}
                  
                  {relatorio.recomendacoes && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-primary">Recomendações:</span>
                      <p className="text-foreground mt-1">{relatorio.recomendacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
            <Button variant="outline" onClick={handleCancelEdit}>
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
  return <PacientesSection handleAbrirProntuario={handleAbrirProntuario} setActiveSection={setActiveSection} />;
      case 'prontuario':
        return renderProntuarioSection();
      case 'laudos':
        return renderLaudosSection();
      case 'comunicacao':
        return renderComunicacaoSection();
      case 'relatorios-medicos':
        return renderRelatoriosMedicosSection();
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
          <Button 
            variant="outline" 
            onClick={logout}
            className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer dark:hover:bg-red-600 dark:hover:text-white"
          >
            Sair
          </Button>
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
              variant={activeSection === 'prontuario' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('prontuario')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Prontuário
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
              variant={activeSection === 'relatorios-medicos' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary hover:text-white cursor-pointer"
              onClick={() => setActiveSection('relatorios-medicos')}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Relatórios Médicos
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
            <Button asChild>
              <Link href="/">Início</Link>
            </Button>
            
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
                    className="flex-1"
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
              className="w-full mt-2"
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

export default ProfissionalPage;