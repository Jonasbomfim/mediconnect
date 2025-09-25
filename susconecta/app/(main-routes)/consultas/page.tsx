"use client";

import Link from "next/link";
import { useState } from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
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

import { mockAppointments, mockProfessionals } from "@/lib/mocks/appointment-mocks";
import { CalendarRegistrationForm } from "@/components/forms/calendar-registration-form";

// --- Helper Functions ---
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
    if (typeof s !== 'string' || s.length === 0) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
};

// --- Main Page Component ---
export default function ConsultasPage() {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<any | null>(null);

  // Converte o objeto da consulta para o formato esperado pelo formulário
  const mapAppointmentToFormData = (appointment: any) => {
    const professional = mockProfessionals.find(p => p.id === appointment.professional);
    const appointmentDate = new Date(appointment.time);
    
    return {
        id: appointment.id,
        patientName: appointment.patient,
        professionalName: professional ? professional.name : '',
        appointmentDate: appointmentDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        startTime: appointmentDate.toTimeString().split(' ')[0].substring(0, 5), // Formato HH:MM
        endTime: new Date(appointmentDate.getTime() + appointment.duration * 60000).toTimeString().split(' ')[0].substring(0, 5),
        status: appointment.status,
        appointmentType: appointment.type,
        notes: appointment.notes,
        // Adicione outros campos do paciente aqui se necessário (cpf, rg, etc.)
        // Eles não existem no mock de agendamento, então virão vazios
        cpf: '',
        rg: '',
        birthDate: '',
        phoneCode: '+55',
        phoneNumber: '',
        email: '',
        unit: 'nei',
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
  };

  const handleSave = (formData: any) => {
    // Como o formulário edita campos que não estão na tabela,
    // precisamos mapear de volta para o formato original do agendamento.
    // Para a simulação, vamos atualizar apenas os campos que existem no mock.
    const updatedAppointment = {
        id: formData.id,
        patient: formData.patientName,
        time: new Date(`${formData.appointmentDate}T${formData.startTime}`).toISOString(),
        duration: 30, // Duração não está no form, então mantemos um valor fixo
        type: formData.appointmentType as any,
        status: formData.status as any,
        professional: appointments.find(a => a.id === formData.id)?.professional || '', // Mantém o ID do profissional
        notes: formData.notes,
    };

    setAppointments(prev => 
        prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a)
    );
    handleCancel(); // Fecha o formulário
  };

  if (showForm && editingAppointment) {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Button type="button" variant="ghost" size="icon" onClick={handleCancel}> 
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold md:text-2xl">Editar Consulta</h1>
            </div>
            <CalendarRegistrationForm 
                initialData={editingAppointment} 
                onSave={handleSave} 
                onCancel={handleCancel} 
            />
        </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Consultas</h1>
          <p className="text-muted-foreground">Visualize, filtre e gerencie todas as consultas da clínica.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/agenda">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Agendar Nova Consulta
              </span>
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultas Agendadas</CardTitle>
          <CardDescription>
            Visualize, filtre e gerencie todas as consultas da clínica.
          </CardDescription>
          <div className="pt-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por..."
                className="pl-8 w-full"
              />
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
                const professional = mockProfessionals.find(
                  (p) => p.id === appointment.professional
                );
                return (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {appointment.patient}
                    </TableCell>
                    <TableCell>
                      {professional ? professional.name : "Não encontrado"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          appointment.status === "confirmed" ? "bg-green-600" : ""
                        }
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
                          <DropdownMenuItem
                            onClick={() => handleView(appointment)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(appointment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(appointment.id)}
                            className="text-destructive"
                          >
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
        </CardContent>
      </Card>

      {viewingAppointment && (
        <Dialog open={!!viewingAppointment} onOpenChange={() => setViewingAppointment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Consulta</DialogTitle>
              <DialogDescription>
                Informações detalhadas da consulta de {viewingAppointment?.patient}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Paciente
                </Label>
                <span className="col-span-3">{viewingAppointment?.patient}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Médico
                </Label>
                <span className="col-span-3">
                    {mockProfessionals.find(p => p.id === viewingAppointment?.professional)?.name || "Não encontrado"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Data e Hora
                </Label>
                <span className="col-span-3">{viewingAppointment?.time ? formatDate(viewingAppointment.time) : ''}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Status
                </Label>
                <span className="col-span-3">
                    <Badge
                        variant={
                          viewingAppointment?.status === "confirmed"
                            ? "default"
                            : viewingAppointment?.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className={
                          viewingAppointment?.status === "confirmed" ? "bg-green-600" : ""
                        }
                    >
                        {capitalize(viewingAppointment?.status || '')}
                    </Badge>
                </span>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Tipo
                </Label>
                <span className="col-span-3">{capitalize(viewingAppointment?.type || '')}</span>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Observações
                </Label>
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