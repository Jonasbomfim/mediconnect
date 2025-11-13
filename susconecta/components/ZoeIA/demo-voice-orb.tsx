"use client";

import { useEffect, useState } from "react";
import { VoicePoweredOrb } from "@/components/ZoeIA/voice-powered-orb";
import { AIAssistantInterface } from "@/components/ZoeIA/ai-assistant-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff } from "lucide-react";

export default function VoicePoweredOrbPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    if (!assistantOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [assistantOpen]);

  const openAssistant = () => setAssistantOpen(true);
  const closeAssistant = () => setAssistantOpen(false);

  return (
    <div className="min-h-screen d flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-8">
        {assistantOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                className="flex items-center gap-2"
                onClick={closeAssistant}
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            <div className="flex-1 overflow-auto">
              <AIAssistantInterface />
            </div>
          </div>
        )}

        {/* Orb */}
        <div
          className="w-96 h-96 relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          role="button"
          tabIndex={0}
          aria-label="Abrir assistente virtual"
          onClick={openAssistant}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openAssistant();
            }
          }}
        >
          <VoicePoweredOrb
            enableVoiceControl={isRecording}
            className="rounded-xl overflow-hidden shadow-2xl"
            onVoiceDetected={setVoiceDetected}
          />
          {voiceDetected && (
            <span className="absolute bottom-4 right-4 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
              Ouvindo…
            </span>
          )}
        </div>

        {/* Control Button */}
        <Button
          onClick={toggleRecording}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="px-8 py-3"
        >
          {isRecording ? (
            <>
              <MicOff className="w-5 h-5 mr-3" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5 mr-3" />
              Start Recording
            </>
          )}
        </Button>

        {/* Simple Instructions */}
        <p className="text-muted-foreground text-center max-w-md">
          Click the button to enable voice control. Speak to see the orb respond to your voice with subtle movements.
        </p>
      </div>
    </div>
  );
}
