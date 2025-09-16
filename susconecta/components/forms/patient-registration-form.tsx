
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, ChevronDown, ChevronUp, FileImage, Loader2, Save, Upload, User, X, XCircle, Trash2 } from "lucide-react";

import {
  Paciente,
  PacienteInput,
  buscarCepAPI,
  validarCPF,
  criarPaciente,
  atualizarPaciente,
  uploadFotoPaciente,
  removerFotoPaciente,
  adicionarAnexo,
  listarAnexos,
  removerAnexo,
  buscarPacientePorId,
} from "@/lib/api";

type Mode = "create" | "edit";

export interface PatientRegistrationFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  patientId?: number | null;
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
  data_nascimento: string;
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
  data_nascimento: "",
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

  const title = useMemo(() => (mode === "create" ? "Cadastro de Paciente" : "Editar Paciente"), [mode]);

  
  useEffect(() => {
    async function load() {
      if (mode !== "edit" || patientId == null) return;
      try {
        const p = await buscarPacientePorId(String(patientId));
        setForm((s) => ({
          ...s,
          nome: p.nome || "",
          nome_social: p.nome_social || "",
          cpf: p.cpf || "",
          rg: p.rg || "",
          sexo: p.sexo || "",
          data_nascimento: (p.data_nascimento as string) || "",
          telefone: p.telefone || "",
          email: p.email || "",
          cep: p.endereco?.cep || "",
          logradouro: p.endereco?.logradouro || "",
          numero: p.endereco?.numero || "",
          complemento: p.endereco?.complemento || "",
          bairro: p.endereco?.bairro || "",
          cidade: p.endereco?.cidade || "",
          estado: p.endereco?.estado || "",
          observacoes: p.observacoes || "",
        }));
        const ax = await listarAnexos(String(patientId)).catch(() => []);
        setServerAnexos(Array.isArray(ax) ? ax : []);
      } catch {
        
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
    return {
      nome: form.nome,
      nome_social: form.nome_social || null,
      cpf: form.cpf,
      rg: form.rg || null,
      sexo: form.sexo || null,
      data_nascimento: form.data_nascimento || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: {
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
      },
      observacoes: form.observacoes || null,
    };
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validateLocal()) return;

    
    try {
      const { valido, existe } = await validarCPF(form.cpf);
      if (!valido) {
        setErrors((e) => ({ ...e, cpf: "CPF inválido (validação externa)" }));
        return;
      }
      if (existe && mode === "create") {
        setErrors((e) => ({ ...e, cpf: "CPF já cadastrado no sistema" }));
        return;
      }
    } catch {
      
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

      onSaved?.(saved);
      setForm(initial);
      setPhotoPreview(null);
      setServerAnexos([]);

      if (inline) onClose?.();
      else onOpenChange?.(false);

      alert(mode === "create" ? "Paciente cadastrado!" : "Paciente atualizado!");
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
                    <Label htmlFor="photo" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" /> Carregar Foto
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
                    <RadioGroup value={form.sexo} onValueChange={(v) => setField("sexo", v)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="masculino" id="masculino" />
                        <Label htmlFor="masculino">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="feminino" id="feminino" />
                        <Label htmlFor="feminino">Feminino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="outro" id="outro" />
                        <Label htmlFor="outro">Outro</Label>
                      </div>
                    </RadioGroup>
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
                    <Label htmlFor="anexos" className="cursor-pointer">
                      <div className="text-center">
                        <Upload className="mx-auto h-7 w-7 mb-2" />
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
