"use client";

import { useRouter } from "next/navigation";
import { CalendarRegistrationForm } from "@/components/forms/calendar-registration-form";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";
import { useState } from "react";

interface FormData {
  patientName?: string;
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
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({});

  const handleFormChange = (data: FormData) => {
    setFormData(data);
  };

  const handleSave = () => {
    console.log("Salvando novo agendamento...", formData);
    alert("Novo agendamento salvo (simulado)!");
    router.push("/consultas"); 
  };

  const handleCancel = () => {
    router.back(); 
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderAgenda />
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-8">
        <CalendarRegistrationForm 
            formData={formData} 
            onFormChange={handleFormChange} 
        />
      </main>
      <FooterAgenda onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}