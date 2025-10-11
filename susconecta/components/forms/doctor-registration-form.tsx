"use client";

import { useEffect, useMemo, useState } from "react";
import { buscarPacientePorId } from "@/lib/api"; 
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
import {
  criarMedico,
  atualizarMedico,
  buscarMedicoPorId,
  uploadFotoMedico,
  listarAnexosMedico,
  adicionarAnexoMedico,
  removerAnexoMedico,
  MedicoInput,
  Medico,
  criarUsuarioMedico,
  gerarSenhaAleatoria,
} from "@/lib/api";
;

import { buscarCepAPI } from "@/lib/api";
import { CredentialsDialog } from "@/components/credentials-dialog"; 

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





type Mode = "create" | "edit";

export interface DoctorRegistrationFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  doctorId?: string | number | null;
  inline?: boolean;
  mode?: Mode;
  onSaved?: (medico: Medico) => void;
  onClose?: () => void;
}

type FormData = {
  photo: File | null;
  full_name: string;  // Substitua 'nome' por 'full_name'
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
  full_name: "",
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
  celular: "",  // Aqui, 'celular' pode ser 'phone_mobile'
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




// AgendaEditor removido - restaurando o textarea original abaixo

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
  
  // Estados para o dialog de credenciais
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    userName: string;
    userType: 'médico' | 'paciente';
  } | null>(null);

  const title = useMemo(() => (mode === "create" ? "Cadastro de Médico" : "Editar Médico"), [mode]);

 useEffect(() => {
  let alive = true;
  async function load() {
    if (mode === "edit" && doctorId) {
      try {
        console.log("[DoctorForm] Carregando médico ID:", doctorId);
        const medico = await buscarMedicoPorId(String(doctorId));
        console.log("[DoctorForm] Dados recebidos do API:", medico);
        console.log("[DoctorForm] Campos principais:", {
          full_name: medico.full_name,
          crm: medico.crm,
          especialidade: medico.especialidade,
          specialty: (medico as any).specialty,
          cpf: medico.cpf,
          email: medico.email
        });
        console.log("[DoctorForm] Verificando especialidade:", {
          'medico.especialidade': medico.especialidade,
          'medico.specialty': (medico as any).specialty,
          'typeof especialidade': typeof medico.especialidade,
          'especialidade length': medico.especialidade?.length
        });
        if (!alive) return;
        
        // Busca a especialidade em diferentes campos possíveis
        const especialidade = medico.especialidade || 
                              (medico as any).specialty || 
                              (medico as any).speciality || 
                              "";
        console.log('🎯 Especialidade encontrada:', especialidade);
        
        const formData = {
          photo: null,
          full_name: String(medico.full_name || ""),
          nome_social: String(medico.nome_social || ""),
          crm: String(medico.crm || ""),
          estado_crm: String(medico.estado_crm || ""),
          rqe: String(medico.rqe || ""),
          formacao_academica: Array.isArray(medico.formacao_academica) ? medico.formacao_academica : [],
          curriculo: null, 
          especialidade: String(especialidade),
          cpf: String(medico.cpf || ""),
          rg: String(medico.rg || ""),
          sexo: String(medico.sexo || ""),
          data_nascimento: String(medico.data_nascimento || ""),
          email: String(medico.email || ""),
          telefone: String(medico.telefone || ""),
          celular: String(medico.celular || ""),
          contato_emergencia: String(medico.contato_emergencia || ""),
          cep: String(medico.cep || ""),
          logradouro: String(medico.street || ""),
          numero: String(medico.number || ""),
          complemento: String(medico.complement || ""),
          bairro: String(medico.neighborhood || ""),
          cidade: String(medico.city || ""),
          estado: String(medico.state || ""),
          observacoes: String(medico.observacoes || ""),
          anexos: [],
          tipo_vinculo: String(medico.tipo_vinculo || ""),
          dados_bancarios: medico.dados_bancarios || { banco: "", agencia: "", conta: "", tipo_conta: "" },
          agenda_horario: String(medico.agenda_horario || ""),
          valor_consulta: medico.valor_consulta ? String(medico.valor_consulta) : "",
        };
        
        console.log("[DoctorForm] Dados do formulário preparados:", formData);
        setForm(formData);

        try {
          const list = await listarAnexosMedico(String(doctorId));
          setServerAnexos(list ?? []);
        } catch (err) {
          console.error("[DoctorForm] Erro ao carregar anexos:", err);
        }
      } catch (err) {
        console.error("[DoctorForm] Erro ao carregar médico:", err);
      }
    }
  }
  load();
  return () => { alive = false; };
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
    const res = await buscarCepAPI(clean);
    if (res && !res.erro) {
      setField("logradouro", res.logradouro ?? "");
      setField("bairro", res.bairro ?? "");
      setField("cidade", res.localidade ?? "");
      setField("estado", res.uf ?? "");
    } else {
      setErrors((e) => ({ ...e, cep: "CEP não encontrado" }));
    }
  } catch {
    setErrors((e) => ({ ...e, cep: "Erro ao buscar CEP" }));
  } finally {
    setSearchingCEP(false);
  }
}


 function validateLocal(): boolean {
  const e: Record<string, string> = {};

  if (!form.full_name.trim()) e.full_name = "Nome é obrigatório";
  if (!form.cpf.trim()) e.cpf = "CPF é obrigatório";
  if (!form.crm.trim()) e.crm = "CRM é obrigatório";
  if (!form.especialidade.trim()) e.especialidade = "Especialidade é obrigatória";
  if (!form.cep.trim()) e.cep = "CEP é obrigatório";  // Verifique se o CEP está preenchido
  if (!form.bairro.trim()) e.bairro = "Bairro é obrigatório";  // Verifique se o bairro está preenchido
  if (!form.cidade.trim()) e.cidade = "Cidade é obrigatória";  // Verifique se a cidade está preenchida
  
  setErrors(e);
  return Object.keys(e).length === 0;
}

