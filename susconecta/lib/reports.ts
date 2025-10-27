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
  // If token not passed explicitly, try the same fallbacks as lib/api.ts
  if (!token && typeof window !== 'undefined') {
    token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') ||
      undefined;
  }

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
    let rawText = '';
    try {
      rawText = await resposta.clone().text();
      const dadosErro = JSON.parse(rawText || '{}');
      mensagemErro = dadosErro.message || dadosErro.error || mensagemErro;
    } catch (e) {
      // Se não conseguir parsear como JSON, manter rawText para debug
    }
    console.error('[tratarRespostaApi] response raw:', rawText);
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

  // Busca o token do usuário (compatível com lib/api.ts keys)
  let token: string | undefined = undefined;
  if (typeof window !== 'undefined') {
    token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('auth_token') ||
      sessionStorage.getItem('token') ||
      undefined;
  }

  // Monta cabeçalhos conforme cURL
  const cabecalhos: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
  };
  if (token) {
    cabecalhos['Authorization'] = `Bearer ${token}`;
  }

  // Logs de depuração (mask token)
  const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : null;
  console.log('[listarRelatorios] URL:', url);
  console.log('[listarRelatorios] Authorization (masked):', masked);
  console.log('[listarRelatorios] Headers (masked):', {
    ...cabecalhos,
    Authorization: cabecalhos['Authorization'] ? '<<masked>>' : undefined,
  });

  const resposta = await fetch(url, {
    method: 'GET',
    headers: cabecalhos,
  });
  console.log('[listarRelatorios] Status:', resposta.status, resposta.statusText);
  const dados = await resposta.json().catch(() => null);
  console.log('[listarRelatorios] Payload:', dados);
  if (!resposta.ok) throw new Error('Erro ao buscar relatórios');
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
  const headers = obterCabecalhos(token);
  const masked = (headers as any)['Authorization'] ? String((headers as any)['Authorization']).replace(/Bearer\s+(.+)/, 'Bearer <token_masked>') : null;
  console.log('[criarRelatorio] POST', BASE_API_RELATORIOS);
  console.log('[criarRelatorio] Headers (masked):', { ...headers, Authorization: masked });

  const resposta = await fetch(BASE_API_RELATORIOS, {
    method: 'POST',
    headers,
    body: JSON.stringify(dadosRelatorio),
  });
  console.log('[criarRelatorio] Status:', resposta.status, resposta.statusText);
  if (!resposta.ok) {
    let mensagemErro = `HTTP ${resposta.status}: ${resposta.statusText}`;
    try {
      const dadosErro = await resposta.json();
      mensagemErro = dadosErro.message || dadosErro.error || mensagemErro;
      console.error('[criarRelatorio] error body:', dadosErro);
    } catch (e) {
      console.error('[criarRelatorio] erro ao parsear body de erro');
    }
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
    // Try a strict eq lookup first (encode the id)
    const encodedId = encodeURIComponent(String(idPaciente));
    let url = `${BASE_API_RELATORIOS}?patient_id=eq.${encodedId}`;
    const headers = obterCabecalhos();
    const masked = (headers as any)['Authorization'] ? `${String((headers as any)['Authorization']).slice(0,6)}...${String((headers as any)['Authorization']).slice(-6)}` : null;
    console.debug('[listarRelatoriosPorPaciente] URL:', url);
    console.debug('[listarRelatoriosPorPaciente] Headers (masked):', { ...headers, Authorization: masked ? '<<masked>>' : undefined });
    const resposta = await fetch(url, {
      method: 'GET',
      headers,
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    console.log('✅ [API RELATÓRIOS] Relatórios do paciente encontrados (eq):', resultado.length);
    // If eq returned results, return them. Otherwise retry using `in.(id)` which some setups prefer.
    if (Array.isArray(resultado) && resultado.length) return resultado;

    // Retry with in.(id) clause as a fallback
    try {
      const inClause = encodeURIComponent(`(${String(idPaciente)})`);
      const urlIn = `${BASE_API_RELATORIOS}?patient_id=in.${inClause}`;
      console.debug('[listarRelatoriosPorPaciente] retrying with IN clause URL:', urlIn);
      const resp2 = await fetch(urlIn, { method: 'GET', headers });
      const res2 = await tratarRespostaApi<Report[]>(resp2);
      console.log('✅ [API RELATÓRIOS] Relatórios do paciente encontrados (in):', Array.isArray(res2) ? res2.length : 0);
      return Array.isArray(res2) ? res2 : [];
    } catch (e) {
      console.warn('[listarRelatoriosPorPaciente] fallback in.() failed', e);
    }

    return [];
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
    const url = `${BASE_API_RELATORIOS}?requested_by=eq.${idMedico}`;
    const headers = obterCabecalhos();
    const masked = (headers as any)['Authorization'] ? `${String((headers as any)['Authorization']).slice(0,6)}...${String((headers as any)['Authorization']).slice(-6)}` : null;
    console.debug('[listarRelatoriosPorMedico] URL:', url);
    console.debug('[listarRelatoriosPorMedico] Headers (masked):', { ...headers, Authorization: masked ? '<<masked>>' : undefined });
    const resposta = await fetch(url, {
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

/**
 * Lista relatórios para vários pacientes em uma única chamada (usa in.(...)).
 * Retorna array vazio se nenhum id for fornecido.
 */
export async function listarRelatoriosPorPacientes(ids: string[]): Promise<Report[]> {
  try {
    if (!ids || !ids.length) return [];
    // sanitize ids and remove empties
    const cleaned = ids.map(i => String(i).trim()).filter(Boolean);
    if (!cleaned.length) return [];

    // monta cláusula in.(id1,id2,...)
    const inClause = cleaned.join(',');
    const url = `${BASE_API_RELATORIOS}?patient_id=in.(${inClause})`;
    const headers = obterCabecalhos();
    const masked = (headers as any)['Authorization'] ? '<<masked>>' : undefined;
    console.debug('[listarRelatoriosPorPacientes] URL:', url);
    console.debug('[listarRelatoriosPorPacientes] Headers (masked):', { ...headers, Authorization: masked ? '<<masked>>' : undefined });

    const resposta = await fetch(url, { method: 'GET', headers });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    console.log('✅ [API RELATÓRIOS] Relatórios encontrados para pacientes:', resultado.length);
    return resultado;
  } catch (erro) {
    console.error('❌ [API RELATÓRIOS] Erro ao buscar relatórios para vários pacientes:', erro);
    throw erro;
  }
}

/**
 * Lista relatórios apenas para pacientes que foram atribuídos ao médico (userId).
 * - Recupera as atribuições via `listAssignmentsForUser(userId)`
 * - Extrai os patient_id e chama `listarRelatoriosPorPacientes` em batch
 */
export async function listarRelatoriosParaMedicoAtribuido(userId?: string): Promise<Report[]> {
  try {
    if (!userId) {
      console.warn('[listarRelatoriosParaMedicoAtribuido] userId ausente, retornando array vazio');
      return [];
    }

    console.log('[listarRelatoriosParaMedicoAtribuido] buscando assignments para user:', userId);
    // importe dinamicamente para evitar possíveis ciclos
    const assignmentMod = await import('./assignment');
    const assigns = await assignmentMod.listAssignmentsForUser(String(userId));
    if (!assigns || !Array.isArray(assigns) || assigns.length === 0) {
      console.log('[listarRelatoriosParaMedicoAtribuido] nenhum paciente atribuído encontrado para user:', userId);
      return [];
    }

    const patientIds = Array.from(new Set(assigns.map((a: any) => String(a.patient_id)).filter(Boolean)));
    if (!patientIds.length) {
      console.log('[listarRelatoriosParaMedicoAtribuido] nenhuma patient_id válida encontrada nas atribuições');
      return [];
    }

    console.log('[listarRelatoriosParaMedicoAtribuido] carregando relatórios para pacientes:', patientIds);
    const rels = await listarRelatoriosPorPacientes(patientIds);
    return rels || [];
  } catch (err) {
    console.error('[listarRelatoriosParaMedicoAtribuido] erro:', err);
    throw err;
  }
}