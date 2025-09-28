/**
 * Utilitário de debug para requisições HTTP (apenas em desenvolvimento)
 */

export function debugRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: any
) {
  if (process.env.NODE_ENV !== 'development') return;

  const headersWithoutSensitive = Object.keys(headers).reduce((acc, key) => {
    // Não logar valores sensíveis, apenas nomes
    if (key.toLowerCase().includes('apikey') || key.toLowerCase().includes('authorization')) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = headers[key];
    }
    return acc;
  }, {} as Record<string, string>);

  const bodyShape = body ? Object.keys(typeof body === 'string' ? JSON.parse(body) : body) : [];

  console.log('[DEBUG] Request Preview:', {
    method,
    path: new URL(url).pathname,
    query: new URL(url).search,
    headerNames: Object.keys(headers),
    headers: headersWithoutSensitive,
    bodyShape,
    timestamp: new Date().toISOString(),
  });
}