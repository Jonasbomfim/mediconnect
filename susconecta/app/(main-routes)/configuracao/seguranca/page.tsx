"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function SegurancaConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Configurações de Segurança</h1>

      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <input type="password" placeholder="Senha atual" className="w-full border rounded p-2 mb-2" />
          <input type="password" placeholder="Nova senha" className="w-full border rounded p-2 mb-2" />
          <input type="password" placeholder="Confirmar nova senha" className="w-full border rounded p-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Dados (LGPD)</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="h-4 w-4" /> <span>Solicitar consentimento do paciente no cadastro</span>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
