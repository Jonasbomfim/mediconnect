import type React from "react";
import type { Metadata } from "next";
import "./globals.css";

// Importa as famílias direto do pacote geist
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "SUSConecta - Conectando Pacientes e Profissionais de Saúde",
  description:
    "Plataforma inovadora que conecta pacientes e médicos de forma prática, segura e humanizada. Experimente o futuro dos agendamentos médicos.",
  keywords: "saúde, médicos, pacientes, agendamento, telemedicina, SUS",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}

