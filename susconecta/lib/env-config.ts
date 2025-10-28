/**
 * Configuração segura das variáveis de ambiente
 * Valida se URL e API Key pertencem ao mesmo projeto Supabase
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yuanqfswhberkoevtmfr.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ";

/**
 * Extrai o REF do projeto da URL da Supabase
 */
function extractProjectRef(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

/**
 * Extrai o REF do projeto da API Key JWT
 */
function extractProjectRefFromKey(apiKey: string): string | null {
  try {
    const part = apiKey.split('.')[1];
    if (!part) return null;
    // Decode base64 payload in both browser and Node environments
    let jsonStr: string | null = null;
    if (typeof atob === 'function') {
      try { jsonStr = atob(part); } catch (e) { jsonStr = null; }
    }
    if (!jsonStr && typeof Buffer !== 'undefined') {
      try { jsonStr = Buffer.from(part, 'base64').toString('utf8'); } catch (e) { jsonStr = null; }
    }
    if (!jsonStr) return null;
    const payload = JSON.parse(jsonStr);
    return payload?.ref ?? payload?.project_ref ?? null;
  } catch {
    return null;
  }
}

/**
 * Valida se URL e API Key pertencem ao mesmo projeto
 */
function validateProjectConsistency(): boolean {
  const urlRef = extractProjectRef(SUPABASE_URL);
  const keyRef = extractProjectRefFromKey(SUPABASE_ANON_KEY);
  
  if (!urlRef || !keyRef) {
    console.warn('[ENV] Não foi possível extrair REF do projeto');
    return false;
  }
  
  if (urlRef !== keyRef) {
    console.error('[ENV] ERRO: URL e API Key são de projetos diferentes!', {
      urlRef,
      keyRef
    });
    return false;
  }
  
  console.log('[ENV] Projeto validado:', urlRef);
  return true;
}

// Validar na inicialização
if (typeof window === 'undefined') {
  // Server-side
  validateProjectConsistency();
} else {
  // Client-side
  setTimeout(() => validateProjectConsistency(), 100);
}

export const ENV_CONFIG = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  PROJECT_REF: extractProjectRef(SUPABASE_URL),
  
  // URLs dos endpoints de autenticação
  AUTH_ENDPOINTS: {
    LOGIN: `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    LOGOUT: `${SUPABASE_URL}/auth/v1/logout`,
    REFRESH: `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    USER: `${SUPABASE_URL}/auth/v1/user`,
  },
  
  // Headers padrão
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
  },
  
  // Validação
  isValid: validateProjectConsistency(),
} as const;