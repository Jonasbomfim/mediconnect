"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Calendar, Users, UserCheck, FileText, BarChart3, Settings, Stethoscope, User } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
 { name: "Agendamento", href: "/agendamento", icon: Calendar },
  { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
  { name: "Médicos", href: "/dashboard/doutores", icon: User },
  { name: "Consultas", href: "/dashboard/consultas", icon: UserCheck },
  { name: "Prontuários", href: "/dashboard/prontuarios", icon: FileText },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-sidebar-foreground">SUSConecta</span>
        </Link>
      </div>

      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
