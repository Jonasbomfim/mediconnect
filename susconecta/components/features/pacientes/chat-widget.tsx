

"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AIAssistantInterface,
  ChatSession,
} from "@/components/ZoeIA/ai-assistant-interface";
import { VoicePoweredOrb } from "@/components/ZoeIA/voice-powered-orb";

export function ChatWidget() {
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [realtimeOpen, setRealtimeOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);

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
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-sky-500 to-emerald-400 opacity-90 blur-sm transition group-hover:blur group-hover:opacity-100"
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
    setIsRecording(false);
    setVoiceDetected(false);
  };

  const toggleRecording = () => {
    setIsRecording((prev) => {
      const next = !prev;
      if (!next) {
        setVoiceDetected(false);
      }
      return next;
    });
  };

  const handleOpenDocuments = () => {
    console.log("[ChatWidget] Abrindo fluxo de documentos");
    closeAssistant();
  };

  const handleOpenChat = () => {
    console.log("[ChatWidget] Encaminhando para chat em tempo real");
    setAssistantOpen(false);
    openRealtime();
  };

  const handleUpsertHistory = (session: ChatSession) => {
    setHistory((previous) => {
      const index = previous.findIndex((item) => item.id === session.id);
      if (index >= 0) {
        const updated = [...previous];
        updated[index] = session;
        return updated;
      }
      return [...previous, session];
    });
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
              onAddHistory={handleUpsertHistory}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      )}

      {realtimeOpen && (
        <div
          id="ai-realtime-overlay"
          className="fixed inset-0 z-[110] flex flex-col bg-background"
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

          <div className="flex-1 overflow-auto">
            <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-10 text-center">
              <div className="relative w-full max-w-md aspect-square">
                <VoicePoweredOrb
                  enableVoiceControl={isRecording}
                  className="h-full w-full rounded-3xl shadow-2xl"
                  onVoiceDetected={setVoiceDetected}
                />
                {voiceDetected && (
                  <span className="absolute bottom-6 right-6 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                    Ouvindo…
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={toggleRecording}
                  size="lg"
                  className="px-8 py-3"
                  variant={isRecording ? "destructive" : "default"}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="mr-2 h-5 w-5" aria-hidden />
                      Parar captura de voz
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-5 w-5" aria-hidden />
                      Iniciar captura de voz
                    </>
                  )}
                </Button>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ative a captura para falar com a equipe em tempo real. Assim que sua voz for detectada, a Zoe sinaliza visualmente e encaminha o atendimento.
                </p>
              </div>
            </div>
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
