
"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parse, isValid, parseISO } from "date-fns";
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

import {
  Paciente,
  PacienteInput,
  buscarCepAPI,
  criarPaciente,
  atualizarPaciente,
  uploadFotoPaciente,
  removerFotoPaciente,
  adicionarAnexo,
  listarAnexos,
  removerAnexo,
  buscarPacientePorId,
  criarUsuarioPaciente,
  CreateUserWithPasswordResponse,
} from "@/lib/api";

import { validarCPFLocal } from "@/lib/utils";
import { verificarCpfDuplicado } from "@/lib/api";
import { CredentialsDialog } from "@/components/credentials-dialog"; 



type Mode = "create" | "edit";

export interface PatientRegistrationFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  patientId?: string | number | null;
  inline?: boolean;
  mode?: Mode;
  onSaved?: (paciente: Paciente) => void;
  onClose?: () => void;
}

type FormData = {
  photo: File | null;
  nome: string;
  nome_social: string;
  cpf: string;
  rg: string;
  sexo: string;
  birth_date: string;   // 👈 corrigido
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  observacoes: string;
  anexos: File[];
};

const initial: FormData = {
  photo: null,
  nome: "",
  nome_social: "",
  cpf: "",
  rg: "",
  sexo: "",
  birth_date: "",   // 👈 corrigido
  email: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
  anexos: [],
};



