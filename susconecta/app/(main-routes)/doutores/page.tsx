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


import { listarMedicos, excluirMedico, buscarMedicos, buscarMedicoPorId, Medico } from "@/lib/api";

function normalizeMedico(m: any): Medico {
  return {
    id: String(m.id ?? m.uuid ?? ""),
    full_name: m.full_name ?? m.nome ?? "",        // 👈 Correção: usar full_name como padrão
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
    active: m.active ?? true,
    cep: m.cep ?? "",
    city: m.city ?? "",
    complement: m.complement ?? null,
    neighborhood: m.neighborhood ?? "",
    number: m.number ?? "",
    phone2: m.phone2 ?? null,
    state: m.state ?? "",
    street: m.street ?? "",
    created_at: m.created_at ?? null,
    created_by: m.created_by ?? null,
    updated_at: m.updated_at ?? null,
    updated_by: m.updated_by ?? null,
    user_id: m.user_id ?? null,
  };
}


export default function DoutoresPage() {
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Medico | null>(null);
  const [searchResults, setSearchResults] = useState<Medico[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

 
  async function load() {
    setLoading(true);
    try {
     const list = await listarMedicos({ limit: 50 });
     const normalized = (list ?? []).map(normalizeMedico);
     console.log('🏥 Médicos carregados:', normalized);
     setDoctors(normalized);

    } finally {
      setLoading(false);
    }
  }

  // Função para detectar se é um UUID válido
  function isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Função para buscar médicos no servidor
  async function handleBuscarServidor(termoBusca?: string) {
    const termo = (termoBusca || search).trim();
    
    if (!termo) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    console.log('🔍 Buscando médico por:', termo);
    
    setLoading(true);
    try {
      // Se parece com UUID, tenta busca direta por ID
      if (isValidUUID(termo)) {
        console.log('📋 Detectado UUID, buscando por ID...');
        try {
          const medico = await buscarMedicoPorId(termo);
          const normalizado = normalizeMedico(medico);
          console.log('✅ Médico encontrado por ID:', normalizado);
          setSearchResults([normalizado]);
          setSearchMode(true);
          return;
        } catch (error) {
          console.log('❌ Não encontrado por ID, tentando busca geral...');
        }
      }

      // Busca geral
      const resultados = await buscarMedicos(termo);
      const normalizados = resultados.map(normalizeMedico);
      console.log('📋 Resultados da busca geral:', normalizados);
      
      setSearchResults(normalizados);
      setSearchMode(true);
    } catch (error) {
      console.error('❌ Erro na busca:', error);
      setSearchResults([]);
      setSearchMode(true);
    } finally {
      setLoading(false);
    }
  }

  // Handler para mudança no campo de busca com busca automática
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valor = e.target.value;
    setSearch(valor);
    
    // Limpa o timeout anterior se existir
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Se limpar a busca, volta ao modo normal
    if (!valor.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    
    // Busca automática com debounce ajustável
    // Para IDs (UUID) longos, faz busca no servidor
    // Para busca parcial, usa apenas filtro local
    const isLikeUUID = valor.includes('-') && valor.length > 10;
    const shouldSearchServer = isLikeUUID || valor.length >= 3;
    
    if (shouldSearchServer) {
      const debounceTime = isLikeUUID ? 300 : 500;
      const newTimeout = setTimeout(() => {
        handleBuscarServidor(valor);
      }, debounceTime);
      
      setSearchTimeout(newTimeout);
    } else {
      // Para termos curtos, apenas usa filtro local
      setSearchMode(false);
      setSearchResults([]);
    }
  }

  // Handler para Enter no campo de busca
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBuscarServidor();
    }
  }

  // Handler para o botão de busca
  function handleClickBuscar() {
    handleBuscarServidor();
  }

  useEffect(() => {
    load();
  }, []);

  // Limpa o timeout quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Lista de médicos a exibir (busca ou filtro local)
  const displayedDoctors = useMemo(() => {
    console.log('🔍 Filtro - search:', search, 'searchMode:', searchMode, 'doctors:', doctors.length, 'searchResults:', searchResults.length);
    
    // Se não tem busca, mostra todos os médicos
    if (!search.trim()) return doctors;
    
    const q = search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    
    // Se estamos em modo de busca (servidor), filtra os resultados da busca
    const sourceList = searchMode ? searchResults : doctors;
    console.log('🔍 Usando sourceList:', searchMode ? 'searchResults' : 'doctors', '- tamanho:', sourceList.length);
    
    const filtered = sourceList.filter((d) => {
      // Busca por nome
      const byName = (d.full_name || "").toLowerCase().includes(q);
      
      // Busca por CRM (remove formatação se necessário)
      const byCrm = qDigits.length >= 3 && (d.crm || "").replace(/\D/g, "").includes(qDigits);
      
      // Busca por ID (UUID completo ou parcial)
      const byId = (d.id || "").toLowerCase().includes(q);
      
      // Busca por email
      const byEmail = (d.email || "").toLowerCase().includes(q);
      
      // Busca por especialidade
      const byEspecialidade = (d.especialidade || "").toLowerCase().includes(q);
      
      const match = byName || byCrm || byId || byEmail || byEspecialidade;
      if (match) {
        console.log('✅ Match encontrado:', d.full_name, d.id, 'por:', { byName, byCrm, byId, byEmail, byEspecialidade });
      }
      
      return match;
    });
    
    console.log('🔍 Resultados filtrados:', filtered.length);
    return filtered;
  }, [doctors, search, searchMode, searchResults]);

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
          doctorId={editingId}
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
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 w-80"
                placeholder="Digite para buscar por ID, nome, CRM ou especialidade…"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleClickBuscar}
              disabled={loading || !search.trim()}
            >
              Buscar
            </Button>
            {searchMode && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearch("");
                  setSearchMode(false);
                  setSearchResults([]);
                }}
              >
                Limpar
              </Button>
            )}
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
            ) : displayedDoctors.length > 0 ? (
              displayedDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.full_name}</TableCell>
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
                Informações detalhadas de {viewingDoctor?.full_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Nome</Label>
                <span className="col-span-3 font-medium">{viewingDoctor?.full_name}</span>
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
        Mostrando {displayedDoctors.length} {searchMode ? 'resultado(s) da busca' : `de ${doctors.length}`}
      </div>
    </div>
  );
}
