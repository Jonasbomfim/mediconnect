"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar as ShadSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

import {
  Home,
  Calendar,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Stethoscope,
  User,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Calendario", href: "/calendar", icon: Calendar },
  { name: "Pacientes", href: "/dashboard/pacientes", icon: Users },
  { name: "Médicos", href: "/dashboard/medicos", icon: User },
  { name: "Consultas", href: "/dashboard/consultas", icon: UserCheck },
  { name: "Prontuários", href: "/dashboard/prontuarios", icon: FileText },
  { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <ShadSidebar
      /* mude para side="right" se preferir */
      side="left"
      /* isso faz colapsar para ícones */
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity pt-2"
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4 text-primary-foreground" />
          </div>

          {/* este span some no modo ícone */}
          <span className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            SUSConecta
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="mr-3 h-4 w-4 shrink-0" />
                        {/* o texto esconde quando colapsa */}
                        <span className="truncate group-data-[collapsible=icon]:hidden">
                          {item.name}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{/* espaço para perfil/logout, se quiser */}</SidebarFooter>

      {/* rail clicável/hover que ajuda a reabrir/fechar */}
      <SidebarRail />
    </ShadSidebar>
  )
}
