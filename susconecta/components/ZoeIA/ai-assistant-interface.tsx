"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import {
  Clock,
  Info,
  Lock,
  MessageCircle,
  Plus,
  Upload,
} from "lucide-react";

interface HistoryEntry {
  id: string;
  text: string;
  createdAt: string;
}

interface AIAssistantInterfaceProps {
  onOpenDocuments?: () => void;
  onOpenChat?: () => void;
  history?: HistoryEntry[];
  onAddHistory?: (entry: HistoryEntry) => void;
  onClearHistory?: () => void;
}

export function AIAssistantInterface({
  onOpenDocuments,
  onOpenChat,
  history: externalHistory,
  onAddHistory,
  onClearHistory,
}: AIAssistantInterfaceProps) {
  const [question, setQuestion] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [internalHistory, setInternalHistory] = useState<HistoryEntry[]>([]);
  const history = externalHistory ?? internalHistory;

  const showHistoryBadge = useMemo(() => history.length > 0, [history.length]);

  const handleDocuments = () => {
    if (onOpenDocuments) {
      onOpenDocuments();
      return;
    }
    console.log("[ZoeIA] Abrir fluxo de documentos");
  };

  const handleOpenRealtimeChat = () => {
    if (onOpenChat) {
      onOpenChat();
      return;
    }
    console.log("[ZoeIA] Abrir chat em tempo real");
  };

  const handleSendMessage = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    handlePersistHistory(trimmed);
    console.log("[ZoeIA] Mensagem enviada para Zoe", trimmed);
    setQuestion("");
  };

  const RealtimeTriggerButton = () => (
    <button
      type="button"
      onClick={handleOpenRealtimeChat}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-zinc-900 dark:text-white"
      aria-label="Abrir chat Zoe em tempo real"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden
      >
        <rect x="4" y="7" width="2" height="10" rx="1" />
        <rect x="8" y="5" width="2" height="14" rx="1" />
        <rect x="12" y="7" width="2" height="10" rx="1" />
        <rect x="16" y="9" width="2" height="6" rx="1" />
        <rect x="20" y="8" width="2" height="8" rx="1" />
      </svg>
    </button>
  );

  const handlePersistHistory = (text: string) => {
    const entry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
    };

    if (onAddHistory) {
      onAddHistory(entry);
    } else {
      setInternalHistory((prev) => [...prev, entry]);
    }
    setDrawerOpen(true);
  };

  const handleClearHistory = () => {
    if (onClearHistory) {
      onClearHistory();
    } else {
      setInternalHistory([]);
    }
  };

  const HistoryGlyph = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
    >
      <circle cx="16" cy="8" r="3" className="stroke-current" strokeWidth="1.6" />
      <line x1="5" y1="8" x2="12" y2="8" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="5" y1="16" x2="19" y2="16" className="stroke-current" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="16" r="1" className="fill-current" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="relative rounded-2xl border border-border/60 bg-card text-muted-foreground shadow-sm transition hover:text-primary"
            >
              <HistoryGlyph />
              <span className="sr-only">Abrir histórico de interações</span>
              {showHistoryBadge && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </Button>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-sky-500 to-emerald-400 text-base font-semibold text-white shadow-lg">
              Zoe
            </span>
            <div>
              <p className="text-sm font-semibold text-primary">Assistente Clínica Zoe</p>
              <h1 className="text-2xl font-bold tracking-tight">Olá, eu sou Zoe. Como posso ajudar hoje?</h1>
            </div>
          </div>
          <SimpleThemeToggle />
        </header>

        <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground shadow-sm">
          <Lock className="h-4 w-4" />
          <span>Suas informações permanecem criptografadas e seguras com a equipe Zoe.</span>
        </div>

        <section className="space-y-6 rounded-3xl border border-primary/15 bg-card/60 p-6 shadow-lg backdrop-blur">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-sm leading-relaxed text-muted-foreground">
            <div className="mb-4 flex items-center gap-3 text-primary">
              <Info className="h-5 w-5" />
              <span className="font-semibold">Informativo importante</span>
            </div>
            <p>
              A Zoe é a assistente virtual da Clínica Zoe. Ela reúne informações sobre seus cuidados e orienta os próximos passos.
              O atendimento é informativo e não substitui a avaliação de um profissional de saúde qualificado.
            </p>
            <p className="mt-4">
              Em situações de urgência, procure imediatamente o suporte médico presencial ou ligue para os serviços de emergência.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={handleDocuments}
              size="lg"
              className="justify-start gap-3 rounded-2xl bg-primary text-primary-foreground shadow-md transition hover:shadow-xl"
            >
              <Upload className="h-5 w-5" />
              Enviar documentos clínicos
            </Button>
            <Button
              onClick={handleOpenRealtimeChat}
              size="lg"
              variant="outline"
              className="justify-start gap-3 rounded-2xl border-primary/40 bg-background shadow-md transition hover:border-primary hover:text-primary"
            >
              <MessageCircle className="h-5 w-5" />
              Conversar com a equipe Zoe
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-background/80 p-4 shadow-inner">
            <p className="text-sm text-muted-foreground">
              Estamos reunindo o histórico da sua jornada. Enquanto isso, você pode anexar exames, enviar dúvidas ou solicitar contato com a equipe Zoe.
            </p>
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-full border border-border bg-card/70 px-3 py-2 shadow-xl">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/40 bg-background/60 text-muted-foreground transition hover:text-primary"
            onClick={handleDocuments}
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Pergunte qualquer coisa para a Zoe"
            className="border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="rounded-full bg-primary px-5 text-primary-foreground shadow-md transition hover:bg-primary/90"
              onClick={handleSendMessage}
            >
              Enviar
            </Button>
            <RealtimeTriggerButton />
          </div>
        </div>

        {drawerOpen && (
          <aside className="fixed inset-y-0 left-0 z-[120] w-[min(22rem,80vw)] bg-card shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-sky-500 to-emerald-400 text-sm font-semibold text-white shadow-md">
                    Zoe
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Histórico da Zoe</h2>
                    <p className="text-xs text-muted-foreground">{history.length} registro{history.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-full"
                >
                  <span className="sr-only">Fechar histórico</span>
                  ×
                </Button>
              </div>

              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Button
                  type="button"
                  className="flex-1 justify-start gap-2 rounded-xl bg-primary text-primary-foreground shadow-md transition hover:shadow-lg"
                  onClick={() => {
                    handleClearHistory();
                    setDrawerOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Novo atendimento
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma conversa registrada ainda. Envie uma mensagem para começar um novo acompanhamento com a Zoe.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3 text-sm">
                    {[...history]
                      .reverse()
                      .map((entry) => (
                        <li
                          key={entry.id}
                          className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/90 p-3 shadow-sm"
                        >
                          <span className="mt-0.5 text-primary">
                            <Clock className="h-4 w-4" />
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-foreground line-clamp-2">{entry.text}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
