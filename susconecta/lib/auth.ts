import type { 
  LoginRequest, 
  LoginResponse, 
  AuthError,
  UserData 
} from '@/types/auth';

import { API_CONFIG, AUTH_ENDPOINTS, DEFAULT_HEADERS, buildApiUrl } from '@/lib/config';
import { debugRequest } from '@/lib/debug-utils';
import { ENV_CONFIG } from '@/lib/env-config';

/**
 * Classe de erro customizada para autenticação
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Headers para requisições autenticadas (COM Bearer token)
 */
function getAuthHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "apikey": ENV_CONFIG.SUPABASE_ANON_KEY,
    "Authorization": `Bearer ${token}`,
  };
}

/**
 * Headers APENAS para login (SEM Authorization Bearer)
 */
function getLoginHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "apikey": ENV_CONFIG.SUPABASE_ANON_KEY,
  };
}

/**
 * Utilitário para processar resposta da API
 */
async function processResponse<T>(response: Response): Promise<T> {
  console.log(`[AUTH] Response status: ${response.status} ${response.statusText}`);
  
  let data: any = null;
  
  try {
    const text = await response.text();
    if (text) {
      data = JSON.parse(text);
    }
  } catch (error) {
    console.log('[AUTH] Response sem JSON ou vazia (normal para alguns endpoints)');
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || response.statusText || 'Erro na autenticação';
    const errorCode = data?.code || String(response.status);

    // Log raw text as well to help debug cases where JSON is empty or {}
    let rawText = '';
    try { rawText = await response.clone().text(); } catch (_) { rawText = '<unable to read raw text>'; }

    console.error('[AUTH ERROR]', {
      url: response.url,
      status: response.status,
      data,
      rawText,
    });

    throw new AuthenticationError(errorMessage, errorCode, data);
  }

  console.log('[AUTH] Response data:', data);
  return data as T;
}

/**
 * Serviço para fazer login e obter token JWT
 */
export async function loginUser(
  email: string, 
  password: string, 
  userType: 'profissional' | 'paciente' | 'administrador'
): Promise<LoginResponse> {
  try {
  // Use the canonical Supabase token endpoint for password grant as configured in ENV_CONFIG.
  const url = AUTH_ENDPOINTS.LOGIN;

  const payload = { email, password };

  console.log('[AUTH-API] Iniciando login (using AUTH_ENDPOINTS.LOGIN)...', {
    email,
    userType,
    url,
    timestamp: new Date().toLocaleTimeString()
  });

  // Do not log passwords. Log only non-sensitive info.
  debugRequest('POST', url, getLoginHeaders(), { email });

  // Perform single, explicit request to the configured token endpoint.
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: getLoginHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error('[AUTH-API] Network error when calling', url, networkError);
    throw new AuthenticationError('Não foi possível contatar o serviço de autenticação', 'AUTH_NETWORK_ERROR', networkError);
  }

  console.log(`[AUTH-API] Login response: ${response.status} ${response.statusText}`, {
    url: response.url,
    status: response.status,
    timestamp: new Date().toLocaleTimeString()
  });

  // If endpoint is missing, make the error explicit
  if (response.status === 404) {
    console.error('[AUTH-API] Final response was 404 (Not Found) for', url);
    throw new AuthenticationError('Signin endpoint not found (404) at configured AUTH_ENDPOINTS.LOGIN', 'SIGNIN_NOT_FOUND', { url });
  }

  const data = await processResponse<any>(response);
    
    console.log('[AUTH] Dados recebidos da API:', data);
    
    // Verificar se recebemos os dados necessários
    if (!data || (!data.access_token && !data.token)) {
      console.error('[AUTH] API não retornou token válido:', data);
      throw new AuthenticationError(
        'API não retornou token de acesso',
        'NO_TOKEN_RECEIVED',
        data
      );
    }
    
    // Adaptar resposta da sua API para o formato esperado
    const adaptedResponse: LoginResponse = {
      access_token: data.access_token || data.token,
      token_type: data.token_type || "Bearer",
      expires_in: data.expires_in || 3600,
      user: {
        id: data.user?.id || data.id || "1",
        email: email,
        name: data.user?.name || data.name || email.split('@')[0],
        userType: userType,
        profile: data.user?.profile || data.profile || {}
      }
    };
    
    console.log('[AUTH-API] LOGIN REALIZADO COM SUCESSO!', {
      token: adaptedResponse.access_token?.substring(0, 20) + '...',
      user: { 
        email: adaptedResponse.user.email, 
        userType: adaptedResponse.user.userType 
      },
      timestamp: new Date().toLocaleTimeString()
    });

    // Delay final para visualizar sucesso
    await new Promise(resolve => setTimeout(resolve, 50));

    return adaptedResponse;
  } catch (error) {
    console.error('[AUTH] Erro no login:', error);
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    throw new AuthenticationError(
      'Email ou senha incorretos',
      'INVALID_CREDENTIALS',
      error
    );
  }
}

