
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Search, Eye, Edit, Trash2, ArrowLeft } from "lucide-react";

import { Paciente, Endereco, listarPacientes, buscarPacientes, buscarPacientePorId, excluirPaciente } from "@/lib/api";
import { PatientRegistrationForm } from "@/components/forms/patient-registration-form";
import AssignmentForm from "@/components/admin/AssignmentForm";


function normalizePaciente(p: any): Paciente {
  return {
    id: String(p.id ?? p.uuid ?? p.paciente_id ?? ""),
    full_name: p.full_name ?? p.name ?? p.nome ?? "",
    social_name: p.social_name ?? p.nome_social ?? null,
    cpf: p.cpf ?? "",
    rg: p.rg ?? p.document_number ?? null,
    sex: p.sex ?? p.sexo ?? null,
    birth_date: p.birth_date ?? p.data_nascimento ?? null,
    phone_mobile: p.phone_mobile ?? p.telefone ?? "",
    email: p.email ?? "",
    cep: p.cep ?? "",
    street: p.street ?? p.logradouro ?? "",
    number: p.number ?? p.numero ?? "",
    complement: p.complement ?? p.complemento ?? "",
    neighborhood: p.neighborhood ?? p.bairro ?? "",
    city: p.city ?? p.cidade ?? "",
    state: p.state ?? p.estado ?? "",
    notes: p.notes ?? p.observacoes ?? null,
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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignPatientId, setAssignPatientId] = useState<string | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await listarPacientes({ page: 1, limit: 50 });
      
      if (Array.isArray(data)) {
        setPatients(data.map(normalizePaciente));
      } else {
        setPatients([]);
      }
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
    const q = search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    
    return patients.filter((p) => {
      // Busca por nome
      const byName = (p.full_name || "").toLowerCase().includes(q);
      
      // Busca por CPF (remove formatação)
      const byCPF = qDigits.length >= 3 && (p.cpf || "").replace(/\D/g, "").includes(qDigits);
      
      // Busca por ID (UUID completo ou parcial)
      const byId = (p.id || "").toLowerCase().includes(q);
      
      // Busca por email
      const byEmail = (p.email || "").toLowerCase().includes(q);
      
      return byName || byCPF || byId || byEmail;
    });
  }, [patients, search]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Reset para página 1 quando mudar a busca ou itens por página
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

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

    try {
      setLoading(true);
      setError(null);

      // Se parece com ID (UUID), busca diretamente
      if (q.includes('-') && q.length > 10) {
        const one = await buscarPacientePorId(q);
        setPatients(one ? [normalizePaciente(one)] : []);
        setError(one ? null : "Paciente não encontrado.");
        // Limpa o campo de busca para que o filtro não interfira
        setSearch("");
        return;
      }

      // Para outros termos, usa busca avançada
      const results = await buscarPacientes(q);
      setPatients(results.map(normalizePaciente));
      setError(results.length === 0 ? "Nenhum paciente encontrado." : null);
      // Limpa o campo de busca para que o filtro não interfira
      setSearch("");
      
    } catch (e: any) {
      setPatients([]);
      setError(e?.message || "Erro na busca.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Carregando pacientes...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  if (showForm) {
    return (
      <div className="space-y-6 p-6 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setShowForm(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{editingId ? "Editar paciente" : "Novo paciente"}</h1>
        </div>

        <PatientRegistrationForm
          inline
          mode={editingId ? "edit" : "create"}
          patientId={editingId}
          onSaved={handleSaved}
          onClose={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background">
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
          <Button variant="secondary" onClick={() => void handleBuscarServidor()} className="hover:bg-primary hover:text-white">Buscar</Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Novo paciente
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Nome</TableHead>
              <TableHead className="text-primary-foreground">CPF</TableHead>
              <TableHead className="text-primary-foreground">Telefone</TableHead>
              <TableHead className="text-primary-foreground">Cidade</TableHead>
              <TableHead className="text-primary-foreground">Estado</TableHead>
              <TableHead className="w-[100px] text-primary-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "(sem nome)"}</TableCell>
                  <TableCell>{p.cpf || "-"}</TableCell>
                  <TableCell>{p.phone_mobile || "-"}</TableCell>
                  <TableCell>{p.city || "-"}</TableCell>
                  <TableCell>{p.state || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-primary hover:text-white transition-colors">
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
                        <DropdownMenuItem onClick={() => { setAssignPatientId(String(p.id)); setAssignDialogOpen(true); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Atribuir profissional
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

      {/* Controles de paginação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-sm text-muted-foreground">
            Mostrando {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
            {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Primeira
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Próxima
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:!bg-primary hover:!text-white transition-colors"
          >
            Última
          </Button>
        </div>
      </div>

      {viewingPatient && (
        <Dialog open={!!viewingPatient} onOpenChange={() => setViewingPatient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Paciente</DialogTitle>
              <DialogDescription>
                Informações detalhadas de {viewingPatient.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <span className="col-span-3 font-medium">{viewingPatient.full_name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">CPF</Label>
                <span className="col-span-3">{viewingPatient.cpf}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Telefone</Label>
                <span className="col-span-3">{viewingPatient.phone_mobile}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Endereço</Label>
                <span className="col-span-3">
                  {`${viewingPatient.street || ''}, ${viewingPatient.number || ''} - ${viewingPatient.neighborhood || ''}, ${viewingPatient.city || ''} - ${viewingPatient.state || ''}`}
                </span>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Observações</Label>
                <span className="col-span-3">{viewingPatient.notes || "Nenhuma"}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingPatient(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Assignment dialog */}
      {assignDialogOpen && assignPatientId && (
        <AssignmentForm
          patientId={assignPatientId}
          open={assignDialogOpen}
          onClose={() => { setAssignDialogOpen(false); setAssignPatientId(null); }}
          onSaved={() => { setAssignDialogOpen(false); setAssignPatientId(null); loadAll(); }}
        />
      )}
    </div>
  );
}
