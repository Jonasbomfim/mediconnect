'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AuthenticationError } from '@/lib/auth'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, user } = useAuth()

  // Mapeamento de redirecionamento baseado em role
  const getRoleRedirectPath = (userType: string): string => {
    switch (userType) {
      case 'paciente':
        return '/paciente'
      case 'profissional':
        return '/profissional'
      case 'administrador':
        return '/dashboard'
      default:
        return '/'
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Tentar fazer login com cada tipo de usuário até conseguir
      // Ordem de prioridade: profissional (inclui médico), paciente, administrador
      const userTypes: Array<'paciente' | 'profissional' | 'administrador'> = [
        'profissional',  // Tentar profissional PRIMEIRO pois inclui médicos
        'paciente',
        'administrador'
      ]

      let lastError: AuthenticationError | Error | null = null
      let loginAttempted = false

      for (const userType of userTypes) {
        try {
          console.log(`[LOGIN] Tentando login como ${userType}...`)
          const loginSuccess = await login(credentials.email, credentials.password, userType)
          
          if (loginSuccess) {
            loginAttempted = true
            console.log('[LOGIN] Login bem-sucedido como', userType)
            console.log('[LOGIN] User state:', user)
            
            // Aguardar um pouco para o state do usuário ser atualizado
            await new Promise(resolve => setTimeout(resolve, 500))
            
            // Obter o userType atualizado do localStorage (que foi salvo pela função login)
            const storedUser = localStorage.getItem('auth_user')
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser)
                const redirectPath = getRoleRedirectPath(userData.userType)
                console.log('[LOGIN] Redirecionando para:', redirectPath)
                router.push(redirectPath)
              } catch (parseErr) {
                console.error('[LOGIN] Erro ao parsear user do localStorage:', parseErr)
                router.push('/')
              }
            } else {
              console.warn('[LOGIN] Usuário não encontrado no localStorage')
              router.push('/')
            }
            return
          }
        } catch (err) {
          lastError = err as AuthenticationError | Error
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.log(`[LOGIN] Falha ao tentar como ${userType}:`, errorMsg)
          continue
        }
      }

      // Se chegou aqui, nenhum tipo funcionou
      console.error('[LOGIN] Nenhum tipo de usuário funcionou. Erro final:', lastError)
      
      if (lastError instanceof AuthenticationError) {
        const errorMsg = lastError.message || lastError.details?.error_code || ''
        if (lastError.code === '400' || errorMsg.includes('invalid_credentials') || errorMsg.includes('Email or password')) {
          setError('❌ Email ou senha incorretos. Verifique suas credenciais.')
        } else {
          setError(lastError.message || 'Erro ao fazer login. Tente novamente.')
        }
      } else if (lastError instanceof Error) {
        setError(lastError.message || 'Erro desconhecido ao fazer login.')
      } else {
        setError('Falha ao fazer login. Credenciais inválidas ou conta não encontrada.')
      }
    } catch (err) {
      console.error('[LOGIN] Erro no login:', err)
    } finally {
      setLoading(false)
    }
  }

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground">
            Entrar
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Login</CardTitle>
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
            
            <div className="mt-4 text-center">
              <Button variant="ghost" asChild className="w-full">
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