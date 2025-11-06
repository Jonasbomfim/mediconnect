"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function HeaderAgenda() {
  const pathname = usePathname();
  const router = useRouter();

  const isAg = pathname?.startsWith("/agenda");
  const isPr = pathname?.startsWith("/procedimento");
  const isFi = pathname?.startsWith("/financeiro");

  return (
    <header className="border-b bg-background border-border">
      <div className="mx-auto w-full max-w-7xl px-8 py-3 flex items-center justify-between">
        <h1 className="text-[18px] font-semibold text-foreground">Novo Agendamento</h1>

        <div className="flex items-center gap-2">
          <nav
            role="tablist"
            aria-label="Navegação de Agendamento"
            className="flex items-center gap-2"
          >
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
            <Link
              href="/procedimento"
              role="tab"
              className={`px-4 py-1.5 text-[13px] font-medium border rounded-md ${
                isPr 
                  ? "bg-primary text-white border-primary dark:bg-primary dark:text-white" 
                  : "text-foreground hover:bg-muted border-input"
              }`}
            >
              Procedimento
            </Link>
            <Link
              href="/financeiro"
              role="tab"
              className={`px-4 py-1.5 text-[13px] font-medium border rounded-md ${
                isFi 
                  ? "bg-primary text-white border-primary dark:bg-primary dark:text-white" 
                  : "text-foreground hover:bg-muted border-input"
              }`}
            >
              Financeiro
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Voltar para Calendário"
            onClick={() => router.push("/calendar")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
