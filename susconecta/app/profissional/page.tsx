"use client";

import React, { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Clock, FileCheck, Upload, Download, Eye, History, Stethoscope, Pill, Activity } from "lucide-react"
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
      <section className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Agenda do Dia</h2>
        </div>
        
        {/* Navegação de Data */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium text-gray-900">
              {formatDate(currentCalendarDate)}
            </h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              Hoje
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            {todayEvents.length} consulta{todayEvents.length !== 1 ? 's' : ''} agendada{todayEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Pacientes do Dia */}
        <div className="space-y-4">
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Nenhuma consulta agendada para este dia</p>
              <p className="text-sm">Agenda livre para este dia</p>
            </div>
          ) : (
            todayEvents.map((appointment) => {
              const paciente = pacientes.find(p => p.nome === appointment.title);
              return (
                <div
                  key={appointment.id}
                  className="border-l-4 p-4 rounded-lg shadow-sm bg-white border-gray-200"
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
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          {appointment.title}
                        </div>
                        {paciente && (
                          <div className="text-sm text-gray-500">
                            CPF: {paciente.cpf} • {paciente.idade} anos
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-500" />
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
                          className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (paciente) {
                              handleAbrirProntuario(paciente);
                              setActiveSection('prontuario');
                            }
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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

  
  const renderPacientesSection = () => {
    // Estados para busca de pacientes
    const [buscaPaciente, setBuscaPaciente] = useState("");
    const [pacientesBusca, setPacientesBusca] = useState<any[]>([]);
    const [carregandoBusca, setCarregandoBusca] = useState(false);
    const [erroBusca, setErroBusca] = useState<string | null>(null);

    // Função para buscar pacientes
    const handleBuscarPaciente = async () => {
      if (!buscaPaciente.trim()) {
        setPacientesBusca([]);
        setErroBusca(null);
        return;
      }

      setCarregandoBusca(true);
      setErroBusca(null);

      try {
        // Importa a função de busca
        const { buscarPacientes } = await import("@/lib/api");
        const resultados = await buscarPacientes(buscaPaciente.trim());
        
        if (resultados.length === 0) {
          setErroBusca("Nenhum paciente encontrado com os critérios informados.");
          setPacientesBusca([]);
        } else {
          // Transforma os dados da API para o formato usado no componente
          const pacientesFormatados = resultados.map(p => ({
            nome: p.full_name || "Nome não informado",
            cpf: p.cpf || "CPF não informado",
            idade: p.birth_date ? new Date().getFullYear() - new Date(p.birth_date).getFullYear() : "N/A",
            statusLaudo: "Pendente", // Status padrão
            id: p.id
          }));
          setPacientesBusca(pacientesFormatados);
          setErroBusca(null);
        }
      } catch (error: any) {
        console.error("Erro ao buscar pacientes:", error);
        setErroBusca(error.message || "Erro ao buscar pacientes. Tente novamente.");
        setPacientesBusca([]);
      } finally {
        setCarregandoBusca(false);
      }
    };

    const handleLimparBusca = () => {
      setBuscaPaciente("");
      setPacientesBusca([]);
      setErroBusca(null);
    };

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Gerenciamento de Pacientes</h2>
        
        {/* Campo de busca */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Buscar Paciente</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Digite ID, CPF, nome ou email do paciente..."
                value={buscaPaciente}
                onChange={(e) => setBuscaPaciente(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuscarPaciente()}
                className="w-full"
              />
            </div>
            <Button 
              onClick={handleBuscarPaciente} 
              disabled={carregandoBusca}
              className="flex items-center gap-2"
            >
              {carregandoBusca ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
            {(buscaPaciente || pacientesBusca.length > 0 || erroBusca) && (
              <Button 
                variant="outline" 
                onClick={handleLimparBusca}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
          
          {/* Resultados da busca */}
          {erroBusca && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{erroBusca}</p>
            </div>
          )}
          
          {pacientesBusca.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium mb-2">Resultados da busca ({pacientesBusca.length}):</h4>
              <div className="space-y-2">
                {pacientesBusca.map((paciente, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm">
                    <div>
                      <p className="font-medium">{paciente.nome}</p>
                      <p className="text-sm text-gray-600">CPF: {paciente.cpf} • Idade: {paciente.idade} anos</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAbrirProntuario(paciente);
                        setActiveSection('prontuario');
                      }}
                      className="flex items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      Abrir Prontuário
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
                          className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                          onClick={() => {
                            handleAbrirProntuario(paciente);
                            setActiveSection('prontuario');
                          }}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          Ver informações do paciente
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
      <div className="bg-white shadow-md rounded-lg p-6">
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
                  <SelectTrigger className="w-48 h-8 text-xs bg-white border-primary/30 cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((paciente) => (
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-primary hover:text-primary-foreground">
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="text-center mb-6">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Selecionar Paciente</h3>
                <p className="text-sm text-gray-600">Escolha um paciente para visualizar o prontuário completo</p>
              </div>
              
              <div className="max-w-md mx-auto">
                <Label htmlFor="seletorPaciente" className="block text-sm font-medium text-gray-700 mb-2">
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
                      <SelectItem key={paciente.cpf} value={paciente.nome} className="hover:bg-primary hover:text-primary-foreground cursor-pointer">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ou selecione rapidamente:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.cpf}
                    onClick={() => setPacienteSelecionado(paciente)}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{paciente.nome}</p>
                        <p className="text-sm text-gray-500">CPF: {paciente.cpf}</p>
                        <p className="text-sm text-gray-500">{paciente.idade} anos</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        paciente.statusLaudo === 'Finalizado' 
                          ? 'bg-green-100 text-green-800' 
                          : paciente.statusLaudo === 'Pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
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
          <div className="border-b border-gray-200 mb-6">
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
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

      <div className="bg-white border rounded-lg p-6 space-y-6">
        {/* Data da Consulta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dataConsulta" className="text-sm font-medium text-gray-700">
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
            <Label htmlFor="cid10" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="anamnese" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="exameFisico" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="hipotesesDiagnosticas" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="condutaMedica" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="prescricoes" className="text-sm font-medium text-gray-700">
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
          <Label htmlFor="retornoAgendado" className="text-sm font-medium text-gray-700">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
        <div className="bg-white border rounded-lg p-6">
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
                      <p className="text-xs text-gray-500">
                        Registrada em: {consulta.dataCriacao}
                      </p>
                    </div>
                    {consulta.cid10 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {consulta.cid10}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700">
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
              <p className="text-sm text-gray-600">27/09/2025 - 09:00</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Finalizada</span>
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
              <p className="text-sm text-gray-600">15/09/2025 - 14:30</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Retorno Agendado</span>
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
              <span className="text-gray-600">15/03/2010</span>
            </div>
            <div className="flex justify-between">
              <span>Colecistectomia laparoscópica</span>
              <span className="text-gray-600">22/08/2019</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Alergias e Reações Adversas</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Alergia</span>
              <span>Penicilina - reação cutânea</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Intolerância</span>
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
        <h3 className="text-lg font-semibold">Prescrições Médicas</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Prescrição
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Prescrição Atual</h4>
              <p className="text-sm text-gray-600">Prescrita em 27/09/2025</p>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ativa</span>
          </div>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Losartana 50mg</p>
                  <p className="text-sm text-gray-600">1 comprimido pela manhã</p>
                  <p className="text-sm text-gray-500">Duração: 30 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Metformina 850mg</p>
                  <p className="text-sm text-gray-600">1 comprimido após café e jantar</p>
                  <p className="text-sm text-gray-500">Duração: 60 dias</p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Prescrições Anteriores</h4>
              <p className="text-sm text-gray-600">Histórico de medicamentos</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Sinvastatina 20mg</p>
                <p className="text-gray-600">Prescrita em 15/08/2025 - Finalizada</p>
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
        <h3 className="text-lg font-semibold">Exames Solicitados</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Exames Pendentes</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded">
              <div>
                <p className="font-medium">Ecocardiograma</p>
                <p className="text-sm text-gray-600">Solicitado em 25/09/2025</p>
                <p className="text-sm text-gray-500">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pendente</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded">
              <div>
                <p className="font-medium">Hemograma Completo</p>
                <p className="text-sm text-gray-600">Solicitado em 27/09/2025</p>
                <p className="text-sm text-gray-500">Urgência: Normal</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Agendado</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Resultados Disponíveis</h4>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
              <div>
                <p className="font-medium">Glicemia de Jejum</p>
                <p className="text-sm text-gray-600">Realizado em 20/09/2025</p>
                <p className="text-sm font-medium text-green-700">Resultado: 95 mg/dL (Normal)</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
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
        <h3 className="text-lg font-semibold">Diagnósticos</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Novo Diagnóstico
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Diagnósticos Ativos</h4>
          <div className="space-y-3">
            <div className="border-l-4 border-red-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Hipertensão Arterial Sistêmica</p>
                  <p className="text-sm text-gray-600">CID-10: I10</p>
                  <p className="text-sm text-gray-500">Diagnosticado em: 15/03/2020</p>
                  <p className="text-sm mt-1">Status: Controlada com medicação</p>
                </div>
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Ativo</span>
              </div>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Diabetes Mellitus Tipo 2</p>
                  <p className="text-sm text-gray-600">CID-10: E11</p>
                  <p className="text-sm text-gray-500">Diagnosticado em: 10/08/2018</p>
                  <p className="text-sm mt-1">Status: Controlada com dieta e medicação</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Histórico de Diagnósticos</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">Gastrite Aguda</p>
                <p className="text-gray-600">CID-10: K29.0 - Resolvido em 2023</p>
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Resolvido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEvolucaoTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Evolução do Quadro</h3>
        <Button className="flex items-center gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Nova Evolução
        </Button>
      </div>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Evolução Recente</h4>
              <p className="text-sm text-gray-600">27/09/2025 - 09:15</p>
            </div>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Melhora</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm"><strong>Subjetivo:</strong> Paciente relatou diminuição significativa da dor no peito e melhora da capacidade respiratória.</p>
            <p className="text-sm"><strong>Objetivo:</strong> PA: 130/80 mmHg, FC: 72 bpm, ausculta cardíaca sem alterações.</p>
            <p className="text-sm"><strong>Avaliação:</strong> Resposta positiva ao tratamento iniciado, pressão arterial em níveis aceitáveis.</p>
            <p className="text-sm"><strong>Plano:</strong> Manter medicação atual, retorno em 30 dias.</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-medium">Evolução Anterior</h4>
              <p className="text-sm text-gray-600">15/09/2025 - 14:45</p>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Estável</span>
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
        <h3 className="text-lg font-semibold">Anexos (Exames, Imagens)</h3>
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
                  <p className="text-xs text-gray-600">20/09/2025</p>
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
                  <p className="text-xs text-gray-600">15/09/2025</p>
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
            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Laudo de Ecocardiograma</p>
                  <p className="text-xs text-gray-600">10/08/2025 - Dr. Carlos Andrade</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
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
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer">
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
    <section>
      <LaudoEditor />
    </section>
  );
// --- LaudoEditor COMPONENT ---
function LaudoEditor() {
  
  const pacientes = [
    { nome: "Ana Souza", cpf: "123.456.789-00", idade: 32, sexo: "Feminino" },
    { nome: "Bruno Lima", cpf: "987.654.321-00", idade: 45, sexo: "Masculino" },
    { nome: "Carla Menezes", cpf: "111.222.333-44", idade: 28, sexo: "Feminino" },
  ];

  const [conteudo, setConteudo] = useState("");
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [cid, setCid] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const sigCanvasRef = useRef<any>(null);
  const [laudos, setLaudos] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);

  
  const handleSelectPaciente = (paciente: any) => {
    setPacienteSelecionado(paciente);
  };

  const limparPaciente = () => setPacienteSelecionado(null);

  const salvarLaudo = (status: string) => {
    if (!pacienteSelecionado) {
      alert('Selecione um paciente.');
      return;
    }
    const novoLaudo = {
      paciente: pacienteSelecionado.nome,
      cpf: pacienteSelecionado.cpf,
      idade: pacienteSelecionado.idade,
      sexo: pacienteSelecionado.sexo,
      cid,
      conteudo,
      imagem,
      assinatura,
      data: new Date().toLocaleString(),
      status
    };
    setLaudos(prev => [novoLaudo, ...prev]);
    setPacienteSelecionado(null); setCid(""); setConteudo(""); setImagem(null); setAssinatura(null);
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-white p-2 md:p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-primary/10 shadow-lg rounded-xl p-4 md:p-6 mb-6">
          <h2 className="text-2xl font-bold text-primary mb-4 text-center tracking-tight">Laudo Médico</h2>
          
          {!pacienteSelecionado ? (
            <div className="flex flex-col items-center justify-center py-8 px-1 bg-white rounded-xl shadow-sm">
              <div className="mb-2">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="mx-auto text-gray-400">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-center text-gray-800 mb-1">Selecionar Paciente</h2>
              <p className="text-gray-500 text-center mb-4 max-w-xs text-sm">Escolha um paciente para visualizar o prontuário completo</p>
              <div className="w-full max-w-xs">
                <label htmlFor="select-paciente" className="block text-sm font-medium text-gray-700 mb-1">Escolha o paciente:</label>
                <div className="relative">
                  <select
                    id="select-paciente"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-300 focus:outline-none bg-white text-sm text-gray-900 shadow-sm transition-all appearance-none"
                    onChange={e => {
                      const p = pacientes.find(p => p.cpf === e.target.value);
                      if (p) handleSelectPaciente(p);
                    }}
                    defaultValue=""
                  >
                    <option value="" className="text-gray-400">Selecione um paciente...</option>
                    {pacientes.map(p => (
                      <option key={p.cpf} value={p.cpf}>{p.nome} - {p.cpf}</option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 14l-4-4h8l-4 4z" fill="currentColor"/></svg>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="font-bold text-primary text-base mb-0.5">{pacienteSelecionado.nome}</div>
                <div className="text-xs text-gray-700">CPF: {pacienteSelecionado.cpf}</div>
                <div className="text-xs text-gray-700">Idade: {pacienteSelecionado.idade}</div>
                <div className="text-xs text-gray-700">Sexo: {pacienteSelecionado.sexo}</div>
              </div>
              <button type="button" onClick={limparPaciente} className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-semibold shadow text-xs">Trocar paciente</button>
            </div>
          )}
          
          <form className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-primary">CID</label>
              <input
                type="text"
                value={cid}
                onChange={e => setCid(e.target.value)}
                placeholder="Ex: I10, E11, etc."
                className="w-full p-2 border border-primary/20 rounded-md focus:ring-2 focus:ring-primary/30 focus:outline-none text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-primary">Conteúdo do Laudo *</label>
              {!preview ? (
                <ReactQuill
                  value={conteudo}
                  onChange={setConteudo}
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      [{ 'size': ['small', false, 'large', 'huge'] }],
                      ['clean']
                    ]
                  }}
                  className="h-40 border border-primary/20 rounded-md text-sm"
                />
              ) : (
                <div className="border border-primary/20 p-2 rounded-md bg-muted overflow-auto">
                  <h3 className="text-base font-semibold mb-1 text-primary">Pré-visualização:</h3>
                  <div dangerouslySetInnerHTML={{ __html: conteudo }} />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-primary mb-2">Imagem (opcional)</label>
              <div className="mb-2"></div>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setImagem(reader.result as string);
                    reader.readAsDataURL(file);
                  } else {
                    setImagem(null);
                  }
                }}
                className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {imagem && (
                <img src={imagem} alt="Pré-visualização" className="mt-1 rounded-md max-h-20 border border-primary/20" />
              )}
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-primary">Assinatura Digital</label>
              <div className="bg-muted rounded-md border border-primary/20 p-2 flex flex-col items-center">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="#0f172a"
                  backgroundColor="#fff"
                  canvasProps={{ width: 220, height: 60, className: "rounded-md border bg-white shadow" }}
                  onEnd={() => setAssinatura(sigCanvasRef.current?.isEmpty() ? null : sigCanvasRef.current?.toDataURL())}
                />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => { sigCanvasRef.current?.clear(); setAssinatura(null); }} className="px-2 py-1 text-xs rounded-md bg-muted-foreground text-white hover:bg-muted font-semibold shadow">Limpar</button>
                </div>
                {assinatura && (
                  <img src={assinatura} alt="Assinatura" className="mt-2 max-h-10 border rounded-md bg-white shadow" />
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2 mt-4">
              <button
                type="button"
                onClick={() => salvarLaudo("Rascunho")}
                className="w-full md:w-1/3 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-base shadow-sm hover:bg-gray-200 transition-all border border-gray-200"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Salvar Rascunho
              </button>
              <button
                type="button"
                onClick={() => salvarLaudo("Entregue")}
                className="w-full md:w-1/3 flex items-center justify-center gap-1 bg-primary text-white py-2 rounded-lg font-semibold text-base shadow-sm hover:bg-primary/90 transition-all border border-primary/20"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2l4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Liberar Laudo
              </button>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="w-full md:w-1/3 flex items-center justify-center gap-1 bg-white text-primary py-2 rounded-lg font-semibold text-base shadow-sm hover:bg-primary/10 transition-all border border-primary/20"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 10l4.553 2.276A2 2 0 0121 14.09V17a2 2 0 01-2 2H5a2 2 0 01-2-2v-2.91a2 2 0 01.447-1.814L8 10m7-4v4m0 0l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Pré-visualizar Laudo
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white border border-primary/10 shadow-lg rounded-xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-primary mb-3 text-center">Histórico de Laudos</h3>
          {laudos.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">Nenhum laudo registrado.</p>
          ) : (
            laudos.map((laudo: any, idx: number) => (
              <div key={idx} className="border border-primary/20 rounded-2xl p-4 mb-6 bg-primary/5 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/><path d="M4 20c0-2.5 3.5-4.5 8-4.5s8 2 8 4.5" stroke="currentColor" strokeWidth="2"/></svg>
                    <span className="font-bold text-lg md:text-xl text-primary drop-shadow-sm">{laudo.paciente}</span>
                  </div>
                  <span className="text-base text-gray-500 font-medium">CPF: {laudo.cpf}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-sm text-gray-700">
                  <div>Idade: <span className="font-medium">{laudo.idade}</span></div>
                  <div>Sexo: <span className="font-medium">{laudo.sexo}</span></div>
                  <div>Status: <span className="font-medium">{laudo.status}</span></div>
                  <div>CID: <span className="font-medium">{laudo.cid}</span></div>
                  <div>Data: <span className="font-medium">{laudo.data}</span></div>
                </div>
                {laudo.assinatura && (
                  <div className="mb-2">
                    <p className="font-semibold text-primary text-sm mb-1">Assinatura Digital:</p>
                    <img src={laudo.assinatura} alt="Assinatura digital" className="rounded-lg max-h-16 border bg-white shadow" />
                  </div>
                )}
                {laudo.imagem && (
                  <div className="mb-2">
                    <p className="font-semibold text-primary text-sm mb-1">Imagem:</p>
                    <img src={laudo.imagem} alt="Imagem do laudo" className="rounded-lg max-h-20 border border-primary/20 mb-1" />
                  </div>
                )}
                <div className="mb-1">
                  <p className="font-semibold text-primary text-sm mb-1">Conteúdo:</p>
                  <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: laudo.conteudo }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

  
  const renderComunicacaoSection = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Comunicação com o Paciente</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="destinatario">Destinatário</Label>
            <Input 
              id="destinatario" 
              placeholder="Nome do Paciente ou CPF" 
              disabled 
              className="bg-muted cursor-not-allowed text-gray-700 disabled:text-gray-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipoMensagem">Tipo de mensagem</Label>
            <Select>
              <SelectTrigger id="tipoMensagem" className="hover:border-primary focus:border-primary cursor-pointer">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200">
                <SelectItem value="lembrete" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Lembrete de Consulta</SelectItem>
                <SelectItem value="resultado" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Resultado de Exame</SelectItem>
                <SelectItem value="instrucao" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Instruções Pós-Consulta</SelectItem>
                <SelectItem value="outro" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Outro</SelectItem>
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
        <h2 className="text-2xl font-bold">Relatórios Médicos</h2>
        {editandoRelatorio && (
          <Button variant="outline" onClick={handleCancelarEdicaoRelatorio}>
            Cancelar Edição
          </Button>
        )}
      </div>

      {/* Formulário de Relatório Médico */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
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
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissionalCrm">CRM e Especialidade</Label>
                <Input
                  id="profissionalCrm"
                  value={relatorioMedico.profissionalCrm}
                  disabled
                  className="bg-gray-100"
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
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Relatórios Médicos Salvos</h3>
        
        {relatoriosMedicos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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
                    <p className="text-sm text-gray-600">CPF: {relatorio.pacienteCpf} • Idade: {relatorio.pacienteIdade} anos</p>
                    <p className="text-sm text-gray-500">Data do relatório: {new Date(relatorio.dataRelatorio).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-gray-400">Gerado em: {relatorio.dataGeracao}</p>
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
                    <p className="text-gray-700 mt-1">{relatorio.motivoRelatorio}</p>
                  </div>
                  
                  {relatorio.diagnosticos && (
                    <div>
                      <span className="font-medium text-primary">Diagnóstico(s):</span>
                      <p className="text-gray-700 mt-1">{relatorio.diagnosticos}</p>
                    </div>
                  )}
                  
                  {relatorio.recomendacoes && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-primary">Recomendações:</span>
                      <p className="text-gray-700 mt-1">{relatorio.recomendacoes}</p>
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
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
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
          <h3 className="text-lg font-semibold border-b pb-2">Informações Pessoais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <p className="p-2 bg-gray-100 rounded text-gray-600">{profileData.nome}</p>
            <span className="text-xs text-gray-500">Este campo não pode ser alterado</span>
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
              <p className="p-2 bg-gray-50 rounded">{profileData.email}</p>
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
              <p className="p-2 bg-gray-50 rounded">{profileData.telefone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="crm">CRM</Label>
            <p className="p-2 bg-gray-100 rounded text-gray-600">{profileData.crm}</p>
            <span className="text-xs text-gray-500">Este campo não pode ser alterado</span>
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
              <p className="p-2 bg-gray-50 rounded">{profileData.especialidade}</p>
            )}
          </div>
        </div>

        {/* Endereço e Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Endereço e Contato</h3>
          
          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço</Label>
            {isEditingProfile ? (
              <Input
                id="endereco"
                value={profileData.endereco}
                onChange={(e) => handleProfileChange('endereco', e.target.value)}
              />
            ) : (
              <p className="p-2 bg-gray-50 rounded">{profileData.endereco}</p>
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
              <p className="p-2 bg-gray-50 rounded">{profileData.cidade}</p>
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
              <p className="p-2 bg-gray-50 rounded">{profileData.cep}</p>
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
              <p className="p-2 bg-gray-50 rounded min-h-[100px]">{profileData.biografia}</p>
            )}
          </div>
        </div>
      </div>

      {/* Foto do Perfil */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Foto do Perfil</h3>
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
              <p className="text-xs text-gray-500">
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
        return renderPacientesSection();
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
        <header className="bg-white shadow-md rounded-lg p-4 mb-6 flex items-center justify-between">
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
            className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white cursor-pointer"
          >
            Sair
          </Button>
        </header>
      
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {}
        <aside className="md:sticky md:top-8 h-fit">
          <nav className="bg-white shadow-md rounded-lg p-3 space-y-1">
            <Button 
              variant={activeSection === 'calendario' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('calendario')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </Button>
            <Button 
              variant={activeSection === 'pacientes' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('pacientes')}
            >
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </Button>
            <Button 
              variant={activeSection === 'prontuario' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('prontuario')}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Prontuário
            </Button>
            <Button 
              variant={activeSection === 'laudos' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('laudos')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Laudos
            </Button>
            <Button 
              variant={activeSection === 'comunicacao' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('comunicacao')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comunicação
            </Button>
            <Button 
              variant={activeSection === 'relatorios-medicos' ? 'default' : 'ghost'} 
              className="w-full justify-start hover:bg-primary hover:text-primary-foreground cursor-pointer"
              onClick={() => setActiveSection('relatorios-medicos')}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Relatórios Médicos
            </Button>
            <Button 
              variant={activeSection === 'perfil' ? 'default' : 'ghost'} 
              className="w-full justify-start cursor-pointer hover:bg-primary hover:text-primary-foreground cursor-pointer"
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

          <div className="bg-white p-6 rounded-lg w-96 border border-black">

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
          <div className="bg-white p-6 rounded-lg w-96">
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