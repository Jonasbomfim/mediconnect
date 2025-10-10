/**
 * Atualiza um relatório existente (edição)
 * @param id ID do relatório a ser atualizado
 * @param dados Dados a serem atualizados no relatório
 */
export async function editarRelatorio(id: string, dados: Partial<{
  patient_id: string;
  order_number: string;
  exam: string;
  diagnosis: string;
  conclusion: string;
  cid_code: string;
  content_html: string;
  content_json: any;
  status: string;
  requested_by: string;
  due_at: string;
  hide_date: boolean;
  hide_signature: boolean;
}>): Promise<any> {
  const url = `${BASE_API_RELATORIOS}/${id}`;
  const cabecalhos: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      cabecalhos['Authorization'] = `Bearer ${token}`;
    }
  }
  const resposta = await fetch(url, {
    method: 'PATCH',
    headers: cabecalhos,
    body: JSON.stringify(dados),
  });
  if (!resposta.ok) throw new Error('Erro ao atualizar relatório');
  return resposta.json();
}
// services/reports.ts

import { 
  Report, 
  CreateReportData, 
  UpdateReportData, 
  ReportsResponse, 
  ReportResponse
} from '@/types/report-types';

// Definição local para ApiError
type ApiError = {
  message: string;
  code: string;
};

// URL base da API Supabase
const BASE_API_RELATORIOS = 'https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/reports';

// Cabeçalhos base para as requisições Supabase
function obterCabecalhos(token?: string): HeadersInit {
  const cabecalhos: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
    'Prefer': 'return=representation',
  };
  if (token) {
    cabecalhos['Authorization'] = `Bearer ${token}`;
  }
  return cabecalhos;
}

// Função para tratar erros da API
async function tratarRespostaApi<T>(resposta: Response): Promise<T> {
  if (!resposta.ok) {
    let mensagemErro = `HTTP ${resposta.status}: ${resposta.statusText}`;
    try {
      const dadosErro = await resposta.json();
      mensagemErro = dadosErro.message || dadosErro.error || mensagemErro;
    } catch (e) {
      // Se não conseguir parsear como JSON, usa a mensagem de status HTTP
    }
    const erro: ApiError = {
      message: mensagemErro,
      code: resposta.status.toString(),
    };
    throw erro;
  }
  const dados = await resposta.json();
  return dados;
}

// ===== SERVIÇOS DE RELATÓRIOS MÉDICOS =====

/**
 * Lista relatórios médicos com filtros opcionais (patient_id, status)
 */
export async function listarRelatorios(filtros?: { patient_id?: string; status?: string }): Promise<Report[]> {
  // Monta query string se houver filtros
  let url = BASE_API_RELATORIOS;
  if (filtros && (filtros.patient_id || filtros.status)) {
    const params = new URLSearchParams();
    if (filtros.patient_id) params.append('patient_id', filtros.patient_id);
    if (filtros.status) params.append('status', filtros.status);
    url += `?${params.toString()}`;
  }

  // Monta cabeçalhos conforme cURL
  const cabecalhos: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      cabecalhos['Authorization'] = `Bearer ${token}`;
    }
  }

  const resposta = await fetch(url, {
    method: 'GET',
    headers: cabecalhos,
  });
  if (!resposta.ok) throw new Error('Erro ao buscar relatórios');
  const dados = await resposta.json();
  if (Array.isArray(dados)) return dados;
  if (dados && Array.isArray(dados.data)) return dados.data;
  for (const chave in dados) {
    if (Array.isArray(dados[chave])) return dados[chave];
  }
  return [];
}

/**
 * Busca um relatório específico por ID
 */
