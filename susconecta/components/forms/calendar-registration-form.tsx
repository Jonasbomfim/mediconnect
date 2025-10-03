
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Search, ChevronDown } from "lucide-react";

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

interface CalendarRegistrationFormProperties {
  formData: FormData;
  onFormChange: (data: FormData) => void;
}

const formatValidityDate = (value: string) => {
  const cleaned = value.replaceAll(/\D/g, "");
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }
  if (cleaned.length > 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
};

export function CalendarRegistrationForm({ formData, onFormChange }: CalendarRegistrationFormProperties) {
  const [isAdditionalInfoOpen, setIsAdditionalInfoOpen] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === 'validade') {
        const formattedValue = formatValidityDate(value);
        onFormChange({ ...formData, [name]: formattedValue });
    } else {
        onFormChange({ ...formData, [name]: value });
    }
  };

  return (
    <form className="space-y-8">
      <div className="border border-border rounded-md p-6 space-y-4 bg-card">
        <h2 className="font-medium text-foreground">Informações do paciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 space-y-2">
              <Label className="text-[13px]">Nome *</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="patientName" 
                  placeholder="Digite o nome do paciente"
                  className="h-11 pl-8 rounded-md transition-colors hover:bg-muted/30"
                  value={formData.patientName || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[13px]">CPF do paciente</Label>
              <Input name="cpf" placeholder="Número do CPF" className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.cpf || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[13px]">RG</Label>
              <Input name="rg" placeholder="Número do RG" className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.rg || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[13px]">Data de nascimento *</Label>
              <Input name="birthDate" type="date" className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.birthDate || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[13px]">Telefone</Label>
              <div className="flex gap-2">
                <select name="phoneCode" className="h-11 w-20 rounded-md border border-gray-300 dark:border-input bg-background text-foreground px-2 text-[13px] transition-colors hover:bg-muted/30 hover:border-gray-400" value={formData.phoneCode || '+55'} onChange={handleChange}>
                  <option value="+55">+55</option>
                  <option value="+351">+351</option>
                  <option value="+1">+1</option>
                </select>
                <Input name="phoneNumber" placeholder="(99) 99999-9999" className="h-11 flex-1 rounded-md transition-colors hover:bg-muted/30" value={formData.phoneNumber || ''} onChange={handleChange} />
              </div>
            </div>
            <div className="md:col-span-6 space-y-2">
              <Label className="text-[13px]">E-mail</Label>
              <Input name="email" type="email" placeholder="email@exemplo.com" className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.email || ''} onChange={handleChange} />
            </div>
            <div className="md:col-span-6 space-y-2">
              <Label className="text-[13px]">Convênio</Label>
              <div className="relative">
                <select name="convenio" className="h-11 w-full rounded-md border border-gray-300 dark:border-input bg-background text-foreground pr-8 pl-3 text-[13px] appearance-none transition-colors hover:bg-muted/30 hover:border-gray-400" value={formData.convenio || ''} onChange={handleChange}>
                    <option value="" disabled>Selecione um convênio</option>
                    <option value="sulamerica">Sulamérica</option>
                    <option value="bradesco">Bradesco Saúde</option>
                    <option value="amil">Amil</option>
                    <option value="unimed">Unimed</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="md:col-span-6 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-[13px]">Matrícula</Label>
                        <Input name="matricula" placeholder="000000000" maxLength={9} className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.matricula || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Validade</Label>
                        <Input name="validade" placeholder="00/00/0000" className="h-11 rounded-md transition-colors hover:bg-muted/30" value={formData.validade || ''} onChange={handleChange} />
                    </div>
                </div>
            </div>
            <div className="md:col-span-12 space-y-2">
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsAdditionalInfoOpen(!isAdditionalInfoOpen)}
                >
                    <Label className="text-sm font-medium cursor-pointer">Informações adicionais</Label>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isAdditionalInfoOpen ? 'rotate-180' : ''}`} />
                </div>
                {isAdditionalInfoOpen && (
                    <div className="space-y-2">
                        <Label className="text-[13px]">Documentos e anexos</Label>
                        <Textarea name="documentos" rows={5} className="text-[13px] resize-none rounded-md transition-colors hover:bg-muted/30" value={formData.documentos || ''} onChange={handleChange} />
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="border border-border rounded-md p-6 space-y-4 bg-card">
        <h2 className="font-medium text-foreground">Informações do atendimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[13px]">Nome do profissional *</Label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input name="professionalName" className="h-11 w-full rounded-md pl-8 pr-12 text-[13px] transition-colors hover:bg-muted/30" value={formData.professionalName || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-[13px]">Unidade *</Label>
                        <select name="unit" className="h-11 w-full rounded-md border border-gray-300 dark:border-input bg-background text-foreground pr-8 pl-3 text-[13px] appearance-none transition-colors hover:bg-muted/30 hover:border-gray-400" value={formData.unit || 'nei'} onChange={handleChange}>
                            <option value="nei">Núcleo de Especialidades Integradas</option>
                            <option value="cc">Clínica Central</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Data *</Label>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input name="appointmentDate" type="date" className="h-11 w-full rounded-md pl-8 pr-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.appointmentDate || ''} onChange={handleChange} />
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label className="text-[13px]">Início *</Label>
                        <Input name="startTime" type="time" className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.startTime || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Término *</Label>
                        <Input name="endTime" type="time" className="h-11 w-full rounded-md px-3 text-[13px] transition-colors hover:bg-muted/30" value={formData.endTime || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[13px]">Profissional solicitante</Label>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <select name="requestingProfessional" className="h-11 w-full rounded-md border border-gray-300 dark:border-input bg-background text-foreground pr-8 pl-8 text-[13px] appearance-none transition-colors hover:bg-muted/30 hover:border-gray-400" value={formData.requestingProfessional || ''} onChange={handleChange}>
                                <option value="" disabled>Selecione solicitante</option>
                                <option value="dr-a">Dr. A</option>
                                <option value="dr-b">Dr. B</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-[13px]">Tipo de atendimento *</Label>
                        <div className="flex items-center space-x-2">
                            <Input type="checkbox" id="reembolso" className="h-4 w-4" />
                            <Label htmlFor="reembolso" className="text-[13px] font-medium">Pagamento via Reembolso</Label>
                        </div>
                    </div>
                    <div className="relative mt-1">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input name="appointmentType" placeholder="Pesquisar" className="h-11 w-full rounded-md pl-8 pr-8 text-[13px] transition-colors hover:bg-muted/30" value={formData.appointmentType || ''} onChange={handleChange} />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-[13px]">Observações</Label>
                        <div className="flex items-center space-x-2">
                            <Input type="checkbox" id="imprimir" className="h-4 w-4" />
                            <Label htmlFor="imprimir" className="text-[13px] font-medium">Imprimir na Etiqueta / Pulseira</Label>
                        </div>
                    </div>
                    <Textarea name="notes" rows={6} className="text-[13px] min-h-[120px] resize-none rounded-md transition-colors hover:bg-muted/30" value={formData.notes || ''} onChange={handleChange} />
                </div>
            </div>
        </div>
      </div>

    </form>
  );
}