export function PatientRegistrationForm({
  open = true,
  onOpenChange,
  patientId = null,
  inline = false,
  mode = "create",
  onSaved,
  onClose,
}: PatientRegistrationFormProps) {
  const [form, setForm] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState({ dados: true, contato: false, endereco: false, obs: false });
  const [isSubmitting, setSubmitting] = useState(false);
  const [isSearchingCEP, setSearchingCEP] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverAnexos, setServerAnexos] = useState<any[]>([]);
  
  // Estados para o dialog de credenciais
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState<CreateUserWithPasswordResponse | null>(null);
  const [savedPatient, setSavedPatient] = useState<Paciente | null>(null);

  const title = useMemo(() => (mode === "create" ? "Cadastro de Paciente" : "Editar Paciente"), [mode]);

  
  useEffect(() => {
    async function load() {
      if (mode !== "edit" || patientId == null) return;
      try {
        console.log("[PatientForm] Carregando paciente ID:", patientId);
        const p = await buscarPacientePorId(String(patientId));
        console.log("[PatientForm] Dados recebidos:", p);
        setForm((s) => ({
  ...s,
  nome: p.full_name || "",        // 👈 trocar nome → full_name
  nome_social: p.social_name || "",
  cpf: p.cpf || "",
  rg: p.rg || "",
  sexo: p.sex || "",
  birth_date: p.birth_date ? (() => {
    try { return format(parseISO(String(p.birth_date)), 'dd/MM/yyyy'); } catch { return String(p.birth_date); }
  })() : "",
  telefone: p.phone_mobile || "",
  email: p.email || "",
  cep: p.cep || "",
  logradouro: p.street || "",
  numero: p.number || "",
  complemento: p.complement || "",
  bairro: p.neighborhood || "",
  cidade: p.city || "",
  estado: p.state || "",
  observacoes: p.notes || "",
}));

        const ax = await listarAnexos(String(patientId)).catch(() => []);
        setServerAnexos(Array.isArray(ax) ? ax : []);
      } catch (err) {
        console.error("[PatientForm] Erro ao carregar paciente:", err);
      }
    }
    load();
  }, [mode, patientId]);

  function setField<T extends keyof FormData>(k: T, v: FormData[T]) {
    setForm((s) => ({ ...s, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: "" }));
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
      if (res?.erro) {
        setErrors((e) => ({ ...e, cep: "CEP não encontrado" }));
      } else {
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
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toPayload(): PacienteInput {
  // converte dd/MM/yyyy para ISO (yyyy-MM-dd) se possível
  let isoDate: string | null = null;
  try {
    const parts = String(form.birth_date).split(/\D+/).filter(Boolean);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (!isNaN(date.getTime())) {
        isoDate = date.toISOString().slice(0, 10);
      }
    }
  } catch {}

  return {
    full_name: form.nome,   // 👈 troca 'nome' por 'full_name'
    social_name: form.nome_social || null,
    cpf: form.cpf,
    rg: form.rg || null,
    sex: form.sexo || null,
    birth_date: isoDate,   // enviar ISO ou null
    phone_mobile: form.telefone || null,
    email: form.email || null,
    cep: form.cep || null,
    street: form.logradouro || null,
    number: form.numero || null,
    complement: form.complemento || null,
    neighborhood: form.bairro || null,
    city: form.cidade || null,
    state: form.estado || null,
    notes: form.observacoes || null,
  };
}



  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateLocal()) return;

    
    try {
  // 1) validação local
  if (!validarCPFLocal(form.cpf)) {
    setErrors((e) => ({ ...e, cpf: "CPF inválido" }));
    return;
  }

  // 2) checar duplicidade no banco (apenas se criando novo paciente)
  if (mode === "create") {
    const existe = await verificarCpfDuplicado(form.cpf);
    if (existe) {
      setErrors((e) => ({ ...e, cpf: "CPF já cadastrado no sistema" }));
      return;
    }
  }
} catch (err) {
  console.error("Erro ao validar CPF", err);
}


    setSubmitting(true);
    try {
      const payload = toPayload();

      let saved: Paciente;
      if (mode === "create") {
        saved = await criarPaciente(payload);
      } else {
        if (patientId == null) throw new Error("Paciente inexistente para edição");
        saved = await atualizarPaciente(String(patientId), payload);
      }

      if (form.photo && saved?.id) {
        try {
          await uploadFotoPaciente(saved.id, form.photo);
        } catch {}
      }

      if (form.anexos.length && saved?.id) {
        for (const f of form.anexos) {
          try {
            await adicionarAnexo(saved.id, f);
          } catch {}
        }
      }

      // Se for criação de novo paciente e tiver email válido, cria usuário
      if (mode === "create" && form.email && form.email.includes('@')) {
        console.log("🔐 Iniciando criação de usuário para o paciente...");
        console.log("📧 Email:", form.email);
        console.log("👤 Nome:", form.nome);
        console.log("📱 Telefone:", form.telefone);
        
        try {
          const userCredentials = await criarUsuarioPaciente({
            email: form.email,
            full_name: form.nome,
            phone_mobile: form.telefone,
          });
          
          console.log("✅ Usuário criado com sucesso!", userCredentials);
          console.log("🔑 Senha gerada:", userCredentials.password);
          
          // Armazena as credenciais e mostra o dialog
          console.log("📋 Antes de setCredentials - credentials atual:", credentials);
          console.log("📋 Antes de setShowCredentials - showCredentials atual:", showCredentials);
          
          setCredentials(userCredentials);
          setShowCredentials(true);
          
          console.log("📋 Depois de set - credentials:", userCredentials);
          console.log("📋 Depois de set - showCredentials: true");
          console.log("📋 Modo inline?", inline);
          console.log("📋 userCredentials completo:", JSON.stringify(userCredentials));
          
          // Força re-render
          setTimeout(() => {
            console.log("⏰ Timeout - credentials:", credentials);
            console.log("⏰ Timeout - showCredentials:", showCredentials);
          }, 100);
          
          console.log("📋 Credenciais definidas, dialog deve aparecer!");
          
          // Salva o paciente para chamar onSaved depois
          setSavedPatient(saved);
          
          // ⚠️ NÃO chama onSaved aqui! O dialog vai chamar quando fechar.
          // Se chamar agora, o formulário fecha e o dialog desaparece.
          console.log("⚠️ NÃO chamando onSaved ainda - aguardando dialog fechar");
          
          // RETORNA AQUI para não executar o código abaixo
          return;
          
        } catch (userError: any) {
          console.error("❌ ERRO ao criar usuário:", userError);
          console.error("📋 Stack trace:", userError?.stack);
          const errorMessage = userError?.message || "Erro desconhecido";
          console.error("� Mensagem:", errorMessage);
          
          // Mostra erro mas fecha o formulário normalmente
          alert(`Paciente cadastrado com sucesso!\n\n⚠️ Porém, houve erro ao criar usuário de acesso:\n${errorMessage}\n\nVerifique os logs do console (F12) para mais detalhes.`);
          
          // Fecha o formulário mesmo com erro na criação de usuário
          setForm(initial);
          setPhotoPreview(null);
          setServerAnexos([]);
          
          if (inline) onClose?.();
          else onOpenChange?.(false);
        }
      } else {
        console.log("⚠️ Não criará usuário. Motivo:");
        console.log("  - Mode:", mode);
        console.log("  - Email:", form.email);
        console.log("  - Tem @:", form.email?.includes('@'));
        
        // Se não for criar usuário, fecha normalmente
        setForm(initial);
        setPhotoPreview(null);
        setServerAnexos([]);
        
        if (inline) onClose?.();
        else onOpenChange?.(false);

        alert(mode === "create" ? "Paciente cadastrado!" : "Paciente atualizado!");
      }

      onSaved?.(saved);
    } catch (err: any) {
      setErrors({ submit: err?.message || "Erro ao salvar paciente." });
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

  async function handleRemoverFotoServidor() {
    if (mode !== "edit" || !patientId) return;
    try {
      await removerFotoPaciente(String(patientId));
      alert("Foto removida.");
    } catch (e: any) {
      alert(e?.message || "Não foi possível remover a foto.");
    }
  }

  async function handleRemoverAnexoServidor(anexoId: string | number) {
    if (mode !== "edit" || !patientId) return;
    try {
      await removerAnexo(String(patientId), anexoId);
      setServerAnexos((prev) => prev.filter((a) => String(a.id ?? a.anexo_id) !== String(anexoId)));
    } catch (e: any) {
      alert(e?.message || "Não foi possível remover o anexo.");
    }
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
        {}
        <Collapsible open={expanded.dados} onOpenChange={() => setExpanded((s) => ({ ...s, dados: !s.dados }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dados Pessoais
                  </span>
                  {expanded.dados ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
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
                    {mode === "edit" && (
                      <Button type="button" variant="ghost" onClick={handleRemoverFotoServidor}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remover foto
                      </Button>
                    )}
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
                    <Input value={form.rg} onChange={(e) => setField("rg", e.target.value)} />
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
                      value={form.birth_date}
                      onChange={(e) => {
                        // permita apenas números e '/'
                        const v = e.target.value.replace(/[^0-9\/]/g, "").slice(0, 10);
                        setField("birth_date", v);
                      }}
                      onBlur={() => {
                        // tenta formatar automaticamente se for uma data válida
                        const raw = form.birth_date;
                        const parts = raw.split(/\D+/).filter(Boolean);
                        if (parts.length === 3) {
                          const d = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2].padStart(4,'0')}`;
                          setField("birth_date", d);
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {}
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input value={form.email} onChange={(e) => setField("email", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={form.telefone} onChange={(e) => setField("telefone", e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {}
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
              <CardContent className="space-y-4">
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

        {}
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
              <CardContent className="space-y-4">
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

                {mode === "edit" && serverAnexos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Anexos já enviados</Label>
                    <div className="space-y-2">
                      {serverAnexos.map((ax) => {
                        const id = ax.id ?? ax.anexo_id ?? ax.uuid ?? "";
                        return (
                          <div key={String(id)} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{ax.nome || ax.filename || `Anexo ${id}`}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoverAnexoServidor(String(id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => (inline ? onClose?.() : onOpenChange?.(false))} disabled={isSubmitting}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Salvando..." : mode === "create" ? "Salvar Paciente" : "Atualizar Paciente"}
          </Button>
        </div>
      </form>
    </>
  );

  if (inline) {
    return (
      <>
        <div className="space-y-6">{content}</div>
        
        {/* Debug */}
        {console.log("🎨 RENDER inline - credentials:", credentials, "showCredentials:", showCredentials)}
        
        {/* Dialog de credenciais */}
        {credentials && (
          <CredentialsDialog
            open={showCredentials}
            onOpenChange={(open) => {
              console.log("🔄 CredentialsDialog onOpenChange:", open);
              setShowCredentials(open);
              if (!open) {
                console.log("🔄 Dialog fechando - chamando onSaved e limpando formulário");
                
                // Chama onSaved com o paciente salvo
                if (savedPatient) {
                  console.log("✅ Chamando onSaved com paciente:", savedPatient.id);
                  onSaved?.(savedPatient);
                }
                
                // Limpa o formulário e fecha
                setForm(initial);
                setPhotoPreview(null);
                setServerAnexos([]);
                setCredentials(null);
                setSavedPatient(null);
                onClose?.();
              }
            }}
            email={credentials.email}
            password={credentials.password}
            userName={form.nome}
            userType="paciente"
          />
        )}
      </>
    );
  }

  return (
    <>
      {console.log("🎨 RENDER dialog - credentials:", credentials, "showCredentials:", showCredentials)}
      
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
          open={showCredentials}
          onOpenChange={(open) => {
            setShowCredentials(open);
            if (!open) {
              // Quando fechar o dialog, limpa o formulário e fecha o modal principal
              setForm(initial);
              setPhotoPreview(null);
              setServerAnexos([]);
              setCredentials(null);
              onOpenChange?.(false);
            }
          }}
          email={credentials.email}
          password={credentials.password}
          userName={form.nome}
          userType="paciente"
        />
      )}
    </>
  );
}
