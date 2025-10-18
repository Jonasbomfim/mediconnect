"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { listarAgendamentos, buscarPacientesPorIds, buscarMedicosPorIds, atualizarAgendamento } from "@/lib/api";
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);
  // Local form state used when editing. Keep hook at top-level to avoid Hooks order changes.
  const [localForm, setLocalForm] = useState<any | null>(null);

  const mapAppointmentToFormData = (appointment: any) => {
    const appointmentDate = new Date(appointment.time || appointment.scheduled_at || Date.now());

    return {
      id: appointment.id,
      patientName: appointment.patient,
      patientId: appointment.patient_id || appointment.patientId || null,
      professionalName: appointment.professional || "",
      appointmentDate: appointmentDate.toISOString().split("T")[0],
      startTime: appointmentDate.toTimeString().split(" ")[0].substring(0, 5),
      endTime: new Date(appointmentDate.getTime() + (appointment.duration || 30) * 60000)
        .toTimeString()
        .split(" ")[0]
        .substring(0, 5),
      status: appointment.status,
      appointmentType: appointment.type,
      notes: appointment.notes || "",
      cpf: "",
      rg: "",
      birthDate: "",
      phoneCode: "+55",
      phoneNumber: "",
      email: "",
      unit: "nei",
    };
  };

  const handleDelete = (appointmentId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta consulta?")) {
      setAppointments((prev) => prev.filter((a) => a.id !== appointmentId));
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
          const [sh, sm] = String(formData.startTime).split(":").map((n: string) => Number(n));
          const [eh, em] = String(formData.endTime).split(":").map((n: string) => Number(n));
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
        time: updated.scheduled_at || updated.created_at || scheduled_at,
        duration: updated.duration_minutes || duration_minutes,
        type: updated.appointment_type || formData.appointmentType || existing.type || 'presencial',
        status: updated.status || formData.status || existing.status,
        professional: existing.professional || formData.professionalName || '',
        notes: updated.notes || updated.patient_notes || formData.notes || existing.notes || '',
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

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const arr = await listarAgendamentos("select=*&order=scheduled_at.desc&limit=200");
        if (!mounted) return;

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
            time: a.scheduled_at || a.created_at || "",
            duration: a.duration_minutes || 30,
            type: a.appointment_type || "presencial",
            status: a.status || "requested",
            professional,
            notes: a.notes || a.patient_notes || "",
          };
        });

        setAppointments(mapped);
        setIsLoading(false);
      } catch (err) {
        console.warn("[ConsultasPage] Falha ao carregar agendamentos, usando mocks", err);
        setAppointments([]);
        setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

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
        <CalendarRegistrationForm formData={localForm} onFormChange={onFormChange} />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
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
          <Link href="/agenda">
            <Button size="sm" className="h-8 gap-1">
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
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por..." className="pl-8 w-full" />
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" className="w-[180px]" />
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
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data e Hora</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => {
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
                      <TableCell>{formatDate(appointment.time)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent">
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
                <span className="col-span-3">{viewingAppointment?.time ? formatDate(viewingAppointment.time) : ''}</span>
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