"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeaderAgenda() {
  const pathname = usePathname();
  const isAg = pathname?.startsWith("/agenda");

  return (
    <header className="border-b bg-background border-border">
      <div className="mx-auto w-full max-w-7xl px-8 py-3 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-foreground">Novo Agendamento</h1>
        <nav role="tablist" aria-label="Navegação de Agendamento" className="flex items-center gap-2">
          <Link
            href="/agenda"
            role="tab"
            className={`px-4 py-1.5 text-[13px] font-medium border rounded-md ${
              isAg
                ? "bg-primary text-white border-primary dark:bg-primary dark:text-white"
                : "text-foreground hover:bg-muted border-input"
            }`}
          >
            Agendamento
          </Link>
        </nav>
      </div>
    </header>
  );
}
