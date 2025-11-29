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
import { buscarPacientePorId } from '@/lib/api';

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

  // Logs removidos por segurança

  const resposta = await fetch(url, {
    method: 'GET',
    headers: cabecalhos,
  });
  // Logs removidos por segurança
  const dados = await resposta.json().catch(() => null);
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
    // Validar ID antes de fazer requisição
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.warn('[REPORTS] ID vazio ou inválido ao buscar relatório');
      throw new Error('ID de relatório inválido');
    }

    const encodedId = encodeURIComponent(id.trim());
    const resposta = await fetch(`${BASE_API_RELATORIOS}?id=eq.${encodedId}`, {
      method: 'GET',
      headers: obterCabecalhos(),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    const relatorio = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
    if (!relatorio) throw new Error('Relatório não encontrado');
    return relatorio;
  } catch (erro) {
    console.error('[REPORTS] Erro ao buscar relatório:', erro);
    throw erro;
  }
}

/**
 * Cria um novo relatório médico
 */
export async function criarRelatorio(dadosRelatorio: CreateReportData, token?: string): Promise<Report> {
  const headers = obterCabecalhos(token);
  // Logs removidos por segurança

  const resposta = await fetch(BASE_API_RELATORIOS, {
    method: 'POST',
    headers,
    body: JSON.stringify(dadosRelatorio),
  });
  // Log removido por segurança
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
    const novoRelatorio = resultado[0];
    
    // ✅ ENVIAR NOTIFICAÇÃO PARA N8N APÓS CRIAR RELATÓRIO
    if (novoRelatorio && novoRelatorio.id && dadosRelatorio.patient_id) {
      try {
        console.log('[criarRelatorio] Enviando notificação para n8n webhook...');
        
        // Buscar dados do paciente para incluir nome e telefone
        const pacienteData = await buscarPacientePorId(dadosRelatorio.patient_id).catch(e => {
          console.warn('[criarRelatorio] Erro ao buscar paciente:', e);
          return null;
        });
        
        const pacienteNome = pacienteData?.full_name || '';
        const pacienteCelular = pacienteData?.phone_mobile || '';
        
        const payloadWebhook = {
          pacienteId: dadosRelatorio.patient_id,
          reportId: novoRelatorio.id,
          pacienteNome: pacienteNome,
          pacienteCelular: pacienteCelular
        };
        
        console.log('[criarRelatorio] Payload do webhook:', payloadWebhook);
        
        const resNotificacao = await fetch('https://joaogustavo.me/webhook/notificar-laudo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWebhook)
        }).catch(e => {
          console.warn('[criarRelatorio] Erro de rede ao enviar webhook:', e);
          return null;
        });

        if (resNotificacao?.ok) {
          console.log('[criarRelatorio] ✅ Notificação enviada com sucesso ao n8n');
        } else if (resNotificacao) {
          console.warn('[criarRelatorio] ⚠️ Notificação ao n8n retornou status:', resNotificacao.status);
        }
      } catch (erroNotificacao) {
        console.warn('[criarRelatorio] ❌ Erro ao enviar notificação para n8n:', erroNotificacao);
        // Não falha a criação do relatório se a notificação falhar
      }
    }
    
    return novoRelatorio;
  }
  throw new Error('Resposta inesperada da API Supabase');
}

/**
 * Atualiza um relatório existente
 */
