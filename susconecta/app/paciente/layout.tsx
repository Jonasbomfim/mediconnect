import type { ReactNode } from "react";
import { ChatWidget } from "@/components/features/pacientes/chat-widget";

export default function PacienteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
