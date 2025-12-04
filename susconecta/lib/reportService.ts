/**
 * serviço para criar relatórios e notificar pacientes via n8n
 * 
 * Este serviço encapsula a lógica de:
 * 1. Criar um novo report no Supabase
 * 2. Notificar o paciente via webhook n8n (que dispara SMS via Twilio)
 */

interface CreateReportData {
  patientId: string; // UUID do paciente
  requestedBy: string; // UUID de quem solicitou (médico)
  exam: string;
  diagnosis: string;
  conclusion: string;
  contentHtml: string;
}

interface CreateReportResult {
  success: boolean;
  report?: any;
  error?: string;
}

/**
 * Cria um novo report no Supabase e notifica o paciente via n8n
 * 
 * Fluxo:
 * 1. Insere um novo registro na tabela 'reports' com status 'draft'
 * 2. Envia webhook para n8n com pacienteId e reportId
 * 3. n8n recebe e dispara notificação SMS via Twilio
 * 4. Retorna o report criado (mesmo que a notificação falhe)
 * 
 * @param data Dados do report a ser criado
 * @returns { success: true, report } ou { success: false, error }
 */
export const createAndNotifyReport = async (data: CreateReportData): Promise<CreateReportResult> => {
  try {
    // Validação básica
    if (!data.patientId || !data.exam || !data.conclusion) {
      throw new Error('Faltam campos obrigatórios: patientId, exam, conclusion');
    }

    console.log('[reportService] Criando novo report para paciente:', data.patientId);

    // 1. Criar report no Supabase
    const BASE_API = 'https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/reports';
    
    let token: string | undefined = undefined;
    if (typeof window !== 'undefined') {
      token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('token') ||
        sessionStorage.getItem('auth_token') ||
        sessionStorage.getItem('token') ||
        undefined;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
      'Prefer': 'return=representation',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const reportPayload = {
      patient_id: data.patientId,
      status: 'draft',
      requested_by: data.requestedBy,
      exam: data.exam,
      diagnosis: data.diagnosis,
      conclusion: data.conclusion,
      content_html: data.contentHtml,
      created_at: new Date().toISOString(),
    };

    const responseSupabase = await fetch(BASE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify(reportPayload),
    });

    if (!responseSupabase.ok) {
      const errorText = await responseSupabase.text();
      console.error('[reportService] Erro ao criar report no Supabase:', errorText);
      throw new Error(`Supabase error: ${responseSupabase.statusText}`);
    }

    const newReport = await responseSupabase.json();
    
    // Supabase retorna array
    const report = Array.isArray(newReport) ? newReport[0] : newReport;
    
    if (!report || !report.id) {
      throw new Error('Report criado mas sem ID retornado');
    }

    console.log('[reportService] Report criado com sucesso. ID:', report.id);

    // 2. Notificar paciente via n8n → Twilio
    try {
      console.log('[reportService] Enviando notificação para n8n...');
      
      const notificationResponse = await fetch('https://joaogustavo.me/webhook/notificar-laudo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pacienteId: report.patient_id, // UUID do paciente
          reportId: report.id,            // UUID do report
        }),
      });

      if (!notificationResponse.ok) {
        console.warn(
          '[reportService] Erro ao enviar notificação SMS. Status:',
          notificationResponse.status
        );
        // Não falha a criação do report se SMS falhar
      } else {
        console.log('[reportService] Notificação enviada com sucesso ao n8n');
      }
    } catch (erroNotificacao) {
      console.warn('[reportService] Erro ao enviar notificação para n8n:', erroNotificacao);
      // Não falha a criação do report se a notificação falhar
    }

    return { 
      success: true, 
      report,
    };
  } catch (error) {
    console.error('[reportService] Erro ao criar report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Interface exportada para uso em componentes
 */
export type { CreateReportData, CreateReportResult };
