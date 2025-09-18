"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";

import {
  RotateCcw,
  Accessibility,
  Volume2,
  Flame,
  Settings,
  Clipboard,
  Search,
  ChevronDown,
  Upload,
  FileDown,
  Tag,
  Save,
} from "lucide-react";
import HeaderAgenda from "@/components/agenda/HeaderAgenda";
import FooterAgenda from "@/components/agenda/FooterAgenda";

export default function NovoAgendamentoPage() {
  const [bloqueio, setBloqueio] = useState(false);

  return (
    // ====== WRAPPER COM ESPAÇAMENTO GERAL ======
    <div className="min-h-screen flex flex-col bg-white">
      {/* HEADER fora do <main>, usando o MESMO container do footer */}
      <HeaderAgenda />

      {/* Conteúdo */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-8 py-8 space-y-8">
        {/* ==== INFORMAÇÕES DO PACIENTE — layout idêntico ao print ==== */}
        <div className="border rounded-md p-6 space-y-4 bg-white">
          <h2 className="font-medium">Informações do paciente</h2>

          {/* grade principal: 12 colunas para controlar as larguras */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* ===== Linha 1 ===== */}
            <div className="md:col-span-6">
              <Label>Nome *</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite o nome do paciente"
                  className="h-10 pl-8"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <Label>CPF do paciente</Label>
              <Input placeholder="Número do CPF" className="h-10" />
            </div>

            <div className="md:col-span-3">
              <Label>RG</Label>
              <Input placeholder="Número do RG" className="h-10" />
            </div>

            {/* ===== Linha 2 ===== */}
            {/* 1ª coluna (span 6) com sub-grid: Data (5 col) + Telefone (7 col) */}
            <div className="md:col-span-6">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label>Data de nascimento *</Label>
                  <Input type="date" className="h-10" />
                </div>

                <div className="col-span-7">
                  <Label>Telefone</Label>
                  <div className="grid grid-cols-[86px_1fr] gap-2">
                    <select className="h-10 rounded-md border border-input bg-background px-2 text-[13px]">
                      <option value="+55">+55</option>
                      <option value="+351">+351</option>
                      <option value="+1">+1</option>
                    </select>
                    <Input placeholder="(99) 99999-9999" className="h-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* 2ª coluna da linha 2: E-mail (span 6) */}
            <div className="md:col-span-6">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                className="h-10"
              />
            </div>

            {/* ===== Linha 3 ===== */}
            <div className="md:col-span-6">
              <Label>Convênio</Label>
              <div className="relative">
                <select
                  defaultValue="particular"
                  className="h-10 w-full rounded-md border border-input bg-background pr-8 pl-3 text-[13px] appearance-none"
                >
                  <option value="particular">Particular</option>
                  <option value="plano-a">Plano A</option>
                  <option value="plano-b">Plano B</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="md:col-span-6 grid grid-cols-2 gap-4">
              <div>
                <Label>Matrícula</Label>
                <Input defaultValue="000000000" className="h-10" />
              </div>
              <div>
                <Label>Validade</Label>
                <Input placeholder="00/0000" className="h-10" />
              </div>
            </div>
          </div>

          {/* link Informações adicionais */}
          <button
            type="button"
            className="text-sm text-blue-600 inline-flex items-center gap-1 hover:underline"
            aria-label="Ver informações adicionais do paciente"
          >
            Informações adicionais
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* barra Documentos e anexos */}
          <div className="flex items-center justify-between border rounded-md px-3 py-2">
            <span className="text-sm">Documentos e anexos</span>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Enviar documento"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Baixar documento"
              >
                <FileDown className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                aria-label="Gerenciar etiquetas"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ==== INFORMAÇÕES DO ATENDIMENTO ==== */}
        <div className="border rounded-md p-6 space-y-4 bg-white">
          <h2 className="font-medium">Informações do atendimento</h2>

          {/* GRID PRINCIPAL: 12 colunas */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA (span 6) */}
            <div className="md:col-span-6 space-y-3">
              {/* Nome do profissional */}
              <div>
                <Label className="text-[13px]">
                  Nome do profissional <span className="text-red-600">*</span>
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    defaultValue="Robson Alves dos Anjos Neto"
                    className="h-10 w-full rounded-full border border-input pl-8 pr-12 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-muted px-2 text-xs font-medium">
                    RA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Unidade */}
                <div>
                  <Label className="text-[13px]">
                    Unidade <span className="text-red-600">*</span>
                  </Label>
                  <select
                    defaultValue="nei"
                    className="h-10 w-full rounded-md border border-input bg-background pr-8 pl-3 text-[13px] appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="nei">
                      Núcleo de Especialidades Integradas
                    </option>
                    <option value="cc">Clínica Central</option>
                  </select>
                </div>

                {/* Data com ícone */}
                <div>
                  <Label className="text-[13px]">
                    Data <span className="text-red-600">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      defaultValue="2025-07-29"
                      className="h-10 w-full rounded-md border border-input pl-8 pr-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Início / Término / Profissional solicitante (na mesma linha) */}
              <div className="grid grid-cols-12 gap-3 items-end">
                {/* Início (maior) */}
                <div className="col-span-12 md:col-span-3">
                  <Label className="text-[13px]">
                    Início <span className="text-red-600">*</span>
                  </Label>
                  <input
                    type="time"
                    defaultValue="21:03"
                    className="h-10 w-full rounded-md border border-input px-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Término (maior) */}
                <div className="col-span-12 md:col-span-3">
                  <Label className="text-[13px]">
                    Término <span className="text-red-600">*</span>
                  </Label>
                  <input
                    type="time"
                    defaultValue="21:03"
                    className="h-10 w-full rounded-md border border-input px-3 text-[13px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Profissional solicitante */}
                <div className="col-span-12 md:col-span-6">
                  <Label className="text-[13px]">
                    Profissional solicitante
                  </Label>
                  <div className="relative">
                    {/* ícone de busca à esquerda */}
                    <svg
                      className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>

                    <select
                      defaultValue=""
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-8 text-[13px] appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        Selecione o solicitante
                      </option>
                      <option value="1">Dr. Carlos Silva</option>
                      <option value="2">Dra. Maria Santos</option>
                    </select>

                    <svg
                      className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA — altura/posição como a imagem 1 */}
            <div className="md:col-span-6 relative -top-10">
              {/* toolbar */}
              <div className="mb-2 flex items-center justify-end gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Accessibility className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Volume2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Flame className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8">
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>

              {/* Tipo de atendimento + campo de busca */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px]">
                    Tipo de atendimento <span className="text-red-600">*</span>
                  </Label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-current"
                    />{" "}
                    Pagamento via Reembolso
                  </label>
                </div>

                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar"
                    className="h-10 w-full rounded-md border border-input pl-8 pr-8 text-[13px]"
                  />
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Observações + imprimir */}
              <div className="mb-0.2 flex items-center justify-between">
                <Label className="text-[13px]">Observações</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-current"
                  />{" "}
                  Imprimir na Etiqueta / Pulseira
                </label>
              </div>

              {/* Textarea mais baixo e compacto */}
              <Textarea
                rows={4}
                placeholder=""
                className="text-[13px] h-[110px] min-h-0 resize-none"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ====== FOOTER FIXO ====== */}
      <FooterAgenda />
    </div>
  );
}
