"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search, Edit, Trash2, ArrowLeft, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DoctorRegistrationForm, Medico } from "@/components/forms/doctor-registration-form";

// Mock data for doctors
const initialDoctors: Medico[] = [
  {
    id: "1",
    nome: "Dr. João Silva",
    especialidade: "Cardiologia",
    crm: "12345-SP",
    email: "joao.silva@example.com",
    telefone: "(11) 99999-1234",
  },
  {
    id: "2",
    nome: "Dra. Maria Oliveira",
    especialidade: "Pediatria",
    crm: "54321-RJ",
    email: "maria.oliveira@example.com",
    telefone: "(21) 98888-5678",
  },
];

export default function DoutoresPage() {
  const [doctors, setDoctors] = useState<Medico[]>(initialDoctors);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  function handleDelete(id: string) {
    if (!confirm("Excluir este médico?")) return;
    setDoctors((prev) => prev.filter((x) => String(x.id) !== String(id)));
  }

  function handleSaved(medico: Medico) {
    const saved = medico;
    setDoctors((prev) => {
      // Se não houver ID, é um novo médico
      if (!saved.id) {
        return [{ ...saved, id: String(Date.now()) }, ...prev];
      }
      // Se houver ID, é uma edição
      const i = prev.findIndex((x) => String(x.id) === String(saved.id));
      if (i < 0) return [{ ...saved, id: String(Date.now()) }, ...prev]; // Caso não encontre, adiciona
      const clone = [...prev];
      clone[i] = saved;
      return clone;
    });
    setShowForm(false);
  }

  if (showForm) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
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
          <Button onClick={handleAdd}>
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
            {filtered.length > 0 ? (
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
                        <DropdownMenuItem onClick={() => alert(JSON.stringify(doctor, null, 2))}>
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
      <div className="text-sm text-muted-foreground">Mostrando {filtered.length} de {doctors.length}</div>
    </div>
  );
} 