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

  const bodyShape = body ? Object.keys(typeof body === 'string' ? (() => {
    try { return JSON.parse(body); } catch { return {}; }
  })() : body) : [];

  // Support relative URLs (e.g. '/api/signin-user') by providing a base when needed.
  try {
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (e) {
      // Fallbacks: browser origin or localhost for server-side dev
      const base = (typeof window !== 'undefined' && window.location && window.location.origin)
        ? window.location.origin
        : 'http://localhost';
      urlObj = new URL(url, base);
    }

    console.log('[DEBUG] Request Preview:', {
      method,
      path: urlObj.pathname,
      query: urlObj.search,
      headerNames: Object.keys(headers),
      headers: headersWithoutSensitive,
      bodyShape,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Never throw from debug tooling; keep best-effort logging
    // eslint-disable-next-line no-console
    console.warn('[DEBUG] debugRequest failed to parse URL or body', { url, error: err });
  }
}