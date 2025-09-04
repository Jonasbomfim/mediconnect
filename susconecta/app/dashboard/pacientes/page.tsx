"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Calendar,
  Gift,
  Eye,
  Edit,
  Trash2,
  CalendarPlus,
  ArrowLeft,
} from "lucide-react"
import { PatientRegistrationForm } from "@/components/forms/patient-registration-form"

const patients = [
  {
    id: 1,
    name: "Aaron Avalos Perez",
    phone: "(75) 99982-6363",
    city: "Aracaju",
    state: "Sergipe",
    lastAppointment: "26/09/2025 14:30",
    nextAppointment: "19/08/2025 15:00",
    isVip: false,
    convenio: "unimed",
    birthday: "1985-03-15",
    age: 40,
  },
  {
    id: 2,
    name: "ABENANDO OLIVEIRA DE JESUS",
    phone: "(75) 99986-0093",
    city: "-",
    state: "-",
    lastAppointment: "Ainda não houve atendimento",
    nextAppointment: "Nenhum atendimento agendado",
    isVip: false,
    convenio: "particular",
    birthday: "1978-12-03",
    age: 46,
  },
  {
    id: 3,
    name: "ABDIAS DANTAS DOS SANTOS",
    phone: "(75) 99125-7267",
    city: "São Cristóvão",
    state: "Sergipe",
    lastAppointment: "30/12/2024 08:40",
    nextAppointment: "Nenhum atendimento agendado",
    isVip: true,
    convenio: "bradesco",
    birthday: "1990-12-03",
    age: 34,
  },
  {
    id: 4,
    name: "Abdias Matheus Rodrigues Ferreira",
    phone: "(75) 99983-7711",
    city: "Pirambu",
    state: "Sergipe",
    lastAppointment: "04/09/2024 16:20",
    nextAppointment: "Nenhum atendimento agendado",
    isVip: false,
    convenio: "amil",
    birthday: "1982-12-03",
    age: 42,
  },
  {
    id: 5,
    name: "Abdon Ferreira Guerra",
    phone: "(75) 99971-0228",
    city: "-",
    state: "-",
    lastAppointment: "08/05/2025 08:00",
    nextAppointment: "Nenhum atendimento agendado",
    isVip: false,
    convenio: "unimed",
    birthday: "1975-12-03",
    age: 49,
  },
]

