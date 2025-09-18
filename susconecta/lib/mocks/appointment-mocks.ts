export const mockAppointments = [
  {
    id: "1",
    patient: "Ana Costa",
    time: "2025-09-10T09:00",
    duration: 30,
    type: "consulta" as const,
    status: "confirmed" as const,
    professional: "1",
    notes: "",
  },
  {
    id: "2",
    patient: "Pedro Alves",
    time: "2025-09-10T10:30",
    duration: 45,
    type: "retorno" as const,
    status: "pending" as const,
    professional: "2",
    notes: "",
  },
  {
    id: "3",
    patient: "Mariana Lima",
    time: "2025-09-10T14:00",
    duration: 60,
    type: "exame" as const,
    status: "confirmed" as const,
    professional: "3",
    notes: "",
  },
];

export const mockWaitingList = [
  {
    id: "1",
    name: "Ana Costa",
    specialty: "Cardiologia",
    preferredDate: "2025-09-12",
    priority: "high" as const,
    contact: "(11) 99999-9999",
  },
  {
    id: "2",
    name: "Pedro Alves",
    specialty: "Dermatologia",
    preferredDate: "2025-09-15",
    priority: "medium" as const,
    contact: "(11) 98888-8888",
  },
  {
    id: "3",
    name: "Mariana Lima",
    specialty: "Ortopedia",
    preferredDate: "2025-09-20",
    priority: "low" as const,
    contact: "(11) 97777-7777",
  },
];

export const mockProfessionals = [
  { id: "1", name: "Dr. Carlos Silva", specialty: "Cardiologia" },
  { id: "2", name: "Dra. Maria Santos", specialty: "Dermatologia" },
  { id: "3", name: "Dr. João Oliveira", specialty: "Ortopedia" },
];