export async function buscarRelatorioPorId(id: string): Promise<Report> {
  try {
    console.log('🔍 [API RELATÓRIOS] Buscando relatório ID:', id);
    const resposta = await fetch(`${BASE_API_RELATORIOS}?id=eq.${id}`, {
      method: 'GET',
      headers: obterCabecalhos(),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    const relatorio = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
    console.log('✅ [API RELATÓRIOS] Relatório encontrado:', relatorio);
    if (!relatorio) throw new Error('Relatório não encontrado');
    return relatorio;
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao buscar relatório:', erro);
    throw erro;
  }
}

/**
 * Cria um novo relatório médico
 */
export async function criarRelatorio(dadosRelatorio: CreateReportData, token?: string): Promise<Report> {
  const resposta = await fetch(BASE_API_RELATORIOS, {
    method: 'POST',
    headers: obterCabecalhos(token),
    body: JSON.stringify(dadosRelatorio),
  });
  if (!resposta.ok) {
    let mensagemErro = `HTTP ${resposta.status}: ${resposta.statusText}`;
    try {
      const dadosErro = await resposta.json();
      mensagemErro = dadosErro.message || dadosErro.error || mensagemErro;
    } catch (e) {}
    const erro: any = {
      message: mensagemErro,
      code: resposta.status.toString(),
    };
    throw erro;
  }
  const resultado = await resposta.json();
  // Supabase retorna array
  if (Array.isArray(resultado) && resultado.length > 0) {
    return resultado[0];
  }
  throw new Error('Resposta inesperada da API Supabase');
}

/**
 * Atualiza um relatório existente
 */
export async function atualizarRelatorio(id: string, dadosRelatorio: UpdateReportData): Promise<Report> {
  try {
    console.log('📝 [API RELATÓRIOS] Atualizando relatório ID:', id);
    console.log('📤 [API RELATÓRIOS] Dados:', dadosRelatorio);
    const resposta = await fetch(`${BASE_API_RELATORIOS}?id=eq.${id}`, {
      method: 'PATCH',
      headers: obterCabecalhos(),
      body: JSON.stringify(dadosRelatorio),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    const relatorio = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
    console.log('✅ [API RELATÓRIOS] Relatório atualizado:', relatorio);
    if (!relatorio) throw new Error('Relatório não encontrado');
    return relatorio;
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao atualizar relatório:', erro);
    throw erro;
  }
}

/**
 * Deleta um relatório
 */
export async function deletarRelatorio(id: string): Promise<void> {
  try {
    console.log('🗑️ [API RELATÓRIOS] Deletando relatório ID:', id);
    const resposta = await fetch(`${BASE_API_RELATORIOS}/${id}`, {
      method: 'DELETE',
      headers: obterCabecalhos(),
    });
    await tratarRespostaApi<void>(resposta);
    console.log('✅ [API RELATÓRIOS] Relatório deletado com sucesso');
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao deletar relatório:', erro);
    throw erro;
  }
}

/**
 * Lista relatórios de um paciente específico
 */
export async function listarRelatoriosPorPaciente(idPaciente: string): Promise<Report[]> {
  try {
    console.log('👤 [API RELATÓRIOS] Buscando relatórios do paciente:', idPaciente);
    const resposta = await fetch(`${BASE_API_RELATORIOS}?patient_id=eq.${idPaciente}`, {
      method: 'GET',
      headers: obterCabecalhos(),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    console.log('✅ [API RELATÓRIOS] Relatórios do paciente encontrados:', resultado.length);
    return resultado;
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao buscar relatórios do paciente:', erro);
    throw erro;
  }
}

/**
 * Lista relatórios de um médico específico
 */
export async function listarRelatoriosPorMedico(idMedico: string): Promise<Report[]> {
  try {
    console.log('👨‍⚕️ [API RELATÓRIOS] Buscando relatórios do médico:', idMedico);
    const resposta = await fetch(`${BASE_API_RELATORIOS}?requested_by=eq.${idMedico}`, {
      method: 'GET',
      headers: obterCabecalhos(),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    console.log('✅ [API RELATÓRIOS] Relatórios do médico encontrados:', resultado.length);
    return resultado;
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao buscar relatórios do médico:', erro);
    throw erro;
  }
}