"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Search, Edit, Trash2, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DoctorRegistrationForm } from "@/components/forms/doctor-registration-form";


import { listarMedicos, excluirMedico, Medico } from "@/lib/api";

function normalizeMedico(m: any): Medico {
  return {
    id: String(m.id ?? m.uuid ?? ""),
    nome: m.nome ?? m.full_name ?? "",        // 👈 Supabase usa full_name
    nome_social: m.nome_social ?? m.social_name ?? null,
    cpf: m.cpf ?? "",
    rg: m.rg ?? m.document_number ?? null,
    sexo: m.sexo ?? m.sex ?? null,
    data_nascimento: m.data_nascimento ?? m.birth_date ?? null,
    telefone: m.telefone ?? m.phone_mobile ?? "",
    celular: m.celular ?? m.phone2 ?? null,
    contato_emergencia: m.contato_emergencia ?? null,
    email: m.email ?? "",
    crm: m.crm ?? "",
    estado_crm: m.estado_crm ?? m.crm_state ?? null,
    rqe: m.rqe ?? null,
    formacao_academica: m.formacao_academica ?? [],
    curriculo_url: m.curriculo_url ?? null,
    especialidade: m.especialidade ?? m.specialty ?? "",
    observacoes: m.observacoes ?? m.notes ?? null,
    foto_url: m.foto_url ?? null,
    tipo_vinculo: m.tipo_vinculo ?? null,
    dados_bancarios: m.dados_bancarios ?? null,
    agenda_horario: m.agenda_horario ?? null,
    valor_consulta: m.valor_consulta ?? null,
  };
}


export default function DoutoresPage() {
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Medico | null>(null);

 
  async function load() {
    setLoading(true);
    try {
     const list = await listarMedicos({ limit: 50 });
setDoctors((list ?? []).map(normalizeMedico));

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter((d) => {
      const byName = (d.nome || "").toLowerCase().includes(q);
      const byCrm = (d.crm || "").toLowerCase().includes(q);
      const byEspecialidade = (d.especialidade || "").toLowerCase().includes(q);
      return byName || byCrm || byEspecialidade;
    });
  }, [doctors, search]);

  function handleAdd() {
    setEditingId(null);
    setShowForm(true);
  }

    

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
  }

  function handleView(doctor: Medico) {
    setViewingDoctor(doctor);
  }

  
  async function handleDelete(id: string) {
    if (!confirm("Excluir este médico?")) return;
    await excluirMedico(id);
    await load();
  }

  
  function handleSaved(savedDoctor?: Medico) {
  setShowForm(false);

  if (savedDoctor) {
    const normalized = normalizeMedico(savedDoctor);
    setDoctors((prev) => {
      const i = prev.findIndex((d) => String(d.id) === String(normalized.id));
      if (i < 0) {
        // Novo médico → adiciona no topo
        return [normalized, ...prev];
      } else {
        // Médico editado → substitui na lista
        const clone = [...prev];
        clone[i] = normalized;
        return clone;
      }
    });
  } else {
    // fallback → recarrega tudo
    load();
  }
}


  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingId ? "Editar Médico" : "Novo Médico"}</h1>
        </div>

        <DoctorRegistrationForm
          inline
          mode={editingId ? "edit" : "create"}
          doctorId={editingId ? Number(editingId) : null}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Médicos</h1>
          <p className="text-muted-foreground">Gerencie os médicos da sua clínica</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-80"
              placeholder="Buscar por nome, CRM ou especialidade…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleAdd} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Médico
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>CRM</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doctor.especialidade}</Badge>
                  </TableCell>
                  <TableCell>{doctor.crm}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{doctor.email}</span>
                      <span className="text-sm text-muted-foreground">{doctor.telefone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(doctor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(String(doctor.id))}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(String(doctor.id))} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum médico encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {viewingDoctor && (
        <Dialog open={!!viewingDoctor} onOpenChange={() => setViewingDoctor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Médico</DialogTitle>
              <DialogDescription>
                Informações detalhadas de {viewingDoctor?.nome}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <span className="col-span-3 font-medium">{viewingDoctor?.nome}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Especialidade</Label>
                <span className="col-span-3">
                  <Badge variant="outline">{viewingDoctor?.especialidade}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">CRM</Label>
                <span className="col-span-3">{viewingDoctor?.crm}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Email</Label>
                <span className="col-span-3">{viewingDoctor?.email}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Telefone</Label>
                <span className="col-span-3">{viewingDoctor?.telefone}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingDoctor(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="text-sm text-muted-foreground">
        Mostrando {filtered.length} de {doctors.length}
      </div>
    </div>
  );
}
