"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, ChevronDown } from "lucide-react";
import { Plus } from "lucide-react";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function ProcedimentoPage() {
  const router = useRouter();
  
  const handleSave = () => {
    // Lógica de salvar será implementada
    console.log("Salvando procedimentos...");
  };

  const handleCancel = () => {
    router.push("/calendar");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <HeaderAgenda />

      {/* CORPO */}
      <main className="mx-auto w-full max-w-7xl px-8 py-6 space-y-6 flex-1 overflow-auto">
        {/* ATENDIMENTOS */}
        <section className="space-y-6">
          {/* Selo Atendimento com + dentro da bolinha */}
          <div className="inline-flex items-center gap-2 border border-border px-3 py-1.5 bg-card text-[12px] rounded-md cursor-pointer hover:bg-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <Plus className="h-3 w-3" strokeWidth={2} />
            </span>
            <span className="text-foreground">Atendimento</span>
          </div>

          {/* Traço separador */}
          <div className="border-b border-border" />

          {/* PROCEDIMENTOS */}
          <div className="space-y-1">
            <Label className="text-[13px] text-foreground/80">
              Procedimentos
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar"
                className="h-10 w-full rounded-md pl-8 pr-8 border-input focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
              />
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Traço separador */}
          <div className="border-b border-border" />

          {/* OUTRAS DESPESAS */}
          <div className="space-y-1">
            <Label className="text-[13px] text-foreground/80">
              Outras despesas
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar"
                className="h-10 w-full rounded-md pl-8 pr-8 border-input focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
              />
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ FIXO */}
      <FooterAgenda onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
