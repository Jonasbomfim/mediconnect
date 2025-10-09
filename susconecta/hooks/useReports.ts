// hooks/useReports.ts

import { useState, useEffect, useCallback } from 'react';
import { 
  Report, 
  CreateReportData, 
  UpdateReportData,
  ApiError 
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

interface UseReportsReturn {
  // Estados
  reports: Report[];
  selectedReport: Report | null;
  loading: boolean;
  error: string | null;
  
  // Ações
  loadReports: () => Promise<void>;
  loadReportById: (id: string) => Promise<void>;
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
      setReports(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Carregar um relatório específico
  const loadReportById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await buscarRelatorioPorId(id);
      setSelectedReport(report);
    } catch (err) {
      handleError(err);
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