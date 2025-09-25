    "use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function NotificacoesConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações de Notificações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Internos</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4" /> <span>Notificar quando consulta for cancelada</span>
          </label>
          <label className="flex items-center space-x-2 mt-2">
            <input type="checkbox" className="h-4 w-4" /> <span>Notificar quando novo paciente for cadastrado</span>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
