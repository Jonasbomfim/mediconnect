"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { User, FolderOpen, X, Users, MessageSquare, ClipboardList } from "lucide-react"
import { Calendar as CalendarIcon, FileText, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pacientes = [
  { nome: "Ana Souza", cpf: "123.456.789-00", idade: 42, statusLaudo: "Finalizado" },
  { nome: "Bruno Lima", cpf: "987.654.321-00", idade: 33, statusLaudo: "Pendente" },
  { nome: "Carla Menezes", cpf: "111.222.333-44", idade: 67, statusLaudo: "Rascunho" },
];

const medico = {
  nome: "Dr. Carlos Andrade",
  identificacao: "CRM 000000 • Cardiologia",
  fotoUrl: "",
}

const ProfissionalPage = () => {
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);

  const handleSave = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("Laudo salvo!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSmoothScroll = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleAbrirProntuario = (paciente: any) => {
    setPacienteSelecionado(paciente);
    
    // Preencher campos da seção Gestão de Laudos
    const pacienteLaudo = document.getElementById('pacienteLaudo') as HTMLInputElement;
    
    if (pacienteLaudo) pacienteLaudo.value = paciente.nome;
    
    // Preencher campos da seção Comunicação com o Paciente
    const destinatario = document.getElementById('destinatario') as HTMLInputElement;
    
    if (destinatario) destinatario.value = `${paciente.nome} - ${paciente.cpf}`;
    
    // Rolar para a seção do prontuário
    const prontuarioSection = document.getElementById('prontuario-paciente');
    if (prontuarioSection) {
      prontuarioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFecharProntuario = () => {
    setPacienteSelecionado(null);
  };

  return (
    <TooltipProvider>
    <div className="container mx-auto px-4 py-8">
      <header className="bg-white shadow-md rounded-lg p-4 mb-6 flex items-center gap-4">
  <Avatar className="h-12 w-12">
    <AvatarImage src={medico.fotoUrl} alt={medico.nome} />
    <AvatarFallback className="bg-muted">
      <User className="h-5 w-5" />
    </AvatarFallback>
  </Avatar>
  <div className="min-w-0">
      <p className="text-sm text-muted-foreground truncate">Conta do profissional</p>
      <h2 className="text-lg font-semibold leading-none truncate">{medico.nome}</h2>
      <p className="text-sm text-muted-foreground truncate">{medico.identificacao}</p>
    </div>
    </header>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="md:sticky md:top-8 h-fit">
          <nav className="bg-white shadow-md rounded-lg p-3 space-y-1">
            <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary hover:text-primary-foreground">
              <a 
                href="#calendario" 
                onClick={(e) => handleSmoothScroll(e, 'calendario')}
                className="flex items-center"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Calendário
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary hover:text-primary-foreground">
              <a 
                href="#gerenciamento-pacientes" 
                onClick={(e) => handleSmoothScroll(e, 'gerenciamento-pacientes')}
                className="flex items-center"
              >
                <Users className="mr-2 h-4 w-4" />
                Pacientes
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary hover:text-primary-foreground">
              <a 
                href="#prontuario-paciente" 
                onClick={(e) => handleSmoothScroll(e, 'prontuario-paciente')}
                className="flex items-center"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Prontuário
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary hover:text-primary-foreground">
              <a 
                href="#gestao-laudos" 
                onClick={(e) => handleSmoothScroll(e, 'gestao-laudos')}
                className="flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
                Laudos
              </a>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start hover:bg-primary hover:text-primary-foreground">
              <a 
                href="#comunicacao-paciente" 
                onClick={(e) => handleSmoothScroll(e, 'comunicacao-paciente')}
                className="flex items-center"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comunicação
              </a>
            </Button>
            <Button variant="ghost" className="w-full justify-start cursor-pointer hover:bg-primary hover:text-primary-foreground">
              <Settings className="mr-2 h-4 w-4" />
              Meu Perfil
            </Button>
          </nav>
        </aside>


        <main>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Área do Profissional de Saúde</h1>
            <Button asChild>
              <Link href="/">Início</Link>
            </Button>
          </div>
          <p className="mb-8">Bem-vindo à sua área exclusiva.</p>

          <section id="calendario" className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Calendário</h2>
            <p className="text-sm text-muted-foreground">
              Seção do calendário (integração pode ser adicionada depois).
            </p>
          </section>

          <div id="gerenciamento-pacientes" className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Gerenciamento de Pacientes</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Status do laudo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes.map((paciente) => (
                  <TableRow key={paciente.cpf}>
                    <TableCell className="font-medium">{paciente.nome}</TableCell>
                    <TableCell>{paciente.cpf}</TableCell>
                    <TableCell>{paciente.idade}</TableCell>
                    <TableCell>{paciente.statusLaudo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                              onClick={() => handleAbrirProntuario(paciente)}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Detalhes do Paciente</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div id="prontuario-paciente" className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Prontuário do Paciente</h2>
            {pacienteSelecionado && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-primary">Dados do Paciente</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFecharProntuario}
                    className="text-primary hover:text-primary hover:bg-primary/10 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-primary">Nome:</span>
                    <p className="text-primary/80">{pacienteSelecionado.nome}</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">CPF:</span>
                    <p className="text-primary/80">{pacienteSelecionado.cpf}</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">Idade:</span>
                    <p className="text-primary/80">{pacienteSelecionado.idade} anos</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div>
                <Label htmlFor="dataConsulta">Data da consulta</Label>
                <p id="dataConsulta" className="text-sm text-muted-foreground">
                  03/09/2025
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cid10">CID-10</Label>
                  <Input id="cid10" placeholder="Insira o código CID-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retornoAgendado">Retorno Agendado</Label>
                  <Input id="retornoAgendado" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="anamnese">Anamnese</Label>
                <Textarea id="anamnese" placeholder="Descreva a anamnese do paciente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exameFisico">Exame Físico</Label>
                <Textarea id="exameFisico" placeholder="Descreva o exame físico" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hipoteses">Hipóteses Diagnósticas</Label>
                <Textarea id="hipoteses" placeholder="Liste as hipóteses diagnósticas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conduta">Conduta Médica</Label>
                <Textarea id="conduta" placeholder="Descreva a conduta médica" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prescricoes">Prescrições</Label>
                <Textarea id="prescricoes" placeholder="Insira as prescrições" />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave}>Salvar Informações</Button>
              </div>
            </div>
          </div>

          <section id="gestao-laudos" className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Gestão de Laudos</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tipoLaudo">Tipo de laudo</Label>
                  <Select name="tipoLaudo">
                    <SelectTrigger id="tipoLaudo" className="hover:border-primary focus:border-primary cursor-pointer">
                      <SelectValue placeholder="Selecione o tipo de laudo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 ">
                      <SelectItem value="exame-sangue" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Exame de Sangue</SelectItem>
                      <SelectItem value="raio-x" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Raio‑X</SelectItem>
                      <SelectItem value="ultrassom" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Ultrassom</SelectItem>
                      <SelectItem value="tomografia" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Tomografia</SelectItem>
                      <SelectItem value="ressonancia" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Ressonância</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pacienteLaudo">Paciente</Label>
                  <Input 
                    id="pacienteLaudo" 
                    placeholder="Nome do Paciente" 
                    disabled 
                    className="bg-muted cursor-not-allowed text-gray-700 disabled:text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="medicoResponsavel">Médico Responsável</Label>
                  <p id="medicoResponsavel" className="text-sm text-muted-foreground">
                    Dr. Carlos Andrade
                  </p>
                </div>
                <div>
                  <Label htmlFor="dataEmissao">Data de emissão</Label>
                  <p id="dataEmissao" className="text-sm text-muted-foreground">
                    03/09/2025
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conteudoLaudo">Conteúdo do Laudo</Label>
                <Textarea
                  id="conteudoLaudo"
                  placeholder="Insira o conteúdo detalhado do laudo"
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select>
                    <SelectTrigger id="status" className="hover:border-primary focus:border-primary cursor-pointer">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="rascunho" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Rascunho</SelectItem>
                      <SelectItem value="finalizado" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Finalizado</SelectItem>
                      <SelectItem value="pendente" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assinatura">Assinatura digital (CRM)</Label>
                  <Input id="assinatura" placeholder="Insira seu CRM para assinar" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave}>Salvar Laudo</Button>
              </div>
            </div>
          </section>

          <div id="comunicacao-paciente" className="bg-white shadow-md rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Comunicação com o Paciente</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="destinatario">Destinatário</Label>
                  <Input 
                    id="destinatario" 
                    placeholder="Nome do Paciente ou CPF" 
                    disabled 
                    className="bg-muted cursor-not-allowed text-gray-700 disabled:text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoMensagem">Tipo de mensagem</Label>
                  <Select>
                    <SelectTrigger id="tipoMensagem" className="hover:border-primary focus:border-primary cursor-pointer">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="lembrete" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Lembrete de Consulta</SelectItem>
                      <SelectItem value="resultado" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Resultado de Exame</SelectItem>
                      <SelectItem value="instrucao" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Instruções Pós-Consulta</SelectItem>
                      <SelectItem value="outro" className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground cursor-pointer">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dataEnvio">Data de envio</Label>
                  <p id="dataEnvio" className="text-sm text-muted-foreground">03/09/2025</p>
                </div>
                <div>
                  <Label htmlFor="statusEntrega">Status da entrega</Label>
                  <p id="statusEntrega" className="text-sm text-muted-foreground">Pendente</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resposta do paciente</Label>
                <div className="border rounded-md p-3 bg-muted/40 space-y-2">
                  <p className="text-sm">"Ok, obrigado pelo lembrete!"</p>
                  <p className="text-xs text-muted-foreground">03/09/2025 14:30</p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave}>Registrar Comunicação</Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default ProfissionalPage;
