'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  userEmail: string | null
  userType: string | null
  login: (email: string, password: string, userType: string) => boolean
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userType, setUserType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('isAuthenticated')
      const email = localStorage.getItem('userEmail')
      const type = localStorage.getItem('userType')
      
      if (auth === 'true' && email) {
        setIsAuthenticated(true)
        setUserEmail(email)
        setUserType(type)
      } else {
        setIsAuthenticated(false)
        setUserEmail(null)
        setUserType(null)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (email: string, password: string, userType: string): boolean => {
    if (email === 'teste@gmail.com' && password === '123456') {
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userEmail', email)
      localStorage.setItem('userType', userType)
      setIsAuthenticated(true)
      setUserEmail(email)
      setUserType(userType)
      return true
    }
    return false
  }

  const logout = () => {
    // Usar o estado atual em vez do localStorage para evitar condição de corrida
    const currentUserType = userType || localStorage.getItem('userType')
    
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userType')
    setIsAuthenticated(false)
    setUserEmail(null)
    setUserType(null)
    
    // Redirecionar para a página de login correta baseado no tipo de usuário
    if (currentUserType === 'administrador') {
      router.push('/login-admin')
    } else {
      router.push('/login')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userEmail,
      userType,
      login,
      logout,
      checkAuth
    }}>
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