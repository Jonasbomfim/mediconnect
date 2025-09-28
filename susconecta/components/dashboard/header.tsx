"use client"

import { Bell, Search, ChevronDown } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { SidebarTrigger } from "../ui/sidebar"

export function PagesHeader({ title = "", subtitle = "" }: { title?: string, subtitle?: string }) {
  const { logout, user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownOpen]);

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex flex-row items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-start flex-col justify-center py-2">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar paciente" className="pl-10 w-64" />
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>


        {/* Avatar Dropdown Simples */}
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full border-2 border-gray-300 hover:border-blue-500"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/01.png" alt="@usuario" />
              <AvatarFallback className="bg-blue-500 text-white font-semibold">RA</AvatarFallback>
            </Avatar>
          </Button>

          {/* Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {user?.userType === 'administrador' ? 'Administrador da Clínica' : 'Usuário do Sistema'}
                  </p>
                  {user?.email ? (
                    <p className="text-xs leading-none text-gray-600">{user.email}</p>
                  ) : (
                    <p className="text-xs leading-none text-gray-600">Email não disponível</p>
                  )}
                  <p className="text-xs leading-none text-blue-600 font-medium">
                    Tipo: {user?.userType === 'administrador' ? 'Administrador' : user?.userType || 'Não definido'}
                  </p>
                </div>
              </div>
              
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                  👤 Perfil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer">
                  ⚙️ Configurações
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    
                    // Usar sempre o logout do hook useAuth (ele já redireciona corretamente)
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  🚪 Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
