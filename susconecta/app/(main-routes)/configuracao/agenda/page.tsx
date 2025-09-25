"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function AgendaConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações da Agenda</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tempo padrão de consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <select className="border rounded p-2">
            <option>15 minutos</option>
            <option>30 minutos</option>
            <option>1 hora</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="time" className="border rounded p-2 mr-2" /> até
          <input type="time" className="border rounded p-2 ml-2" />
        </CardContent>
      </Card>
    </div>
  )
}
