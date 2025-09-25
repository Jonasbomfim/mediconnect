import type React from "react"
import type { Metadata } from "next"
import { AuthProvider } from "@/hooks/useAuth"
import "./globals.css"

export const metadata: Metadata = {
  title: "MediConecta - Conectando Pacientes e Profissionais de Saúde",
  description:
    "Plataforma inovadora que conecta pacientes e médicos de forma prática, segura e humanizada. Experimente o futuro dos agendamentos médicos.",
  keywords: "saúde, médicos, pacientes, agendamento, telemedicina, SUS",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body style={{ fontFamily: "var(--font-geist-sans)" }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
