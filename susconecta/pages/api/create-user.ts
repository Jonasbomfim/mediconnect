import type { NextApiRequest, NextApiResponse } from 'next'
import { ENV_CONFIG } from '@/lib/env-config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const target = `${ENV_CONFIG.SUPABASE_URL}/functions/v1/create-user`
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
    }

    // forward authorization header if present (keeps the caller's identity)
    if (req.headers.authorization) headers.Authorization = String(req.headers.authorization)

    const r = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    })
    // If the function is not available (404) or returns server error (5xx),
    // perform a fallback: create the user via Supabase Auth signup so the
    // client doesn't experience a hard 404.
    if (r.status === 404 || r.status >= 500) {
      console.warn('[proxy/create-user] function returned', r.status, 'falling back to signup')
      // attempt signup
      try {
        const body = req.body || {}
        const email = body.email
        let password = body.password
        const full_name = body.full_name
        const phone = body.phone
        const role = body.role || (Array.isArray(body.roles) ? body.roles[0] : undefined)

        // generate a password if none provided
        if (!password) {
          const rand = Math.floor(Math.random() * 900) + 100
          password = `senha${rand}!`
        }

        const userType = (role && String(role).toLowerCase() === 'paciente') ? 'paciente' : 'profissional'

        const signupUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signup`
        const signupRes = await fetch(signupUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email,
            password,
            data: { userType, full_name, phone }
          }),
        })

        const signupText = await signupRes.text()
        try {
          const signupJson = JSON.parse(signupText)
          return res.status(signupRes.status).json({ fallback: true, from: 'signup', result: signupJson })
        } catch {
          return res.status(signupRes.status).send(signupText)
        }
      } catch (err2: any) {
        console.error('[proxy/create-user] fallback signup failed', err2)
        return res.status(502).json({ error: 'Bad gateway (fallback failed)', details: String(err2) })
      }
    }

    const text = await r.text()
    try {
      const json = JSON.parse(text)
      return res.status(r.status).json(json)
    } catch {
      // not JSON, return raw text
      res.status(r.status).send(text)
    }
  } catch (err: any) {
    console.error('[proxy/create-user] error', err)
    return res.status(502).json({ error: 'Bad gateway', details: String(err) })
  }
}
