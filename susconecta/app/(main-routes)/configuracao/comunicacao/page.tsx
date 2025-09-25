"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function ComunicacaoConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações de Comunicação</h1>

      <Card>
        <CardHeader>
          <CardTitle>Modelo de Lembrete</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full border rounded p-2"
            placeholder="Exemplo: Olá {nome}, sua consulta está marcada para {data} às {hora}."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequência de Lembretes</CardTitle>
        </CardHeader>
        <CardContent>
          <select className="border rounded p-2">
            <option>24 horas antes</option>
            <option>4 horas antes</option>
            <option>1 hora antes</option>
          </select>
        </CardContent>
      </Card>
    </div>
  )
}
