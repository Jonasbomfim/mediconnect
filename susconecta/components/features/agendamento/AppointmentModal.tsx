'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Appointment {
  id?: string;
  patient: string;
  time: string;
  duration: number;
  type: 'consulta' | 'exame' | 'retorno';
  status: 'confirmed' | 'pending' | 'absent';
  professional: string;
  notes?: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  professionals: Professional[];
  appointment?: Appointment | null;
}

export default function AppointmentModal({ 
  isOpen, 
  onClose, 
  onSave, 
  professionals, 
  appointment 
}: AppointmentModalProps) {
  const [formData, setFormData] = useState<Appointment>({
    patient: '',
    time: '',
    duration: 30,
    type: 'consulta',
    status: 'pending',
    professional: '',
    notes: ''
  });

  useEffect(() => {
    if (appointment) {
      setFormData(appointment);
    } else {
      setFormData({
        patient: '',
        time: '',
        duration: 30,
        type: 'consulta',
        status: 'pending',
        professional: professionals[0]?.id || '',
        notes: ''
      });
    }
  }, [appointment, professionals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Paciente
              </label>
              <input
                type="text"
                name="patient"
                value={formData.patient}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profissional
              </label>
              <select
                name="professional"
                value={formData.professional}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Selecione um profissional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name} - {prof.specialty}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora
                </label>
                <input
                  type="datetime-local"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duração (min)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="consulta">Consulta</option>
                  <option value="exame">Exame</option>
                  <option value="retorno">Retorno</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendente</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="absent">Ausente</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}