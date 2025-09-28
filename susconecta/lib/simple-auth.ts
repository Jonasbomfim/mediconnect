/**
 * Versão simplificada para testar conexão com Supabase
 */

export async function testSupabaseConnection() {
  const url = 'https://yuanqfswhberkoevtmfr.supabase.co/rest/v1/';
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
    'Content-Type': 'application/json'
  };

  console.log('[TEST] Testando conexão com Supabase...');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    
    console.log('[TEST] Status:', response.status);
    console.log('[TEST] Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('[TEST] ✅ Conexão com Supabase OK!');
    } else {
      console.log('[TEST] ❌ Problema na conexão:', response.statusText);
    }
    
    return response.ok;
  } catch (error) {
    console.error('[TEST] Erro na conexão:', error);
    return false;
  }
}

/**
 * Versão simplificada do login para debug
 */
export async function simpleLogin(email: string, password: string) {
  const url = 'https://yuanqfswhberkoevtmfr.supabase.co/auth/v1/token?grant_type=password';
  
  const payload = {
    email: email,
    password: password
  };
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1YW5xZnN3aGJlcmtvZXZ0bWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQzNjksImV4cCI6MjA3MDUzMDM2OX0.g8Fm4XAvtX46zifBZnYVH4tVuQkqUH6Ia9CXQj4DztQ',
  };

  console.log('[SIMPLE-LOGIN] Tentando login simples...', {
    url,
    email,
    headers: Object.keys(headers)
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    console.log('[SIMPLE-LOGIN] Response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (response.ok) {
      return JSON.parse(responseText);
    } else {
      throw new Error(`Login failed: ${response.status} - ${responseText}`);
    }
    
  } catch (error) {
    console.error('[SIMPLE-LOGIN] Erro:', error);
    throw error;
  }
}