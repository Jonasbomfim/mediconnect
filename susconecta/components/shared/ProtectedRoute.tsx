'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import type { UserType } from '@/types/auth'
import { USER_TYPE_ROUTES, LOGIN_ROUTES, AUTH_STORAGE_KEYS } from '@/types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: UserType[]
}

export default function ProtectedRoute({ 
  children, 
  requiredUserType 
}: ProtectedRouteProps) {
  const { authStatus, user } = useAuth()
  const router = useRouter()
  const isRedirecting = useRef(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // marca que o componente já montou no cliente
    setMounted(true)

    // Evitar múltiplos redirects
    if (isRedirecting.current) return

    // Durante loading, não fazer nada
    if (authStatus === 'loading') return

    // Se não autenticado, redirecionar para login
    if (authStatus === 'unauthenticated') {
      isRedirecting.current = true
      
      console.log('[PROTECTED-ROUTE] Usuário NÃO autenticado - redirecionando...')
      
      // Determinar página de login baseada no histórico
      let userType: UserType = 'profissional'
      
      if (typeof window !== 'undefined') {
        try {
          const storedUserType = localStorage.getItem(AUTH_STORAGE_KEYS.USER_TYPE)
          if (storedUserType && ['profissional', 'paciente', 'administrador'].includes(storedUserType)) {
            userType = storedUserType as UserType
          }
        } catch (error) {
          console.warn('[PROTECTED-ROUTE] Erro ao ler localStorage:', error)
        }
      }
      
      const loginRoute = LOGIN_ROUTES[userType]
      console.log('[PROTECTED-ROUTE] Redirecionando para login:', {
        userType,
        loginRoute,
        timestamp: new Date().toLocaleTimeString()
      })
      
      router.push(loginRoute)
      return
    }

    // Se autenticado mas não tem permissão para esta página
    if (authStatus === 'authenticated' && user && requiredUserType && !requiredUserType.includes(user.userType)) {
      isRedirecting.current = true
      
      console.log('[PROTECTED-ROUTE] Usuário SEM permissão para esta página', {
        userType: user.userType,
        requiredTypes: requiredUserType
      })
      
      const correctRoute = USER_TYPE_ROUTES[user.userType]
      console.log('[PROTECTED-ROUTE] Redirecionando para área correta:', correctRoute)
      
      router.push(correctRoute)
      return
    }

    // Se chegou aqui, acesso está autorizado
    if (authStatus === 'authenticated') {
      console.log('[PROTECTED-ROUTE] ACESSO AUTORIZADO!', {
        userType: user?.userType,
        email: user?.email,
        timestamp: new Date().toLocaleTimeString()
      })
      isRedirecting.current = false
    }
  }, [authStatus, user, requiredUserType, router])

  // Durante loading, mostrar spinner
  if (authStatus === 'loading') {
    // evitar render no servidor para não causar mismatch de hidratação
    if (!mounted) return null

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não autenticado ou redirecionando, mostrar spinner
  if (authStatus === 'unauthenticated' || isRedirecting.current) {
    // evitar render no servidor para não causar mismatch de hidratação
    if (!mounted) return null

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando...</p>
        </div>
      </div>
    )
  }

  // Se usuário não tem permissão, mostrar fallback (não deveria chegar aqui devido ao useEffect)
  if (requiredUserType && user && !requiredUserType.includes(user.userType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  // Finalmente, renderizar conteúdo protegido
  return <>{children}</>
}