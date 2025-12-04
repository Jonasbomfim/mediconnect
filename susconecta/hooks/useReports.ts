// hooks/useReports.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  Report, 
  CreateReportData, 
  UpdateReportData
} from '@/types/report-types';
import {
  listarRelatorios,
  buscarRelatorioPorId,
  criarRelatorio,
  atualizarRelatorio,
  deletarRelatorio,
  listarRelatoriosPorPaciente,
  listarRelatoriosPorMedico
} from '@/lib/reports';
import { buscarPacientePorId, buscarMedicoPorId, buscarPacientesPorIds, buscarMedicosPorIds } from '@/lib/api';

interface UseReportsReturn {
  // Estados
  reports: Report[];
  selectedReport: Report | null;
  loading: boolean;
  error: string | null;
  
  // Ações
  loadReports: () => Promise<void>;
  loadReportById: (id: string) => Promise<Report>;
  createNewReport: (data: CreateReportData) => Promise<Report>;
  updateExistingReport: (id: string, data: UpdateReportData) => Promise<Report>;
  deleteExistingReport: (id: string) => Promise<void>;
  loadReportsByPatient: (patientId: string) => Promise<void>;
  loadReportsByDoctor: (doctorId: string) => Promise<void>;
  clearError: () => void;
  clearSelectedReport: () => void;
}

