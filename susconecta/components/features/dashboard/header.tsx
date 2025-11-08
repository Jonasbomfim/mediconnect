"use client"

import { Bell, ChevronDown } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "../../ui/sidebar"
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";

export function PagesHeader({ title = "", subtitle = "" }: { title?: string, subtitle?: string }) {
  const { logout, user } = useAuth();
  const router = useRouter();
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
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
  <Button variant="ghost" size="icon" className="hover:bg-primary! hover:text-white! transition-colors">
          <Bell className="h-4 w-4" />
        </Button>

        <SimpleThemeToggle />
                    <Button
                      variant="outline"
                      className="text-primary border-primary bg-transparent shadow-sm shadow-blue-500/10 border border-blue-200 hover:bg-blue-50 dark:shadow-none dark:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
                      asChild
                    ></Button>
        {/* Avatar Dropdown Simples */}
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full border-2 border-border hover:border-primary"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {/* Mostrar foto do usuário quando disponível; senão, mostrar fallback com iniciais */}
            <Avatar className="h-8 w-8">
              {
                (() => {
                  const userPhoto = (user as any)?.profile?.foto_url || (user as any)?.profile?.fotoUrl || (user as any)?.profile?.avatar_url
                  const alt = user?.name || user?.email || 'Usuário'

                  const getInitials = (name?: string, email?: string) => {
                    if (name) {
                      const parts = name.trim().split(/\s+/)
                      const first = parts[0]?.charAt(0) ?? ''
                      const second = parts[1]?.charAt(0) ?? ''
                      return (first + second).toUpperCase() || (email?.charAt(0) ?? 'U').toUpperCase()
                    }
                    if (email) return email.charAt(0).toUpperCase()
                    return 'U'
                  }

                  return (
                    <>
                      <AvatarImage src={userPhoto || undefined} alt={alt} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">{getInitials(user?.name, user?.email)}</AvatarFallback>
                    </>
                  )
                })()
              }
            </Avatar>
          </Button>

          {/* Dropdown Content */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-md shadow-lg z-50 text-popover-foreground">
              <div className="p-4 border-b border-border">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {user?.userType === 'administrador' ? 'Administrador da Clínica' : 'Usuário do Sistema'}
                  </p>
                  {user?.email ? (
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  ) : (
                    <p className="text-xs leading-none text-muted-foreground">Email não disponível</p>
                  )}
                  <p className="text-xs leading-none text-primary font-medium">
                    Tipo: {user?.userType === 'administrador' ? 'Administrador' : user?.userType || 'Não definido'}
                  </p>
                </div>
              </div>
              
              <div className="py-1">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    router.push('/perfil');
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent cursor-pointer"
                >
                   Perfil
                </button>
                
                <div className="border-t border-border my-1"></div>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setDropdownOpen(false);
                    
                    // Usar sempre o logout do hook useAuth (ele já redireciona corretamente)
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                   Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
