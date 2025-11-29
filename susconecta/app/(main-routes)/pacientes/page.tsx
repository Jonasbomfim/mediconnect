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
import { PatientRegistrationForm } from "@/components/features/forms/patient-registration-form";
import AssignmentForm from "@/components/features/admin/AssignmentForm";


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

  // Ordenação e filtros adicionais
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "recent" | "oldest">("name_asc");
  const [stateFilter, setStateFilter] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");

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

  // Opções dinâmicas para Estado e Cidade
  const stateOptions = useMemo(
    () =>
      Array.from(
        new Set((patients || []).map((p) => (p.state || "").trim()).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })),
    [patients],
  );

  const cityOptions = useMemo(() => {
    const base = (patients || []).filter((p) => !stateFilter || String(p.state) === stateFilter);
    return Array.from(
      new Set(base.map((p) => (p.city || "").trim()).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }));
  }, [patients, stateFilter]);

  // Índice para ordenar por "tempo" (ordem de carregamento)
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    (patients || []).forEach((p, i) => map.set(String(p.id), i));
    return map;
  }, [patients]);

  // Substitui o filtered anterior: aplica busca + filtros + ordenação
  const filtered = useMemo(() => {
    let base = patients;

    // Busca
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const qDigits = q.replace(/\D/g, "");
      base = patients.filter((p) => {
        const byName = (p.full_name || "").toLowerCase().includes(q);
        const byCPF = qDigits.length >= 3 && (p.cpf || "").replace(/\D/g, "").includes(qDigits);
        const byId = (p.id || "").toLowerCase().includes(q);
        const byEmail = (p.email || "").toLowerCase().includes(q);
        return byName || byCPF || byId || byEmail;
      });
    }

    // Filtros por UF e cidade
    const withLocation = base.filter((p) => {
      if (stateFilter && String(p.state) !== stateFilter) return false;
      if (cityFilter && String(p.city) !== cityFilter) return false;
      return true;
    });

    // Ordenação
    const sorted = [...withLocation];
    if (sortBy === "name_asc" || sortBy === "name_desc") {
      sorted.sort((a, b) => {
        const an = (a.full_name || "").trim();
        const bn = (b.full_name || "").trim();
        const cmp = an.localeCompare(bn, "pt-BR", { sensitivity: "base" });
        return sortBy === "name_asc" ? cmp : -cmp;
      });
    } else if (sortBy === "recent" || sortBy === "oldest") {
      sorted.sort((a, b) => {
        const ia = indexById.get(String(a.id)) ?? 0;
        const ib = indexById.get(String(b.id)) ?? 0;
        return sortBy === "recent" ? ia - ib : ib - ia;
      });
    }

    return sorted;
  }, [patients, search, stateFilter, cityFilter, sortBy, indexById]);

  // Dados paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  // Reset página ao mudar filtros/ordenadores
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, stateFilter, cityFilter, sortBy]);

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 bg-background">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pacientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie os pacientes</p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Novo paciente</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>

      {/* Filtros e busca responsivos */}
      <div className="space-y-2 sm:space-y-3">
        {/* Linha 1: Busca */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8 w-full text-xs sm:text-sm h-8 sm:h-9"
              placeholder="Nome, CPF ou ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscarServidor()}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void handleBuscarServidor()} className="hover:bg-primary hover:text-white text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-4">
            <span className="hidden sm:inline">Buscar</span>
            <span className="sm:hidden">Ir</span>
          </Button>
        </div>

        {/* Linha 2: Selects responsivos em grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {/* Ordenar por */}
          <select
            aria-label="Ordenar por"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value="name_asc">A–Z</option>
            <option value="name_desc">Z–A</option>
            <option value="recent">Recentes</option>
            <option value="oldest">Antigos</option>
          </select>

          {/* Estado (UF) */}
          <select
            aria-label="Filtrar por estado"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCityFilter("");
            }}
            className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value="">Estado</option>
            {stateOptions.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>

          {/* Cidade (dependente do estado) */}
          <select
            aria-label="Filtrar por cidade"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value="">Cidade</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground text-xs sm:text-sm">Nome</TableHead>
              <TableHead className="text-primary-foreground text-xs sm:text-sm">CPF</TableHead>
              <TableHead className="text-primary-foreground text-xs sm:text-sm">Telefone</TableHead>
              <TableHead className="text-primary-foreground text-xs sm:text-sm">Cidade</TableHead>
              <TableHead className="text-primary-foreground text-xs sm:text-sm">Estado</TableHead>
              <TableHead className="w-[100px] text-primary-foreground text-xs sm:text-sm">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">{p.full_name || "(sem nome)"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{p.cpf || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{p.phone_mobile || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{p.city || "-"}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{p.state || "-"}</TableCell>
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
                <TableCell colSpan={6} className="text-center text-xs sm:text-sm text-muted-foreground py-4">
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="md:hidden space-y-2">
        {paginatedData.length > 0 ? (
          paginatedData.map((p) => (
            <div key={p.id} className="bg-card p-3 sm:p-4 rounded-lg border border-border hover:border-primary transition-colors">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-[10px] sm:text-xs font-semibold text-primary">Nome</div>
                    <div className="text-xs sm:text-sm font-medium truncate">{p.full_name || "(sem nome)"}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-7 w-7 p-0 flex items-center justify-center rounded-md hover:bg-primary hover:text-white transition-colors flex-shrink-0">
                        <span className="sr-only">Menu</span>
                        <MoreHorizontal className="h-3.5 w-3.5" />
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
                        Atribuir prof.
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">CPF</div>
                  <div className="text-[10px] sm:text-xs font-medium">{p.cpf || "-"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Telefone</div>
                  <div className="text-[10px] sm:text-xs font-medium">{p.phone_mobile || "-"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Cidade</div>
                  <div className="text-[10px] sm:text-xs font-medium truncate">{p.city || "-"}</div>
                </div>
                <div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Estado</div>
                  <div className="text-[10px] sm:text-xs font-medium">{p.state || "-"}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-xs sm:text-sm text-muted-foreground py-4">
            Nenhum paciente encontrado
          </div>
        )}
      </div>

      {/* Controles de paginação - Responsivos */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground text-xs sm:text-sm">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-8 sm:h-9 rounded-md border border-input bg-background px-2 sm:px-3 py-1 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary transition-colors cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
          <span className="text-muted-foreground text-xs sm:text-sm">
            Mostrando {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
            {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
          >
            <span className="hidden sm:inline">Primeira</span>
            <span className="sm:hidden">1ª</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
          >
            <span className="hidden sm:inline">Anterior</span>
            <span className="sm:hidden">«</span>
          </Button>
          <span className="text-muted-foreground text-xs sm:text-sm">
            Pág {currentPage} de {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
          >
            <span className="hidden sm:inline">Próxima</span>
            <span className="sm:hidden">»</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:bg-primary! hover:text-white! transition-colors text-xs sm:text-sm h-7 sm:h-9 px-1 sm:px-3"
          >
            <span className="hidden sm:inline">Última</span>
            <span className="sm:hidden">Últ</span>
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