export async function atualizarRelatorio(id: string, dadosRelatorio: UpdateReportData): Promise<Report> {
  try {
    // Logs removidos por segurança
    const resposta = await fetch(`${BASE_API_RELATORIOS}?id=eq.${id}`, {
      method: 'PATCH',
      headers: obterCabecalhos(),
      body: JSON.stringify(dadosRelatorio),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    const relatorio = Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
    // Log removido por segurança
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
    // Log removido por segurança
    const resposta = await fetch(`${BASE_API_RELATORIOS}/${id}`, {
      method: 'DELETE',
      headers: obterCabecalhos(),
    });
    await tratarRespostaApi<void>(resposta);
    // Log removido por segurança
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
    // Validar ID antes de fazer requisição
    if (!idPaciente || typeof idPaciente !== 'string' || idPaciente.trim() === '') {
      console.warn('[REPORTS] ID paciente vazio ou inválido ao listar relatórios');
      return [];
    }

    // Try a strict eq lookup first (encode the id)
    const encodedId = encodeURIComponent(String(idPaciente).trim());
    let url = `${BASE_API_RELATORIOS}?patient_id=eq.${encodedId}`;
    const headers = obterCabecalhos();
    const resposta = await fetch(url, {
      method: 'GET',
      headers,
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    // If eq returned results, return them. Otherwise retry using `in.(id)` which some setups prefer.
    if (Array.isArray(resultado) && resultado.length) return resultado;

    // Retry with in.(id) clause as a fallback
    try {
      const inClause = encodeURIComponent(`(${String(idPaciente).trim()})`);
      const urlIn = `${BASE_API_RELATORIOS}?patient_id=in.${inClause}`;
      const resp2 = await fetch(urlIn, { method: 'GET', headers });
      const res2 = await tratarRespostaApi<Report[]>(resp2);
      return Array.isArray(res2) ? res2 : [];
    } catch (e) {
      // Fallback falhou, retornar vazio
      return [];
    }
  } catch (erro) {
    console.error('[REPORTS] Erro ao buscar relatórios do paciente:', erro);
    return [];
  }
}

/**
 * Lista relatórios de um médico específico
 */
export async function listarRelatoriosPorMedico(idMedico: string): Promise<Report[]> {
  try {
    // Validar ID antes de fazer requisição
    if (!idMedico || typeof idMedico !== 'string' || idMedico.trim() === '') {
      console.warn('[REPORTS] ID médico vazio ou inválido ao listar relatórios');
      return [];
    }

    const encodedId = encodeURIComponent(idMedico.trim());
    const url = `${BASE_API_RELATORIOS}?requested_by=eq.${encodedId}`;
    const headers = obterCabecalhos();
    const resposta = await fetch(url, {
      method: 'GET',
      headers: obterCabecalhos(),
    });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    return Array.isArray(resultado) ? resultado : [];
  } catch (erro) {
    console.error('[REPORTS] Erro ao buscar relatórios do médico:', erro);
    return [];
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

    // monta cláusula in.(id1,id2,...) com proper encoding
    const encodedIds = cleaned.map(id => encodeURIComponent(id)).join(',');
    const url = `${BASE_API_RELATORIOS}?patient_id=in.(${encodedIds})`;
    const headers = obterCabecalhos();

    const resposta = await fetch(url, { method: 'GET', headers });
    const resultado = await tratarRespostaApi<Report[]>(resposta);
    return Array.isArray(resultado) ? resultado : [];
  } catch (erro) {
    console.error('[REPORTS] Erro ao buscar relatórios para vários pacientes:', erro);
    return [];
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
      // Log removido por segurança
      return [];
    }

    // Log removido por segurança
    // importe dinamicamente para evitar possíveis ciclos
    const assignmentMod = await import('./assignment');
    const assigns = await assignmentMod.listAssignmentsForUser(String(userId));
    if (!assigns || !Array.isArray(assigns) || assigns.length === 0) {
      // Log removido por segurança
      return [];
    }

    const patientIds = Array.from(new Set(assigns.map((a: any) => String(a.patient_id)).filter(Boolean)));
    if (!patientIds.length) {
      // Log removido por segurança
      return [];
    }

    // Log removido por segurança
    const rels = await listarRelatoriosPorPacientes(patientIds);
    return rels || [];
  } catch (err) {
    console.error('[listarRelatoriosParaMedicoAtribuido] erro:', err);
    throw err;
  }
}

/**
 * Interface para dados necessários ao criar um laudo
 */
export interface CriarLaudoData {
  pacienteId: string;           // ID do paciente (obrigatório)
  textoLaudo: string;           // Texto do laudo (obrigatório)
  medicoId?: string;            // ID do médico que criou (opcional)
  exame?: string;               // Tipo de exame (opcional)
  diagnostico?: string;         // Diagnóstico (opcional)
  conclusao?: string;           // Conclusão (opcional)
  cidCode?: string;             // Código CID (opcional)
  status?: 'rascunho' | 'concluido' | 'enviado';  // Status (opcional, padrão: 'concluido')
  contentHtml?: string;         // Conteúdo HTML (opcional)
  contentJson?: any;            // Conteúdo JSON (opcional)
}

/**
 * Cria um novo laudo no Supabase e notifica o paciente via n8n
 * 
 * Fluxo:
 * 1. Salva o laudo no Supabase (tabela 'reports')
 * 2. Envia notificação ao n8n com pacienteId e laudoId
 * 3. Retorna o laudo criado
 * 
 * @param laudoData Dados do laudo a criar
 * @returns Laudo criado com ID
 * @throws Erro se falhar ao criar o laudo
 */
export async function criarLaudo(laudoData: CriarLaudoData): Promise<any> {
  try {
    // 1. Validação dos dados obrigatórios
    if (!laudoData.pacienteId || !laudoData.textoLaudo) {
      throw new Error('Paciente ID e Texto do Laudo são obrigatórios');
    }

    console.log('[criarLaudo] Criando laudo para paciente:', laudoData.pacienteId);

    // 2. Monta o payload para Supabase
    const payloadSupabase = {
      patient_id: laudoData.pacienteId,
      ...(laudoData.medicoId && { requested_by: laudoData.medicoId }),
      ...(laudoData.exame && { exam: laudoData.exame }),
      ...(laudoData.diagnostico && { diagnosis: laudoData.diagnostico }),
      ...(laudoData.conclusao && { conclusion: laudoData.conclusao }),
      ...(laudoData.cidCode && { cid_code: laudoData.cidCode }),
      ...(laudoData.contentHtml && { content_html: laudoData.contentHtml }),
      ...(laudoData.contentJson && { content_json: laudoData.contentJson }),
      status: laudoData.status || 'concluido',
    };

    // 3. Salva o laudo no Supabase
    const urlSupabase = 'https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/reports';
    
    let tokenAuth: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      tokenAuth =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        undefined;
    }

    const headersSupabase: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
      'Prefer': 'return=representation',
    };
    
    if (tokenAuth) {
      headersSupabase['Authorization'] = `Bearer ${tokenAuth}`;
    }

    const resSupabase = await fetch(urlSupabase, {
      method: 'POST',
      headers: headersSupabase,
      body: JSON.stringify(payloadSupabase),
    });

    if (!resSupabase.ok) {
      const errorText = await resSupabase.text();
      console.error('[criarLaudo] Erro ao salvar laudo no Supabase:', errorText);
      throw new Error(`Falha ao salvar laudo: ${resSupabase.statusText}`);
    }

    const novoLaudo = await resSupabase.json();
    const laudoId = novoLaudo?.id;

    if (!laudoId) {
      throw new Error('Laudo criado mas sem ID retornado');
    }

    console.log('[criarLaudo] Laudo salvo com sucesso. ID:', laudoId);

    // 4. CHAMAR O N8N para notificar o paciente
    // Padrão simples: apenas pacienteId e reportId
    try {
      console.log('[criarLaudo] Enviando notificação para n8n...');
      
      const resNotificacao = await fetch('https://joaogustavo.me/webhook/notificar-laudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pacienteId: laudoData.pacienteId,  // ← ID do paciente
          reportId: laudoId                   // ← ID do report criado
        })
      });

      if (resNotificacao.ok) {
        console.log('[criarLaudo] Notificação enviada com sucesso ao n8n');
      } else {
        console.warn('[criarLaudo] Notificação ao n8n retornou status:', resNotificacao.status);
      }
    } catch (erroNotificacao) {
      // Não falha a criação do laudo se a notificação falhar
      console.warn('[criarLaudo] Erro ao enviar notificação para n8n:', erroNotificacao);
    }

    // 5. Retorna o laudo criado
    return {
      ...novoLaudo,
      mensagem: 'Laudo criado e paciente notificado com sucesso!',
    };
  } catch (erro) {
    console.error('[criarLaudo] Erro ao criar laudo:', erro);
    throw erro;
  }
}