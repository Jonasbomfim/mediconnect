import { NextResponse } from 'next/server'
import { ENV_CONFIG } from '@/lib/env-config'

type Body = {
  user_id: string
  role: string
}

async function getRequesterIdFromToken(token: string | null): Promise<string | null> {
  if (!token) return null
  try {
    const url = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/user`
    const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': ENV_CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    return data?.id ?? null
  } catch (err) {
    console.error('[assign-role] erro ao obter requester id', err)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    if (!body || !body.user_id || !body.role) return NextResponse.json({ error: 'user_id and role required' }, { status: 400 })

    const authHeader = req.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    const requesterId = await getRequesterIdFromToken(token)
    if (!requesterId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    // Check if requester is administrador
    const checkUrl = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${requesterId}&role=eq.administrador`
    const checkRes = await fetch(checkUrl, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } })
    if (!checkRes.ok) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const arr = await checkRes.json().catch(() => [])
    if (!Array.isArray(arr) || arr.length === 0) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    // Insert role using service role key from environment (must be set on the server)
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!svcKey) return NextResponse.json({ error: 'server misconfigured' }, { status: 500 })

    const insertUrl = `${ENV_CONFIG.SUPABASE_URL}/rest/v1/user_roles`
    const insertRes = await fetch(insertUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', apikey: svcKey, Authorization: `Bearer ${svcKey}` },
      body: JSON.stringify({ user_id: body.user_id, role: body.role }),
    })

    if (!insertRes.ok) {
      const errBody = await insertRes.text().catch(() => null)
      console.error('[assign-role] insert failed', insertRes.status, errBody)
      return NextResponse.json({ error: 'failed to assign role', details: errBody }, { status: insertRes.status })
    }

    const result = await insertRes.json().catch(() => null)
    return NextResponse.json({ ok: true, data: result })
  } catch (err) {
    console.error('[assign-role] unexpected error', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }
}
