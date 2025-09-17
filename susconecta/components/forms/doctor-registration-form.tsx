"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ChevronDown, ChevronUp, FileImage, Loader2, Save, Upload, User, X, XCircle, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Mock data and types since API is not used for now

type FormacaoAcademica = {
  instituicao: string;
  curso: string;
  ano_conclusao: string;
};

type DadosBancarios = {
  banco: string;
  agencia: string;
  conta: string;
  tipo_conta: string;
};

export type Medico = {
  id: string;
  nome?: string;
  nome_social?: string | null;
  cpf?: string;
  rg?: string | null;
  sexo?: string | null;
  data_nascimento?: string | null;
  telefone?: string;
  celular?: string;
  contato_emergencia?: string;
  email?: string;
  crm?: string;
  estado_crm?: string;
  rqe?: string;
  formacao_academica?: FormacaoAcademica[];
  curriculo_url?: string | null;
  especialidade?: string;
  observacoes?: string | null;
  foto_url?: string | null;
  tipo_vinculo?: string;
  dados_bancarios?: DadosBancarios;
  
  agenda_horario?: string;
  valor_consulta?: number | string;
};

type Mode = "create" | "edit";

export interface DoctorRegistrationFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  doctorId?: number | null;
  inline?: boolean;
  mode?: Mode;
  onSaved?: (medico: Medico) => void;
  onClose?: () => void;
}

type FormData = {
  photo: File | null;
  nome: string;
  nome_social: string;
  crm: string;
  estado_crm: string;
  rqe: string;
  formacao_academica: FormacaoAcademica[];
  curriculo: File | null;
  especialidade: string;
  cpf: string;
  rg: string;
  sexo: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  celular: string;
  contato_emergencia: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  anexos: File[];
  tipo_vinculo: string;
  dados_bancarios: DadosBancarios;
  
  agenda_horario: string;
  valor_consulta: string;
};

const initial: FormData = {
  photo: null,
  nome: "",
  nome_social: "",
  crm: "",
  estado_crm: "",
  rqe: "",
  formacao_academica: [],
  curriculo: null,
  especialidade: "",
  cpf: "",
  rg: "",
  sexo: "",
  data_nascimento: "",
  email: "",
  telefone: "",
  celular: "",
  contato_emergencia: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
  anexos: [],
  tipo_vinculo: "",
  dados_bancarios: {
    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
  },
  agenda_horario: "",
  valor_consulta: "",
};



