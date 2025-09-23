"use client";

import React, { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
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
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Clock } from "lucide-react"
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
  identificacao: "CRM 000000 • Cardiologia",
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
  const { logout, userEmail } = useAuth();
  const [activeSection, setActiveSection] = useState('calendario');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  
  // Estados para o perfil do médico
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: "Dr. Carlos Andrade",
    email: userEmail || "carlos.andrade@hospital.com",
    telefone: "(11) 99999-9999",
    endereco: "Rua das Flores, 123 - Centro",
    cidade: "São Paulo",
    cep: "01234-567",
    crm: "CRM 000000",
    especialidade: "Cardiologia",
    biografia: "Médico cardiologista com mais de 15 anos de experiência em cirurgias cardíacas e tratamentos preventivos."
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
      type: "Rotina",
      time: "10:30",
      date: new Date().toISOString().split('T')[0], 
      pacienteId: "987.654.321-00",
      color: colorsByType.Rotina
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

  
  const renderPacientesSection = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Gerenciamento de Pacientes</h2>
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
  );

  
  const renderProntuarioSection = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Prontuário do Paciente</h2>
      {pacienteSelecionado && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-primary">Dados do Paciente</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFecharProntuario}
              className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
      <div className="space-y-6">
        <div>
          <Label htmlFor="dataConsulta">Data da consulta</Label>
          <p id="dataConsulta" className="text-sm text-muted-foreground">
            03/09/2025
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cid10">CID-10</Label>
            <Input id="cid10" placeholder="Insira o código CID-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retornoAgendado">Retorno Agendado</Label>
            <Input id="retornoAgendado" type="date" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="anamnese">Anamnese</Label>
          <Textarea id="anamnese" placeholder="Descreva a anamnese do paciente" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exameFisico">Exame Físico</Label>
          <Textarea id="exameFisico" placeholder="Descreva o exame físico" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hipoteses">Hipóteses Diagnósticas</Label>
          <Textarea id="hipoteses" placeholder="Liste as hipóteses diagnósticas" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="conduta">Conduta Médica</Label>
          <Textarea id="conduta" placeholder="Descreva a conduta médica" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prescricoes">Prescrições</Label>
          <Textarea id="prescricoes" placeholder="Insira as prescrições" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar Informações</Button>
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
  const [conteudo, setConteudo] = useState("");
  const [paciente, setPaciente] = useState("");
  const [cpf, setCpf] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const sigCanvasRef = useRef<any>(null);
  const [idade, setIdade] = useState("");
  const [sexo, setSexo] = useState("");
  const [cid, setCid] = useState("");
  const [laudos, setLaudos] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);

  const salvarLaudo = (status: string) => {
    const novoLaudo = {
      paciente,
      cpf,
      idade,
      sexo,
      cid,
      conteudo,
      imagem,
      assinatura,
      data: new Date().toLocaleString(),
      status
    };
    setLaudos(prev => [novoLaudo, ...prev]);
    setPaciente(""); setCpf(""); setIdade(""); setSexo(""); setCid(""); setConteudo(""); setImagem(null); setAssinatura(null);
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  return (
    <div className="min-h-screen bg-muted p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md w-full md:w-1/3 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-primary text-center mb-4">Informações do Paciente</h2>
          <input type="text" placeholder="Nome do paciente" value={paciente} onChange={e => setPaciente(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
          <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
          <input type="number" placeholder="Idade" value={idade} onChange={e => setIdade(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
          <select value={sexo} onChange={e => setSexo(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none">
            <option value="">Sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
          <input type="text" placeholder="CID" value={cid} onChange={e => setCid(e.target.value)} className="p-3 border rounded-md focus:ring-2 focus:ring-primary/50 focus:outline-none"/>
          <div>
            <label className="block mb-1 font-medium text-primary">Imagem (opcional)</label>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setImagem(reader.result as string);
                reader.readAsDataURL(file);
              } else {
                setImagem(null);
              }
            }} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
            {imagem && (
              <img src={imagem} alt="Pré-visualização" className="mt-2 rounded-md max-h-32 border" />
            )}
          </div>
          <div>
            <label className="block mb-1 font-medium text-primary">Assinatura Digital</label>
            <div className="bg-muted rounded-md border p-2 flex flex-col items-center">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="#0f172a"
                backgroundColor="#fff"
                canvasProps={{ width: 300, height: 100, className: "rounded border bg-white" }}
                onEnd={() => setAssinatura(sigCanvasRef.current?.isEmpty() ? null : sigCanvasRef.current?.toDataURL())}
              />
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => { sigCanvasRef.current?.clear(); setAssinatura(null); }} className="px-3 py-1 text-xs rounded bg-muted-foreground text-white hover:bg-muted">Limpar</button>
                <button type="button" onClick={() => setAssinatura(sigCanvasRef.current?.toDataURL())} className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90">Salvar Assinatura</button>
              </div>
              {assinatura && (
                <img src={assinatura} alt="Assinatura" className="mt-2 max-h-16 border rounded bg-white" />
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={() => salvarLaudo("Rascunho")} className="w-1/2 bg-muted-foreground text-white py-2 rounded-md hover:bg-muted">Salvar Rascunho</button>
            <button type="button" onClick={() => salvarLaudo("Entregue")} className="w-1/2 bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90">Liberar Laudo</button>
          </div>
          <button type="button" onClick={() => setPreview(!preview)} className="mt-2 w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90">Pré-visualizar Laudo</button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md w-full md:w-2/3 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-primary text-center mb-4">Editor de Laudo</h2>
          {!preview ? (
            <ReactQuill value={conteudo} onChange={setConteudo} modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{'list': 'ordered'}, {'list': 'bullet'}],
                [{'align': []}],
                [{'size': ['small', false, 'large', 'huge']}],
                ['clean']
              ]
            }} className="h-64"/>
          ) : (
            <div className="border p-4 rounded-md bg-muted overflow-auto">
              <h3 className="text-lg font-semibold mb-2">Pré-visualização:</h3>
              <div dangerouslySetInnerHTML={{__html: conteudo}} />
            </div>
          )}
          <div className="mt-6">
            <h3 className="text-xl font-bold text-primary mb-4 text-center">Histórico de Laudos</h3>
            {laudos.length === 0 ? (
              <p className="text-muted-foreground text-center">Nenhum laudo registrado.</p>
            ) : (
              laudos.map((laudo: any, idx: number) => (
                <div key={idx} className="border border-primary/20 rounded-lg p-4 mb-4 bg-muted shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <p className="font-semibold text-primary-foreground">{laudo.paciente}</p>
                    <p className="text-muted-foreground">CPF: {laudo.cpf}</p>
                    <p className="text-muted-foreground">Idade: {laudo.idade}</p>
                    <p className="text-muted-foreground">Sexo: {laudo.sexo}</p>
                    <p className="text-muted-foreground">CID: {laudo.cid}</p>
                    <p className="text-muted-foreground">Status: {laudo.status}</p>
                    <p className="text-muted-foreground">Data: {laudo.data}</p>
                  </div>
                  {laudo.imagem && (
                    <div className="mb-2">
                      <p className="font-semibold text-primary">Imagem:</p>
                      <img src={laudo.imagem} alt="Imagem do laudo" className="rounded-md max-h-32 border mb-2" />
                    </div>
                  )}
                  {laudo.assinatura && (
                    <div className="mb-2">
                      <p className="font-semibold text-primary">Assinatura Digital:</p>
                      <img src={laudo.assinatura} alt="Assinatura digital" className="rounded-md max-h-16 border bg-white" />
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="font-semibold text-primary">Conteúdo:</p>
                    <div dangerouslySetInnerHTML={{__html: laudo.conteudo}}/>
                  </div>
                </div>
              ))
            )}
          </div>
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
      case 'perfil':
        return renderPerfilSection();
      default:
        return renderCalendarioSection();
    }
  };

  return (
    <ProtectedRoute requiredUserType="profissional">
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
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate">Logado como: {userEmail}</p>
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