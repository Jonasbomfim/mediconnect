'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { sendMagicLink } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthenticationError } from '@/lib/auth'

export default function LoginPage() {
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
      // Tentar fazer login usando o contexto com tipo profissional
      const success = await login(credentials.email, credentials.password, 'profissional')
      
      if (success) {
        console.log('[LOGIN-PROFISSIONAL] Login bem-sucedido, redirecionando...')
        
        // Redirecionamento direto - solução que funcionou
        window.location.href = '/profissional'
      }
    } catch (err) {
      console.error('[LOGIN-PROFISSIONAL] Erro no login:', err)
      
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
    // basic client-side validation
    if (!credentials.email) {
      setMagicError('Por favor, preencha o email antes de solicitar o magic link.')
      return
    }

    setMagicLoading(true)
    setMagicError('')
    setMagicMessage('')

    try {
      const res = await sendMagicLink(credentials.email, { target: 'medico' })
      setMagicMessage(res?.message ?? 'Magic link enviado. Verifique seu email.')
    } catch (err: any) {
      console.error('[MAGIC-LINK] erro ao enviar:', err)
      setMagicError(err?.message ?? String(err))
    } finally {
      setMagicLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Login Profissional de Saúde
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
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
                {loading ? 'Entrando...' : 'Entrar'}
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
              <Button variant="outline" asChild className="w-full hover:bg-primary! hover:text-white! hover:border-primary! transition-all duration-200">
                <Link href="/">
                  Voltar ao Início
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}