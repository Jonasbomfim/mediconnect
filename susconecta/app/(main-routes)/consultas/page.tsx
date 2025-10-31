"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { mockProfessionals } from "@/lib/mocks/appointment-mocks";
import { listarAgendamentos, buscarPacientesPorIds, buscarMedicosPorIds, atualizarAgendamento, buscarAgendamentoPorId, deletarAgendamento } from "@/lib/api";
import { CalendarRegistrationForm } from "@/components/forms/calendar-registration-form";

const formatDate = (date: string | Date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const capitalize = (s: string) => {
  if (typeof s !== "string" || s.length === 0) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [originalAppointments, setOriginalAppointments] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);
  // Local form state used when editing. Keep hook at top-level to avoid Hooks order changes.
  const [localForm, setLocalForm] = useState<any | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const mapAppointmentToFormData = (appointment: any) => {
    // prefer scheduled_at (ISO) if available
    const scheduledBase = appointment.scheduled_at || appointment.time || appointment.created_at || null;
    const baseDate = scheduledBase ? new Date(scheduledBase) : new Date();
    const duration = appointment.duration_minutes ?? appointment.duration ?? 30;

    // compute start and end times (HH:MM)
    const appointmentDateStr = baseDate.toISOString().split("T")[0];
    const startTime = `${String(baseDate.getHours()).padStart(2, '0')}:${String(baseDate.getMinutes()).padStart(2, '0')}`;
    const endDate = new Date(baseDate.getTime() + duration * 60000);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    return {
      id: appointment.id,
      patientName: appointment.patient,
      patientId: appointment.patient_id || appointment.patientId || null,
      // include doctor id so the form can run availability/exception checks when editing
      doctorId: appointment.doctor_id || appointment.doctorId || null,
      professionalName: appointment.professional || "",
      appointmentDate: appointmentDateStr,
      startTime,
      endTime,
      status: appointment.status,
      appointmentType: appointment.appointment_type || appointment.type,
      notes: appointment.notes || appointment.patient_notes || "",
      cpf: "",
      rg: "",
      birthDate: "",
      phoneCode: "+55",
      phoneNumber: "",
      email: "",
      unit: "nei",
      // API-editable fields (populate so the form shows existing values)
      duration_minutes: duration,
      chief_complaint: appointment.chief_complaint ?? null,
      patient_notes: appointment.patient_notes ?? null,
      insurance_provider: appointment.insurance_provider ?? null,
      checked_in_at: appointment.checked_in_at ?? null,
      completed_at: appointment.completed_at ?? null,
      cancelled_at: appointment.cancelled_at ?? null,
      cancellation_reason: appointment.cancellation_reason ?? appointment.cancellationReason ?? "",
    };
  };

  const handleDelete = async (appointmentId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta consulta?")) return;
    try {
      // call server DELETE
      await deletarAgendamento(appointmentId);
      // remove from UI
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
      // also update originalAppointments cache
      setOriginalAppointments((prev) => (prev || []).filter((a) => a.id !== appointmentId));
      alert('Agendamento excluído com sucesso.');
    } catch (err) {
      console.error('[ConsultasPage] Falha ao excluir agendamento', err);
      try {
        const msg = err instanceof Error ? err.message : String(err);
        alert('Falha ao excluir agendamento: ' + msg);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleEdit = (appointment: any) => {
    const formData = mapAppointmentToFormData(appointment);
    setEditingAppointment(formData);
    setShowForm(true);
  };

  const handleView = (appointment: any) => {
    setViewingAppointment(appointment);
  };

  const handleCancel = () => {
    setEditingAppointment(null);
    setShowForm(false);
    setLocalForm(null);
  };

  const handleSave = async (formData: any) => {
    try {
      // build scheduled_at ISO (formData.startTime is 'HH:MM')
      const scheduled_at = new Date(`${formData.appointmentDate}T${formData.startTime}`).toISOString();

      // compute duration from start/end times when available
      let duration_minutes = 30;
      try {
        if (formData.startTime && formData.endTime) {
          const [sh, sm] = String(formData.startTime).split(":").map(Number);
          const [eh, em] = String(formData.endTime).split(":").map(Number);
          const start = (sh || 0) * 60 + (sm || 0);
          const end = (eh || 0) * 60 + (em || 0);
          if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) duration_minutes = end - start;
        }
      } catch (e) {
        // fallback to default
        duration_minutes = 30;
      }

      const payload: any = {
        scheduled_at,
        duration_minutes,
        status: formData.status || undefined,
        notes: formData.notes ?? null,
        chief_complaint: formData.chief_complaint ?? null,
        patient_notes: formData.patient_notes ?? null,
        insurance_provider: formData.insurance_provider ?? null,
        // convert local datetime-local inputs (which may be in 'YYYY-MM-DDTHH:MM' format) to proper ISO if present
        checked_in_at: formData.checked_in_at ? new Date(formData.checked_in_at).toISOString() : null,
        completed_at: formData.completed_at ? new Date(formData.completed_at).toISOString() : null,
        cancelled_at: formData.cancelled_at ? new Date(formData.cancelled_at).toISOString() : null,
        cancellation_reason: formData.cancellation_reason ?? null,
      };

      // Call PATCH endpoint
      const updated = await atualizarAgendamento(formData.id, payload);

      // Build UI-friendly row using server response and existing local fields
      const existing = appointments.find((a) => a.id === formData.id) || {};
      const mapped = {
        id: updated.id,
        patient: formData.patientName || existing.patient || '',
        patient_id: existing.patient_id ?? null,
        // preserve doctor id so future edits retain the selected professional
        doctor_id: existing.doctor_id ?? (formData.doctorId || (formData as any).doctor_id) ?? null,
        // preserve server-side fields so future edits read them
        scheduled_at: updated.scheduled_at ?? scheduled_at,
        duration_minutes: updated.duration_minutes ?? duration_minutes,
        appointment_type: updated.appointment_type ?? formData.appointmentType ?? existing.type ?? 'presencial',
        status: updated.status ?? formData.status ?? existing.status,
        professional: existing.professional || formData.professionalName || '',
        notes: updated.notes ?? updated.patient_notes ?? formData.notes ?? existing.notes ?? '',
        chief_complaint: updated.chief_complaint ?? formData.chief_complaint ?? existing.chief_complaint ?? null,
        patient_notes: updated.patient_notes ?? formData.patient_notes ?? existing.patient_notes ?? null,
        insurance_provider: updated.insurance_provider ?? formData.insurance_provider ?? existing.insurance_provider ?? null,
        checked_in_at: updated.checked_in_at ?? formData.checked_in_at ?? existing.checked_in_at ?? null,
        completed_at: updated.completed_at ?? formData.completed_at ?? existing.completed_at ?? null,
        cancelled_at: updated.cancelled_at ?? formData.cancelled_at ?? existing.cancelled_at ?? null,
        cancellation_reason: updated.cancellation_reason ?? formData.cancellation_reason ?? existing.cancellation_reason ?? null,
      };

      setAppointments((prev) => prev.map((a) => (a.id === mapped.id ? mapped : a)));
      handleCancel();
    } catch (err) {
      console.error('[ConsultasPage] Falha ao atualizar agendamento', err);
      // Inform the user
      try {
        const msg = err instanceof Error ? err.message : String(err);
        alert('Falha ao salvar alterações: ' + msg);
      } catch (e) {
        // ignore
      }
    }
  };

  // Fetch and map appointments (used at load and when clearing search)
  const fetchAndMapAppointments = async () => {
    const arr = await listarAgendamentos("select=*&order=scheduled_at.desc&limit=200");

    // Collect unique patient_ids and doctor_ids
    const patientIds = new Set<string>();
    const doctorIds = new Set<string>();
    for (const a of arr || []) {
      if (a.patient_id) patientIds.add(String(a.patient_id));
      if (a.doctor_id) doctorIds.add(String(a.doctor_id));
    }

    // Batch fetch patients and doctors
    const patientsMap = new Map<string, any>();
    const doctorsMap = new Map<string, any>();

    try {
      if (patientIds.size) {
        const list = await buscarPacientesPorIds(Array.from(patientIds));
        for (const p of list || []) patientsMap.set(String(p.id), p);
      }
    } catch (e) {
      console.warn("[ConsultasPage] Falha ao buscar pacientes em lote", e);
    }

    try {
      if (doctorIds.size) {
        const list = await buscarMedicosPorIds(Array.from(doctorIds));
        for (const d of list || []) doctorsMap.set(String(d.id), d);
      }
    } catch (e) {
      console.warn("[ConsultasPage] Falha ao buscar médicos em lote", e);
    }

    // Map appointments using the maps
    const mapped = (arr || []).map((a: any) => {
      const patient = a.patient_id ? patientsMap.get(String(a.patient_id))?.full_name || String(a.patient_id) : "";
      const professional = a.doctor_id ? doctorsMap.get(String(a.doctor_id))?.full_name || String(a.doctor_id) : "";
      return {
        id: a.id,
        patient,
        patient_id: a.patient_id,
        // preserve the doctor's id so later edit flows can access it
        doctor_id: a.doctor_id ?? null,
        // keep some server-side fields so edit can access them later
        scheduled_at: a.scheduled_at ?? a.time ?? a.created_at ?? null,
        duration_minutes: a.duration_minutes ?? a.duration ?? null,
        appointment_type: a.appointment_type ?? a.type ?? null,
        status: a.status ?? "requested",
        professional,
        notes: a.notes || a.patient_notes || "",
        // additional editable fields
        chief_complaint: a.chief_complaint ?? null,
        patient_notes: a.patient_notes ?? null,
        insurance_provider: a.insurance_provider ?? null,
        checked_in_at: a.checked_in_at ?? null,
        completed_at: a.completed_at ?? null,
        cancelled_at: a.cancelled_at ?? null,
        cancellation_reason: a.cancellation_reason ?? a.cancellationReason ?? null,
      };
    });

    return mapped;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mapped = await fetchAndMapAppointments();
        if (!mounted) return;
        setAppointments(mapped);
        setOriginalAppointments(mapped || []);
        setIsLoading(false);
      } catch (err) {
        console.warn("[ConsultasPage] Falha ao carregar agendamentos, usando mocks", err);
        if (!mounted) return;
        setAppointments([]);
        setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Search box: allow fetching a single appointment by ID when pressing Enter
  // Perform a local-only search against the already-loaded appointments.
  // This intentionally does not call the server — it filters the cached list.
  const applyFilters = (val?: string) => {
  const trimmed = String((val ?? searchValue) || '').trim();
    let list = (originalAppointments || []).slice();

    // search
    if (trimmed) {
      const q = trimmed.toLowerCase();
      list = list.filter((a) => {
        const patient = String(a.patient || '').toLowerCase();
        const professional = String(a.professional || '').toLowerCase();
        const pid = String(a.patient_id || '').toLowerCase();
        const aid = String(a.id || '').toLowerCase();
        return (
          patient.includes(q) ||
          professional.includes(q) ||
          pid === q ||
          aid === q
        );
      });
    }

    // status filter
    if (selectedStatus && selectedStatus !== 'all') {
      list = list.filter((a) => String(a.status || '').toLowerCase() === String(selectedStatus).toLowerCase());
    }

    // date filter (YYYY-MM-DD)
    if (filterDate) {
      list = list.filter((a) => {
        try {
          const sched = a.scheduled_at || a.time || a.created_at || null;
          if (!sched) return false;
          const iso = new Date(sched).toISOString().split('T')[0];
          return iso === filterDate;
        } catch (e) { return false; }
      });
    }

    setAppointments(list as any[]);
  };

  const performSearch = (val: string) => { applyFilters(val); };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // keep behavior consistent: perform a local filter immediately
      performSearch(searchValue);
    } else if (e.key === 'Escape') {
      setSearchValue('');
      setAppointments(originalAppointments || []);
    }
  };

  const handleClearSearch = async () => {
    setSearchValue('');
    setIsLoading(true);
    try {
      // Reset to the original cached list without refetching from server
      setAppointments(originalAppointments || []);
    } catch (err) {
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce live filtering as the user types. Operates only on the cached originalAppointments.
  useEffect(() => {
    const t = setTimeout(() => {
      performSearch(searchValue);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, originalAppointments]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, filterDate, originalAppointments]);

  // Dados paginados
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return appointments.slice(startIndex, endIndex);
  }, [appointments, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(appointments.length / itemsPerPage);

  // Reset para página 1 quando mudar a busca ou itens por página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedStatus, filterDate, itemsPerPage]);

  // Keep localForm synchronized with editingAppointment
  useEffect(() => {
    if (showForm && editingAppointment) {
      setLocalForm(editingAppointment);
    }
    if (!showForm) setLocalForm(null);
  }, [showForm, editingAppointment]);

  const onFormChange = (d: any) => setLocalForm(d);

  const saveLocal = async () => {
    if (!localForm) return;
    await handleSave(localForm);
  };

  // If editing, render the edit form as a focused view (keeps hooks stable)
  if (showForm && localForm) {
    return (
      <div className="space-y-6 p-6 bg-background">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold md:text-2xl">Editar Consulta</h1>
        </div>
  <CalendarRegistrationForm formData={localForm} onFormChange={onFormChange} createMode={true} />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" className="hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={saveLocal}>Salvar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Consultas</h1>
          <p className="text-muted-foreground">Visualize, filtre e gerencie todas as consultas da clínica.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Pass origin so the Agenda page can return to Consultas when cancelling */}
          <Link href="/agenda?origin=consultas">
            <Button size="sm" className="h-8 gap-1 bg-blue-600">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Agendar Nova Consulta</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Agendadas</CardTitle>
          <CardDescription>Visualize, filtre e gerencie todas as consultas da clínica.</CardDescription>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[250px] flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por..."
                  className="pl-8 pr-4 w-full shadow-sm border border-border bg-transparent"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
            </div>
            <Select onValueChange={(v) => { setSelectedStatus(String(v)); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                {/* backend uses 'requested' for pending requests, map UI label to that value */}
                <SelectItem value="requested">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-[180px]" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="w-full py-12 flex justify-center items-center">
              <Loader2 className="animate-spin mr-2" />
              <span>Carregando agendamentos...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">Paciente</TableHead>
                  <TableHead className="text-primary-foreground">Médico</TableHead>
                  <TableHead className="text-primary-foreground">Status</TableHead>
                  <TableHead className="text-primary-foreground">Data e Hora</TableHead>
                  <TableHead className="text-primary-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAppointments.map((appointment) => {
                  // appointment.professional may now contain the doctor's name (resolved)
                  const professionalLookup = mockProfessionals.find((p) => p.id === appointment.professional);
                  const professionalName = typeof appointment.professional === "string" && appointment.professional && !professionalLookup
                    ? appointment.professional
                    : (professionalLookup ? professionalLookup.name : (appointment.professional || "Não encontrado"));

                  return (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.patient}</TableCell>
                      <TableCell>{professionalName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === "confirmed"
                              ? "default"
                              : appointment.status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className={appointment.status === "confirmed" ? "bg-green-600" : ""}
                        >
                          {capitalize(appointment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(appointment.scheduled_at ?? appointment.time)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-primary hover:text-white transition-colors">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(appointment)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(appointment.id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Controles de paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-sm text-muted-foreground">
            Mostrando {paginatedAppointments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
            {Math.min(currentPage * itemsPerPage, appointments.length)} de {appointments.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Primeira
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Próxima
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Última
          </Button>
        </div>
      </div>

      {viewingAppointment && (
        <Dialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Consulta</DialogTitle>
              <DialogDescription>Informações detalhadas da consulta de {viewingAppointment?.patient}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Paciente</Label>
                <span className="col-span-3">{viewingAppointment?.patient}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Médico</Label>
                <span className="col-span-3">{viewingAppointment?.professional || 'Não encontrado'}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Data e Hora</Label>
                <span className="col-span-3">{(viewingAppointment?.scheduled_at ?? viewingAppointment?.time) ? formatDate(viewingAppointment?.scheduled_at ?? viewingAppointment?.time) : ''}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <span className="col-span-3">
                  <Badge
                    variant={
                      viewingAppointment?.status === "confirmed"
                        ? "default"
                        : viewingAppointment?.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                    className={viewingAppointment?.status === "confirmed" ? "bg-green-600" : ""}
                  >
                    {capitalize(viewingAppointment?.status || "")}
                  </Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tipo</Label>
                <span className="col-span-3">{capitalize(viewingAppointment?.type || "")}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Observações</Label>
                <span className="col-span-3">{viewingAppointment?.notes || "Nenhuma"}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingAppointment(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    );
  }