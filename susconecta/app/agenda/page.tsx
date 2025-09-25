"use client";

import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/forms/appointment-form";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function NovoAgendamentoPage() {
  const router = useRouter();

  const handleSave = (data: any) => {
    console.log("Salvando novo agendamento...", data);
    // Aqui viria a chamada da API para criar um novo agendamento
    alert("Novo agendamento salvo (simulado)!");
    router.push("/consultas"); // Volta para a lista após salvar
  };

  const handleCancel = () => {
    router.back(); // Simplesmente volta para a página anterior
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeaderAgenda />
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-8">
        <AppointmentForm 
            onSave={handleSave} 
            onCancel={handleCancel} 
            initialData={{}} // Passa um objeto vazio para o modo de criação
        />
      </main>
      <FooterAgenda />
    </div>
  );
}