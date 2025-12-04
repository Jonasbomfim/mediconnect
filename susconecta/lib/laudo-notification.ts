/**
 * Módulo de notificação de laudos via n8n
 * Integração com automação n8n para notificar pacientes quando laudos são criados
 */

import { ENV_CONFIG } from '@/lib/env-config';

/**
 * Configurações do webhook n8n
 */
const N8N_WEBHOOK_CONFIG = {
  // URL do webhook configurado no n8n
  webhookUrl: 'https://joaogustavo.me/webhook/notificar-laudo',
  // Timeout para a requisição (em ms)
  timeout: 30000,
  // Tentativas de retry em caso de falha
  maxRetries: 3,
};

/**
 * Tipos de dados para notificação de laudo
 */
export interface NotificacaoLaudoPayload {
  pacienteId: string;
  laudoId: string;
  pacienteName?: string;
  pacienteEmail?: string;
  medicalDetails?: {
    examType?: string;
    medico?: string;
    dataEmissao?: string;
  };
}

/**
 * Resultado da notificação
 */
export interface NotificacaoLaudoResult {
  sucesso: boolean;
  mensagem: string;
  n8nResponse?: any;
  erro?: string;
}

/**
 * Notifica o n8n sobre a criação de um novo laudo
 * @param payload Dados do laudo e paciente para notificação
 * @returns Resultado da notificação
 */
export async function notificarLaudoCriadoN8n(
  payload: NotificacaoLaudoPayload
): Promise<NotificacaoLaudoResult> {
  try {
    // Validação básica dos dados
    if (!payload.pacienteId || !payload.laudoId) {
      return {
        sucesso: false,
        mensagem: 'Dados de paciente ou laudo inválidos',
        erro: 'pacienteId e laudoId são obrigatórios',
      };
    }

    // Constrói o payload para o webhook
    const webhookPayload = {
      pacienteId: payload.pacienteId,
      laudoId: payload.laudoId,
      pacienteName: payload.pacienteName || '',
      pacienteEmail: payload.pacienteEmail || '',
      // Adiciona dados médicos se disponíveis
      ...(payload.medicalDetails && {
        examType: payload.medicalDetails.examType,
        medico: payload.medicalDetails.medico,
        dataEmissao: payload.medicalDetails.dataEmissao,
      }),
      // Timestamp da notificação
      notificadoEm: new Date().toISOString(),
    };

    console.log('[n8n] Enviando notificação de laudo criado:', {
      pacienteId: payload.pacienteId,
      laudoId: payload.laudoId,
      webhookUrl: N8N_WEBHOOK_CONFIG.webhookUrl,
    });

    // Tenta enviar o webhook com retry
    let ultimoErro: any = null;
    
    for (let tentativa = 1; tentativa <= N8N_WEBHOOK_CONFIG.maxRetries; tentativa++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          N8N_WEBHOOK_CONFIG.timeout
        );

        const response = await fetch(N8N_WEBHOOK_CONFIG.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const responseData = await response.json();

        console.log('[n8n] Notificação enviada com sucesso:', {
          status: response.status,
          laudoId: payload.laudoId,
        });

        return {
          sucesso: true,
          mensagem: 'Paciente notificado com sucesso',
          n8nResponse: responseData,
        };
      } catch (erro) {
        ultimoErro = erro;
        console.warn(
          `[n8n] Tentativa ${tentativa}/${N8N_WEBHOOK_CONFIG.maxRetries} falhou:`,
          erro instanceof Error ? erro.message : String(erro)
        );

        // Se não for a última tentativa, aguarda um pouco antes de tentar novamente
        if (tentativa < N8N_WEBHOOK_CONFIG.maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * tentativa) // Backoff exponencial
          );
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error('[n8n] Todas as tentativas de notificação falharam:', ultimoErro);

    return {
      sucesso: false,
      mensagem: 'Falha ao notificar paciente através do n8n',
      erro: ultimoErro instanceof Error ? ultimoErro.message : String(ultimoErro),
    };
  } catch (erro) {
    console.error('[notificarLaudoCriadoN8n] Erro inesperado:', erro);

    return {
      sucesso: false,
      mensagem: 'Erro ao processar notificação de laudo',
      erro: erro instanceof Error ? erro.message : String(erro),
    };
  }
}

/**
 * Versão assíncrona que não bloqueia - envia notificação em background
 * Útil para não aumentar o tempo de resposta da API
 * @param payload Dados do laudo e paciente
 */
export function notificarLaudoAsyncBackground(
  payload: NotificacaoLaudoPayload
): void {
  // Envia notificação em background sem aguardar
  notificarLaudoCriadoN8n(payload)
    .then((result) => {
      if (!result.sucesso) {
        console.warn('[n8n] Notificação de laudo falhou (background):', result.erro);
      }
    })
    .catch((erro) => {
      console.error('[n8n] Erro ao notificar laudo em background:', erro);
    });
}

/**
 * Determina se as notificações n8n estão habilitadas
 * Pode ser controlado via variável de ambiente
 */
export function notificacoesHabilitadas(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: verificar variável de ambiente
    return process.env.NEXT_PUBLIC_N8N_ENABLED !== 'false';
  }
  
  // Client-side: sempre habilitado
  return true;
}
