"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Search, Edit, Trash2, ArrowLeft, Eye, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DoctorRegistrationForm } from "@/components/forms/doctor-registration-form";
import AvailabilityForm from '@/components/forms/availability-form'
import ExceptionForm from '@/components/forms/exception-form'
import { listarDisponibilidades, DoctorAvailability, deletarDisponibilidade, listarExcecoes, DoctorException, deletarExcecao } from '@/lib/api'


import { listarMedicos, excluirMedico, buscarMedicos, buscarMedicoPorId, buscarPacientesPorIds, Medico } from "@/lib/api";
import { listAssignmentsForUser } from '@/lib/assignment';

function normalizeMedico(m: any): Medico {
  const normalizeSex = (v: any) => {
    if (v === null || typeof v === 'undefined') return null;
    const s = String(v || '').trim().toLowerCase();
    if (!s) return null;
    const male = new Set(['m','masc','male','masculino','homem','h','1','mas']);
    const female = new Set(['f','fem','female','feminino','mulher','mul','2','fem']);
    const other = new Set(['o','outro','other','3','nb','nonbinary','nao binario','não binário']);
    if (male.has(s)) return 'masculino';
    if (female.has(s)) return 'feminino';
    if (other.has(s)) return 'outro';
    if (['masculino','feminino','outro'].includes(s)) return s;
    return null;
  };

  const formatBirth = (v: any) => {
    if (!v && typeof v !== 'string') return null;
    const s = String(v || '').trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
      const [, y, mth, d] = iso;
      return `${d.padStart(2,'0')}/${mth.padStart(2,'0')}/${y}`;
    }
    const ddmmyyyy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) return s;
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2,'0');
      const mth = String(parsed.getMonth() + 1).padStart(2,'0');
      const y = String(parsed.getFullYear());
      return `${d}/${mth}/${y}`;
    }
    return null;
  };
  return {
    id: String(m.id ?? m.uuid ?? ""),
    full_name: m.full_name ?? m.nome ?? "",        // 👈 Correção: usar full_name como padrão
    nome_social: m.nome_social ?? m.social_name ?? null,
    cpf: m.cpf ?? "",
    rg: m.rg ?? m.document_number ?? null,
  sexo: normalizeSex(m.sexo ?? m.sex ?? m.sexualidade ?? null),
  data_nascimento: formatBirth(m.data_nascimento ?? m.birth_date ?? m.birthDate ?? null),
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

function translateWeekday(w?: string) {
  if (!w) return '';
  const key = w.toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
  const map: Record<string, string> = {
    'segunda': 'Segunda',
    'terca': 'Terça',
    'quarta': 'Quarta',
    'quinta': 'Quinta',
    'sexta': 'Sexta',
    'sabado': 'Sábado',
    'domingo': 'Domingo',
    'monday': 'Segunda',
    'tuesday': 'Terça',
    'wednesday': 'Quarta',
    'thursday': 'Quinta',
    'friday': 'Sexta',
    'saturday': 'Sábado',
    'sunday': 'Domingo',
  };
  return map[key] ?? w;
}


export default function DoutoresPage() {
  const [doctors, setDoctors] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Medico | null>(null);
  const [assignedDialogOpen, setAssignedDialogOpen] = useState(false);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [assignedLoading, setAssignedLoading] = useState(false);
  const [assignedDoctor, setAssignedDoctor] = useState<Medico | null>(null);
  const [availabilityOpenFor, setAvailabilityOpenFor] = useState<Medico | null>(null);
  const [availabilityViewingFor, setAvailabilityViewingFor] = useState<Medico | null>(null);
  const [availabilities, setAvailabilities] = useState<DoctorAvailability[]>([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<DoctorAvailability | null>(null);
  const [exceptions, setExceptions] = useState<DoctorException[]>([]);
  const [exceptionsLoading, setExceptionsLoading] = useState(false);
  const [exceptionViewingFor, setExceptionViewingFor] = useState<Medico | null>(null);
  const [exceptionOpenFor, setExceptionOpenFor] = useState<Medico | null>(null);
  const [searchResults, setSearchResults] = useState<Medico[]>([]);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

 
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
    void handleBuscarServidor();
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

  // Dados paginados
  const paginatedDoctors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayedDoctors.slice(startIndex, endIndex);
  }, [displayedDoctors, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(displayedDoctors.length / itemsPerPage);

  // Reset para página 1 quando mudar a busca ou itens por página
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, searchMode]);

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

  async function handleViewAssignedPatients(doctor: Medico) {
    setAssignedDoctor(doctor);
    setAssignedLoading(true);
    setAssignedPatients([]);
    try {
      const assigns = await listAssignmentsForUser(String(doctor.user_id ?? doctor.id));
      const patientIds = Array.isArray(assigns) ? assigns.map((a:any) => String(a.patient_id)).filter(Boolean) : [];
      if (patientIds.length) {
        const patients = await buscarPacientesPorIds(patientIds);
        setAssignedPatients(patients || []);
      } else {
        setAssignedPatients([]);
      }
    } catch (e) {
      console.warn('[DoutoresPage] erro ao carregar pacientes atribuídos:', e);
      setAssignedPatients([]);
    } finally {
      setAssignedLoading(false);
      setAssignedDialogOpen(true);
    }
  }

  async function reloadAvailabilities(doctorId?: string) {
    if (!doctorId) return;
    setAvailLoading(true);
    try {
      const list = await listarDisponibilidades({ doctorId, active: true });
      setAvailabilities(list || []);
    } catch (e) {
      console.warn('Erro ao recarregar disponibilidades:', e);
    } finally {
      setAvailLoading(false);
    }
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
      <div className="space-y-6 p-6 bg-background">
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
    <div className="space-y-6 p-6 bg-background">
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
              variant="secondary"
              onClick={() => void handleBuscarServidor()}
              disabled={loading}
              className="hover:bg-primary hover:text-white"
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
            <TableRow className="bg-primary hover:bg-primary">
              <TableHead className="text-primary-foreground">Nome</TableHead>
              <TableHead className="text-primary-foreground">Especialidade</TableHead>
              <TableHead className="text-primary-foreground">CRM</TableHead>
              <TableHead className="text-primary-foreground">Contato</TableHead>
              <TableHead className="w-[100px] text-primary-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : paginatedDoctors.length > 0 ? (
              paginatedDoctors.map((doctor) => (
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
                        <button className="h-8 w-8 p-0 flex items-center justify-center rounded-md hover:bg-primary hover:text-white transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(doctor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </DropdownMenuItem>
                        
                        {/* Ver pacientes atribuídos ao médico */}
                        <DropdownMenuItem onClick={() => handleViewAssignedPatients(doctor)}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver pacientes atribuídos
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setAvailabilityOpenFor(doctor)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar disponibilidade
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => setExceptionOpenFor(doctor)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Criar exceção
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={async () => {
                          setAvailLoading(true);
                          try {
                            const list = await listarDisponibilidades({ doctorId: doctor.id, active: true });
                            setAvailabilities(list || []);
                            setAvailabilityViewingFor(doctor);
                          } catch (e) {
                            console.warn('Erro ao listar disponibilidades:', e);
                          } finally {
                            setAvailLoading(false);
                          }
                        }}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver disponibilidades
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={async () => {
                          setExceptionsLoading(true);
                          try {
                            const list = await listarExcecoes({ doctorId: doctor.id });
                            setExceptions(list || []);
                            setExceptionViewingFor(doctor);
                          } catch (e) {
                            console.warn('Erro ao listar exceções:', e);
                          } finally {
                            setExceptionsLoading(false);
                          }
                        }}>
                          <Users className="mr-2 h-4 w-4" />
                          Ver exceções
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
            Mostrando {paginatedDoctors.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{" "}
            {Math.min(currentPage * itemsPerPage, displayedDoctors.length)} de {displayedDoctors.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Primeira
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="hover:bg-primary! hover:text-white! transition-colors"
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
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Próxima
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="hover:bg-primary! hover:text-white! transition-colors"
          >
            Última
          </Button>
        </div>
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

      {/* Availability modal */}
      {availabilityOpenFor && (
        <AvailabilityForm
          open={!!availabilityOpenFor}
          onOpenChange={(open) => { if (!open) setAvailabilityOpenFor(null); }}
          doctorId={availabilityOpenFor?.id}
          onSaved={(saved) => { console.log('Disponibilidade salva', saved); setAvailabilityOpenFor(null); /* optionally reload list */ reloadAvailabilities(availabilityOpenFor?.id); }}
        />
      )}

      {exceptionOpenFor && (
        <ExceptionForm
          open={!!exceptionOpenFor}
          onOpenChange={(open) => { if (!open) setExceptionOpenFor(null); }}
          doctorId={exceptionOpenFor?.id}
          onSaved={(saved) => { console.log('Exceção criada', saved); setExceptionOpenFor(null); /* reload availabilities in case a full-day block affects listing */ reloadAvailabilities(exceptionOpenFor?.id); }}
        />
      )}

      {/* Edit availability modal */}
      {editingAvailability && (
        <AvailabilityForm
          open={!!editingAvailability}
          onOpenChange={(open) => { if (!open) setEditingAvailability(null); }}
          doctorId={editingAvailability?.doctor_id ?? availabilityViewingFor?.id}
          availability={editingAvailability}
          mode="edit"
          onSaved={(saved) => { console.log('Disponibilidade atualizada', saved); setEditingAvailability(null); reloadAvailabilities(editingAvailability?.doctor_id ?? availabilityViewingFor?.id); }}
        />
      )}

      {/* Ver disponibilidades dialog */}
      {availabilityViewingFor && (
        <Dialog open={!!availabilityViewingFor} onOpenChange={(open) => { if (!open) { setAvailabilityViewingFor(null); setAvailabilities([]); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disponibilidades - {availabilityViewingFor.full_name}</DialogTitle>
              <DialogDescription>
                Lista de disponibilidades públicas do médico selecionado.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {availLoading ? (
                <div>Carregando disponibilidades…</div>
              ) : availabilities && availabilities.length ? (
                <div className="space-y-2">
                  {availabilities.map((a) => (
                      <div key={String(a.id)} className="p-2 border rounded flex justify-between items-start">
                        <div>
                          <div className="font-medium">{translateWeekday(a.weekday)} • {a.start_time} — {a.end_time}</div>
                          <div className="text-xs text-muted-foreground">Duração: {a.slot_minutes} min • Tipo: {a.appointment_type || '—'} • {a.active ? 'Ativa' : 'Inativa'}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingAvailability(a)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={async () => {
                            if (!confirm('Excluir esta disponibilidade?')) return;
                            try {
                              await deletarDisponibilidade(String(a.id));
                              // reload
                              reloadAvailabilities(availabilityViewingFor?.id ?? a.doctor_id);
                            } catch (e) {
                              console.warn('Erro ao deletar disponibilidade:', e);
                              alert((e as any)?.message || 'Erro ao deletar disponibilidade');
                            }
                          }}>Excluir</Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div>Nenhuma disponibilidade encontrada.</div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => { setAvailabilityViewingFor(null); setAvailabilities([]); }}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Ver exceções dialog */}
      {exceptionViewingFor && (
        <Dialog open={!!exceptionViewingFor} onOpenChange={(open) => { if (!open) { setExceptionViewingFor(null); setExceptions([]); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exceções - {exceptionViewingFor.full_name}</DialogTitle>
              <DialogDescription>
                Lista de exceções (bloqueios/liberações) do médico selecionado.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {exceptionsLoading ? (
                <div>Carregando exceções…</div>
              ) : exceptions && exceptions.length ? (
                <div className="space-y-2">
                  {exceptions.map((ex) => (
                    <div key={String(ex.id)} className="p-2 border rounded flex justify-between items-start">
                      <div>
                        <div className="font-medium">{ex.date} {ex.start_time ? `• ${ex.start_time}` : ''} {ex.end_time ? `— ${ex.end_time}` : ''}</div>
                        <div className="text-xs text-muted-foreground">Tipo: {ex.kind} • Motivo: {ex.reason || '—'}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={async () => {
                          if (!confirm('Excluir esta exceção?')) return;
                          try {
                            await deletarExcecao(String(ex.id));
                            const list = await listarExcecoes({ doctorId: exceptionViewingFor?.id });
                            setExceptions(list || []);
                          } catch (e) {
                            console.warn('Erro ao deletar exceção:', e);
                            alert((e as any)?.message || 'Erro ao deletar exceção');
                          }
                        }}>Excluir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>Nenhuma exceção encontrada.</div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => { setExceptionViewingFor(null); setExceptions([]); }}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="text-sm text-muted-foreground">
        {searchMode ? 'Resultado(s) da busca' : `Total de ${doctors.length} médico(s)`}
      </div>
      {/* Dialog para pacientes atribuídos */}
      <Dialog open={assignedDialogOpen} onOpenChange={(open) => { if (!open) { setAssignedDialogOpen(false); setAssignedPatients([]); setAssignedDoctor(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pacientes atribuídos{assignedDoctor ? ` - ${assignedDoctor.full_name}` : ''}</DialogTitle>
            <DialogDescription>
              Lista de pacientes atribuídos a este médico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {assignedLoading ? (
              <div>Carregando pacientes...</div>
            ) : assignedPatients && assignedPatients.length ? (
              <div className="space-y-2">
                {assignedPatients.map((p:any) => (
                  <div key={p.id} className="p-2 border rounded">
                    <div className="font-medium">{p.full_name ?? p.nome ?? p.name ?? '(sem nome)'}</div>
                    <div className="text-xs text-muted-foreground">ID: {p.id} {p.cpf ? `• CPF: ${p.cpf}` : ''}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>Nenhum paciente atribuído encontrado.</div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setAssignedDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
