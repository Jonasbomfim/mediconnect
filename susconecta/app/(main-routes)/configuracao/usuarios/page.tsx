"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function UsuariosConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>

      <Card>
        <CardHeader>
          <CardTitle>Usuários da Clínica</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Permissão</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2">Maria Silva</td>
                <td className="p-2">maria@clinica.com</td>
                <td className="p-2">Secretária</td>
                <td className="p-2">[Editar] [Remover]</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
