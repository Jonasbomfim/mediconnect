"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploadChat from "@/components/ui/file-upload-and-chat";

// 👉 AQUI você importa o fluxo correto de voz (já testado e funcionando)
import AIVoiceFlow from "@/components/ZoeIA/ai-voice-flow";

export function ChatWidget() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [realtimeOpen, setRealtimeOpen] = useState(false);

  useEffect(() => {
    if (!assistantOpen && !realtimeOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [assistantOpen, realtimeOpen]);

  const gradientRing = useMemo(
    () => (
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-linear-to-br from-primary via-sky-500 to-emerald-400 opacity-90 blur-sm transition group-hover:blur group-hover:opacity-100"
      />
    ),
    []
  );

  const openAssistant = () => setAssistantOpen(true);
  const closeAssistant = () => setAssistantOpen(false);

  const openRealtime = () => setRealtimeOpen(true);
  const closeRealtime = () => {
    setRealtimeOpen(false);
    setAssistantOpen(true);
  };

  return (
    <>
      {/* ----------------- ASSISTANT PANEL ----------------- */}
      {assistantOpen && (
        <div
          id="ai-assistant-overlay"
          className="fixed inset-0 z-100 flex flex-col bg-gray-50 dark:bg-slate-950 border-b border-border"
        >
          <div className="flex items-center justify-between border-b px-4 py-3 bg-slate-100 dark:bg-slate-900 border-gray-300 dark:border-slate-700 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-slate-900 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              onClick={closeAssistant}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="text-sm font-semibold">Voltar</span>
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            <FileUploadChat onOpenVoice={openRealtime} />
          </div>
        </div>
      )}

      {/* ----------------- REALTIME VOICE PANEL ----------------- */}
      {realtimeOpen && (
        <div
          id="ai-realtime-overlay"
          className="fixed inset-0 z-110 flex flex-col bg-background"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2"
              onClick={closeRealtime}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="text-sm">Voltar para a Zoe</span>
            </Button>
          </div>

          {/* 🔥 Aqui entra o AIVoiceFlow COMPLETO */}
          <div className="flex-1 overflow-auto flex items-center justify-center">
            <AIVoiceFlow />
          </div>
        </div>
      )}

      {/* ----------------- FLOATING BUTTON ----------------- */}
      <div className="fixed bottom-6 right-6 z-50 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={openAssistant}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
