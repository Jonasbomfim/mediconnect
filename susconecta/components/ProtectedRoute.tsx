'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredUserType?: string
}

export default function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { isAuthenticated, userType, checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Usuário não autenticado, redirecionando para login...')
      router.push('/login')
    } else if (requiredUserType && userType !== requiredUserType) {
      console.log(`Tipo de usuário incorreto. Esperado: ${requiredUserType}, Atual: ${userType}`)
      router.push('/login')
    } else {
      console.log('Usuário autenticado!')
    }
  }, [isAuthenticated, userType, requiredUserType, router])

  if (!isAuthenticated || (requiredUserType && userType !== requiredUserType)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}