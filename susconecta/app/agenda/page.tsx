"use client";

import { useRouter } from "next/navigation";
import { CalendarRegistrationForm } from "@/components/forms/calendar-registration-form";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function NovoAgendamentoPage() {
  const router = useRouter();

  const handleSave = (data: any) => {
    console.log("Salvando novo agendamento...", data);
    alert("Novo agendamento salvo (simulado)!");
    router.push("/consultas"); 
  };

  const handleCancel = () => {
    router.back(); 
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAgenda />
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-8">
        <CalendarRegistrationForm 
            onSave={handleSave} 
            onCancel={handleCancel} 
            initialData={{}} 
        />
      </main>
      <FooterAgenda />
    </div>
  );
}