'use client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, LogOut, Home } from 'lucide-react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PacientePage() {
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    console.log('[PACIENTE] Iniciando logout...')
    await logout()
  }

  return (
    <ProtectedRoute requiredUserType={["paciente"]}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Portal do Paciente
            </CardTitle>
            <p className="text-sm text-gray-600">
              Bem-vindo ao seu espaço pessoal
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Informações do Paciente */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Maria Silva Santos
              </h2>
              <p className="text-sm text-gray-600">
                CPF: 123.456.789-00
              </p>
              <p className="text-sm text-gray-600">
                Idade: 35 anos
              </p>
            </div>

            {/* Informações do Login */}
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  Conectado como:
                </p>
                <p className="font-medium text-gray-800">
                  {user?.email || 'paciente@example.com'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tipo de usuário: Paciente
                </p>
              </div>
            </div>

            {/* Botão Voltar ao Início */}
            <Button 
              asChild
              variant="outline"
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Voltar ao Início
              </Link>
            </Button>

            {/* Botão de Logout */}
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>

            {/* Informação adicional */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Em breve, mais funcionalidades estarão disponíveis
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}