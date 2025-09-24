"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Search, ChevronDown, Upload, FileDown, Tag } from "lucide-react";

// Este é um formulário genérico para Criar e Editar um agendamento.
// Ele não tem Header ou Footer, apenas o conteúdo do formulário em si.

export function AppointmentForm({ initialData, onSave, onCancel }: any) {
  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    // Se os dados iniciais mudarem (ex: usuário clica em outro item para editar),
    // atualizamos o estado do formulário.
    setFormData(initialData || {});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ==== INFORMAÇÕES DO PACIENTE ==== */}
      <div className="border rounded-md p-6 space-y-4 bg-white">
        <h2 className="font-medium">Informações do paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <Label>Nome *</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  name="patientName" // Nome do campo para o estado
                  placeholder="Digite o nome do paciente"
                  className="h-10 pl-8"
                  value={formData.patientName || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <Label>CPF do paciente</Label>
              <Input name="cpf" placeholder="Número do CPF" className="h-10" value={formData.cpf || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-3">
              <Label>RG</Label>
              <Input name="rg" placeholder="Número do RG" className="h-10" value={formData.rg || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-6">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5">
                  <Label>Data de nascimento *</Label>
                  <Input name="birthDate" type="date" className="h-10" value={formData.birthDate || ''} onChange={handleChange} />
                </div>
                <div className="col-span-7">
                  <Label>Telefone</Label>
                  <div className="grid grid-cols-[86px_1fr] gap-2">
                    <select name="phoneCode" className="h-10 rounded-md border border-input bg-background px-2 text-[13px]" value={formData.phoneCode || '+55'} onChange={handleChange}>
                      <option value="+55">+55</option>
                      <option value="+351">+351</option>
                      <option value="+1">+1</option>
                    </select>
                    <Input name="phoneNumber" placeholder="(99) 99999-9999" className="h-10" value={formData.phoneNumber || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-6">
              <Label>E-mail</Label>
              <Input name="email" type="email" placeholder="email@exemplo.com" className="h-10" value={formData.email || ''} onChange={handleChange} />
            </div>
        </div>
      </div>

      {/* ==== INFORMAÇÕES DO ATENDIMENTO ==== */}
      <div className="border rounded-md p-6 space-y-4 bg-white">
        <h2 className="font-medium">Informações do atendimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-6 space-y-3">
                <div>
                    <Label className="text-[13px]">Nome do profissional *</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="professionalName" className="h-10 w-full rounded-full border border-input pl-8 pr-12 text-[13px]" value={formData.professionalName || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-[13px]">Unidade *</Label>
                        <select name="unit" className="h-10 w-full rounded-md border border-input bg-background pr-8 pl-3 text-[13px] appearance-none" value={formData.unit || 'nei'} onChange={handleChange}>
                            <option value="nei">Núcleo de Especialidades Integradas</option>
                            <option value="cc">Clínica Central</option>
                        </select>
                    </div>
                    <div>
                        <Label className="text-[13px]">Data *</Label>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input name="appointmentDate" type="date" className="h-10 w-full rounded-md border border-input pl-8 pr-3 text-[13px]" value={formData.appointmentDate || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 md:col-span-3">
                        <Label className="text-[13px]">Início *</Label>
                        <Input name="startTime" type="time" className="h-10 w-full rounded-md border border-input px-3 text-[13px]" value={formData.startTime || ''} onChange={handleChange} />
                    </div>
                    <div className="col-span-12 md:col-span-3">
                        <Label className="text-[13px]">Término *</Label>
                        <Input name="endTime" type="time" className="h-10 w-full rounded-md border border-input px-3 text-[13px]" value={formData.endTime || ''} onChange={handleChange} />
                    </div>
                </div>
            </div>
            <div className="md:col-span-6">
                <div className="mb-2">
                    <Label className="text-[13px]">Tipo de atendimento *</Label>
                    <div className="relative mt-1">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input name="appointmentType" placeholder="Pesquisar" className="h-10 w-full rounded-md border border-input pl-8 pr-8 text-[13px]" value={formData.appointmentType || ''} onChange={handleChange} />
                    </div>
                </div>
                <div>
                    <Label className="text-[13px]">Observações</Label>
                    <Textarea name="notes" rows={4} className="text-[13px] h-[110px] min-h-0 resize-none" value={formData.notes || ''} onChange={handleChange} />
                </div>
            </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar</Button>
      </div>
    </form>
  );
}
