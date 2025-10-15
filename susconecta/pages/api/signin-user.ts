import type { NextApiRequest, NextApiResponse } from 'next';
import { ENV_CONFIG } from '@/lib/env-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // Lightweight debug log to confirm the pages API route is invoked.
    try {
      console.log('[pages/api/signin-user] POST received', { url: req.url, email: payload?.email ?? null });
    } catch (e) {
      // ignore logging errors
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
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('[pages/api/signin-user] Unexpected error', error);
    return res.status(500).json({ error: 'Internal proxy error' });
  }
}
