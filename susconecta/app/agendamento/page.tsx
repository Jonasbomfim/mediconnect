// app/agendamento/page.tsx
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Importação dinâmica para evitar erros de SSR
const AgendaCalendar = dynamic(() => import('@/components/agendamento/AgendaCalendar'), { 
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
});

const AppointmentModal = dynamic(() => import('@/components/agendamento/AppointmentModal'), { ssr: false });
const ListaEspera = dynamic(() => import('@/components/agendamento/ListaEspera'), { ssr: false });

// Dados mockados
const mockAppointments = [
  { id: '1', patient: 'Ana Costa', time: '2025-09-10T09:00', duration: 30, type: 'consulta' as const, status: 'confirmed' as const, professional: '1', notes: '' },
  { id: '2', patient: 'Pedro Alves', time: '2025-09-10T10:30', duration: 45, type: 'retorno' as const, status: 'pending' as const, professional: '2', notes: '' },
  { id: '3', patient: 'Mariana Lima', time: '2025-09-10T14:00', duration: 60, type: 'exame' as const, status: 'confirmed' as const, professional: '3', notes: '' },
];

const mockWaitingList = [
  { id: '1', name: 'Ana Costa', specialty: 'Cardiologia', preferredDate: '2025-09-12', priority: 'high' as const, contact: '(11) 99999-9999' },
  { id: '2', name: 'Pedro Alves', specialty: 'Dermatologia', preferredDate: '2025-09-15', priority: 'medium' as const, contact: '(11) 98888-8888' },
  { id: '3', name: 'Mariana Lima', specialty: 'Ortopedia', preferredDate: '2025-09-20', priority: 'low' as const, contact: '(11) 97777-7777' },
];

const mockProfessionals = [
  { id: '1', name: 'Dr. Carlos Silva', specialty: 'Cardiologia' },
  { id: '2', name: 'Dra. Maria Santos', specialty: 'Dermatologia' },
  { id: '3', name: 'Dr. João Oliveira', specialty: 'Ortopedia' },
];

export default function AgendamentoPage() {
  const [appointments, setAppointments] = useState(mockAppointments);
  const [waitingList, setWaitingList] = useState(mockWaitingList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'agenda' | 'espera'>('agenda');

  const handleSaveAppointment = (appointment: any) => {
    if (appointment.id) {
      setAppointments(prev => prev.map(a => a.id === appointment.id ? appointment : a));
    } else {
      const newAppointment = {
        ...appointment,
        id: Date.now().toString(),
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
  };

  const handleEditAppointment = (appointment: any) => {
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
    console.log(`Notificando paciente ${patientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamento</h1>
          <p className="text-gray-600 mt-2">Gerencie a agenda da clínica</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'agenda' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setActiveTab('espera')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'espera' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Lista de Espera
          </button>
        </div>
      </div>

      {activeTab === 'agenda' ? (
        <AgendaCalendar
          professionals={mockProfessionals}
          appointments={appointments}
          onAddAppointment={handleAddAppointment}
          onEditAppointment={handleEditAppointment}
        />
      ) : (
        <ListaEspera
          patients={waitingList}
          onNotify={handleNotifyPatient}
          onAddToWaitlist={() => {}}
        />
      )}

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAppointment}
        professionals={mockProfessionals}
        appointment={selectedAppointment}
      />
    </div>
  );
}