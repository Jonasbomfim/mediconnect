'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { loginUser, logoutUser, AuthenticationError } from '@/lib/auth'
import { getUserInfo, getCurrentUser } from '@/lib/api'
import { ENV_CONFIG } from '@/lib/env-config'
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
            console.log(' [AUTH] Falha no refresh automático')
            await new Promise(resolve => setTimeout(resolve, 400))
          }
        }
        
        clearAuthData()
        return
      }

      // Restaurar sessão válida
      const userData = JSON.parse(storedUser) as UserData
      setToken(storedToken)
      // Também buscar o usuário autenticado (/auth/v1/user) para garantir id/email atualizados
      try {
        const authUser = await getCurrentUser().catch(() => null)
        if (authUser) {
          userData.id = authUser.id ?? userData.id
          userData.email = authUser.email ?? userData.email
        }
      } catch (e) {
        console.warn('[AUTH] Falha ao buscar /auth/v1/user durante restauração de sessão:', e)
      }
      // Tentar buscar profile consolidado (user-info) e mesclar
      try {
        const info = await getUserInfo()
        if (info?.profile) {
          const mapped = {
            cpf: (info.profile as any).cpf ?? userData.profile?.cpf,
            crm: (info.profile as any).crm ?? userData.profile?.crm,
            telefone: info.profile.phone ?? userData.profile?.telefone,
            foto_url: info.profile.avatar_url ?? userData.profile?.foto_url,
          }
          if (userData.profile) {
            userData.profile = { ...userData.profile, ...mapped }
          } else {
            userData.profile = mapped
          }
          // Persistir o usuário atualizado no localStorage para evitar
          // que 'auth_user.profile' fique vazio após um reload completo
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(userData))
            }
          } catch (e) {
            console.warn('[AUTH] Falha ao persistir user (profile) no localStorage:', e)
          }
        }
      } catch (err) {
        console.warn('[AUTH] Falha ao buscar user-info na restauração de sessão:', err)
      }

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
      
      // Após receber token, buscar roles/permissions reais e reconciliar userType
      try {
        const infoRes = await fetch(`${ENV_CONFIG.SUPABASE_URL}/functions/v1/user-info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${response.access_token}`,
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
          }
        })
        if (infoRes.ok) {
          const info = await infoRes.json().catch(() => null)
          const roles: string[] = Array.isArray(info?.roles) ? info.roles : (info?.roles ? [info.roles] : [])

          // Derivar tipo de usuário a partir dos roles
          let derived: UserType = 'paciente'
          if (roles.includes('admin') || roles.includes('gestor') || roles.includes('secretaria')) {
            derived = 'administrador'
          } else if (roles.includes('medico') || roles.includes('enfermeiro')) {
            derived = 'profissional'
          }

          // Atualizar userType caso seja diferente
          if (response.user && response.user.userType !== derived) {
            response.user.userType = derived
            console.log('[AUTH] userType reconciled from roles ->', derived)
          }
        } else if (infoRes.status === 401 || infoRes.status === 403) {
          // Authentication/permission issue: don't spam the console with raw response
          console.warn('[AUTH] user-info returned', infoRes.status, '- skipping role reconciliation');
        } else {
          console.warn('[AUTH] Falha ao obter user-info para reconciliar roles:', infoRes.status)
        }
      } catch (err) {
        console.warn('[AUTH] Erro ao buscar user-info após login (não crítico):', err)
      }

      // Após login, tentar buscar profile consolidado e mesclar antes de persistir
      try {
        const info = await getUserInfo()
        if (info?.profile && response.user) {
          const mapped = {
            cpf: (info.profile as any).cpf ?? response.user.profile?.cpf,
            crm: (info.profile as any).crm ?? response.user.profile?.crm,
            telefone: info.profile.phone ?? response.user.profile?.telefone,
            foto_url: info.profile.avatar_url ?? response.user.profile?.foto_url,
          }
          if (response.user.profile) {
            response.user.profile = { ...response.user.profile, ...mapped }
          } else {
            response.user.profile = mapped
          }
        }
      } catch (err) {
        console.warn('[AUTH] Falha ao buscar user-info após login (não crítico):', err)
      }

      // Também chamar /auth/v1/user para obter dados básicos do usuário autenticado
      try {
        const curRes = await fetch(`${ENV_CONFIG.SUPABASE_URL}/auth/v1/user`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${response.access_token}`,
            'apikey': ENV_CONFIG.SUPABASE_ANON_KEY,
          }
        })
        if (curRes.ok) {
          const cu = await curRes.json().catch(() => null)
          if (cu && response.user) {
            response.user.id = cu.id ?? response.user.id
            response.user.email = cu.email ?? response.user.email
          }
        } else {
          // não crítico
          console.warn('[AUTH] /auth/v1/user retornou', curRes.status)
        }
      } catch (e) {
        console.warn('[AUTH] Erro ao chamar /auth/v1/user após login (não crítico):', e)
      }

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
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new AuthenticationError(
        errorMessage || 'Erro inesperado durante o login',
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