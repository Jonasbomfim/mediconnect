"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIAssistantInterface } from "@/components/ZoeIA/ai-assistant-interface";

interface HistoryEntry {
  id: string;
  text: string;
  createdAt: string;
}

export function ChatWidget() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!assistantOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [assistantOpen]);

  const gradientRing = useMemo(
    () => (
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-sky-500 to-emerald-400 opacity-90 blur-sm transition group-hover:blur group-hover:opacity-100"
      />
    ),
    []
  );

  const openAssistant = () => setAssistantOpen(true);
  const closeAssistant = () => setAssistantOpen(false);

  const handleOpenDocuments = () => {
    console.log("[ChatWidget] Abrindo fluxo de documentos");
    closeAssistant();
  };

  const handleOpenChat = () => {
    console.log("[ChatWidget] Encaminhando para chat humano");
    closeAssistant();
  };

  const handleAddHistory = (entry: HistoryEntry) => {
    setHistory((prev) => [...prev, entry]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <>
      {assistantOpen && (
        <div
          id="ai-assistant-overlay"
          className="fixed inset-0 z-[100] flex flex-col bg-background"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2"
              onClick={closeAssistant}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="text-sm">Voltar</span>
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <AIAssistantInterface
              onOpenDocuments={handleOpenDocuments}
              onOpenChat={handleOpenChat}
              history={history}
              onAddHistory={handleAddHistory}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={openAssistant}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-haspopup="dialog"
          aria-expanded={assistantOpen}
          aria-controls="ai-assistant-overlay"
        >
          {gradientRing}
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-[0_12px_30px_rgba(37,99,235,0.25)] ring-1 ring-primary/10 transition group-hover:scale-[1.03] group-active:scale-95">
            <Sparkles className="h-7 w-7" aria-hidden />
          </span>
        </button>
      </div>
    </>
  );
}
