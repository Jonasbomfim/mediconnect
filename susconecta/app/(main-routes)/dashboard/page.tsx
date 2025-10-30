'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  countTotalPatients,
  countTotalDoctors,
  countAppointmentsToday,
  getUpcomingAppointments,
  getAppointmentsByDateRange,
  getNewUsersLastDays,
  getPendingReports,
  getDisabledUsers,
  getDoctorsAvailabilityToday,
  getPatientById,
  getDoctorById,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Users, Stethoscope, Clock, FileText, AlertTriangle, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form';
import { DoctorRegistrationForm } from '@/components/forms/doctor-registration-form';

interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  appointmentsToday: number;
}

interface UpcomingAppointment {
  id: string;
  scheduled_at: string;
  status: string;
  doctor_id: string;
  patient_id: string;
  doctor?: { full_name?: string };
  patient?: { full_name?: string };
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0,
  });
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [disabledUsers, setDisabledUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Map<string, any>>(new Map());
  const [patients, setPatients] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  
  // Estados para os modais de formulário
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Carrega stats
      const [patientCount, doctorCount, todayCount] = await Promise.all([
        countTotalPatients(),
        countTotalDoctors(),
        countAppointmentsToday(),
      ]);

      setStats({
        totalPatients: patientCount,
        totalDoctors: doctorCount,
        appointmentsToday: todayCount,
      });

      // 2. Carrega dados dos widgets em paralelo
      const [upcomingAppts, appointmentDataRange, newUsersList, pendingReportsList, disabledUsersList] = await Promise.all([
        getUpcomingAppointments(5),
        getAppointmentsByDateRange(7),
        getNewUsersLastDays(7),
        getPendingReports(5),
        getDisabledUsers(5),
      ]);

      setAppointments(upcomingAppts);
      setAppointmentData(appointmentDataRange);
      setNewUsers(newUsersList);
      setPendingReports(pendingReportsList);
      setDisabledUsers(disabledUsersList);

      // 3. Busca detalhes de pacientes e médicos para as próximas consultas
      const doctorMap = new Map();
      const patientMap = new Map();

      for (const appt of upcomingAppts) {
        if (appt.doctor_id && !doctorMap.has(appt.doctor_id)) {
          const doctor = await getDoctorById(appt.doctor_id);
          if (doctor) doctorMap.set(appt.doctor_id, doctor);
        }
        if (appt.patient_id && !patientMap.has(appt.patient_id)) {
          const patient = await getPatientById(appt.patient_id);
          if (patient) patientMap.set(appt.patient_id, patient);
        }
      }

      setDoctors(doctorMap);
      setPatients(patientMap);
    } catch (err) {
      console.error('[Dashboard] Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientFormSaved = () => {
    setShowPatientForm(false);
    setEditingPatientId(null);
    loadDashboardData();
  };

  const handleDoctorFormSaved = () => {
    setShowDoctorForm(false);
    setEditingDoctorId(null);
    loadDashboardData();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      confirmed: { variant: 'default', label: 'Confirmado' },
      completed: { variant: 'secondary', label: 'Concluído' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
      requested: { variant: 'outline', label: 'Solicitado' },
    };
    const s = statusMap[status] || { variant: 'outline', label: status };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6 bg-background">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Se está exibindo formulário de paciente
  if (showPatientForm) {
    return (
      <div className="space-y-6 p-6 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => {
            setShowPatientForm(false);
            setEditingPatientId(null);
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingPatientId ? "Editar paciente" : "Novo paciente"}</h1>
        </div>

        <PatientRegistrationForm
          inline
          mode={editingPatientId ? "edit" : "create"}
          patientId={editingPatientId}
          onSaved={handlePatientFormSaved}
          onClose={() => {
            setShowPatientForm(false);
            setEditingPatientId(null);
          }}
        />
      </div>
    );
  }

  // Se está exibindo formulário de médico
  if (showDoctorForm) {
    return (
      <div className="space-y-6 p-6 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => {
            setShowDoctorForm(false);
            setEditingDoctorId(null);
          }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingDoctorId ? "Editar Médico" : "Novo Médico"}</h1>
        </div>

        <DoctorRegistrationForm
          inline
          mode={editingDoctorId ? "edit" : "create"}
          doctorId={editingDoctorId}
          onSaved={handleDoctorFormSaved}
          onClose={() => {
            setShowDoctorForm(false);
            setEditingDoctorId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Bem-vindo ao painel de controle</p>
      </div>

      {/* 1. CARDS RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total de Pacientes</h3>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalPatients}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total de Médicos</h3>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.totalDoctors}</p>
            </div>
            <Stethoscope className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Consultas Hoje</h3>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.appointmentsToday}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Relatórios Pendentes</h3>
              <p className="text-3xl font-bold text-foreground mt-2">{pendingReports.length}</p>
            </div>
            <FileText className="h-8 w-8 text-orange-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* 6. AÇÕES RÁPIDAS */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowPatientForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
          <Button onClick={() => router.push('/agenda')} variant="outline" className="gap-2 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground">
            <Calendar className="h-4 w-4" />
            Novo Agendamento
          </Button>
          <Button onClick={() => setShowDoctorForm(true)} variant="outline" className="gap-2 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground">
            <Stethoscope className="h-4 w-4" />
            Novo Médico
          </Button>
          <Button onClick={() => router.push('/dashboard/relatorios')} variant="outline" className="gap-2 hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground">
            <FileText className="h-4 w-4" />
            Ver Relatórios
          </Button>
        </div>
      </div>

      {/* 2. PRÓXIMAS CONSULTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Próximas Consultas (7 dias)</h2>
          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map(appt => (
                <div key={appt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {patients.get(appt.patient_id)?.full_name || 'Paciente desconhecido'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Médico: {doctors.get(appt.doctor_id)?.full_name || 'Médico desconhecido'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(appt.scheduled_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(appt.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhuma consulta agendada para os próximos 7 dias</p>
          )}
        </div>

        {/* 5. RELATÓRIOS PENDENTES */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatórios Pendentes
          </h2>
          {pendingReports.length > 0 ? (
            <div className="space-y-2">
              {pendingReports.map(report => (
                <div key={report.id} className="p-3 bg-muted rounded-lg hover:bg-muted/80 transition cursor-pointer text-sm">
                  <p className="font-medium text-foreground truncate">{report.order_number}</p>
                  <p className="text-xs text-muted-foreground">{report.exam || 'Sem descrição'}</p>
                </div>
              ))}
              <Button onClick={() => router.push('/dashboard/relatorios')} variant="ghost" className="w-full mt-2" size="sm">
                Ver Todos
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sem relatórios pendentes</p>
          )}
        </div>
      </div>

      {/* 4. NOVOS USUÁRIOS */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">Novos Usuários (últimos 7 dias)</h2>
        {newUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {newUsers.map(user => (
              <div key={user.id} className="p-3 bg-muted rounded-lg">
                <p className="font-medium text-foreground truncate">{user.full_name || 'Sem nome'}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum novo usuário nos últimos 7 dias</p>
        )}
      </div>

      {/* 8. ALERTAS */}
      {disabledUsers.length > 0 && (
        <div className="bg-card p-6 rounded-lg border border-destructive/50">
          <h2 className="text-lg font-semibold text-destructive mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas - Usuários Desabilitados
          </h2>
          <div className="space-y-2">
            {disabledUsers.map(user => (
              <Alert key={user.id} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{user.full_name}</strong> ({user.email}) está desabilitado
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* 11. LINK PARA RELATÓRIOS */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-lg border border-blue-500/20">
        <h2 className="text-lg font-semibold text-foreground mb-2">Seção de Relatórios</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Acesse a seção de relatórios médicos para gerenciar, visualizar e exportar documentos.
        </p>
        <Button asChild>
          <Link href="/dashboard/relatorios">Ir para Relatórios</Link>
        </Button>
      </div>
    </div>
  );
}

