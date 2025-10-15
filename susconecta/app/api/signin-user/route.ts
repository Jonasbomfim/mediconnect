import { NextResponse } from 'next/server';
import { ENV_CONFIG } from '@/lib/env-config';

/**
 * Proxy server-side route (App Router) to call Supabase OpenAPI /auth/v1/signin
 * This keeps the Supabase anon key on the server and avoids CORS from browsers.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Lightweight, non-sensitive debug logging to verify the proxy is hit at runtime.
    try {
      console.log('[api/signin-user] POST received', {
        url: typeof (req as any).url === 'string' ? (req as any).url : undefined,
        email: payload?.email ?? null,
      });
    } catch (e) {
      // never throw from logging
    }

    const url = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signin`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV_CONFIG.SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[api/signin-user] Unexpected error', error);
    return NextResponse.json({ error: 'Internal proxy error' }, { status: 500 });
  }
}
