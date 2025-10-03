"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, ChevronDown, Calculator, DollarSign } from "lucide-react";
import { Plus } from "lucide-react";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function FinanceiroPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [bloqueio, setBloqueio] = useState(false);

  const isAg = pathname?.startsWith("/agendamento");
  const isPr = pathname?.startsWith("/procedimento");
  const isFi = pathname?.startsWith("/financeiro");

  return (
    <div className="w-full min-h-screen flex flex-col bg-background">
      {/* HEADER */}
      <HeaderAgenda />

      {/* CORPO */}
      <main className="mx-auto w-full max-w-7xl px-8 py-6 space-y-6 flex-grow">
        {/* INFORMAÇÕES FINANCEIRAS */}
        <section className="space-y-6">
          {/* Selo Financeiro */}
          <div className="inline-flex items-center gap-2 border border-border px-3 py-1.5 bg-card text-[12px] rounded-md cursor-pointer hover:bg-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <DollarSign className="h-3 w-3" strokeWidth={2} />
            </span>
            <span className="text-foreground">Informações Financeiras</span>
          </div>

          {/* Traço separador */}
          <div className="border-b border-border" />

          {/* VALOR DO ATENDIMENTO */}
          <div className="space-y-4">
            <Label className="text-[13px] text-foreground/80">
              Valor do Atendimento
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor Particular</Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="R$ 0,00"
                    className="h-10 w-full rounded-md pl-8 pr-4 border-input focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor Convênio</Label>
                <div className="relative">
                  <DollarSign className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="R$ 0,00"
                    className="h-10 w-full rounded-md pl-8 pr-4 border-input focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traço separador */}
          <div className="border-b border-border" />

          {/* FORMA DE PAGAMENTO */}
          <div className="space-y-4">
            <Label className="text-[13px] text-foreground/80">
              Forma de Pagamento
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background text-foreground pr-8 pl-3 text-[13px] appearance-none">
                  <option value="">Selecionar</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                  <option value="pix">PIX</option>
                  <option value="convenio">Convênio</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Parcelas</Label>
                <select className="h-10 w-full rounded-md border border-input bg-background text-foreground pr-8 pl-3 text-[13px] appearance-none">
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                  <option value="6">6x</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Desconto</Label>
                <div className="relative">
                  <Calculator className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="0%"
                    className="h-10 w-full rounded-md pl-8 pr-4 border-input focus-visible:ring-1 focus-visible:ring-sky-500 focus-visible:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Traço separador */}
          <div className="border-b border-border" />

          {/* RESUMO FINANCEIRO */}
          <div className="space-y-4">
            <Label className="text-[13px] text-foreground/80">
              Resumo Financeiro
            </Label>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal:</span>
                <span className="text-sm font-medium text-foreground">R$ 0,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Desconto:</span>
                <span className="text-sm font-medium text-foreground">- R$ 0,00</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-foreground">Total:</span>
                  <span className="text-lg font-bold text-primary">R$ 0,00</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ FIXO */}
      <FooterAgenda />
    </div>
  );
}