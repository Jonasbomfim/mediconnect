"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Calendar,
  MessageSquare,
  Bell,
  Users,
  ShieldCheck,
} from "lucide-react"

export default function ConfiguracaoPage() {
  const items = [
    {
      title: "Agenda",
      desc: "Defina horários e bloqueios",
      href: "/dashboard/configuracao/agenda",
      icon: Calendar,
    },
    {
      title: "Comunicação",
      desc: "Gerencie mensagens automáticas",
      href: "/dashboard/configuracao/comunicacao",
      icon: MessageSquare,
    },
    {
      title: "Notificações",
      desc: "Configure alertas internos",
      href: "/dashboard/configuracao/notificacoes",
      icon: Bell,
    },
    {
      title: "Usuários",
      desc: "Controle acessos e permissões",
      href: "/dashboard/configuracao/usuarios",
      icon: Users,
    },
    {
      title: "Segurança",
      desc: "Senhas, privacidade e LGPD",
      href: "/dashboard/configuracao/seguranca",
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* título */}
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* introdução */}
      <p className="text-gray-600">
        Ajuste os principais parâmetros do sistema. Escolha uma das seções abaixo
        para configurar horários, mensagens, notificações internas, permissões de usuários
        e regras de segurança da clínica.
      </p>

      {/* grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card className="cursor-pointer hover:shadow-md transition">
              <CardHeader className="flex flex-row items-center gap-2">
                <item.icon className="w-5 h-5 text-primary" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
