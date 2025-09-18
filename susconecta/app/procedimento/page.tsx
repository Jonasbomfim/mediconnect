"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, ChevronDown, RotateCcw } from "lucide-react";
import { Plus } from "lucide-react";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function ProcedimentoPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [bloqueio, setBloqueio] = useState(false);

  const isAg = pathname?.startsWith("/agendamento");
  const isPr = pathname?.startsWith("/procedimento");
  const isFi = pathname?.startsWith("/financeiro");
  const tab = (active: boolean, extra = "") =>
    `px-4 py-1.5 text-[13px] border ${
      active
        ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
        : "text-gray-700 hover:bg-gray-100"
    } ${extra}`;

  return (
    <div className="w-full min-h-screen flex flex-col bg-white">
      {/* HEADER */}
      <HeaderAgenda />

      {/* CORPO */}
      <main className="mx-auto w-full max-w-7xl px-8 py-6 space-y-6 flex-grow">
        {/* ATENDIMENTOS */}
        <section className="space-y-6">
          {/* Selo Atendimento com + dentro da bolinha */}
          <div className="inline-flex items-center gap-2 border px-3 py-1.5 bg-white text-[12px] rounded-md cursor-pointer hover:bg-gray-50">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 bg-gray-100 text-gray-700">
              <Plus className="h-3 w-3" strokeWidth={2} />
            </span>
            Atendimento
          </div>

          {/* Traço separador */}
          <div className="border-b border-gray-200" />

          {/* PROCEDIMENTOS */}
          <div className="space-y-1">
            <Label className="text-[13px] text-foreground/80">
              Procedimentos
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar"
                className="h-10 w-full rounded-md pl-8 pr-8 border border-gray-300 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
              />
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          {/* Traço separador */}
          <div className="border-b border-gray-200" />

          {/* OUTRAS DESPESAS */}
          <div className="space-y-1">
            <Label className="text-[13px] text-foreground/80">
              Outras despesas
            </Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar"
                className="h-10 w-full rounded-md pl-8 pr-8 border border-gray-300 focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
              />
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ FIXO */}
      <FooterAgenda />
    </div>
  );
}
