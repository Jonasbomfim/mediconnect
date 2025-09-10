// hooks/useAgenda.ts
import { useState } from 'react';

export interface Appointment {
  id: string;
  patient: string;
  time: string;
  duration: number;
  type: 'consulta' | 'exame' | 'retorno';
  status: 'confirmed' | 'pending' | 'absent';
  professional: string;
  notes?: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
}

export interface WaitingPatient {
  id: string;
  name: string;
  specialty: string;
  preferredDate: string;
  priority: 'high' | 'medium' | 'low';
  contact: string;
}

export const useAgenda = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitingList, setWaitingList] = useState<WaitingPatient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const professionals: Professional[] = [
    { id: '1', name: 'Dr. Carlos Silva', specialty: 'Cardiologia' },
    { id: '2', name: 'Dra. Maria Santos', specialty: 'Dermatologia' },
    { id: '3', name: 'Dr. João Oliveira', specialty: 'Ortopedia' },
  ];

  const handleSaveAppointment = (appointment: Appointment) => {
    if (appointment.id) {
      // Editar agendamento existente
      setAppointments(prev => prev.map(a => a.id === appointment.id ? appointment : a));
    } else {
      // Novo agendamento
      const newAppointment = {
        ...appointment,
        id: Date.now().toString(),
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleNotifyPatient = (patientId: string) => {
    // Lógica para notificar paciente
    console.log(`Notificando paciente ${patientId}`);
  };

  const handleAddToWaitlist = () => {
    setIsWaitlistModalOpen(true);
  };

  return {
    appointments,
    waitingList,
    professionals,
    isModalOpen,
    selectedAppointment,
    isWaitlistModalOpen,
    handleSaveAppointment,
    handleEditAppointment,
    handleAddAppointment,
    handleCloseModal,
    handleNotifyPatient,
    handleAddToWaitlist,
  };
};