export function DoctorRegistrationForm({
  open = true,
  onOpenChange,
  doctorId = null,
  inline = false,
  mode = "create",
  onSaved,
  onClose,
}: DoctorRegistrationFormProps) {
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState({ dados: true, contato: false, endereco: false, obs: false, formacao: false, admin: false });
  const [isSubmitting, setSubmitting] = useState(false);
  const [isSearchingCEP, setSearchingCEP] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverAnexos, setServerAnexos] = useState<any[]>([]);

  const title = useMemo(() => (mode === "create" ? "Cadastro de Médico" : "Editar Médico"), [mode]);

  useEffect(() => {
    // Data loading logic would go here in a real scenario
    if (mode === "edit" && doctorId) {
      console.log("Loading doctor data for ID:", doctorId);
      // Example: setForm(loadedDoctorData);
    }
  }, [mode, doctorId]);

  function setField<T extends keyof FormData>(k: T, v: FormData[T]) {
    setForm((s) => ({ ...s, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: "" }));
  }


  function addFormacao() {
    setField("formacao_academica", [
      ...form.formacao_academica,
      { instituicao: "", curso: "", ano_conclusao: "" },
    ]);
  }

  function removeFormacao(index: number) {
    const newFormacao = [...form.formacao_academica];
    newFormacao.splice(index, 1);
    setField("formacao_academica", newFormacao);
  }

  function handleFormacaoChange(index: number, field: keyof FormacaoAcademica, value: string) {
    const newFormacao = [...form.formacao_academica];
    newFormacao[index][field] = value;
    setField("formacao_academica", newFormacao);
  }

  function formatPhone(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length > 6) {
      return n.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    } else if (n.length > 2) {
      return n.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    }
    return n;
  }

  function formatRG(v: string) {
    v = v.replace(/\D/g, "").slice(0, 9);
    v = v.replace(/(\d{2})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  }

  function formatCPF(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => `${a}.${b}.${c}${d ? "-" + d : ""}`);
  }
  function handleCPFChange(v: string) {
    setField("cpf", formatCPF(v));
  }

  function formatCEP(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 8);
    return n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => `${a}${b ? "-" + b : ""}`);
  }
  async function fillFromCEP(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setSearchingCEP(true);
    try {
      // Mocking API call
      console.log("Searching CEP:", clean);
      // In a real app: const res = await buscarCepAPI(clean);
      // Mock response:
      const res = { logradouro: "Rua Fictícia", bairro: "Bairro dos Sonhos", localidade: "Cidade Exemplo", uf: "EX" };
      if (res) {
        setField("logradouro", res.logradouro ?? "");
        setField("bairro", res.bairro ?? "");
        setField("cidade", res.localidade ?? "");
        setField("estado", res.uf ?? "");
      }
    } catch {
      setErrors((e) => ({ ...e, cep: "Erro ao buscar CEP" }));
    } finally {
      setSearchingCEP(false);
    }
  }

  function validateLocal(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.cpf.trim()) e.cpf = "CPF é obrigatório";
    if (!form.crm.trim()) e.crm = "CRM é obrigatório";
    if (!form.especialidade.trim()) e.especialidade = "Especialidade é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateLocal()) return;

    setSubmitting(true);
    console.log("Submitting form with data:", form);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      const savedData: Medico = {
        id: doctorId ? String(doctorId) : String(Date.now()),
        ...form,
      };
      onSaved?.(savedData);
      alert(mode === "create" ? "Médico cadastrado com sucesso! (simulado)" : "Médico atualizado com sucesso! (simulado)");
      if (inline) onClose?.();
      else onOpenChange?.(false);
    }, 1000);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, photo: "Arquivo muito grande. Máx 5MB." }));
      return;
    }
    setField("photo", f);
    const fr = new FileReader();
    fr.onload = (ev) => setPhotoPreview(String(ev.target?.result || ""));
    fr.readAsDataURL(f);
  }

  function addLocalAnexos(e: React.ChangeEvent<HTMLInputElement>) {
    const fs = Array.from(e.target.files || []);
    setField("anexos", [...form.anexos, ...fs]);
  }
  function removeLocalAnexo(idx: number) {
    const clone = [...form.anexos];
    clone.splice(idx, 1);
    setField("anexos", clone);
  }

  const content = (
    <>
      {errors.submit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Collapsible open={expanded.dados} onOpenChange={() => setExpanded((s) => ({ ...s, dados: !s.dados }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Pessoais e Profissionais
                  </span>
                  {expanded.dados ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FileImage className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" /> Carregar Foto
                        </span>
                      </Button>
                    </Label>
                    <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                    <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome *</Label>
                    <Input value={form.nome} onChange={(e) => setField("nome", e.target.value)} className={errors.nome ? "border-destructive" : ""} />
                    {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Nome Social</Label>
                    <Input value={form.nome_social} onChange={(e) => setField("nome_social", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>CRM *</Label>
                        <Input value={form.crm} onChange={(e) => setField("crm", e.target.value)} className={errors.crm ? "border-destructive" : ""} />
                        {errors.crm && <p className="text-sm text-destructive">{errors.crm}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Estado do CRM</Label>
                        <Input value={form.estado_crm} onChange={(e) => setField("estado_crm", e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Especialidade *</Label>
                        <Input value={form.especialidade} onChange={(e) => setField("especialidade", e.target.value)} className={errors.especialidade ? "border-destructive" : ""} />
                        {errors.especialidade && <p className="text-sm text-destructive">{errors.especialidade}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>RQE</Label>
                        <Input value={form.rqe} onChange={(e) => setField("rqe", e.target.value)} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Currículo</Label>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="curriculo-input" className="cursor-pointer">
                            <Button type="button" variant="outline" asChild>
                                <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Anexar PDF ou DOC
                                </span>
                            </Button>
                        </Label>
                        <Input
                            id="curriculo-input"
                            type="file"
                            className="hidden"
                            onChange={(e) => setField("curriculo", e.target.files?.[0] || null)}
                            accept=".pdf,.doc,.docx"
                        />
                        {form.curriculo && <span className="text-sm text-muted-foreground">{form.curriculo.name}</span>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CPF *</Label>
                    <Input
                      value={form.cpf}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={errors.cpf ? "border-destructive" : ""}
                    />
                    {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>RG</Label>
                    <Input 
                      value={form.rg} 
                      onChange={(e) => setField("rg", formatRG(e.target.value))}
                      maxLength={12}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={(v) => setField("sexo", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={form.data_nascimento} onChange={(e) => setField("data_nascimento", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.formacao} onOpenChange={() => setExpanded((s) => ({ ...s, formacao: !s.formacao }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Formação Acadêmica
                  </span>
                  {expanded.formacao ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                {form.formacao_academica.map((formacao, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-center">
                    <div className="space-y-2 col-span-2">
                      <Label>Instituição</Label>
                      <Input
                        value={formacao.instituicao}
                        onChange={(e) =>
                          handleFormacaoChange(index, "instituicao", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Curso</Label>
                      <Input
                        value={formacao.curso}
                        onChange={(e) =>
                          handleFormacaoChange(index, "curso", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ano de Conclusão</Label>
                      <Input
                        value={formacao.ano_conclusao}
                        onChange={(e) =>
                          handleFormacaoChange(index, "ano_conclusao", e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFormacao(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addFormacao}>
                  Adicionar Formação
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.contato} onOpenChange={() => setExpanded((s) => ({ ...s, contato: !s.contato }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span>Contato</span>
                  {expanded.contato ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={form.telefone} 
                      onChange={(e) => setField("telefone", formatPhone(e.target.value))}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Celular</Label>
                    <Input 
                      value={form.celular} 
                      onChange={(e) => setField("celular", formatPhone(e.target.value))}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contato de Emergência</Label>
                    <Input 
                      value={form.contato_emergencia} 
                      onChange={(e) => setField("contato_emergencia", formatPhone(e.target.value))}
                      placeholder="(XX) XXXXX-XXXX"
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.admin} onOpenChange={() => setExpanded((s) => ({ ...s, admin: !s.admin }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Administrativos e Financeiros
                  </span>
                  {expanded.admin ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Vínculo</Label>
                    <Select value={form.tipo_vinculo} onValueChange={(v) => setField("tipo_vinculo", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o vínculo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                        <SelectItem value="autonomo">Autônomo</SelectItem>
                        <SelectItem value="parceiro">Parceiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Consulta</Label>
                    <Input
                      type="number"
                      value={form.valor_consulta}
                      onChange={(e) => setField("valor_consulta", e.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Agenda/Horário</Label>
                  <Textarea
                    value={form.agenda_horario}
                    onChange={(e) => setField("agenda_horario", e.target.value)}
                    placeholder="Descreva os dias e horários de atendimento"
                  />
                </div>

                <div className="space-y-4">
                  <Label>Dados Bancários</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Banco</Label>
                      <Input
                        value={form.dados_bancarios.banco}
                        onChange={(e) => setField("dados_bancarios", { ...form.dados_bancarios, banco: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input
                        value={form.dados_bancarios.agencia}
                        onChange={(e) => setField("dados_bancarios", { ...form.dados_bancarios, agencia: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={form.dados_bancarios.conta}
                        onChange={(e) => setField("dados_bancarios", { ...form.dados_bancarios, conta: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de Conta</Label>
                      <Select
                        value={form.dados_bancarios.tipo_conta}
                        onValueChange={(v) => setField("dados_bancarios", { ...form.dados_bancarios, tipo_conta: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Conta Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.endereco} onOpenChange={() => setExpanded((s) => ({ ...s, endereco: !s.endereco }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span>Endereço</span>
                  {expanded.endereco ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input
                        value={form.cep}
                        onChange={(e) => {
                          const v = formatCEP(e.target.value);
                          setField("cep", v);
                          if (v.replace(/\D/g, "").length === 8) fillFromCEP(v);
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        disabled={isSearchingCEP}
                        className={errors.cep ? "border-destructive" : ""}
                      />
                      {isSearchingCEP && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}
                    </div>
                    {errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Logradouro</Label>
                    <Input value={form.logradouro} onChange={(e) => setField("logradouro", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={form.numero} onChange={(e) => setField("numero", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={form.complemento} onChange={(e) => setField("complemento", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={form.bairro} onChange={(e) => setField("bairro", e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input value={form.estado} onChange={(e) => setField("estado", e.target.value)} placeholder="UF" />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.obs} onOpenChange={() => setExpanded((s) => ({ ...s, obs: !s.obs }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span>Observações e Anexos</span>
                  {expanded.obs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea rows={4} value={form.observacoes} onChange={(e) => setField("observacoes", e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Adicionar anexos</Label>
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <Label htmlFor="anexos" className="cursor-pointer block w-full">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="h-7 w-7 mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para adicionar documentos (PDF, imagens, etc.)</p>
                      </div>
                    </Label>
                    <Input id="anexos" type="file" multiple className="hidden" onChange={addLocalAnexos} />
                  </div>

                  {form.anexos.length > 0 && (
                    <div className="space-y-2">
                      {form.anexos.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{f.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeLocalAnexo(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => (inline ? onClose?.() : onOpenChange?.(false))} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Salvando..." : mode === "create" ? "Salvar Médico" : "Atualizar Médico"}
          </Button>
        </div>
      </form>
    </>
  );

  if (inline) return <div className="space-y-6">{content}</div>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> {title}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