/**
 * Serviço para fazer logout do usuário
 */
export async function logoutUser(token: string): Promise<void> {
  const url = AUTH_ENDPOINTS.LOGOUT;

  console.log('[AUTH-API] Fazendo logout na API...', { 
    url,
    hasToken: !!token,
    timestamp: new Date().toLocaleTimeString()
  });

  // Delay para visualizar na aba Network
  await new Promise(resolve => setTimeout(resolve, 400));

  try {
    console.log('[AUTH-API] Enviando requisição de logout...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });

    console.log(`[AUTH-API] Logout response: ${response.status} ${response.statusText}`, {
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Delay para ver status code
    await new Promise(resolve => setTimeout(resolve, 600));

    // Logout pode retornar 200, 204 ou até 401 (se token já expirou)
    // Todos são considerados "sucesso" para logout
    if (response.ok || response.status === 401) {
      console.log('[AUTH] Logout realizado com sucesso na API');
      return;
    }

    // Se chegou aqui, algo deu errado mas não é crítico para logout
    console.warn('[AUTH] API retornou status inesperado:', response.status);
    
  } catch (error) {
    console.error('[AUTH] Erro ao chamar API de logout:', error);
  }
  
  // Para logout, sempre continuamos mesmo com erro na API
  // Isso evita que o usuário fique "preso" se a API estiver indisponível
  console.log('[AUTH] Logout concluído (local sempre executado)');
}

/**
 * Serviço para renovar token JWT
 */
export async function refreshAuthToken(refreshToken: string): Promise<LoginResponse> {
  const url = AUTH_ENDPOINTS.REFRESH;

  console.log('[AUTH] Renovando token via REFRESH endpoint');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json", 
        "apikey": ENV_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await processResponse<any>(response);

    console.log('[AUTH] Dados recebidos no refresh:', data);

    if (!data || !data.access_token) {
      console.error('[AUTH] Refresh não retornou access_token:', data);
      throw new AuthenticationError('Refresh não retornou access_token', 'NO_TOKEN_RECEIVED', data);
    }

    // Adaptar para o mesmo formato usado no login
    const adapted: LoginResponse = {
      access_token: data.access_token || data.token,
      refresh_token: data.refresh_token || null,
      token_type: data.token_type || 'Bearer',
      expires_in: data.expires_in || 3600,
      user: {
        id: data.user?.id || data.id || '',
        email: data.user?.email || data.email || '',
        name: data.user?.name || data.name || '',
        userType: (data.user?.userType as any) || 'paciente',
        profile: data.user?.profile || data.profile || {}
      }
    };

    console.log('[AUTH] Token renovado com sucesso (adapted)', {
      tokenSnippet: adapted.access_token?.substring(0, 20) + '...'
    });

    return adapted;
  } catch (error) {
    console.error('[AUTH] Erro ao renovar token:', error);

    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError('Não foi possível renovar a sessão', 'REFRESH_ERROR', error);
  }
}

/**
 * Serviço para obter dados do usuário atual
 */
export async function getCurrentUser(token: string): Promise<UserData> {
  const url = AUTH_ENDPOINTS.USER;

  console.log('[AUTH] Obtendo dados do usuário atual');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    const data = await processResponse<UserData>(response);
    
    console.log('[AUTH] Dados do usuário obtidos:', { id: data.id, email: data.email });
    return data;
  } catch (error) {
    console.error('[AUTH] Erro ao obter usuário atual:', error);
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    throw new AuthenticationError(
      'Não foi possível obter dados do usuário',
      'USER_DATA_ERROR',
      error
    );
  }
}

/**
 * Tipos do endpoint público de auto-cadastro
 */
export type RegisterPatientPayload = {
  email: string;
  full_name: string;
  phone_mobile: string; // 10-11 dígitos
  cpf: string;          // 11 dígitos
  birth_date?: string;  // YYYY-MM-DD
  redirect_url?: string;
};

export type RegisterPatientResponse = {
  success: boolean;
  patient_id?: string;
  message?: string;
  email?: string;
};

/**
 * Chama a Edge Function pública de auto-cadastro de paciente.
 * Não requer Authorization (usa apenas apikey).
 */
export async function registerPatientPublic(input: RegisterPatientPayload): Promise<RegisterPatientResponse> {
  // validações rápidas no cliente
  const emailOk = /^\S+@\S+\.\S+$/.test(input.email || '');
  if (!emailOk) throw new AuthenticationError('Email inválido.', 'VALIDATION_ERROR');
  if (!input.full_name || String(input.full_name).trim().length < 3) {
    throw new AuthenticationError('Nome completo deve ter ao menos 3 caracteres.', 'VALIDATION_ERROR');
  }
  const phone = String(input.phone_mobile || '').replace(/\D/g, '');
  if (!(phone.length === 10 || phone.length === 11)) {
    throw new AuthenticationError('Telefone celular deve ter 10 ou 11 dígitos.', 'VALIDATION_ERROR');
  }
  const cpf = String(input.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) {
    throw new AuthenticationError('CPF deve ter 11 dígitos.', 'VALIDATION_ERROR');
  }
  if (input.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(input.birth_date)) {
    throw new AuthenticationError('Data de nascimento deve estar no formato YYYY-MM-DD.', 'VALIDATION_ERROR');
  }

  // monta URL do projeto Supabase
  const url = `${ENV_CONFIG.SUPABASE_URL}/functions/v1/register-patient`;

  // redirect_url padrão para a área do paciente
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirect_url = input.redirect_url || (origin ? `${origin}/paciente` : undefined);

  const payload = {
    email: input.email,
    full_name: input.full_name,
    phone_mobile: phone,
    cpf,
    ...(input.birth_date ? { birth_date: input.birth_date } : {}),
    ...(redirect_url ? { redirect_url } : {}),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getLoginHeaders(), // sem Authorization, com apikey
      body: JSON.stringify(payload),
    });

    // processResponse lança AuthenticationError quando !ok e retorna JSON quando ok
    const data = await processResponse<RegisterPatientResponse>(res);
    return data;
  } catch (err) {
    // Deixa o erro tipado consistente para o chamador (página de cadastro)
    if (err instanceof AuthenticationError) throw err;
    throw new AuthenticationError('Falha no auto-cadastro do paciente', 'REGISTER_PATIENT_ERROR', err);
  }
}

/**
 * Utilitário para validar se um token está expirado
 */
export function isTokenExpired(expiryTimestamp: number): boolean {
  const now = Date.now();
  const expiry = expiryTimestamp * 1000; // Converter para milliseconds
  const buffer = 5 * 60 * 1000; // Buffer de 5 minutos
  
  return now >= (expiry - buffer);
}

/**
 * Utilitário para interceptar requests e adicionar token automaticamente
 */
export function createAuthenticatedFetch(getToken: () => string | null) {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();
    
    if (token) {
      const headers = {
        ...options.headers,
        ...getAuthHeaders(token),
      };
      
      options = {
        ...options,
        headers,
      };
    }

    return fetch(url, options);
  };
}