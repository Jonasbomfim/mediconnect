
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Search, Eye, Edit, Trash2, ArrowLeft } from "lucide-react";

import { Paciente, Endereco, listarPacientes, buscarPacientePorId, excluirPaciente } from "@/lib/api";
import { PatientRegistrationForm } from "@/components/forms/patient-registration-form";


function normalizePaciente(p: any): Paciente {
  const endereco: Endereco = {
    cep: p.endereco?.cep ?? p.cep ?? "",
    logradouro: p.endereco?.logradouro ?? p.street ?? "",
    numero: p.endereco?.numero ?? p.number ?? "",
    complemento: p.endereco?.complemento ?? p.complement ?? "",
    bairro: p.endereco?.bairro ?? p.neighborhood ?? "",
    cidade: p.endereco?.cidade ?? p.city ?? "",
    estado: p.endereco?.estado ?? p.state ?? "",
  };

  return {
    id: String(p.id ?? p.uuid ?? p.paciente_id ?? ""),
    nome: p.full_name ?? "",          // 👈 troca nome → full_name
    nome_social: p.social_name ?? null, // 👈 Supabase usa social_name
    cpf: p.cpf ?? "",
    rg: p.rg ?? p.document_number ?? null, // 👈 às vezes vem como document_number
    sexo: p.sexo ?? p.sex ?? null,    // 👈 Supabase usa sex
    data_nascimento: p.data_nascimento ?? p.birth_date ?? null,
    telefone: p.telefone ?? p.phone_mobile ?? "",
    email: p.email ?? "",
    endereco,
    observacoes: p.observacoes ?? p.notes ?? null,
    foto_url: p.foto_url ?? null,
  };
}


export default function PacientesPage() {
  const [patients, setPatients] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Paciente | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await listarPacientes({ page: 1, limit: 20 });
      setPatients((data ?? []).map(normalizePaciente));
      setError(null);
    } catch (e: any) {
      setPatients([]);
      setError(e?.message || "Erro ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return patients.filter((p) => {
      const byName = (p.nome || "").toLowerCase().includes(q);
      const byCPF = (p.cpf || "").replace(/\D/g, "").includes(qDigits);
      const byId = String(p.id || "").includes(qDigits);
      return byName || byCPF || byId;
    });
  }, [patients, search]);

  function handleAdd() {
    setEditingId(null);
    setShowForm(true);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
  }

  function handleView(patient: Paciente) {
    setViewingPatient(patient);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este paciente?")) return;
    try {
      await excluirPaciente(id);
      setPatients((prev) => prev.filter((x) => String(x.id) !== String(id)));
    } catch (e: any) {
      alert(e?.message || "Não foi possível excluir.");
    }
  }

  function handleSaved(p: Paciente) {
    const saved = normalizePaciente(p);
    setPatients((prev) => {
      const i = prev.findIndex((x) => String(x.id) === String(saved.id));
      if (i < 0) return [saved, ...prev];
      const clone = [...prev];
      clone[i] = saved;
      return clone;
    });
    setShowForm(false);
  }

  async function handleBuscarServidor() {
    const q = search.trim();
    if (!q) return loadAll();

    
    if (/^\d+$/.test(q)) {
      try {
        setLoading(true);
        const one = await buscarPacientePorId(q);
        setPatients(one ? [normalizePaciente(one)] : []);
        setError(one ? null : "Paciente não encontrado.");
      } catch (e: any) {
        setPatients([]);
        setError(e?.message || "Paciente não encontrado.");
      } finally {
        setLoading(false);
      }
      return;
    }

    
    await loadAll();
    setTimeout(() => setSearch(q), 0);
  }

  if (loading) return <p>Carregando pacientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingId ? "Editar paciente" : "Novo paciente"}</h1>
        </div>

        <PatientRegistrationForm
          inline
          mode={editingId ? "edit" : "create"}
          patientId={editingId ? Number(editingId) : null}
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
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-80"
              placeholder="Buscar por nome, CPF ou ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscarServidor()}
            />
          </div>
          <Button variant="secondary" onClick={handleBuscarServidor}>Buscar</Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo paciente
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome || "(sem nome)"}</TableCell>
                  <TableCell>{p.cpf || "-"}</TableCell>
                  <TableCell>{p.telefone || "-"}</TableCell>
                  <TableCell>{p.endereco?.cidade || "-"}</TableCell>
                  <TableCell>{p.endereco?.estado || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-accent">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(p)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(String(p.id))}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(String(p.id))} className="text-destructive">
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
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {viewingPatient && (
        <Dialog open={!!viewingPatient} onOpenChange={() => setViewingPatient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Paciente</DialogTitle>
              <DialogDescription>
                Informações detalhadas de {viewingPatient.nome}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <span className="col-span-3 font-medium">{viewingPatient.nome}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">CPF</Label>
                <span className="col-span-3">{viewingPatient.cpf}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Telefone</Label>
                <span className="col-span-3">{viewingPatient.telefone}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Endereço</Label>
                <span className="col-span-3">
                  {`${viewingPatient.endereco?.logradouro || ''}, ${viewingPatient.endereco?.numero || ''} - ${viewingPatient.endereco?.bairro || ''}, ${viewingPatient.endereco?.cidade || ''} - ${viewingPatient.endereco?.estado || ''}`}
                </span>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Observações</Label>
                <span className="col-span-3">{viewingPatient.observacoes || "Nenhuma"}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingPatient(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="text-sm text-muted-foreground">Mostrando {filtered.length} de {patients.length}</div>
    </div>
  );
}