export function useReports(): UseReportsReturn {
  // Estados
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Caches em memória para evitar múltiplas buscas pelo mesmo ID durante a sessão
  const patientsCacheRef = (globalThis as any).__reportsPatientsCache__ || new Map<string, any>();
  const doctorsCacheRef = (globalThis as any).__reportsDoctorsCache__ || new Map<string, any>();
  // store back to globalThis so cache persiste entre hot reloads
  (globalThis as any).__reportsPatientsCache__ = patientsCacheRef;
  (globalThis as any).__reportsDoctorsCache__ = doctorsCacheRef;

  // Função para tratar erros
  const handleError = useCallback((error: any) => {
    console.error('❌ [useReports] Erro:', error);
    
    if (error && typeof error === 'object' && 'message' in error) {
      setError(error.message);
    } else if (typeof error === 'string') {
      setError(error);
    } else {
      setError('Ocorreu um erro inesperado');
    }
  }, []);

  // Carregar todos os relatórios
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await listarRelatorios();

      // Enriquecer relatórios: quando o backend retorna apenas IDs para paciente/executante,
      // buscamos os detalhes (nome, cpf, etc) em batch e anexamos como `paciente` e `executante`.
      const reportsWithRelations = await (async (arr: any[]) => {
        if (!arr || !arr.length) return arr;

        const patientIds: string[] = [];
        const doctorIds: string[] = [];

        for (const r of arr) {
          const pid = r.patient_id ?? r.patient ?? r.paciente;
          if (pid && typeof pid === 'string' && !patientIds.includes(pid) && !patientsCacheRef.has(String(pid))) patientIds.push(pid);

          const did = r.requested_by ?? r.created_by ?? r.executante;
          if (did && typeof did === 'string' && !doctorIds.includes(did) && !doctorsCacheRef.has(String(did))) doctorIds.push(did);
        }

        const patientsById = new Map<string, any>();
        if (patientIds.length) {
          try {
            const patients = await buscarPacientesPorIds(patientIds);
            for (const p of patients) {
              patientsById.set(String(p.id), p);
              patientsCacheRef.set(String(p.id), p);
            }
          } catch (e) {
            // ignore batch failure
          }
        }

        // fallback individual para quaisquer IDs que não foram resolvidos no batch
        const unresolvedPatientIds = patientIds.filter(id => !patientsById.has(String(id)) && !patientsCacheRef.has(String(id)));
        if (unresolvedPatientIds.length) {
          await Promise.all(unresolvedPatientIds.map(async (id) => {
            try {
              const p = await buscarPacientePorId(id);
              if (p) {
                patientsById.set(String(id), p);
                patientsCacheRef.set(String(id), p);
              }
            } catch (e) {
              // ignore individual failure
            }
          }));
        }

        const doctorsById = new Map<string, any>();
        if (doctorIds.length) {
          try {
            const doctors = await buscarMedicosPorIds(doctorIds);
            for (const d of doctors) {
              doctorsById.set(String(d.id), d);
              doctorsCacheRef.set(String(d.id), d);
            }
          } catch (e) {
            // ignore
          }
        }

        const unresolvedDoctorIds = doctorIds.filter(id => !doctorsById.has(String(id)) && !doctorsCacheRef.has(String(id)));
        if (unresolvedDoctorIds.length) {
          await Promise.all(unresolvedDoctorIds.map(async (id) => {
            try {
              const d = await buscarMedicoPorId(id);
              if (d) {
                doctorsById.set(String(id), d);
                doctorsCacheRef.set(String(id), d);
              }
            } catch (e) {
              // ignore
            }
          }));
        }

        const mapped = arr.map((r) => {
          const copy = { ...r } as any;

          // Heurísticas: prefira nomes já presentes no payload do relatório
          const possiblePatientName = r.patient_name ?? r.patient_full_name ?? r.patientFullName ?? r.paciente?.full_name ?? r.paciente?.nome ?? r.patient?.full_name ?? r.patient?.nome;
          if (possiblePatientName) {
            copy.paciente = copy.paciente || {};
            copy.paciente.full_name = possiblePatientName;
          }

          const pid = r.patient_id ?? r.patient ?? r.paciente;
          if (!copy.paciente && pid) {
            if (patientsById.has(String(pid))) copy.paciente = patientsById.get(String(pid));
            else if (patientsCacheRef.has(String(pid))) copy.paciente = patientsCacheRef.get(String(pid));
          }

          // Executante: prefira campos de nome já fornecidos
          const possibleExecutorName = r.requested_by_name ?? r.requester_name ?? r.requestedByName ?? r.executante_name ?? r.executante?.nome ?? r.executante;
          if (possibleExecutorName) {
            copy.executante = possibleExecutorName;
          } else {
            const did = r.requested_by ?? r.created_by ?? r.executante;
            if (did) {
              if (doctorsById.has(String(did))) copy.executante = doctorsById.get(String(did))?.full_name ?? doctorsById.get(String(did))?.nome ?? copy.executante;
              else if (doctorsCacheRef.has(String(did))) copy.executante = doctorsCacheRef.get(String(did))?.full_name ?? doctorsCacheRef.get(String(did))?.nome ?? copy.executante;
            }
          }

          return copy;
        });

        // Debug: identificar relatórios que ainda não tiveram paciente/doctor resolvido
        try {
          const unresolvedPatients: string[] = [];
          const unresolvedDoctors: string[] = [];
          for (const r of mapped) {
            const pid = r.patient_id ?? r.patient ?? r.paciente;
            if (pid && !r.paciente) unresolvedPatients.push(String(pid));
            const did = r.requested_by ?? r.created_by ?? r.executante;
            // note: if executante was resolved to a name, r.executante will be string name; if still ID, it may be ID
            if (did && (typeof r.executante === 'undefined' || (typeof r.executante === 'string' && r.executante.length > 30 && r.executante.includes('-')))) {
              unresolvedDoctors.push(String(did));
            }
          }
          if (unresolvedPatients.length) console.warn('[useReports] Pacientes não resolvidos (após batch+fallback):', Array.from(new Set(unresolvedPatients)).slice(0,50));
          if (unresolvedDoctors.length) console.warn('[useReports] Executantes não resolvidos (após batch+fallback):', Array.from(new Set(unresolvedDoctors)).slice(0,50));
        } catch (e) {
          // ignore logging errors
        }

        return mapped;
      })(data as any[]);

      setReports(reportsWithRelations || data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Carregar um relatório específico
  const loadReportById = useCallback(async (id: string): Promise<Report> => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await buscarRelatorioPorId(id);
      setSelectedReport(report);
      return report;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Criar novo relatório
  const createNewReport = useCallback(async (data: CreateReportData): Promise<Report> => {
    setLoading(true);
    setError(null);
    
    try {
      const newReport = await criarRelatorio(data);
      
      // Adicionar o novo relatório à lista
      setReports(prev => [newReport, ...prev]);
      
      return newReport;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Atualizar relatório existente
  const updateExistingReport = useCallback(async (id: string, data: UpdateReportData): Promise<Report> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedReport = await atualizarRelatorio(id, data);
      
      // Atualizar na lista
      setReports(prev => 
        prev.map(report => 
          report.id === id ? updatedReport : report
        )
      );
      
      // Atualizar o selecionado se for o mesmo
      if (selectedReport?.id === id) {
        setSelectedReport(updatedReport);
      }
      
      return updatedReport;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedReport]);

  // Deletar relatório
  const deleteExistingReport = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await deletarRelatorio(id);
      
      // Remover da lista
      setReports(prev => prev.filter(report => report.id !== id));
      
      // Limpar seleção se for o mesmo
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedReport]);

  // Carregar relatórios por paciente
  const loadReportsByPatient = useCallback(async (patientId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await listarRelatoriosPorPaciente(patientId);
      setReports(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Carregar relatórios por médico
  const loadReportsByDoctor = useCallback(async (doctorId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await listarRelatoriosPorMedico(doctorId);
      setReports(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpar relatório selecionado
  const clearSelectedReport = useCallback(() => {
    setSelectedReport(null);
  }, []);

  return {
    // Estados
    reports,
    selectedReport,
    loading,
    error,
    
    // Ações
    loadReports,
    loadReportById,
    createNewReport,
    updateExistingReport,
    deleteExistingReport,
    loadReportsByPatient,
    loadReportsByDoctor,
    clearError,
    clearSelectedReport,
  };
}