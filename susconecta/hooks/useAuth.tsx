'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, logoutUser, AuthenticationError } from '@/lib/auth'
import { isExpired, parseJwt } from '@/lib/jwt'
import { httpClient } from '@/lib/http'
import type { 
  AuthContextType, 
  UserData, 
  AuthStatus,
  UserType
} from '@/types/auth'
import { AUTH_STORAGE_KEYS, LOGIN_ROUTES } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<UserData | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const router = useRouter()
  const hasInitialized = useRef(false)

  // Utilitários de armazenamento memorizados
  const clearAuthData = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN)
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
      localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
      // Manter USER_TYPE para redirecionamento correto
    }
    setUser(null)
    setToken(null)
    setAuthStatus('unauthenticated')
    console.log('[AUTH] Dados de autenticação limpos - logout realizado')
  }, [])

  const saveAuthData = useCallback((
    accessToken: string,
    userData: UserData,
    refreshToken?: string
  ) => {
    try {
      if (typeof window !== 'undefined') {
        // Persistir dados de forma atômica
        localStorage.setItem(AUTH_STORAGE_KEYS.TOKEN, accessToken)
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData))
        localStorage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, userData.userType)
        
        if (refreshToken) {
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
        }
      }
      
      setToken(accessToken)
      setUser(userData)
      setAuthStatus('authenticated')
      
      console.log('[AUTH] LOGIN realizado - Dados salvos!', {
        userType: userData.userType,
        email: userData.email,
        timestamp: new Date().toLocaleTimeString()
      })
    } catch (error) {
      console.error('[AUTH] Erro ao salvar dados:', error)
      clearAuthData()
    }
  }, [clearAuthData])

  // Verificação inicial de autenticação
  const checkAuth = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') {
      setAuthStatus('unauthenticated')
      return
    }

    try {
      const storedToken = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.USER)

      console.log('[AUTH] Verificando sessão...', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        timestamp: new Date().toLocaleTimeString()
      })

      // Pequeno delay para visualizar logs
      await new Promise(resolve => setTimeout(resolve, 800))

      if (!storedToken || !storedUser) {
        console.log('[AUTH] Dados ausentes - sessão inválida')
        await new Promise(resolve => setTimeout(resolve, 500))
        clearAuthData()
        return
      }

      // Verificar se token está expirado
      if (isExpired(storedToken)) {
        console.log('[AUTH] Token expirado - tentando renovar...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
        if (refreshToken && !isExpired(refreshToken)) {
          // Tentar renovar via HTTP client (que já tem a lógica)
          try {
            await httpClient.get('/auth/v1/me') // Trigger refresh se necessário
            
            // Se chegou aqui, refresh foi bem-sucedido
            const newToken = localStorage.getItem(AUTH_STORAGE_KEYS.TOKEN)
            const userData = JSON.parse(storedUser) as UserData
            
            if (newToken && newToken !== storedToken) {
              setToken(newToken)
              setUser(userData)
              setAuthStatus('authenticated')
              console.log('[AUTH] Token RENOVADO automaticamente!')
              await new Promise(resolve => setTimeout(resolve, 800))
              return
            }
          } catch (refreshError) {
            console.log('❌ [AUTH] Falha no refresh automático')
            await new Promise(resolve => setTimeout(resolve, 400))
          }
        }
        
        clearAuthData()
        return
      }

      // Restaurar sessão válida
      const userData = JSON.parse(storedUser) as UserData
      setToken(storedToken)
      setUser(userData)
      setAuthStatus('authenticated')

      console.log('[AUTH] Sessão RESTAURADA com sucesso!', {
        userId: userData.id,
        userType: userData.userType,
        email: userData.email,
        timestamp: new Date().toLocaleTimeString()
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error('[AUTH] Erro na verificação:', error)
      clearAuthData()
    }
  }, [clearAuthData])

  // Login memoizado
  const login = useCallback(async (
    email: string,
    password: string,
    userType: UserType
  ): Promise<boolean> => {
    try {
      console.log('[AUTH] Iniciando login:', { email, userType })
      
      const response = await loginUser(email, password, userType)
      
      saveAuthData(
        response.access_token,
        response.user,
        response.refresh_token
      )

      console.log('[AUTH] Login realizado com sucesso')
      return true

    } catch (error) {
      console.error('[AUTH] Erro no login:', error)
      
      if (error instanceof AuthenticationError) {
        throw error
      }
      
      throw new AuthenticationError(
        'Erro inesperado durante o login',
        'UNKNOWN_ERROR',
        error
      )
    }
  }, [saveAuthData])

  // Logout memoizado
  const logout = useCallback(async (): Promise<void> => {
    console.log('[AUTH] Iniciando logout')
    
    const currentUserType = user?.userType || 
      (typeof window !== 'undefined' ? localStorage.getItem(AUTH_STORAGE_KEYS.USER_TYPE) : null) || 
      'profissional'
    
    try {
      if (token) {
        await logoutUser(token)
        console.log('[AUTH] Logout realizado na API')
      }
    } catch (error) {
      console.error('[AUTH] Erro no logout da API:', error)
    }

    clearAuthData()
    
    // Redirecionamento baseado no tipo de usuário
    const loginRoute = LOGIN_ROUTES[currentUserType as UserType] || '/login'
    
    console.log('[AUTH] Redirecionando para:', loginRoute)
    
    if (typeof window !== 'undefined') {
      window.location.href = loginRoute
    }
  }, [user?.userType, token, clearAuthData])

  // Refresh token memoizado (usado pelo HTTP client)
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Esta função é principalmente para compatibilidade
    // O refresh real é feito pelo HTTP client
    return false
  }, [])

  // Getters memorizados
  const contextValue = useMemo(() => ({
    authStatus,
    user,
    token,
    login,
    logout,
    refreshToken
  }), [authStatus, user, token, login, logout, refreshToken])

  // Inicialização única
  useEffect(() => {
    if (!hasInitialized.current && typeof window !== 'undefined') {
      hasInitialized.current = true
      checkAuth()
    }
  }, [checkAuth])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}