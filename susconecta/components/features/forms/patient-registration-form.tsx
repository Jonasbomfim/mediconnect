"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { format, parseISO, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AlertCircle, ChevronDown, ChevronUp, FileImage, Loader2, Save, Upload, User, X, XCircle, Trash2, CalendarIcon } from "lucide-react";

import {
  Paciente,
  PacienteInput,
  buscarCepAPI,
  atualizarPaciente,
  uploadFotoPaciente,
  removerFotoPaciente,
  adicionarAnexo,
  listarAnexos,
  removerAnexo,
  buscarPacientePorId,
  criarPaciente,
} from "@/lib/api";
import { getAvatarPublicUrl } from '@/lib/api';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';

import { validarCPFLocal } from "@/lib/utils";
import { verificarCpfDuplicado } from "@/lib/api";
import { CredentialsDialog } from "@/components/features/general/credentials-dialog";

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
  birth_date: Date | null;
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
  birth_date: null,
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

  // Funções de formatação
  const formatRG = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 9) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    }
    return cleaned.slice(0, 9);
  };

  const formatTelefone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const formatDataNascimento = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  };
  const [isSubmitting, setSubmitting] = useState(false);
  const [isUploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSearchingCEP, setSearchingCEP] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverAnexos, setServerAnexos] = useState<any[]>([]);

  // Hook para carregar automaticamente o avatar do paciente
  const { avatarUrl: retrievedAvatarUrl } = useAvatarUrl(mode === "edit" ? patientId : null);

  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    userName: string;
    userType: 'médico' | 'paciente';
  } | null>(null);
  
  // Ref para guardar o paciente salvo para chamar onSaved quando o dialog fechar
  const savedPatientRef = useRef<any>(null);

  const title = useMemo(() => (mode === "create" ? "Cadastro de Paciente" : "Editar Paciente"), [mode]);

  useEffect(() => {
    async function load() {
      if (mode !== "edit" || patientId == null) return;
      try {
        const p = await buscarPacientePorId(String(patientId));
        setForm((s) => ({
          ...s,
          nome: p.full_name || "",
          nome_social: p.social_name || "",
          cpf: p.cpf || "",
          rg: p.rg || "",
          sexo: p.sex || "",
          birth_date: p.birth_date ? parseISO(String(p.birth_date)) : null,
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

        try {
          const url = getAvatarPublicUrl(String(patientId));
          try {
            const head = await fetch(url, { method: 'HEAD' });
            if (head.ok) { setPhotoPreview(url); }
            else {
              const get = await fetch(url, { method: 'GET' });
              if (get.ok) { setPhotoPreview(url); }
            }
          } catch (inner) { /* ignore */ }
        } catch (detectErr) { /* ignore */ }
      } catch (err) {
        console.error('[PatientForm] Erro ao carregar paciente:', err);
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
  function handleCPFChange(v: string) { setField("cpf", formatCPF(v)); }

  function formatCEP(v: string) { const n = v.replace(/\D/g, "").slice(0, 8); return n.replace(/(\d{5})(\d{0,3})/, (_, a, b) => `${a}${b ? "-" + b : ""}`); }
  async function fillFromCEP(cep: string) {
    const clean = cep.replace(/\D/g, ""); if (clean.length !== 8) return; setSearchingCEP(true);
    try { const res = await buscarCepAPI(clean); if (res?.erro) setErrors((e) => ({ ...e, cep: "CEP não encontrado" })); else { setField("logradouro", res.logradouro ?? ""); setField("bairro", res.bairro ?? ""); setField("cidade", res.localidade ?? ""); setField("estado", res.uf ?? ""); } }
    catch { setErrors((e) => ({ ...e, cep: "Erro ao buscar CEP" })); } finally { setSearchingCEP(false); }
  }

  function validateLocal(): boolean {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Nome é obrigatório";
    if (!form.cpf.trim()) e.cpf = "CPF é obrigatório";
    if (mode === 'create' && !form.email.trim()) e.email = "Email é obrigatório para criar um usuário";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function toPayload(): PacienteInput {
    return {
      full_name: form.nome,
      social_name: form.nome_social || null,
      cpf: form.cpf,
      rg: form.rg || null,
      sex: form.sexo || null,
      birth_date: form.birth_date ? form.birth_date.toISOString().slice(0, 10) : null,
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
    
    // Debug: verificar se token está disponível
    const tokenCheck = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')) : null;
    console.debug('[PatientForm] Token disponível?', !!tokenCheck ? 'SIM' : 'NÃO - Possível causa do erro!');
    if (!tokenCheck) {
      setErrors({ submit: 'Sessão expirada. Por favor, faça login novamente.' }); 
      return;
    }
    
    try {
      if (!validarCPFLocal(form.cpf)) { setErrors((e) => ({ ...e, cpf: "CPF inválido" })); return; }
      if (mode === "create") { const existe = await verificarCpfDuplicado(form.cpf); if (existe) { setErrors((e) => ({ ...e, cpf: "CPF já cadastrado no sistema" })); return; } }
    } catch (err) { console.error("Erro ao validar CPF", err); setErrors({ submit: "Erro ao validar CPF." }); return; }

    setSubmitting(true);
    try {
      if (mode === "edit") {
        if (patientId == null) throw new Error("Paciente inexistente para edição");
        const payload = toPayload(); const saved = await atualizarPaciente(String(patientId), payload);
        if (form.photo) {
          try { 
            setUploadingPhoto(true); 
            try { await removerFotoPaciente(String(patientId)); setPhotoPreview(null); } catch (remErr) { console.warn('[PatientForm] aviso: falha ao remover avatar antes do upload:', remErr); } 
            const uploadResult = await uploadFotoPaciente(String(patientId), form.photo);
            // Upload realizado com sucesso - a foto está armazenada no Supabase Storage
            // Não é necessário fazer PATCH para persistir a URL no banco
            console.debug('[PatientForm] foto_url obtida do upload:', uploadResult.foto_url);
          }
          catch (upErr) { console.warn('[PatientForm] Falha ao enviar foto do paciente:', upErr); alert('Paciente atualizado, mas falha ao enviar a foto. Tente novamente.'); }
          finally { setUploadingPhoto(false); }
        }
        onSaved?.(saved); alert("Paciente atualizado com sucesso!"); setForm(initial); setPhotoPreview(null); setServerAnexos([]); if (inline) onClose?.(); else onOpenChange?.(false);
      } else {
        // create
        const patientPayload = toPayload();
        // Debug helper: log the exact payload being sent to criarPaciente so
        // we can inspect whether `sex`, `birth_date` and `cep` are present
        // before the network request. This helps diagnose backends that
        // ignore alternate field names or strip optional fields.
        console.debug('[PatientForm] payload before criarPaciente:', patientPayload);
        // require phone when email present for single-call function
        if (form.email && form.email.includes('@') && (!form.telefone || !String(form.telefone).trim())) {
          setErrors((e) => ({ ...e, telefone: 'Telefone é obrigatório quando email é informado (fluxo de criação único).' })); setSubmitting(false); return;
        }
        let savedPatientProfile: any = await criarPaciente(patientPayload);
        console.log('🎯 Paciente criado! Resposta completa:', savedPatientProfile);
        console.log('🔑 Senha no objeto:', savedPatientProfile?.password);
        
        // Guardar a senha ANTES de qualquer operação que possa sobrescrever o objeto
        const senhaGerada = savedPatientProfile?.password;

        // Fallback: some backend create flows (create-user-with-password) do not
        // persist optional patient fields like sex/cep/birth_date. The edit flow
        // (atualizarPaciente) writes directly to the patients table and works.
        // To make create behave like edit, attempt a PATCH right after create
        // when any of those fields are missing from the returned object.
        try {
          const pacienteId = savedPatientProfile?.id || savedPatientProfile?.patient_id || savedPatientProfile?.user_id;
          const missing: string[] = [];
          if (!savedPatientProfile?.sex && patientPayload.sex) missing.push('sex');
          if (!savedPatientProfile?.cep && patientPayload.cep) missing.push('cep');
          if (!savedPatientProfile?.birth_date && patientPayload.birth_date) missing.push('birth_date');

          if (pacienteId && missing.length) {
            console.debug('[PatientForm] criando paciente: campos faltando no retorno do create, tentando PATCH fallback:', missing);
            const patched = await atualizarPaciente(String(pacienteId), patientPayload).catch((e) => { console.warn('[PatientForm] fallback PATCH falhou:', e); return null; });
            if (patched) {
              console.debug('[PatientForm] fallback PATCH result:', patched);
              // Preserva a senha ao fazer merge do patch
              savedPatientProfile = { ...patched, password: senhaGerada };
            }
          }
        } catch (e) {
          console.warn('[PatientForm] erro ao tentar fallback PATCH:', e);
        }

        // Usar a senha que foi guardada ANTES do PATCH
        const emailToDisplay = savedPatientProfile?.email || form.email;
        console.log('📧 Email para exibir:', emailToDisplay);
        console.log('🔐 Senha para exibir:', senhaGerada);
        
        if (senhaGerada && emailToDisplay) {
          console.log('✅ Abrindo modal de credenciais...');
          const credentialsToShow = { 
            email: emailToDisplay, 
            password: String(senhaGerada), 
            userName: form.nome, 
            userType: 'paciente' as const
          };
          console.log('📝 Credenciais a serem definidas:', credentialsToShow);
          
          // Guardar o paciente salvo no ref para usar quando o dialog fechar
          savedPatientRef.current = savedPatientProfile;
          
          // Definir credenciais e abrir dialog
          setCredentials(credentialsToShow);
          setShowCredentialsDialog(true);
          
          // NÃO limpar o formulário ou fechar ainda - aguardar o usuário fechar o dialog de credenciais
          // O dialog de credenciais vai chamar onSaved e fechar quando o usuário clicar em "Fechar"
          
          // Verificar se foi setado
          setTimeout(() => {
            console.log('🔍 Verificando estados após 100ms:');
            console.log('  - showCredentialsDialog:', showCredentialsDialog);
            console.log('  - credentials:', credentials);
          }, 100);
        } else {
          console.error('❌ Não foi possível exibir credenciais:', { senhaGerada, emailToDisplay });
          alert(`Paciente criado!\n\nEmail: ${emailToDisplay}\n\nAVISO: A senha não pôde ser recuperada. Entre em contato com o suporte.`);
          
          // Se não há senha, limpar e fechar normalmente
          onSaved?.(savedPatientProfile); 
          setForm(initial); 
          setPhotoPreview(null); 
          setServerAnexos([]); 
          if (inline) onClose?.(); 
          else onOpenChange?.(false);
        }

        if (form.photo) {
          try { 
            setUploadingPhoto(true); 
            const pacienteId = savedPatientProfile?.id || (savedPatientProfile && (savedPatientProfile as any).id); 
            if (pacienteId) {
              const uploadResult = await uploadFotoPaciente(String(pacienteId), form.photo);
              // Upload realizado com sucesso - a foto está armazenada no Supabase Storage
              console.debug('[PatientForm] foto_url obtida do upload após criação:', uploadResult.foto_url);
            }
          }
          catch (upErr) { console.warn('[PatientForm] Falha ao enviar foto do paciente após criação:', upErr); alert('Paciente criado, mas falha ao enviar a foto. Você pode tentar novamente no perfil.'); }
          finally { setUploadingPhoto(false); }
        }
      }
    } catch (err: any) { console.error("❌ Erro no handleSubmit:", err); const userMessage = err?.message?.includes("toPayload") || err?.message?.includes("is not defined") ? "Erro ao processar os dados do formulário. Por favor, verifique os campos e tente novamente." : err?.message || "Erro ao salvar paciente. Por favor, tente novamente."; setErrors({ submit: userMessage }); }
    finally { setSubmitting(false); }
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) { setErrors((e) => ({ ...e, photo: "Arquivo muito grande. Máx 5MB." })); return; } setField("photo", f); const fr = new FileReader(); fr.onload = (ev) => setPhotoPreview(String(ev.target?.result || "")); fr.readAsDataURL(f); }

  function addLocalAnexos(e: React.ChangeEvent<HTMLInputElement>) { const fs = Array.from(e.target.files || []); setField("anexos", [...form.anexos, ...fs]); }
  function removeLocalAnexo(idx: number) { const clone = [...form.anexos]; clone.splice(idx, 1); setField("anexos", clone); }

  async function handleRemoverFotoServidor() { if (mode !== "edit" || !patientId) return; try { setUploadingPhoto(true); await removerFotoPaciente(String(patientId)); setPhotoPreview(null); alert('Foto removida com sucesso.'); } catch (e: any) { console.warn('[PatientForm] erro ao remover foto do servidor', e); if (String(e?.message || '').includes('401')) { alert('Falha ao remover a foto: não autenticado. Faça login novamente e tente novamente.\nDetalhe: ' + (e?.message || '')); } else if (String(e?.message || '').includes('403')) { alert('Falha ao remover a foto: sem permissão. Verifique as permissões do token e se o storage aceita esse usuário.\nDetalhe: ' + (e?.message || '')); } else { alert(e?.message || 'Não foi possível remover a foto do storage. Veja console para detalhes.'); } } finally { setUploadingPhoto(false); } }

  async function handleRemoverAnexoServidor(anexoId: string | number) { if (mode !== "edit" || !patientId) return; try { await removerAnexo(String(patientId), anexoId); setServerAnexos((prev) => prev.filter((a) => String(a.id ?? a.anexo_id) !== String(anexoId))); } catch (e: any) { alert(e?.message || "Não foi possível remover o anexo."); } }

  const content = (
    <>
      {errors.submit && (
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{errors.submit}</AlertDescription></Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal data, contact, address, attachments... keep markup concise */}
        <Collapsible open={expanded.dados} onOpenChange={() => setExpanded((s) => ({ ...s, dados: !s.dados }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between"><span className="flex items-center gap-2"><User className="h-4 w-4" /> Dados Pessoais</span>{expanded.dados ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center overflow-hidden">
                    {photoPreview ? <img src={photoPreview || ""} alt="Preview" className="w-full h-full object-cover" /> : <FileImage className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo" className="cursor-pointer rounded-md transition-colors">
                      <Button type="button" variant="ghost" asChild className="bg-primary text-primary-foreground border-transparent hover:bg-primary"><span><Upload className="mr-2 h-4 w-4 text-primary-foreground" /> Carregar Foto</span></Button>
                    </Label>
                    <Input id="photo" type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    {mode === "edit" && (<Button type="button" variant="ghost" onClick={handleRemoverFotoServidor}><Trash2 className="mr-2 h-4 w-4" /> Remover foto</Button>)}
                    {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                    <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nome *</Label><Input value={form.nome} onChange={(e) => setField("nome", e.target.value)} className={errors.nome ? "border-destructive" : ""} />{errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}</div>
                  <div className="space-y-2"><Label>Nome Social</Label><Input value={form.nome_social} onChange={(e) => setField("nome_social", e.target.value)} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>CPF *</Label><Input value={form.cpf} onChange={(e) => handleCPFChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} className={errors.cpf ? "border-destructive" : ""} />{errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}</div>
                  <div className="space-y-2"><Label>RG</Label><Input value={form.rg} onChange={(e) => setField("rg", formatRG(e.target.value))} placeholder="00.000.000-0" maxLength={12} /></div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={(v) => setField("sexo", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o sexo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date_input">Data de Nascimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal hover:bg-muted hover:text-foreground",
                            !form.birth_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.birth_date ? format(form.birth_date as Date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.birth_date ?? undefined}
                          onSelect={(date) => setField("birth_date", date || null)}
                          initialFocus
                          captionLayout="dropdown"
                          fromYear={1900}
                          toYear={new Date().getFullYear()}
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.contato} onOpenChange={() => setExpanded((s) => ({ ...s, contato: !s.contato }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><CardTitle className="flex items-center justify-between"><span>Contato</span>{expanded.contato ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle></CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setField("email", e.target.value)} />{errors.email && <p className="text-sm text-destructive">{errors.email}</p>}</div>
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setField("telefone", formatTelefone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />{errors.telefone && <p className="text-sm text-destructive">{errors.telefone}</p>}</div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.endereco} onOpenChange={() => setExpanded((s) => ({ ...s, endereco: !s.endereco }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><CardTitle className="flex items-center justify-between"><span>Endereço</span>{expanded.endereco ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle></CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>CEP</Label><div className="relative"><Input value={form.cep} onChange={(e) => { const v = formatCEP(e.target.value); setField("cep", v); if (v.replace(/\D/g, "").length === 8) fillFromCEP(v); }} placeholder="00000-000" maxLength={9} disabled={isSearchingCEP} className={errors.cep ? "border-destructive" : ""} />{isSearchingCEP && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />}</div>{errors.cep && <p className="text-sm text-destructive">{errors.cep}</p>}</div>
                  <div className="space-y-2"><Label>Logradouro</Label><Input value={form.logradouro} onChange={(e) => setField("logradouro", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Número</Label><Input value={form.numero} onChange={(e) => setField("numero", e.target.value)} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Complemento</Label><Input value={form.complemento} onChange={(e) => setField("complemento", e.target.value)} /></div><div className="space-y-2"><Label>Bairro</Label><Input value={form.bairro} onChange={(e) => setField("bairro", e.target.value)} /></div></div>

                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setField("cidade", e.target.value)} /></div><div className="space-y-2"><Label>Estado</Label><Input value={form.estado} onChange={(e) => setField("estado", e.target.value)} placeholder="UF" /></div></div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={expanded.obs} onOpenChange={() => setExpanded((s) => ({ ...s, obs: !s.obs }))}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><CardTitle className="flex items-center justify-between"><span>Observações e Anexos</span>{expanded.obs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</CardTitle></CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Observações</Label><Textarea rows={4} value={form.observacoes} onChange={(e) => setField("observacoes", e.target.value)} /></div>

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
                </div>

              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" className="hover:bg-primary/10 hover:text-primary dark:hover:bg-accent dark:hover:text-accent-foreground" onClick={() => (inline ? onClose?.() : onOpenChange?.(false))} disabled={isSubmitting}><XCircle className="mr-2 h-4 w-4" /> Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{isSubmitting ? "Salvando..." : mode === "create" ? "Salvar Paciente" : "Atualizar Paciente"}</Button>
        </div>
      </form>
    </>
  );

  if (inline) {
    return (
      <>
        <div className="space-y-6">{content}</div>
        <CredentialsDialog 
          open={showCredentialsDialog} 
          onOpenChange={(open) => { 
            console.log('🔄 CredentialsDialog onOpenChange chamado com:', open);
            setShowCredentialsDialog(open); 
            if (!open) { 
              // Dialog foi fechado - limpar estados e fechar formulário
              console.log('✅ Dialog fechado - limpando formulário...');
              setCredentials(null);
              
              // Chamar onSaved se houver paciente salvo
              if (savedPatientRef.current) {
                onSaved?.(savedPatientRef.current);
                savedPatientRef.current = null;
              }
              
              // Limpar formulário
              setForm(initial); 
              setPhotoPreview(null); 
              setServerAnexos([]); 
              
              // Fechar formulário
              if (inline) onClose?.(); 
              else onOpenChange?.(false); 
            } 
          }} 
          email={credentials?.email || ''} 
          password={credentials?.password || ''} 
          userName={credentials?.userName || ''} 
          userType={credentials?.userType || 'paciente'} 
        />
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
      <CredentialsDialog 
        open={showCredentialsDialog} 
        onOpenChange={(open) => { 
          console.log('🔄 CredentialsDialog onOpenChange chamado com:', open);
          setShowCredentialsDialog(open); 
          if (!open) {
            // Dialog foi fechado - limpar estados e fechar formulário
            console.log('✅ Dialog fechado - limpando formulário...');
            setCredentials(null);
            
            // Chamar onSaved se houver paciente salvo
            if (savedPatientRef.current) {
              onSaved?.(savedPatientRef.current);
              savedPatientRef.current = null;
            }
            
            // Limpar formulário
            setForm(initial); 
            setPhotoPreview(null); 
            setServerAnexos([]); 
            
            // Fechar formulário principal
            onOpenChange?.(false);
          } 
        }} 
        email={credentials?.email || ''} 
        password={credentials?.password || ''} 
        userName={credentials?.userName || ''} 
        userType={credentials?.userType || 'paciente'} 
      />
    </>
  );
}