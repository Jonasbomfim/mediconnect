import type { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenResponse, 
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
    
    console.error('[AUTH ERROR]', {
      url: response.url,
      status: response.status,
      data,
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
  // Use server-side AUTH_ENDPOINTS.LOGIN by default. When running in the browser
  // prefer the local proxy that forwards to the OpenAPI signin: `/api/signin-user`.
  const isBrowser = typeof window !== 'undefined';
  const url = isBrowser ? '/api/signin-user' : AUTH_ENDPOINTS.LOGIN;
  
  const payload = {
    email,
    password,
  };

  console.log('[AUTH-API] Iniciando login...', { 
    email, 
    userType, 
    url,
    payload,
    timestamp: new Date().toLocaleTimeString() 
  });
  
  // Log only non-sensitive info; never log passwords
  console.log('🔑 [AUTH-API] Credenciais sendo usadas no login (redacted):');
  console.log('📧 Email:', email);
  console.log('👤 UserType:', userType);

  // Delay para visualizar na aba Network
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    console.log('[AUTH-API] Enviando requisição de login...');
    
    // Debug: Log request sem credenciais sensíveis
    debugRequest('POST', url, getLoginHeaders(), payload);
    
    // Helper to perform a login fetch and return response (no processing here)
    async function doLoginFetch(targetUrl: string) {
      try {
        return await fetch(targetUrl, {
          method: 'POST',
          headers: getLoginHeaders(),
          body: JSON.stringify(payload),
        });
      } catch (err) {
        // bubble up the error to the caller
        throw err;
      }
    }

    let response: Response;
    try {
      response = await doLoginFetch(url);
    } catch (networkError) {
      console.warn('[AUTH-API] Network error when calling', url, networkError);
      // Try fallback to server endpoints if available
      const fallback1 = AUTH_ENDPOINTS.LOGIN;
      const fallback2 = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signin`;
      let tried = [] as string[];

      try {
        tried.push(fallback1);
        response = await doLoginFetch(fallback1);
      } catch (e1) {
        console.warn('[AUTH-API] Fallback1 failed', fallback1, e1);
        try {
          tried.push(fallback2);
          response = await doLoginFetch(fallback2);
        } catch (e2) {
          console.error('[AUTH-API] All fallbacks failed', { tried, e1, e2 });
          throw new AuthenticationError(
            'Não foi possível contatar o serviço de autenticação (todos os caminhos falharam)',
            'AUTH_NETWORK_ERROR',
            { tried }
          );
        }
      }
    }

    console.log(`[AUTH-API] Login response: ${response.status} ${response.statusText}`, {
      url: response.url,
      status: response.status,
      timestamp: new Date().toLocaleTimeString()
    });

    // If proxy returned 404, try direct fallbacks (in case the proxy route is missing)
    if (response.status === 404) {
      console.warn('[AUTH-API] Proxy returned 404, attempting direct login fallbacks');
      const fallback1 = AUTH_ENDPOINTS.LOGIN;
      const fallback2 = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signin`;
      let fallbackResponse: Response | null = null;
      try {
        fallbackResponse = await doLoginFetch(fallback1);
      } catch (e) {
        console.warn('[AUTH-API] fallback1 failed', fallback1, e);
      }

      if (!fallbackResponse || fallbackResponse.status === 404) {
        try {
          fallbackResponse = await doLoginFetch(fallback2);
        } catch (e) {
          console.warn('[AUTH-API] fallback2 failed', fallback2, e);
        }
      }

      if (fallbackResponse) {
        response = fallbackResponse;
        console.log('[AUTH-API] Used fallback response', { url: response.url, status: response.status });
      } else {
        console.error('[AUTH-API] No fallback produced a valid response');
      }
    }

    // Se falhar, mostrar detalhes do erro
    if (!response.ok) {
      try {
        const errorText = await response.text();
        console.error('[AUTH-API] Erro detalhado:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          headers: Object.fromEntries(response.headers.entries())
        });
      } catch (e) {
        console.error('[AUTH-API] Não foi possível ler erro da resposta');
      }
    }

    // Delay adicional para ver status code
    await new Promise(resolve => setTimeout(resolve, 50));

    // If after trying fallbacks we still have a 404, make the error explicit and actionable
    if (response.status === 404) {
      console.error('[AUTH-API] Final response was 404 (Not Found). Likely the local proxy route is missing or Next dev server is not running.', { url: response.url });
      throw new AuthenticationError(
        'Signin endpoint not found (404). Ensure Next.js dev server is running and the route `/api/signin-user` exists.',
        'SIGNIN_NOT_FOUND',
        { url: response.url }
      );
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
export async function refreshAuthToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const url = AUTH_ENDPOINTS.REFRESH;

  console.log('[AUTH] Renovando token');

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

    const data = await processResponse<RefreshTokenResponse>(response);
    
    console.log('[AUTH] Token renovado com sucesso');
    return data;
  } catch (error) {
    console.error('[AUTH] Erro ao renovar token:', error);
    
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    throw new AuthenticationError(
      'Não foi possível renovar a sessão',
      'REFRESH_ERROR',
      error
    );
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