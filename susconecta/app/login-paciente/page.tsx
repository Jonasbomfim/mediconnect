'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { sendMagicLink } from '@/lib/api'
import { ENV_CONFIG } from '@/lib/env-config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthenticationError } from '@/lib/auth'

export default function LoginPacientePage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [magicMessage, setMagicMessage] = useState('')
  const [magicError, setMagicError] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Tentar fazer login usando o contexto com tipo paciente
      const success = await login(credentials.email, credentials.password, 'paciente')
      
      if (success) {
        // Redirecionar para a página do paciente
        router.push('/paciente')
      }
    } catch (err) {
      console.error('[LOGIN-PACIENTE] Erro no login:', err)
      
      if (err instanceof AuthenticationError) {
        // Verificar se é erro de credenciais inválidas (pode ser email não confirmado)
        if (err.code === '400' || err.details?.error_code === 'invalid_credentials') {
          setError(
            '⚠️ Email ou senha incorretos. Se você acabou de se cadastrar, ' +
            'verifique sua caixa de entrada e clique no link de confirmação ' +
            'que foi enviado para ' + credentials.email
          )
        } else {
          setError(err.message)
        }
      } else {
        setError('Erro inesperado. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendMagicLink = async () => {
    if (!credentials.email) {
      setMagicError('Por favor, preencha o email antes de solicitar o magic link.')
      return
    }

    setMagicLoading(true)
    setMagicError('')
    setMagicMessage('')

    try {
      const res = await sendMagicLink(credentials.email, { target: 'paciente' })
      setMagicMessage(res?.message ?? 'Magic link enviado. Verifique seu email.')
    } catch (err: any) {
      console.error('[MAGIC-LINK PACIENTE] erro ao enviar:', err)
      setMagicError(err?.message ?? String(err))
    } finally {
      setMagicLoading(false)
    }
  }

  // --- Auto-cadastro (client-side) ---
  const [showRegister, setShowRegister] = useState(false)
  const [reg, setReg] = useState({ email: '', full_name: '', phone_mobile: '', cpf: '', birth_date: '' })
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')

  function cleanCpf(cpf: string) {
    return String(cpf || '').replace(/\D/g, '')
  }

  function validateCPF(cpfRaw: string) {
    const cpf = cleanCpf(cpfRaw)
    if (!/^\d{11}$/.test(cpf)) return false
    if (/^([0-9])\1+$/.test(cpf)) return false
    const digits = cpf.split('').map((d) => Number(d))
    const calc = (len: number) => {
      let sum = 0
      for (let i = 0; i < len; i++) sum += digits[i] * (len + 1 - i)
      const v = (sum * 10) % 11
      return v === 10 ? 0 : v
    }
    return calc(9) === digits[9] && calc(10) === digits[10]
  }

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setRegError('')
    setRegSuccess('')

    // client-side validation
    if (!reg.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reg.email)) return setRegError('Email inválido')
    if (!reg.full_name || reg.full_name.trim().length < 3) return setRegError('Nome deve ter ao menos 3 caracteres')
    if (!reg.phone_mobile || !/^\d{10,11}$/.test(reg.phone_mobile)) return setRegError('Telefone inválido (10-11 dígitos)')
    if (!reg.cpf || !/^\d{11}$/.test(cleanCpf(reg.cpf))) return setRegError('CPF deve conter 11 dígitos')
    if (!validateCPF(reg.cpf)) return setRegError('CPF inválido')

    setRegLoading(true)
    try {
      const url = `${ENV_CONFIG.SUPABASE_URL}/functions/v1/register-patient`
        const body = {
          email: reg.email,
          full_name: reg.full_name,
          phone_mobile: reg.phone_mobile,
          cpf: cleanCpf(reg.cpf),
          // always include redirect to patient landing as requested
          redirect_url: 'https://mediconecta-app-liart.vercel.app/'
        } as any
        if (reg.birth_date) body.birth_date = reg.birth_date

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ENV_CONFIG.SUPABASE_ANON_KEY, Accept: 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => null)
      if (res.ok) {
        setRegSuccess(json?.message ?? 'Cadastro realizado com sucesso! Verifique seu email para acessar a plataforma.')
        // clear form but keep email for convenience
        setReg({ ...reg, full_name: '', phone_mobile: '', cpf: '', birth_date: '' })
      } else if (res.status === 400) {
        setRegError(json?.error ?? json?.message ?? 'Dados inválidos')
      } else if (res.status === 409) {
        setRegError(json?.error ?? 'CPF ou email já cadastrado')
      } else if (res.status === 429) {
        setRegError(json?.error ?? 'Rate limit excedido. Tente novamente mais tarde.')
      } else {
        setRegError(json?.error ?? json?.message ?? `Erro (${res.status})`)
      }
    } catch (err: any) {
      console.error('[REGISTER PACIENTE] erro', err)
      setRegError(err?.message ?? String(err))
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Sou Paciente
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse sua área pessoal e gerencie suas consultas
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Entrar como Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={credentials.email}
                  onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full cursor-pointer" 
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar na Minha Área'}
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground mb-2">Ou entre usando um magic link (sem senha)</div>

              {magicError && (
                <Alert variant="destructive">
                  <AlertDescription>{magicError}</AlertDescription>
                </Alert>
              )}

              {magicMessage && (
                <Alert>
                  <AlertDescription>{magicMessage}</AlertDescription>
                </Alert>
              )}

              <Button className="w-full" onClick={handleSendMagicLink} disabled={magicLoading}>
                {magicLoading ? 'Enviando magic link...' : 'Enviar magic link'}
              </Button>
            </div>
            
            <div className="mt-4 text-center">
              <Button variant="outline" asChild className="w-full hover:!bg-primary hover:!text-white hover:!border-primary transition-all duration-200">
                <Link href="/">
                  Voltar ao Início
                </Link>
              </Button>
            </div>
            <div className="mt-6">
              <div className="text-sm text-muted-foreground mb-2">Ainda não tem conta? <button className="text-primary underline ml-2" onClick={() => setShowRegister(!showRegister)}>{showRegister ? 'Fechar' : 'Criar conta'}</button></div>

              {showRegister && (
                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle className="text-center">Auto-cadastro de Paciente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground">Nome completo</label>
                        <Input value={reg.full_name} onChange={(e) => setReg({...reg, full_name: e.target.value})} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Email</label>
                        <Input type="email" value={reg.email} onChange={(e) => setReg({...reg, email: e.target.value})} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Telefone (apenas números)</label>
                        <Input value={reg.phone_mobile} onChange={(e) => setReg({...reg, phone_mobile: e.target.value.replace(/\D/g,'')})} placeholder="11999998888" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">CPF (11 dígitos)</label>
                        <Input value={reg.cpf} onChange={(e) => setReg({...reg, cpf: e.target.value.replace(/\D/g,'')})} placeholder="12345678901" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground">Data de nascimento (opcional)</label>
                        <Input type="date" value={reg.birth_date} onChange={(e) => setReg({...reg, birth_date: e.target.value})} />
                      </div>

                      {regError && (
                        <Alert variant="destructive"><AlertDescription>{regError}</AlertDescription></Alert>
                      )}
                      {regSuccess && (
                        <Alert><AlertDescription>{regSuccess}</AlertDescription></Alert>
                      )}

                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={regLoading}>{regLoading ? 'Criando...' : 'Criar Conta'}</Button>
                        <Button variant="ghost" onClick={() => setShowRegister(false)} disabled={regLoading}>Cancelar</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}