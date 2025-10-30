"use client";

import { useEffect, useMemo, useState } from "react";
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
import { AlertCircle, ChevronDown, ChevronUp, FileImage, Loader2, Save, Upload, User, X, XCircle, Trash2 } from "lucide-react";

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
  birth_date: string;
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
  birth_date: "",
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
  const [isUploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSearchingCEP, setSearchingCEP] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serverAnexos, setServerAnexos] = useState<any[]>([]);

  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
    userName: string;
    userType: 'médico' | 'paciente';
  } | null>(null);

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
          birth_date: p.birth_date ? (() => { try { return format(parseISO(String(p.birth_date)), 'dd/MM/yyyy'); } catch { return String(p.birth_date); } })() : "",
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
    let isoDate: string | null = null;
    try {
      const raw = String(form.birth_date || '').trim();
      if (raw) {
        // Try common formats first
        const formats = ['dd/MM/yyyy', 'dd-MM-yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy'];
        for (const f of formats) {
          try {
            const d = parse(raw, f, new Date());
            if (!isNaN(d.getTime())) {
              isoDate = d.toISOString().slice(0, 10);
              break;
            }
          } catch (e) {
            // ignore and try next format
          }
        }

        // Fallback: split numeric parts (handles 'dd mm yyyy' or 'ddmmyyyy' with separators)
        if (!isoDate) {
          const parts = raw.split(/\D+/).filter(Boolean);
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const date = new Date(Number(y), Number(m) - 1, Number(d));
            if (!isNaN(date.getTime())) isoDate = date.toISOString().slice(0, 10);
          }
        }
      }
    } catch (err) {
      console.debug('[PatientForm] parse birth_date failed:', form.birth_date, err);
    }
    return {
      full_name: form.nome,
      social_name: form.nome_social || null,
      cpf: form.cpf,
      rg: form.rg || null,
      sex: form.sexo || null,
      birth_date: isoDate,
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
    ev.preventDefault(); if (!validateLocal()) return;
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
          try { setUploadingPhoto(true); try { await removerFotoPaciente(String(patientId)); setPhotoPreview(null); } catch (remErr) { console.warn('[PatientForm] aviso: falha ao remover avatar antes do upload:', remErr); } await uploadFotoPaciente(String(patientId), form.photo); }
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
        console.log('Perfil do paciente criado (via Function):', savedPatientProfile);

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
              savedPatientProfile = patched;
            }
          }
        } catch (e) {
          console.warn('[PatientForm] erro ao tentar fallback PATCH:', e);
        }

        const maybePassword = (savedPatientProfile as any)?.password || (savedPatientProfile as any)?.generated_password;
        if (maybePassword) {
          setCredentials({ email: (savedPatientProfile as any).email || form.email, password: String(maybePassword), userName: form.nome, userType: 'paciente' });
          setShowCredentialsDialog(true);
        }

        if (form.photo) {
          try { setUploadingPhoto(true); const pacienteId = savedPatientProfile?.id || (savedPatientProfile && (savedPatientProfile as any).id); if (pacienteId) await uploadFotoPaciente(String(pacienteId), form.photo); }
          catch (upErr) { console.warn('[PatientForm] Falha ao enviar foto do paciente após criação:', upErr); alert('Paciente criado, mas falha ao enviar a foto. Você pode tentar novamente no perfil.'); }
          finally { setUploadingPhoto(false); }
        }

        onSaved?.(savedPatientProfile); setForm(initial); setPhotoPreview(null); setServerAnexos([]); if (inline) onClose?.(); else onOpenChange?.(false);
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
                    {photoPreview ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" /> : <FileImage className="h-8 w-8 text-muted-foreground" />}
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
                  <div className="space-y-2"><Label>RG</Label><Input value={form.rg} onChange={(e) => setField("rg", e.target.value)} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Sexo</Label>
                    <Select value={form.sexo} onValueChange={(v) => setField("sexo", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o sexo" /></SelectTrigger>
                      <SelectContent><SelectItem value="masculino">Masculino</SelectItem><SelectItem value="feminino">Feminino</SelectItem><SelectItem value="outro">Outro</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Data de Nascimento</Label><Input placeholder="dd/mm/aaaa" value={form.birth_date} onChange={(e) => { const v = e.target.value.replace(/[^0-9\/]*/g, "").slice(0, 10); setField("birth_date", v); }} onBlur={() => { const raw = form.birth_date; const parts = raw.split(/\D+/).filter(Boolean); if (parts.length === 3) { const d = `${parts[0].padStart(2,'0')}/${parts[1].padStart(2,'0')}/${parts[2].padStart(4,'0')}`; setField("birth_date", d); } }} /></div>
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
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setField("telefone", e.target.value)} />{errors.telefone && <p className="text-sm text-destructive">{errors.telefone}</p>}</div>
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
    return (<><div className="space-y-6">{content}</div>{credentials && (<CredentialsDialog open={showCredentialsDialog} onOpenChange={(open) => { setShowCredentialsDialog(open); if (!open) { setCredentials(null); if (inline) onClose?.(); else onOpenChange?.(false); } }} email={credentials.email} password={credentials.password} userName={credentials.userName} userType={credentials.userType} />)}</>);
  }

  return (<><Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {title}</DialogTitle></DialogHeader>{content}</DialogContent></Dialog>{credentials && (<CredentialsDialog open={showCredentialsDialog} onOpenChange={(open) => { setShowCredentialsDialog(open); if (!open) { setCredentials(null); onOpenChange?.(false); } }} email={credentials.email} password={credentials.password} userName={credentials.userName} userType={credentials.userType} />)}</>);
}