"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function HeaderAgenda() {
  const pathname = usePathname();
  const router = useRouter();

  const isAg = pathname?.startsWith("/agendamento");
  const isPr = pathname?.startsWith("/procedimento");
  const isFi = pathname?.startsWith("/financeiro");

  const tabCls = (active: boolean, extra = "") =>
    `px-4 py-1.5 text-[13px] border ${
      active
        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
        : "text-muted-foreground hover:bg-muted border-border"
    } ${extra}`;

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
              aria-selected={isAg}
              className={tabCls(Boolean(isAg)) + " rounded-md"}
            >
              Agendamento
            </Link>
            <Link
              href="/procedimento"
              role="tab"
              aria-selected={isPr}
              className={tabCls(Boolean(isPr)) + " rounded-md"}
            >
              Procedimento
            </Link>
            <Link
              href="/financeiro"
              role="tab"
              aria-selected={isFi}
              className={tabCls(Boolean(isFi)) + " rounded-md"}
            >
              Financeiro
            </Link>
          </nav>

          <button
            type="button"
            aria-label="Histórico"
            onClick={() => router.back()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
