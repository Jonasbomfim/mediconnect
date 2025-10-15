import { NextRequest, NextResponse } from 'next/server'
import { ENV_CONFIG } from '@/lib/env-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const target = `${ENV_CONFIG.SUPABASE_URL}/functions/v1/create-user`
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
    }
    const auth = req.headers.get('authorization')
    if (auth) headers.Authorization = auth

    const r = await fetch(target, { method: 'POST', headers, body: JSON.stringify(body) })
    if (r.status === 404 || r.status >= 500) {
      // fallback to signup
      const email = body.email
      let password = body.password
      const full_name = body.full_name
      const phone = body.phone
      const role = body.role || (Array.isArray(body.roles) ? body.roles[0] : undefined)
      if (!password) password = `senha${Math.floor(Math.random()*900)+100}!`
      const userType = (role && String(role).toLowerCase() === 'paciente') ? 'paciente' : 'profissional'
      const signupUrl = `${ENV_CONFIG.SUPABASE_URL}/auth/v1/signup`
      const signupRes = await fetch(signupUrl, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Accept':'application/json', 'apikey': ENV_CONFIG.SUPABASE_ANON_KEY },
        body: JSON.stringify({ email, password, data: { userType, full_name, phone } })
      })
      const text = await signupRes.text()
      try { return NextResponse.json({ fallback: true, from: 'signup', result: JSON.parse(text) }, { status: signupRes.status }) } catch { return new NextResponse(text, { status: signupRes.status }) }
    }

    const text = await r.text()
    try { return NextResponse.json(JSON.parse(text), { status: r.status }) } catch { return new NextResponse(text, { status: r.status }) }
  } catch (err:any) {
    console.error('[app/api/create-user] error', err)
    return NextResponse.json({ error: 'Bad gateway', details: String(err) }, { status: 502 })
  }
}
