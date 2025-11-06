"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import SignatureCanvas from "react-signature-canvas";
import Link from "next/link";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { buscarPacientes, listarPacientes, buscarPacientePorId, buscarPacientesPorIds, buscarMedicoPorId, buscarMedicosPorIds, buscarMedicos, listarAgendamentos, type Paciente, buscarRelatorioPorId, atualizarMedico } from "@/lib/api";
import { useReports } from "@/hooks/useReports";
import { CreateReportData } from "@/types/report-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList, Plus, Edit, ChevronLeft, ChevronRight, Clock, FileCheck, Upload, Download, Eye, History, Stethoscope, Pill, Activity, Search } from "lucide-react"
import { Calendar as CalendarIcon, FileText, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


import dynamic from "next/dynamic";
import { ENV_CONFIG } from '@/lib/env-config';
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { PatientRegistrationForm } from "@/components/features/forms/patient-registration-form";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

// pacientes will be loaded inside the component (hooks must run in component body)

// removed static medico placeholder; will load real profile for logged-in user


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

  // Normaliza número de telefone para E.164 básico (prioriza +55 quando aplicável)
  const normalizePhoneNumber = (raw?: string) => {
    if (!raw || typeof raw !== 'string') return '';
    // Remover tudo que não for dígito
    const digits = raw.replace(/\D+/g, '');
    if (!digits) return '';
    // Já tem código de país (começa com 55)
    if (digits.startsWith('55') && digits.length >= 11) return '+' + digits;
    // Se tiver 10 ou 11 dígitos (DDD + número), assume Brasil e prefixa +55
    if (digits.length === 10 || digits.length === 11) return '+55' + digits;
    // Se tiver outros formatos pequenos, apenas prefixa +
    return '+' + digits;
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
  const { logout, user, token } = useAuth();
  const [activeSection, setActiveSection] = useState('calendario');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  
  // Estados para edição de laudo
  const [isEditingLaudoForPatient, setIsEditingLaudoForPatient] = useState(false);
  const [patientForLaudo, setPatientForLaudo] = useState<any>(null);
  
  // Estados para o perfil do médico
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  // Removemos o placeholder extenso — inicializamos com valores minimalistas e vazios.
  const [profileData, setProfileData] = useState({
    nome: '',
    email: user?.email || '',
    telefone: '',
    endereco: '',
    cidade: '',
    cep: '',
    crm: '',
    especialidade: '',
  // biografia field removed — not present in Medico records
    fotoUrl: ''
  });

  // pacientes carregados dinamicamente (hooks devem ficar dentro do componente)
  const [pacientes, setPacientes] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user || !user.id) {
          if (mounted) setPacientes([]);
          return;
        }

        const assignmentsMod = await import('@/lib/assignment');
        if (!assignmentsMod || typeof assignmentsMod.listAssignmentsForUser !== 'function') {
          if (mounted) setPacientes([]);
          return;
        }

        const assignments = await assignmentsMod.listAssignmentsForUser(user.id || '');
        const patientIds = Array.isArray(assignments) ? assignments.map((a:any) => String(a.patient_id)).filter(Boolean) : [];
        if (!patientIds.length) {
          if (mounted) setPacientes([]);
          return;
        }

        const patients = await buscarPacientesPorIds(patientIds);
        const normalized = (patients || []).map((p: any) => ({
          ...p,
          nome: p.full_name ?? (p as any).nome ?? '',
          cpf: p.cpf ?? '',
          idade: getPatientAge(p) // preencher idade para a tabela de pacientes
        }));
        if (mounted) setPacientes(normalized);
      } catch (err) {
        console.warn('[ProfissionalPage] falha ao carregar pacientes atribuídos:', err);
        if (mounted) setPacientes([]);
      }
    })();
    return () => { mounted = false; };
    // Re-run when user id becomes available so patients assigned to the logged-in doctor are loaded
  }, [user?.id]);

  // Carregar perfil do médico correspondente ao usuário logado
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user || !user.email) return;
        // Tenta buscar médicos pelo email do usuário (buscarMedicos lida com queries por email)
        const docs = await buscarMedicos(user.email);
        if (!mounted) return;
        if (Array.isArray(docs) && docs.length > 0) {
          // preferir registro cujo user_id bate com user.id
          let chosen = docs.find(d => String((d as any).user_id) === String(user.id)) || docs[0];
          if (chosen) {
            // store the doctor's id so we can update it later
            try { setDoctorId((chosen as any).id ?? null); } catch {};
            // Especialidade pode vir como 'specialty' (inglês), 'especialidade' (pt),
            // ou até uma lista/array. Normalizamos para string.
            const rawSpecialty = (chosen as any).specialty ?? (chosen as any).especialidade ?? (chosen as any).especialidades ?? (chosen as any).especiality;
            let specialtyStr = '';
            if (Array.isArray(rawSpecialty)) {
              specialtyStr = rawSpecialty.join(', ');
            } else if (rawSpecialty) {
              specialtyStr = String(rawSpecialty);
            }

            // Foto pode vir como 'foto_url' ou 'fotoUrl' ou 'avatar_url'
            const foto = (chosen as any).foto_url || (chosen as any).fotoUrl || (chosen as any).avatar_url || '';

            setProfileData((prev) => ({
              ...prev,
              nome: (chosen as any).full_name || (chosen as any).nome_social || prev.nome || user?.email?.split('@')[0] || '',
              email: (chosen as any).email || user?.email || prev.email,
              telefone: (chosen as any).phone_mobile || (chosen as any).celular || (chosen as any).telefone || (chosen as any).phone || (chosen as any).mobile || (user as any)?.user_metadata?.phone || prev.telefone,
              endereco: (chosen as any).street || (chosen as any).endereco || prev.endereco,
              cidade: (chosen as any).city || (chosen as any).cidade || prev.cidade,
              cep: (chosen as any).cep || prev.cep,
              // store raw CRM (only the number) to avoid double-prefixing when rendering
              crm: (chosen as any).crm ? String((chosen as any).crm).replace(/^(?:CRM\s*)+/i, '').trim() : (prev.crm || ''),
              especialidade: specialtyStr || prev.especialidade || '',
              // biografia removed: prefer to ignore observacoes/curriculo_url here
              // (if needed elsewhere, render directly from chosen.observacoes)
              fotoUrl: foto || prev.fotoUrl || ''
            }));
          }
        }
      } catch (e) {
        console.warn('[ProfissionalPage] falha ao carregar perfil do médico pelo email:', e);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, user?.id]);



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

  
  
  const [events, setEvents] = useState<any[]>([]);
  // Load real appointments for the logged in doctor and map to calendar events
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If we already have a doctorId (set earlier), use it. Otherwise try to resolve from the logged user
        let docId = doctorId;
        if (!docId && user && user.email) {
          // buscarMedicos may return the doctor's record including id
          try {
            const docs = await buscarMedicos(user.email).catch(() => []);
            if (Array.isArray(docs) && docs.length > 0) {
              const chosen = docs.find(d => String((d as any).user_id) === String(user.id)) || docs[0];
              docId = (chosen as any)?.id ?? null;
              if (mounted && !doctorId) setDoctorId(docId);
            }
          } catch (e) {
            // ignore
          }
        }

        if (!docId) {
          // nothing to fetch yet
          return;
        }

        // Fetch appointments for this doctor. We'll ask for future and recent past appointments
        // using a simple filter: doctor_id=eq.<docId>&order=scheduled_at.asc&limit=200
        const qs = `?select=*&doctor_id=eq.${encodeURIComponent(String(docId))}&order=scheduled_at.asc&limit=200`;
        const appts = await listarAgendamentos(qs).catch(() => []);

        if (!mounted) return;

        // Enrich appointments with patient names (batch fetch) and map to UI events
        const patientIds = Array.from(new Set((appts || []).map((x:any) => String(x.patient_id || x.patient_id_raw || '').trim()).filter(Boolean)));
        let patientMap = new Map<string, any>();
        if (patientIds.length) {
          try {
            const patients = await buscarPacientesPorIds(patientIds).catch(() => []);
            for (const p of patients || []) {
              if (p && p.id) patientMap.set(String(p.id), p);
            }
          } catch (e) {
            console.warn('[ProfissionalPage] falha ao buscar pacientes para eventos:', e);
          }
        }

        const mapped = (appts || []).map((a: any, idx: number) => {
          const scheduled = a.scheduled_at || a.time || a.created_at || null;
          // Use local date components to avoid UTC shift when showing the appointment day/time
          let datePart = new Date().toISOString().split('T')[0];
          let timePart = '';
          if (scheduled) {
            try {
              const d = new Date(scheduled);
              // build local date string YYYY-MM-DD using local getters
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              datePart = `${y}-${m}-${day}`;
              timePart = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            } catch (e) {
              // ignore
            }
          }

          const pid = a.patient_id || a.patient || a.patient_id_raw || a.patientId || null;
          const patientObj = pid ? patientMap.get(String(pid)) : null;
          const patientName = patientObj?.full_name || a.patient || a.patient_name || String(pid) || 'Paciente';
          const patientIdVal = pid || null;

          return {
            id: a.id ?? `srv-${idx}-${String(a.scheduled_at || a.created_at || idx)}`,
            title: patientName || 'Paciente',
            type: a.appointment_type || 'Consulta',
            time: timePart || '',
            date: datePart,
            pacienteId: patientIdVal,
            color: colorsByType[a.specialty as keyof typeof colorsByType] || '#4dabf7',
            raw: a,
          };
        });

        setEvents(mapped);

        // Helper: parse 'YYYY-MM-DD' into a local Date to avoid UTC parsing which can shift day
        const parseYMDToLocal = (ymd?: string) => {
          if (!ymd || typeof ymd !== 'string') return new Date();
          const parts = ymd.split('-').map(Number);
          if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return new Date(ymd);
          const [y, m, d] = parts;
          return new Date(y, (m || 1) - 1, d || 1);
        };

        // Set calendar view to nearest upcoming appointment (or today)
        try {
          const now = Date.now();
          const upcoming = mapped.find((m:any) => {
            if (!m.raw) return false;
            const s = m.raw.scheduled_at || m.raw.time || m.raw.created_at;
            if (!s) return false;
            const t = new Date(s).getTime();
            return !isNaN(t) && t >= now;
          });
          if (upcoming) {
            setCurrentCalendarDate(parseYMDToLocal(upcoming.date));
          } else if (mapped.length) {
            // fallback: show the date of the first appointment
            setCurrentCalendarDate(parseYMDToLocal(mapped[0].date));
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.warn('[ProfissionalPage] falha ao carregar agendamentos do servidor:', err);
        // Keep mocked/empty events if fetch fails
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
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

  const [commPhoneNumber, setCommPhoneNumber] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [commPatientId, setCommPatientId] = useState<string | null>(null);
  const [smsSending, setSmsSending] = useState(false);

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  setSmsSending(true);
    try {
      // Validate required fields
      if (!commPhoneNumber || !commPhoneNumber.trim()) throw new Error('O campo phone_number é obrigatório');
      if (!commMessage || !commMessage.trim()) throw new Error('O campo message é obrigatório');

      const payload: any = { phone_number: commPhoneNumber.trim(), message: commMessage.trim() };
      if (commPatientId) payload.patient_id = commPatientId;

  const headers: Record<string,string> = { 'Content-Type': 'application/json' };
  // include any default headers from ENV_CONFIG if present (e.g. apikey)
  if ((ENV_CONFIG as any)?.DEFAULT_HEADERS) Object.assign(headers, (ENV_CONFIG as any).DEFAULT_HEADERS);
  // include Authorization if we have a token (user session)
  if (token) headers['Authorization'] = `Bearer ${token}`;

      // Ensure apikey is present (frontend only has ANON key in this project)
      if (!headers.apikey && (ENV_CONFIG as any)?.SUPABASE_ANON_KEY) {
        headers.apikey = (ENV_CONFIG as any).SUPABASE_ANON_KEY;
      }
      // Ensure Accept header
      headers['Accept'] = 'application/json';

      // Normalizar número antes de enviar (E.164 básico)
      const normalized = normalizePhoneNumber(commPhoneNumber);
      if (!normalized) throw new Error('Número inválido após normalização');
      payload.phone_number = normalized;

      // Debug: log payload and headers with secrets masked to help diagnose issues
      try {
        const masked = { ...headers } as Record<string, any>;
        if (masked.apikey && typeof masked.apikey === 'string') masked.apikey = `${masked.apikey.slice(0,4)}...${masked.apikey.slice(-4)}`;
        if (masked.Authorization) masked.Authorization = 'Bearer <<token-present>>';
        console.debug('[ProfissionalPage] Enviando SMS -> url:', `${(ENV_CONFIG as any).SUPABASE_URL}/functions/v1/send-sms`, 'payload:', payload, 'headers(masked):', masked);
      } catch (e) {
        // ignore logging errors
      }

      const res = await fetch(`${(ENV_CONFIG as any).SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        // If server returned 5xx and we sent a patient_id, try a single retry without patient_id
        if (res.status >= 500 && payload.patient_id) {
          try {
            const fallback = { phone_number: payload.phone_number, message: payload.message };
            console.debug('[ProfissionalPage] 5xx ao enviar com patient_id — tentando reenviar sem patient_id', { fallback });
            const retryRes = await fetch(`${(ENV_CONFIG as any).SUPABASE_URL}/functions/v1/send-sms`, {
              method: 'POST',
              headers,
              body: JSON.stringify(fallback),
            });
            const retryBody = await retryRes.json().catch(() => null);
            if (retryRes.ok) {
              alert('SMS enviado com sucesso (sem patient_id)');
              setCommPhoneNumber('');
              setCommMessage('');
              setCommPatientId(null);
              return;
            } else {
              throw new Error(retryBody?.message || retryBody?.error || `Erro ao enviar SMS (retry ${retryRes.status})`);
            }
          } catch (retryErr) {
            console.warn('[ProfissionalPage] Reenvio sem patient_id falhou', retryErr);
            throw new Error(body?.message || body?.error || `Erro ao enviar SMS (${res.status})`);
          }
        }
        throw new Error(body?.message || body?.error || `Erro ao enviar SMS (${res.status})`);
      }

      // success feedback
      alert('SMS enviado com sucesso');
      // clear fields
      setCommPhoneNumber('');
      setCommMessage('');
      setCommPatientId(null);
    } catch (err: any) {
      alert(String(err?.message || err || 'Falha ao enviar SMS'));
    } finally {
      setSmsSending(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    (async () => {
      if (!doctorId) {
        alert('Não foi possível localizar o registro do médico para atualizar.');
        setIsEditingProfile(false);
        return;
      }

      // Build payload mapping UI fields to DB columns
      const payload: any = {};
      if (profileData.email) payload.email = profileData.email;
      if (profileData.telefone) payload.phone_mobile = profileData.telefone;
      if (profileData.endereco) payload.street = profileData.endereco;
      if (profileData.cidade) payload.city = profileData.cidade;
      if (profileData.cep) payload.cep = profileData.cep;
      if (profileData.especialidade) payload.specialty = profileData.especialidade || profileData.especialidade;
      if (profileData.fotoUrl) payload.foto_url = profileData.fotoUrl;

      // Don't allow updating full_name or crm from this UI

      try {
        const updated = await atualizarMedico(doctorId, payload as any);
        console.debug('[ProfissionalPage] médico atualizado:', updated);
        alert('Perfil atualizado com sucesso!');
      } catch (err: any) {
        console.error('[ProfissionalPage] falha ao atualizar médico:', err);
        // Mostrar mensagem amigável (o erro já é tratado em lib/api)
        alert(err?.message || 'Falha ao atualizar perfil. Verifique logs.');
      } finally {
        setIsEditingProfile(false);
      }
    })();
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
              className="p-2 hover:bg-primary! hover:text-white! cursor-pointer transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-medium text-foreground">
              {formatDate(currentCalendarDate)}
            </h3>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-primary! hover:text-white! cursor-pointer transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
          </div>
          <div className="text-sm text-gray-600 dark:text-muted-foreground">
            {todayEvents.length} consulta{todayEvents.length !== 1 ? 's' : ''} agendada{todayEvents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Pacientes do Dia */}
        <div className="space-y-4 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
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

  const { reports, loadReports, loadReportById, loading: reportsLoading, createNewReport, updateExistingReport } = useReports();
    const [laudos, setLaudos] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<'todos'|'semana'|'mes'|'custom'>('mes');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // helper to check if a date string is in range
    const isInRange = (dateStr: string | undefined, range: 'todos'|'semana'|'mes'|'custom') => {
      if (range === 'todos') return true;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      
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

    // helper: ensure report has paciente object populated (fetch by id if necessary)
    const ensurePaciente = async (report: any) => {
      if (!report) return report;
      try {
        if (!report.paciente) {
          const pid = report.patient_id ?? report.patient ?? report.paciente ?? null;
          if (pid) {
            try {
              const p = await buscarPacientePorId(String(pid));
              if (p) report.paciente = p;
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (e) {
        // ignore
      }
      return report;
    };

    // When selectedRange changes (and isn't custom), compute start/end dates
    useEffect(() => {
      const now = new Date();
      if (selectedRange === 'todos') {
        setStartDate(null);
        setEndDate(null);
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
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Todos
          </Button>
          <Button
            variant={selectedRange === 'semana' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('semana')}
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Semana
          </Button>
          <Button
            variant={selectedRange === 'mes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRange('mes')}
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Mês
          </Button>
        </>
      );
    }

    // SearchBox inserido aqui para acessar reports, setLaudos e loadReports
    function SearchBox() {
      const [searchTerm, setSearchTerm] = useState('');
      const [searching, setSearching] = useState(false);
      const { token } = useAuth();

      const isMaybeId = (s: string) => {
        const t = s.trim();
        if (!t) return false;
        if (t.includes('-') && t.length > 10) return true;
        if (t.toUpperCase().startsWith('REL-')) return true;
        const digits = t.replace(/\D/g, '');
        if (digits.length >= 8) return true;
        return false;
      };

      const doSearch = async () => {
        const term = searchTerm.trim();
        if (!term) return;
        setSearching(true);
        try {
          if (isMaybeId(term)) {
            try {
              let r: any = null;
              // Try direct API lookup first
              try {
                r = await buscarRelatorioPorId(term);
              } catch (e) {
                console.warn('[SearchBox] buscarRelatorioPorId failed, will try loadReportById fallback', e);
              }

              // Fallback: use hook loader if direct API didn't return
              if (!r) {
                try {
                  r = await loadReportById(term);
                } catch (e) {
                  console.warn('[SearchBox] loadReportById fallback failed', e);
                }
              }

              if (r) {
                // If token exists, attempt batch enrichment like useReports
                const enriched: any = { ...r };

                // Collect possible patient/doctor ids from payload
                const pidCandidates: string[] = [];
                const didCandidates: string[] = [];
                const pid = (r as any).patient_id ?? (r as any).patient ?? (r as any).paciente ?? null;
                if (pid) pidCandidates.push(String(pid));
                const possiblePatientName = (r as any).patient_name ?? (r as any).patient_full_name ?? (r as any).paciente?.full_name ?? (r as any).paciente?.nome ?? null;
                if (possiblePatientName) {
                  enriched.paciente = enriched.paciente ?? {};
                  enriched.paciente.full_name = possiblePatientName;
                }

                const did = (r as any).requested_by ?? (r as any).created_by ?? (r as any).executante ?? null;
                if (did) didCandidates.push(String(did));

                // If token available, perform batch fetch to get full patient/doctor objects
                if (token) {
                  try {
                    if (pidCandidates.length) {
                      const patients = await buscarPacientesPorIds(pidCandidates);
                      if (patients && patients.length) {
                        const p = patients[0];
                        enriched.paciente = enriched.paciente ?? {};
                        enriched.paciente.full_name = enriched.paciente.full_name || p.full_name || (p as any).nome;
                        enriched.paciente.id = enriched.paciente.id || p.id;
                        enriched.paciente.cpf = enriched.paciente.cpf || p.cpf;
                      }
                    }
                    if (didCandidates.length) {
                      const doctors = await buscarMedicosPorIds(didCandidates);
                      if (doctors && doctors.length) {
                        const d = doctors[0];
                        enriched.executante = enriched.executante || d.full_name || (d as any).nome;
                      }
                    }
                  } catch (e) {
                    // fallback: continue with payload-only enrichment
                    console.warn('[SearchBox] batch enrichment failed, falling back to payload-only enrichment', e);
                  }
                }

                // Final payload-only fallbacks (ensure id/cpf/order_number are populated)
                const possiblePatientId = (r as any).paciente?.id ?? (r as any).patient?.id ?? (r as any).patient_id ?? (r as any).patientId ?? (r as any).id ?? undefined;
                if (possiblePatientId && !enriched.paciente?.id) {
                  enriched.paciente = enriched.paciente ?? {};
                  enriched.paciente.id = possiblePatientId;
                }
                const possibleCpf = (r as any).patient_cpf ?? (r as any).paciente?.cpf ?? (r as any).patient?.cpf ?? null;
                if (possibleCpf) {
                  enriched.paciente = enriched.paciente ?? {};
                  enriched.paciente.cpf = possibleCpf;
                }
                const execName = (r as any).requested_by_name ?? (r as any).requester_name ?? (r as any).requestedByName ?? (r as any).executante_name ?? (r as any).created_by_name ?? (r as any).createdByName ?? (r as any).executante ?? (r as any).requested_by ?? (r as any).created_by ?? '';
                if (execName) enriched.executante = enriched.executante || execName;
                if ((r as any).order_number) enriched.order_number = (r as any).order_number;

                setLaudos([enriched]);
                return;
              }
            } catch (err: any) {
              console.warn('Relatório não encontrado por ID:', err);
            }
          }

          const lower = term.toLowerCase();
          const filtered = (reports || []).filter((x: any) => {
            const name = (x.paciente?.full_name || x.patient_name || x.patient_full_name || x.order_number || x.exame || x.exam || '').toString().toLowerCase();
            return name.includes(lower);
          });
          if (filtered.length) setLaudos(filtered);
          else setLaudos([]);
        } finally {
          setSearching(false);
        }
      };

      const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') doSearch();
      };

      const handleClear = async () => {
        setSearchTerm('');
        try {
          // Reuse the same logic as initial load so Clear restores the doctor's assigned laudos
          await loadAssignedLaudos();
        } catch (err) {
          console.warn('[SearchBox] erro ao restaurar laudos do médico ao limpar busca:', err);
          // Safe fallback to whatever reports are available
          setLaudos(reports || []);
        }
      };

      return (
        <div>
          <div className="relative">
            <Input
              placeholder="Buscar paciente / pedido / ID"
              className="pl-10 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKey}
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button size="sm" onClick={doSearch} disabled={searching}>
              Buscar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClear} className="hover:bg-primary! hover:text-white! transition-colors">
              Limpar
            </Button>
          </div>
        </div>
      );
    }

    // helper to load laudos for the patients assigned to the logged-in user
    const loadAssignedLaudos = async () => {
      try {
        const assignments = await import('@/lib/assignment').then(m => m.listAssignmentsForUser(user?.id || ''));
        const patientIds = Array.isArray(assignments) ? assignments.map(a => String(a.patient_id)).filter(Boolean) : [];

        if (patientIds.length === 0) {
          setLaudos([]);
          return;
        }

        try {
          const reportsMod = await import('@/lib/reports');
          if (typeof reportsMod.listarRelatoriosPorPacientes === 'function') {
            const batch = await reportsMod.listarRelatoriosPorPacientes(patientIds);
            const mineOnly = (batch || []).filter((r: any) => {
              const requester = ((r.requested_by ?? r.created_by ?? r.executante ?? r.requestedBy ?? r.createdBy) || '').toString();
              return user?.id && requester && requester === user.id;
            });

            const enriched = await (async (reportsArr: any[]) => {
              if (!reportsArr || !reportsArr.length) return reportsArr;
              const pids = reportsArr.map(r => String(getReportPatientId(r))).filter(Boolean);
              if (!pids.length) return reportsArr;
              try {
                const patients = await buscarPacientesPorIds(pids);
                const map = new Map((patients || []).map((p: any) => [String(p.id), p]));
                return reportsArr.map((r: any) => {
                  const pid = String(getReportPatientId(r));
                  return { ...r, paciente: r.paciente ?? map.get(pid) ?? r.paciente } as any;
                });
              } catch (e) {
                return reportsArr;
              }
            })(mineOnly);
            setLaudos(enriched || []);
            return;
          } else {
            const allReports: any[] = [];
            for (const pid of patientIds) {
              try {
                const rels = await import('@/lib/reports').then(m => m.listarRelatoriosPorPaciente(pid));
                if (Array.isArray(rels) && rels.length) {
                  const mine = rels.filter((r: any) => {
                    const requester = ((r.requested_by ?? r.created_by ?? r.executante ?? r.requestedBy ?? r.createdBy) || '').toString();
                    return user?.id && requester && requester === user.id;
                  });
                  if (mine.length) allReports.push(...mine);
                }
              } catch (err) {
                console.warn('[LaudoManager] falha ao carregar relatórios para paciente', pid, err);
              }
            }

            const enrichedAll = await (async (reportsArr: any[]) => {
              if (!reportsArr || !reportsArr.length) return reportsArr;
              const pids = reportsArr.map(r => String(getReportPatientId(r))).filter(Boolean);
              if (!pids.length) return reportsArr;
              try {
                const patients = await buscarPacientesPorIds(pids);
                const map = new Map((patients || []).map((p: any) => [String(p.id), p]));
                return reportsArr.map((r: any) => ({ ...r, paciente: r.paciente ?? map.get(String(getReportPatientId(r))) ?? r.paciente } as any));
              } catch (e) {
                return reportsArr;
              }
            })(allReports);
            setLaudos(enrichedAll);
            return;
          }
        } catch (err) {
          console.warn('[LaudoManager] erro ao carregar relatórios em batch, tentando por paciente individual', err);
          const allReports: any[] = [];
          for (const pid of patientIds) {
            try {
              const rels = await import('@/lib/reports').then(m => m.listarRelatoriosPorPaciente(pid));
              if (Array.isArray(rels) && rels.length) {
                const mine = rels.filter((r: any) => {
                  const requester = ((r.requested_by ?? r.created_by ?? r.executante ?? r.requestedBy ?? r.createdBy) || '').toString();
                  return user?.id && requester && requester === user.id;
                });
                if (mine.length) allReports.push(...mine);
              }
            } catch (e) {
              console.warn('[LaudoManager] falha ao carregar relatórios para paciente', pid, e);
            }
          }
          const enrichedAll = await (async (reportsArr: any[]) => {
            if (!reportsArr || !reportsArr.length) return reportsArr;
            const pids = reportsArr.map(r => String(getReportPatientId(r))).filter(Boolean);
            if (!pids.length) return reportsArr;
            try {
              const patients = await buscarPacientesPorIds(pids);
              const map = new Map((patients || []).map((p: any) => [String(p.id), p]));
              return reportsArr.map((r: any) => ({ ...r, paciente: r.paciente ?? map.get(String(getReportPatientId(r))) ?? r.paciente } as any));
            } catch (e) {
              return reportsArr;
            }
          })(allReports);
          setLaudos(enrichedAll);
          return;
        }
      } catch (e) {
        console.warn('[LaudoManager] erro ao carregar laudos para pacientes atribuídos:', e);
        setLaudos(reports || []);
      }
    };

    // carregar laudos ao montar - somente dos pacientes atribuídos ao médico logado
    useEffect(() => {
      let mounted = true;
      (async () => {
        // call the helper and bail if the component unmounted during async work
        await loadAssignedLaudos();
      })();
      return () => { mounted = false; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // sincroniza quando reports mudarem no hook (fallback)
    useEffect(() => {
      if (!laudos || laudos.length === 0) setLaudos(reports || []);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

      // Sort reports newest-first (more recent dates at the top)
      const sortedLaudos = React.useMemo(() => {
        const arr = (filteredLaudos || []).slice();
        arr.sort((a: any, b: any) => {
          try {
            const da = new Date(getReportDate(a) || 0).getTime() || 0;
            const db = new Date(getReportDate(b) || 0).getTime() || 0;
            return db - da;
          } catch (e) {
            return 0;
          }
        });
        return arr;
      }, [filteredLaudos]);

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
              <p className="text-muted-foreground">Nesta seção você pode gerenciar todos os laudos gerados.</p>
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
                {/* Search input integrado com busca por ID */}
                <SearchBox />
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <CalendarIcon className="w-4 h-4" />
                  <Input type="date" value={startDate ?? ''} onChange={(e) => { setStartDate(e.target.value); setSelectedRange('custom'); }} className="p-1 text-sm h-10" />
                  <span className="inline-flex items-center px-1 text-sm">-</span>
                  <Input type="date" value={endDate ?? ''} onChange={(e) => { setEndDate(e.target.value); setSelectedRange('custom'); }} className="p-1 text-sm h-10" />
                </div>
              </div>

              <div className="flex gap-2 items-center">
                {/* date range buttons: Semana / Mês */}
                <DateRangeButtons />
              </div>

              {/* Filtros e pesquisa removidos por solicitação */}
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
                  {sortedLaudos.map((laudo, idx) => (
                    <TableRow key={`${(laudo?.id ?? laudo?.order_number ?? getReportPatientId(laudo) ?? 'laudo')}-${idx}`}>
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
                          <div>{(laudo?.prazo ?? laudo?.due_at) ? formatReportDate(laudo?.due_at ?? laudo?.prazo) : '-'}</div>
                          <div className="text-xs text-muted-foreground">{
                            (() => {
                              // prefer explicit fields
                              const explicit = laudo?.prazo_hora ?? laudo?.due_time ?? laudo?.hora ?? null;
                              if (explicit) return explicit;
                              // fallback: try to parse due_at / prazo datetime and extract time
                              const due = laudo?.due_at ?? laudo?.prazo ?? laudo?.dueDate ?? laudo?.data ?? null;
                              if (!due) return '-';
                              try {
                                const d = new Date(due);
                                if (isNaN(d.getTime())) return '-';
                                return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              } catch (e) {
                                return '-';
                              }
                            })()
                          }</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                          </div>
                          <div className="font-medium">{getReportPatientName(laudo) || '—'}</div>
                          <div className="text-xs text-muted-foreground">{getReportPatientCpf(laudo) ? `CPF: ${getReportPatientCpf(laudo)}` : ''}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{
                        (() => {
                          const possibleName = laudo.requested_by_name ?? laudo.requester_name ?? laudo.requestedByName ?? laudo.executante_name ?? laudo.executante ?? laudo.executante_name ?? laudo.executante;
                          if (possibleName && typeof possibleName === 'string' && possibleName.trim().length) return possibleName;
                          const possibleId = (laudo.requested_by ?? laudo.created_by ?? laudo.executante ?? laudo.requestedBy ?? laudo.createdBy) || '';
                          if (possibleId && user?.id && possibleId === user.id) return (profileData as any)?.nome || user?.name || possibleId;
                          return possibleName || possibleId || '-';
                        })()
                      }</TableCell>
                      <TableCell className="text-sm">{getReportExam(laudo) || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const full = (laudo?.id || laudo?.order_number) ? await loadReportById(String(laudo?.id ?? laudo?.order_number)) : laudo;
                                await ensurePaciente(full);
                                setLaudoSelecionado(full);
                                setIsViewing(true);
                              } catch (e) {
                                // fallback
                                setLaudoSelecionado(laudo);
                                setIsViewing(true);
                              }
                            }}
                            className="flex items-center gap-1 hover:bg-primary! hover:text-white! transition-colors"
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
              {sortedLaudos.map((laudo, idx) => (
                <div key={`${(laudo?.id ?? laudo?.order_number ?? getReportPatientId(laudo) ?? 'laudo-mobile')}-${idx}`} className="bg-card p-4 rounded-lg border border-border shadow-sm">
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
                        <div className="text-xs text-muted-foreground">{getReportPatientCpf(laudo) ? `CPF: ${getReportPatientCpf(laudo)}` : ''}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end ml-4">
                      <div className="text-sm">{
                        (() => {
                          const possibleName = laudo.requested_by_name ?? laudo.requester_name ?? laudo.requestedByName ?? laudo.executante_name ?? laudo.executante ?? laudo.executante_name ?? laudo.executante;
                          if (possibleName && typeof possibleName === 'string' && possibleName.trim().length) return possibleName;
                          const possibleId = (laudo.requested_by ?? laudo.created_by ?? laudo.executante ?? laudo.requestedBy ?? laudo.createdBy) || '';
                          if (possibleId && user?.id && possibleId === user.id) return (profileData as any)?.nome || user?.name || possibleId;
                          return possibleName || possibleId || '-';
                        })()
                      }</div>
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
              onSaved={async (r:any) => {
                try {
                  // If report has an id, fetch full report and open viewer
                  if (r && (r.id || r.order_number)) {
                    const id = r.id ?? r.order_number;
                    const full = await loadReportById(String(id));
                    await ensurePaciente(full);
                    // prepend to laudos list so it appears immediately
                    setLaudos(prev => [full, ...(prev || [])]);
                    setLaudoSelecionado(full);
                    setIsViewing(true);
                  } else {
                    setLaudoSelecionado(r);
                    setIsViewing(true);
                  }
                  // refresh global reports list too
                  try { await loadReports(); } catch {}
                } catch (e) {
                  // fallback: open what we have
                  setLaudoSelecionado(r);
                  setIsViewing(true);
                }
              }}
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
              onSaved={async (r:any) => {
                try {
                  if (r && (r.id || r.order_number)) {
                    const id = r.id ?? r.order_number;
                    const full = await loadReportById(String(id));
                    await ensurePaciente(full);
                    setLaudos(prev => [full, ...(prev || [])]);
                    setLaudoSelecionado(full);
                    setIsViewing(true);
                  } else {
                    setLaudoSelecionado(r);
                    setIsViewing(true);
                  }
                  try { await loadReports(); } catch {}
                } catch (e) {
                  setLaudoSelecionado(r);
                  setIsViewing(true);
                }
              }}
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
                  const signatureName = laudo?.created_by_name ?? laudo?.createdByName ?? ((laudo?.created_by && user?.id && laudo.created_by === user.id) ? profileData.nome : (laudo?.created_by_name || profileData.nome));
                  return (
                    <>
                      <p className="text-sm font-semibold">{signatureName}</p>
                      <p className="text-xs text-muted-foreground">{profileData.crm ? `CRM: ${String(profileData.crm).replace(/^(?:CRM\s*)+/i, '').trim()}` : 'CRM não informado'}{laudo.especialidade ? ` - ${laudo.especialidade}` : ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">Data: {formatReportDate(getReportDate(laudo))}</p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/20">
            <div className="flex items-center justify-end">
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
  const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("editor");
    const [content, setContent] = useState(laudo?.conteudo || "");
    const [showPreview, setShowPreview] = useState(false);
    const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(preSelectedPatient || null);
    const [listaPacientes, setListaPacientes] = useState<any[]>([]);
  // Novo: campos para solicitante e prazo
  // solicitanteId será enviado ao backend (sempre o id do usuário logado)
  const [solicitanteId, setSolicitanteId] = useState<string>(user?.id || "");
  // displaySolicitante é apenas para exibição (nome do usuário) e NÃO é enviado ao backend
  // Prefer profileData.nome (nome do médico carregado) — cai back para user.name ou email
  const displaySolicitante = ((profileData as any) && ((profileData as any).nome || (profileData as any).nome_social)) || user?.name || (user?.profile as any)?.full_name || user?.email || '';
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

        // preencher solicitanteId/prazo quando existe laudo (edição)
        // preferimos manter o solicitanteId como o user id; se o laudo tiver requested_by que pareça um id, usamos ele
        const possibleRequestedById = laudo.requested_by ?? laudo.created_by ?? null;
        if (possibleRequestedById && typeof possibleRequestedById === 'string' && possibleRequestedById.length > 5) {
          setSolicitanteId(possibleRequestedById);
        } else {
          setSolicitanteId(user?.id || "");
        }

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
    }, [laudo, isNewLaudo, pacienteSelecionado, listaPacientes]);

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
                    <Label htmlFor="solicitante">Solicitante</Label>
                    {/* Mostrar o nome do usuário logado de forma estática (não editável) */}
                    <Input id="solicitante" value={displaySolicitante} readOnly disabled />
                    
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
                      <Button variant="outline" size="sm" onClick={() => formatText('align-left')} title="Alinhar à esquerda" className="px-1 hover:bg-primary/10 hover:text-primary"><svg width="16" height="16" fill="none"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-center')} title="Centralizar" className="px-1 hover:bg-primary/10 hover:text-primary"><svg width="16" height="16" fill="none"><rect x="4" y="4" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="3" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-right')} title="Alinhar à direita" className="px-1 hover:bg-primary/10 hover:text-primary"><svg width="16" height="16" fill="none"><rect x="6" y="4" width="8" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="4" y="10" width="10" height="2" rx="1" fill="currentColor"/></svg></Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('align-justify')} title="Justificar" className="px-1 hover:bg-primary/10 hover:text-primary"><svg width="16" height="16" fill="none"><rect x="2" y="4" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="7" width="12" height="2" rx="1" fill="currentColor"/><rect x="2" y="10" width="12" height="2" rx="1" fill="currentColor"/></svg></Button>
                      {/* Listas */}
                      <Button variant="outline" size="sm" onClick={() => formatText('list-ol')} title="Lista numerada" className="px-1 hover:bg-primary/10 hover:text-primary">1.</Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('list-ul')} title="Lista com marcadores" className="px-1 hover:bg-primary/10 hover:text-primary">•</Button>
                      {/* Recuo */}
                      <Button variant="outline" size="sm" onClick={() => formatText('indent')} title="Aumentar recuo" className="px-1 hover:bg-primary/10 hover:text-primary">→</Button>
                      <Button variant="outline" size="sm" onClick={() => formatText('outdent')} title="Diminuir recuo" className="px-1 hover:bg-primary/10 hover:text-primary">←</Button>
                      {/* Desfazer/Refazer */}
                      <Button variant="outline" size="sm" onClick={handleUndo} title="Desfazer" className="px-1 hover:bg-primary/10 hover:text-primary">↺</Button>
                      <div className="flex flex-wrap gap-1">
                        {templates.map((template, idx) => (
                          <Button
                            key={idx}
                            variant="ghost"
                            size="sm"
                            className="text-xs h-auto p-1 px-2 hover:bg-primary/10 hover:text-primary"
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
                          // eslint-disable-next-line @next/next/no-img-element
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
                            // eslint-disable-next-line @next/next/no-img-element
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
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={assinaturaImg} alt="Assinatura Digital" className="mx-auto h-16 object-contain mb-2" />
                          ) : (
                            <div className="h-16 mb-2 text-xs text-muted-foreground">Assine no campo ao lado para visualizar aqui.</div>
                          )}
                          <div className="border-b border-border mb-2"></div>
                          <p className="text-sm">{((profileData as any)?.nome || (profileData as any)?.nome_social) || user?.name || 'Squad-20'}</p>
                          {(((profileData as any)?.crm) || ((user?.profile as any)?.crm)) ? (
                            // Ensure we render a single 'CRM ' prefix followed by the raw number
                            <p className="text-xs text-muted-foreground">CRM {(((profileData as any)?.crm) || (user?.profile as any)?.crm).toString().replace(/^(?:CRM\s*)+/i, '').trim()}</p>
                          ) : null}
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
                <Button variant="outline" onClick={onClose} className="hover:bg-primary! hover:text-white! transition-colors">
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
                        requested_by: solicitanteId || userId,
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
                              if (JSON.stringify(origVal) !== JSON.stringify(val)) {
                                diff[k] = val;
                              } else {
                                // no change
                              }
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
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="patientSelect">Paciente *</Label>
            <Select
              value={commPatientId ?? ''}
              onValueChange={(val: string) => {
                // Radix Select does not allow an Item with empty string as value.
                // Use a sentinel value "__none" for the "-- nenhum --" choice and map it to null here.
                const v = val === "__none" ? null : (val || null);
                setCommPatientId(v);
                if (!v) {
                  setCommPhoneNumber('');
                  return;
                }
                try {
                  const found = (pacientes || []).find((p: any) => String(p.id ?? p.uuid ?? p.email ?? '') === String(v));
                  if (found) {
                    setCommPhoneNumber(
                      found.phone_mobile ?? found.celular ?? found.telefone ?? found.phone ?? found.mobile ?? found.phone_number ?? ''
                    );
                  } else {
                    setCommPhoneNumber('');
                  }
                } catch (e) {
                  console.warn('[ProfissionalPage] erro ao preencher telefone do paciente selecionado', e);
                  setCommPhoneNumber('');
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- nenhum --" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">-- nenhum --</SelectItem>
                {pacientes && pacientes.map((p:any) => (
                  <SelectItem key={String(p.id || p.uuid || p.cpf || p.email)} value={String(p.id ?? p.uuid ?? p.email ?? '')}>
                    {p.full_name ?? p.nome ?? p.name ?? p.email ?? String(p.id ?? p.cpf ?? '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Número (phone_number)</Label>
            <Input id="phoneNumber" placeholder="+5511999999999" value={commPhoneNumber} readOnly disabled className="bg-muted/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (message)</Label>
            <textarea id="message" className="w-full p-2 border rounded" rows={5} value={commMessage} onChange={(e) => setCommMessage(e.target.value)} />
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={smsSending}>
              {smsSending ? 'Enviando...' : 'Enviar SMS'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  
  const renderPerfilSection = () => (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
      {/* Header com Título e Botão */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Meu Perfil</h2>
          <p className="text-muted-foreground mt-1">Bem-vindo à sua área exclusiva.</p>
        </div>
        {!isEditingProfile ? (
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsEditingProfile(true)}
          >
            ✏️ Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSaveProfile}
            >
              ✓ Salvar
            </Button>
            <Button 
              variant="outline"
              onClick={handleCancelEdit}
            >
              ✕ Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Grid de 3 colunas (2 + 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Pessoais */}
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>

            <div className="space-y-4">
              {/* Nome Completo */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Nome Completo
                </Label>
                <div className="mt-2 p-3 bg-muted rounded text-foreground font-medium">
                  {profileData.nome || "Não preenchido"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo não pode ser alterado
                </p>
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.email || ""}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="mt-2"
                    type="email"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.email || "Não preenchido"}
                  </div>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Telefone
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.telefone || ""}
                    onChange={(e) => handleProfileChange('telefone', e.target.value)}
                    className="mt-2"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.telefone || "Não preenchido"}
                  </div>
                )}
              </div>

              {/* CRM */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  CRM
                </Label>
                <div className="mt-2 p-3 bg-muted rounded text-foreground font-medium">
                  {profileData.crm || "Não preenchido"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este campo não pode ser alterado
                </p>
              </div>

              {/* Especialidade */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Especialidade
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.especialidade || ""}
                    onChange={(e) => handleProfileChange('especialidade', e.target.value)}
                    className="mt-2"
                    placeholder="Ex: Cardiologia"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.especialidade || "Não preenchido"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Endereço e Contato */}
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Endereço e Contato</h3>

            <div className="space-y-4">
              {/* Logradouro */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Logradouro
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.endereco || ""}
                    onChange={(e) => handleProfileChange('endereco', e.target.value)}
                    className="mt-2"
                    placeholder="Rua, avenida, etc."
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.endereco || "Não preenchido"}
                  </div>
                )}
              </div>

              {/* Cidade */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Cidade
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.cidade || ""}
                    onChange={(e) => handleProfileChange('cidade', e.target.value)}
                    className="mt-2"
                    placeholder="São Paulo"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.cidade || "Não preenchido"}
                  </div>
                )}
              </div>

              {/* CEP */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  CEP
                </Label>
                {isEditingProfile ? (
                  <Input
                    value={profileData.cep || ""}
                    onChange={(e) => handleProfileChange('cep', e.target.value)}
                    className="mt-2"
                    placeholder="00000-000"
                  />
                ) : (
                  <div className="mt-2 p-3 bg-muted rounded text-foreground">
                    {profileData.cep || "Não preenchido"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Foto do Perfil */}
        <div>
          <div className="border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Foto do Perfil</h3>

            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profileData.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'MD'}
                </AvatarFallback>
              </Avatar>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {profileData.nome?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'MD'}
                </p>
              </div>
            </div>
          </div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes.map((paciente) => (
                <TableRow key={paciente.id ?? paciente.cpf}>
                  <TableCell>{paciente.nome}</TableCell>
                  <TableCell>{paciente.cpf}</TableCell>
                  <TableCell>{getPatientAge(paciente) ? `${getPatientAge(paciente)} anos` : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    );
      case 'laudos':
        return renderLaudosSection();
      // case 'comunicacao':
      //   return renderComunicacaoSection();
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
              <AvatarImage src={(profileData as any).fotoUrl || undefined} alt={profileData.nome} />
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Conta do profissional</p>
              <h2 className="text-lg font-semibold leading-none truncate">{profileData.nome}</h2>
              <p className="text-sm text-muted-foreground truncate">{(profileData.crm ? `CRM: ${profileData.crm}` : '') + (profileData.especialidade ? ` • ${profileData.especialidade}` : '')}</p>
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
              className="w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer"
              onClick={() => setActiveSection('calendario')}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Calendário
            </Button>
            <Button 
              variant={activeSection === 'pacientes' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer"
              onClick={() => setActiveSection('pacientes')}
            >
              <Users className="mr-2 h-4 w-4" />
              Pacientes
            </Button>
            <Button 
              variant={activeSection === 'laudos' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer"
              onClick={() => setActiveSection('laudos')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Laudos
            </Button>
            {/* Comunicação removida - campos embaixo do calendário */}
            {/* <Button 
              variant={activeSection === 'comunicacao' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer"
              onClick={() => setActiveSection('comunicacao')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Comunicação
            </Button> */}
            <Button 
              variant={activeSection === 'perfil' ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors hover:bg-primary! hover:text-white! cursor-pointer"
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
                    {pacientes && pacientes.map((paciente) => (
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
                    className="flex-1 hover:bg-primary! hover:text-white! transition-colors"
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
            </div>

            <Button
              onClick={() => setShowActionModal(false)}
              variant="outline"
              className="w-full mt-2 hover:bg-primary! hover:text-white! transition-colors"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Modal para visualizar pacientes de um dia específico */}
      {showDayModal && selectedDayDate && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header com navegação */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button 
                onClick={() => {
                  const prev = new Date(selectedDayDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDayDate(prev);
                }}
                className="p-2 hover:bg-muted rounded transition-colors"
                aria-label="Dia anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-lg font-semibold flex-1 text-center">
                {selectedDayDate.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h2>
              
              <button 
                onClick={() => {
                  const next = new Date(selectedDayDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDayDate(next);
                }}
                className="p-2 hover:bg-muted rounded transition-colors"
                aria-label="Próximo dia"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="w-12" />
              
              <button 
                onClick={() => setShowDayModal(false)}
                className="p-2 hover:bg-muted rounded transition-colors ml-2"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const dayStr = selectedDayDate.toISOString().split('T')[0];
                const dayEvents = events.filter(e => e.date === dayStr).sort((a, b) => a.time.localeCompare(b.time));
                
                if (dayEvents.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg">Nenhuma consulta agendada para este dia</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      {dayEvents.length} consulta{dayEvents.length !== 1 ? 's' : ''} agendada{dayEvents.length !== 1 ? 's' : ''}
                    </p>
                    {dayEvents.map((appointment) => {
                      const paciente = pacientes.find(p => p.nome === appointment.title);
                      return (
                        <div
                          key={appointment.id}
                          className="border-l-4 p-4 rounded-lg bg-muted/20"
                          style={{ borderLeftColor: getStatusColor(appointment.type) }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {appointment.title}
                              </h3>
                              <span className="px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: getStatusColor(appointment.type) }}>
                                {appointment.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {appointment.time}
                              </span>
                              {paciente && (
                                <span>
                                  CPF: {getPatientCpf(paciente)} • {getPatientAge(paciente)} anos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Formulário para cadastro de paciente */}
      <PatientRegistrationForm 
        open={showPatientForm}
        onOpenChange={setShowPatientForm}
        mode="create"
        onSaved={(newPaciente) => {
          // Adicionar o novo paciente à lista e recarregar
          setPacientes((prev) => [...prev, newPaciente]);
        }}
      />
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