function toPayload(): MedicoInput {
  // Converte dd/MM/yyyy para ISO (yyyy-MM-dd) se possível
  let isoDate: string | null = null;
  try {
    const parts = String(form.data_nascimento).split(/\D+/).filter(Boolean);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(date.getTime())) {
        isoDate = date.toISOString().slice(0, 10);
      }
    }
  } catch {}

  return {
    user_id: null,
    crm: form.crm || "",
    crm_uf: form.estado_crm || "",
    specialty: form.especialidade || "",
    full_name: form.full_name || "",
    cpf: form.cpf || "",
    email: form.email || "",
    phone_mobile: form.celular || "",
    phone2: form.telefone || null,
    cep: form.cep || "",
    street: form.logradouro || "",
    number: form.numero || "",
    complement: form.complemento || undefined,
    neighborhood: form.bairro || undefined,
    city: form.cidade || "",
    state: form.estado || "",
    birth_date: isoDate,
    rg: form.rg || null,
    active: true,
    created_by: null,
    updated_by: null,
  };
}


async function handleSubmit(ev: React.FormEvent) {
  ev.preventDefault();
  if (!validateLocal()) return;

  setSubmitting(true);
  setErrors({});
  try {
    if (mode === "edit") {
      if (!doctorId) throw new Error("ID do médico não fornecido para edição");
      const payload = toPayload();
      const saved = await atualizarMedico(String(doctorId), payload);
      onSaved?.(saved);
      alert("Médico atualizado com sucesso!");
      if (inline) onClose?.();
      else onOpenChange?.(false);

    } else {
      // --- FLUXO DE CRIAÇÃO DE MÉDICO ---
      console.log('🏥 [CRIAR MÉDICO] Iniciando processo completo...');
      
      const medicoPayload = toPayload();
      console.log("Enviando os dados para a API:", medicoPayload);
      
      // 1. Cria o perfil do médico na tabela doctors
      const savedDoctorProfile = await criarMedico(medicoPayload);
      console.log("✅ Perfil do médico criado:", savedDoctorProfile);

      // 2. Cria usuário no Supabase Auth (direto via /auth/v1/signup)
      console.log('🔐 Criando usuário de autenticação...');
      
      try {
        const authResponse = await criarUsuarioMedico({
          email: form.email,
          full_name: form.full_name,
          phone_mobile: form.celular || '',
        });
        
        if (authResponse.success && authResponse.user) {
          console.log('✅ Usuário Auth criado:', authResponse.user.id);
          
          // 3. Exibe popup com credenciais
          setCredentials({
            email: authResponse.email,
            password: authResponse.password,
            userName: form.full_name,
            userType: 'médico',
          });
          setShowCredentialsDialog(true);
          
          // 4. Limpa formulário
          setForm(initial);
          setPhotoPreview(null);
          setServerAnexos([]);
          
          // 5. Notifica componente pai
          onSaved?.(savedDoctorProfile);
        } else {
          throw new Error('Falha ao criar usuário de autenticação');
        }
        
      } catch (authError: any) {
        console.error('❌ Erro ao criar usuário Auth:', authError);
        
        const errorMsg = authError?.message || String(authError);
        
        // Mensagens específicas de erro
        if (errorMsg.toLowerCase().includes('already registered') || 
            errorMsg.toLowerCase().includes('already been registered') ||
            errorMsg.toLowerCase().includes('já está cadastrado')) {
          alert(
            `⚠️ EMAIL JÁ CADASTRADO\n\n` +
            `O email "${form.email}" já possui uma conta no sistema.\n\n` +
            `✅ O perfil do médico "${form.full_name}" foi salvo com sucesso.\n\n` +
            `❌ Porém, não foi possível criar o login porque este email já está em uso.\n\n` +
            `SOLUÇÃO:\n` +
            `• Use um email diferente para este médico, OU\n` +
            `• Se o médico já tem conta, edite o perfil e vincule ao usuário existente`
          );
        } else {
          alert(
            `⚠️ Médico cadastrado com sucesso, mas houve um problema ao criar o acesso ao sistema.\n\n` +
            `✅ Perfil do médico salvo: ${form.full_name}\n\n` +
            `❌ Erro ao criar login: ${errorMsg}\n\n` +
            `Por favor, entre em contato com o administrador para criar o acesso manualmente.`
          );
        }
        
        // Limpa formulário mesmo com erro
        setForm(initial);
        setPhotoPreview(null);
        setServerAnexos([]);
        onSaved?.(savedDoctorProfile);
        if (inline) onClose?.();
        else onOpenChange?.(false);
      }
    }
  } catch (err: any) {
    console.error("❌ Erro no handleSubmit:", err);
    // Exibe mensagem amigável ao usuário
    const userMessage = err?.message?.includes("toPayload")
      ? "Erro ao processar os dados do formulário. Por favor, verifique os campos e tente novamente."
      : err?.message || "Erro ao salvar médico. Por favor, tente novamente.";
    setErrors({ submit: userMessage });
  } finally {
    setSubmitting(false);
  }
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
                    <Label htmlFor="photo" className="cursor-pointer rounded-md transition-colors">
                      <Button type="button" variant="ghost" asChild className="bg-primary text-primary-foreground border-transparent hover:bg-primary">
                        <span>
                          <Upload className="mr-2 h-4 w-4 text-primary-foreground" /> Carregar Foto
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
                  <Input value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />


                    {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
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
    <Input 
      value={form.especialidade} // Mantenha o nome no form como 'especialidade'
      onChange={(e) => setField("especialidade", e.target.value)} // Envia o valor correto
      className={errors.especialidade ? "border-destructive" : ""}
    />
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
              <Button type="button" variant="ghost" asChild className="bg-primary text-primary-foreground border-transparent hover:bg-primary">
                <span>
                  <Upload className="mr-2 h-4 w-4 text-primary-foreground" />
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
            {form.curriculo && <span className="text-sm text-primary-foreground">{form.curriculo.name}</span>}
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
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={form.data_nascimento}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9\/]/g, "").slice(0, 10);
                        setField("data_nascimento", v);
                      }}
                      onBlur={() => {
                        const raw = form.data_nascimento;
                        const parts = raw.split(/\D+/).filter(Boolean);
                        if (parts.length === 3) {
                          const d = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2].padStart(4,'0')}`;
                          setField("data_nascimento", d);
                        }
                      }}
                    />
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
                <Button type="button" onClick={addFormacao}>
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
                  <div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>Telefone</Label>
    <Input
      value={form.telefone}
      onChange={(e) => setField("telefone", formatPhone(e.target.value))}
      placeholder="(XX) XXXXX-XXXX"
    />
  </div>
  <div className="space-y-2">
    <Label>Celular</Label>
    <Input
      value={form.celular} 
      onChange={(e) => setField("celular", formatPhone(e.target.value))}
      placeholder="(XX) XXXXX-XXXX"
    />
  </div>
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

                {/* Agenda/Horário removido conforme solicitado */}

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
                    <Label htmlFor="anexos" className="cursor-pointer block w-full rounded-md p-4 bg-primary text-primary-foreground">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="h-7 w-7 mb-2 text-primary-foreground" />
                        <p className="text-sm text-primary-foreground">Clique para adicionar documentos (PDF, imagens, etc.)</p>
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

  if (inline) {
    return (
      <>
        <div className="space-y-6">{content}</div>
        
        {/* Dialog de credenciais */}
        {credentials && (
          <CredentialsDialog
            open={showCredentialsDialog}
            onOpenChange={(open) => {
              setShowCredentialsDialog(open);
              if (!open) {
                // Quando o dialog de credenciais fecha, fecha o formulário também
                setCredentials(null);
                if (inline) {
                  onClose?.();
                } else {
                  onOpenChange?.(false);
                }
              }
            }}
            email={credentials.email}
            password={credentials.password}
            userName={credentials.userName}
            userType={credentials.userType}
          />
        )}
      </>
    );
  }

  return (
    <>
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
      
      {/* Dialog de credenciais */}
      {credentials && (
        <CredentialsDialog
          open={showCredentialsDialog}
          onOpenChange={(open) => {
            setShowCredentialsDialog(open);
            if (!open) {
              setCredentials(null);
              onOpenChange?.(false);
            }
          }}
          email={credentials.email}
          password={credentials.password}
          userName={credentials.userName}
          userType={credentials.userType}
        />
      )}
    </>
  );
}
