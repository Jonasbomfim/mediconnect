// components/agendamento/AgendaCalendar.tsx (atualizado)
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, Calendar as CalendarIcon } from 'lucide-react';

interface Appointment {
  id: string;
  patient: string;
  time: string;
  duration: number;
  type: 'consulta' | 'exame' | 'retorno';
  status: 'confirmed' | 'pending' | 'absent';
  professional: string;
  notes: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface AgendaCalendarProps {
  professionals: Professional[];
  appointments: Appointment[];
  onAddAppointment: () => void;
  onEditAppointment: (appointment: Appointment) => void;
}

export default function AgendaCalendar({ 
  professionals, 
  appointments, 
  onAddAppointment, 
  onEditAppointment 
}: AgendaCalendarProps) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedProfessional, setSelectedProfessional] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());

  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8; // Das 8h às 18h
    return [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`];
  }).flat();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 border-green-500 text-green-800';
      case 'pending': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'absent': return 'bg-red-100 border-red-500 text-red-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consulta': return '🩺';
      case 'exame': return '📋';
      case 'retorno': return '↩️';
      default: return '📅';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtra os agendamentos por profissional selecionado
  const filteredAppointments = selectedProfessional === 'all' 
    ? appointments 
    : appointments.filter(app => app.professional === selectedProfessional);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Agenda</h2>
          
          <div className="flex flex-wrap gap-2">
            <select 
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name}</option>
              ))}
            </select>
            
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setView('day')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                  view === 'day' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Dia
              </button>
              <button
                type="button"
                onClick={() => setView('week')}
                className={`px-3 py-2 text-sm font-medium -ml-px ${
                  view === 'week' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setView('month')}
                className={`px-3 py-2 text-sm font-medium -ml-px rounded-r-md ${
                  view === 'month' 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
              >
                Mês
              </button>
            </div>
            
            <button 
              onClick={onAddAppointment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigateDate('prev')}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-medium text-gray-900">
              {formatDate(currentDate)}
            </h3>
            <button 
              onClick={() => navigateDate('next')}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={goToToday}
              className="ml-4 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Hoje
            </button>
          </div>
          <div className="text-sm text-gray-500">
            Atalhos: 'C' para calendário, 'F' para fila de espera
          </div>
        </div>
      </div>

      {/* Visualização de Dia/Semana (calendário) */}
      {view !== 'month' && (
        <div className="overflow-auto">
          <div className="min-w-full">
            <div className="flex">
              <div className="w-20 flex-shrink-0 border-r border-gray-200">
                <div className="h-12 border-b border-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                  Hora
                </div>
                {timeSlots.map(time => (
                  <div key={time} className="h-16 border-b border-gray-200 flex items-center justify-center text-sm text-gray-500">
                    {time}
                  </div>
                ))}
              </div>
              
              <div className="flex-1">
                <div className="h-12 border-b border-gray-200 flex items-center justify-center text-sm font-medium text-gray-500">
                  {currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </div>
                <div className="relative">
                  {timeSlots.map(time => (
                    <div key={time} className="h-16 border-b border-gray-200"></div>
                  ))}
                  
                  {filteredAppointments.map(app => {
                    const [date, timeStr] = app.time.split('T');
                    const [hours, minutes] = timeStr.split(':');
                    const hour = parseInt(hours);
                    const minute = parseInt(minutes);
                    
                    return (
                      <div
                        key={app.id}
                        className={`absolute left-1 right-1 border-l-4 rounded p-2 shadow-sm cursor-pointer ${getStatusColor(app.status)}`}
                        style={{
                          top: `${((hour - 8) * 64 + (minute / 60) * 64) + 48}px`,
                          height: `${(app.duration / 60) * 64}px`,
                        }}
                        onClick={() => onEditAppointment(app)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {app.patient}
                            </div>
                            <div className="text-xs flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {hours}:{minutes} - {app.type} {getTypeIcon(app.type)}
                            </div>
                            <div className="text-xs mt-1">
                              {professionals.find(p => p.id === app.professional)?.name}
                            </div>
                          </div>
                          <div className="text-xs capitalize">
                            {app.status === 'confirmed' ? 'confirmado' : app.status === 'pending' ? 'pendente' : 'ausente'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualização de Mês (lista) */}
      {view === 'month' && (
        <div className="p-4">
          <div className="space-y-4">
            {filteredAppointments.map(app => {
              const [date, timeStr] = app.time.split('T');
              const [hours, minutes] = timeStr.split(':');
              
              return (
                <div key={app.id} className={`border-l-4 p-4 rounded-lg shadow-sm ${getStatusColor(app.status)}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">{app.patient}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{hours}:{minutes} - {app.type} {getTypeIcon(app.type)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm">{professionals.find(p => p.id === app.professional)?.name}</span>
                    </div>
                  </div>
                  {app.notes && (
                    <div className="mt-2 text-sm text-gray-600">
                      {app.notes}
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => onEditAppointment(app)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}