export default function PacientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConvenio, setSelectedConvenio] = useState("all")
  const [showVipOnly, setShowVipOnly] = useState(false)
  const [showBirthdays, setShowBirthdays] = useState(false)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [editingPatient, setEditingPatient] = useState<number | null>(null)
  const [advancedFilters, setAdvancedFilters] = useState({
    city: "",
    state: "",
    minAge: "",
    maxAge: "",
    lastAppointmentFrom: "",
    lastAppointmentTo: "",
  })
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || patient.phone.includes(searchTerm)

    const matchesConvenio = selectedConvenio === "all" || patient.convenio === selectedConvenio
    const matchesVip = !showVipOnly || patient.isVip

    const currentMonth = new Date().getMonth() + 1
    const patientBirthMonth = new Date(patient.birthday).getMonth() + 1
    const matchesBirthday = !showBirthdays || patientBirthMonth === currentMonth

    const matchesCity = !advancedFilters.city || patient.city.toLowerCase().includes(advancedFilters.city.toLowerCase())
    const matchesState =
      !advancedFilters.state || patient.state.toLowerCase().includes(advancedFilters.state.toLowerCase())
    const matchesMinAge = !advancedFilters.minAge || patient.age >= Number.parseInt(advancedFilters.minAge)
    const matchesMaxAge = !advancedFilters.maxAge || patient.age <= Number.parseInt(advancedFilters.maxAge)

    return (
      matchesSearch &&
      matchesConvenio &&
      matchesVip &&
      matchesBirthday &&
      matchesCity &&
      matchesState &&
      matchesMinAge &&
      matchesMaxAge
    )
  })

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      city: "",
      state: "",
      minAge: "",
      maxAge: "",
      lastAppointmentFrom: "",
      lastAppointmentTo: "",
    })
  }

  const handleViewDetails = (patientId: number) => {
    console.log("[v0] Ver detalhes do paciente:", patientId)
  }

  const handleEditPatient = (patientId: number) => {
    console.log("[v0] Editar paciente:", patientId)
    setEditingPatient(patientId)
    setShowPatientForm(true)
  }

  const handleScheduleAppointment = (patientId: number) => {
    console.log("[v0] Marcar consulta para paciente:", patientId)
  }

  const handleDeletePatient = (patientId: number) => {
    console.log("[v0] Excluir paciente:", patientId)
  }

  const handleAddPatient = () => {
    setEditingPatient(null)
    setShowPatientForm(true)
  }

  const handleFormClose = () => {
    setShowPatientForm(false)
    setEditingPatient(null)
  }

  if (showPatientForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleFormClose} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {editingPatient ? "Editar Paciente" : "Cadastrar Novo Paciente"}
            </h1>
            <p className="text-muted-foreground">
              {editingPatient ? "Atualize as informações do paciente" : "Preencha os dados do novo paciente"}
            </p>
          </div>
        </div>

        <PatientRegistrationForm patientId={editingPatient} onClose={handleFormClose} inline={true} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie as informações de seus pacientes</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleAddPatient}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar paciente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o Convênio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Convênios</SelectItem>
            <SelectItem value="unimed">Unimed</SelectItem>
            <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
            <SelectItem value="amil">Amil</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showVipOnly ? "default" : "outline"}
          onClick={() => setShowVipOnly(!showVipOnly)}
          className="flex items-center gap-2"
        >
          <Gift className="h-4 w-4" />
          VIP
        </Button>

        <Button
          variant={showBirthdays ? "default" : "outline"}
          onClick={() => setShowBirthdays(!showBirthdays)}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Aniversariantes
        </Button>

        <Dialog open={isAdvancedFilterOpen} onOpenChange={setIsAdvancedFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="h-4 w-4" />
              Filtro avançado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Filtros Avançados</DialogTitle>
              <DialogDescription>
                Use os filtros abaixo para refinar sua busca por pacientes específicos.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={advancedFilters.city}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, city: e.target.value }))}
                    placeholder="Digite a cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={advancedFilters.state}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="Digite o estado"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minAge">Idade mínima</Label>
                  <Input
                    id="minAge"
                    type="number"
                    value={advancedFilters.minAge}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, minAge: e.target.value }))}
                    placeholder="Ex: 18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAge">Idade máxima</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    value={advancedFilters.maxAge}
                    onChange={(e) => setAdvancedFilters((prev) => ({ ...prev, maxAge: e.target.value }))}
                    placeholder="Ex: 65"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={clearAdvancedFilters} variant="outline" className="flex-1 bg-transparent">
                  Limpar Filtros
                </Button>
                <Button onClick={() => setIsAdvancedFilterOpen(false)} className="flex-1">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último atendimento</TableHead>
              <TableHead>Próximo atendimento</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{patient.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <button onClick={() => handleViewDetails(patient.id)} className="hover:text-primary cursor-pointer">
                      {patient.name}
                    </button>
                    {patient.isVip && (
                      <Badge variant="secondary" className="text-xs">
                        VIP
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.city}</TableCell>
                <TableCell>{patient.state}</TableCell>
                <TableCell>
                  <span
                    className={patient.lastAppointment === "Ainda não houve atendimento" ? "text-muted-foreground" : ""}
                  >
                    {patient.lastAppointment}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={patient.nextAppointment === "Nenhum atendimento agendado" ? "text-muted-foreground" : ""}
                  >
                    {patient.nextAppointment}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(patient.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditPatient(patient.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleScheduleAppointment(patient.id)}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Marcar consulta
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeletePatient(patient.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredPatients.length} de {patients.length} pacientes
      </div>
    </div>
  )
}
