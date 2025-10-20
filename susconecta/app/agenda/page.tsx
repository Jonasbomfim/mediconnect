"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarRegistrationForm } from "@/components/forms/calendar-registration-form";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";
import { useState } from "react";
import { criarAgendamento } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface FormData {
  patientName?: string;
  patientId?: string;
  doctorId?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  phoneCode?: string;
  phoneNumber?: string;
  email?: string;
  convenio?: string;
  matricula?: string;
  validade?: string;
  documentos?: string;
  professionalName?: string;
  unit?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  requestingProfessional?: string;
  appointmentType?: string;
  notes?: string;
  duration_minutes?: number;
  chief_complaint?: string | null;
  patient_notes?: string | null;
  insurance_provider?: string | null;
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({});

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleSave = () => {
    (async () => {
      try {
        // basic validation
        if (!formData.patientId && !(formData as any).patient_id) throw new Error('Patient ID é obrigatório');
        if (!formData.doctorId && !(formData as any).doctor_id) throw new Error('Doctor ID é obrigatório');
        if (!formData.appointmentDate) throw new Error('Data é obrigatória');
        if (!formData.startTime) throw new Error('Horário de início é obrigatório');

        const payload: any = {
          patient_id: formData.patientId || (formData as any).patient_id,
          doctor_id: formData.doctorId || (formData as any).doctor_id,
          scheduled_at: new Date(`${formData.appointmentDate}T${formData.startTime}`).toISOString(),
          duration_minutes: formData.duration_minutes ?? 30,
          appointment_type: formData.appointmentType ?? 'presencial',
          chief_complaint: formData.chief_complaint ?? null,
          patient_notes: formData.patient_notes ?? null,
          insurance_provider: formData.insurance_provider ?? null,
        };

        await criarAgendamento(payload);
        // success
        try { toast({ title: 'Agendamento criado', description: 'O agendamento foi criado com sucesso.' }); } catch {}
        router.push('/consultas');
      } catch (err: any) {
        // If the API threw a blocking exception message, surface it as a toast with additional info
        const msg = err?.message ?? String(err);
        // Heuristic: messages from criarAgendamento about exceptions start with "Não é possível agendar"
        if (typeof msg === 'string' && msg.includes('Não é possível agendar')) {
          try {
            toast({ title: 'Data indisponível', description: msg });
          } catch (_) {}
        } else {
          // fallback to generic alert for unexpected errors
          alert(msg);
        }
      }
    })();
  };

  const handleCancel = () => {
    // If origin was provided (eg: consultas), return there. Default to calendar.
    try {
      const origin = searchParams?.get?.('origin');
      if (origin === 'consultas') {
        router.push('/consultas');
        return;
      }
    } catch (e) {
      // fallback
    }
    router.push("/calendar");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderAgenda />
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-8">
    <CalendarRegistrationForm 
      formData={formData as any} 
      onFormChange={handleFormChange as any} 
      createMode
    />
      </main>
      <FooterAgenda onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}