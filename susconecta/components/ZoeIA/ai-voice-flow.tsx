"use client";

import React, { useRef, useState } from "react";
import { VoicePoweredOrb } from "@/components/ZoeIA/voice-powered-orb";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";


// ⚠ Coloque aqui o webhook real do seu n8n
const N8N_WEBHOOK_URL = "https://n8n.jonasbomfim.store/webhook/zoe2";

const AIVoiceFlow: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [voiceDetected, setVoiceDetected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [replyAudioUrl, setReplyAudioUrl] = useState<string | null>(null); // URL do áudio retornado
  const [replyAudio, setReplyAudio] = useState<HTMLAudioElement | null>(null); // elemento de áudio reproduzido

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // 🚀 Inicia gravação
  const startRecording = async () => {
    try {
      setError(null);
      setStatus("Iniciando microfone...");
      
      // Se estava reproduzindo áudio da IA → parar imediatamente
      if (replyAudio) {
        replyAudio.pause();
        replyAudio.currentTime = 0;
      }
      setReplyAudio(null);
      setReplyAudioUrl(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setStatus("Processando áudio...");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await sendToN8N(blob);
        chunksRef.current = [];
      };

      recorder.start();
      setIsRecording(true);
      setStatus("Gravando... fale algo.");
    } catch (err) {
      console.error(err);
      setError("Erro ao acessar microfone.");
    }
  };

  // ⏹ Finaliza gravação
  const stopRecording = () => {
    try {
      setIsRecording(false);
      setStatus("Finalizando gravação...");

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao parar gravação.");
    }
  };

  // 📤 Envia áudio ao N8N e recebe o MP3
  const sendToN8N = async (audioBlob: Blob) => {
    try {
      setIsSending(true);
      setStatus("Enviando áudio para IA...");

      const formData = new FormData();
      formData.append("audio", audioBlob, "voz.webm");

      const resp = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        throw new Error("N8N retornou erro");
      }

      const replyBlob = await resp.blob();

      // gera url local
      const url = URL.createObjectURL(replyBlob);
      setReplyAudioUrl(url);

      const audio = new Audio(url);
      setReplyAudio(audio);

      setStatus("Reproduzindo resposta...");
      audio.play().catch(() => {});

    } catch (err) {
      console.error(err);
      setError("Erro ao enviar/receber áudio.");
    } finally {
      setIsSending(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6">

      {/* ORB — agora com comportamento inteligente */}
      <div className="w-72 h-72 relative">
        <VoicePoweredOrb
          className="w-full h-full"

          /* 🔥 LÓGICA DO ORB: 
             - Gravando?       → usa microfone
             - Não gravando, mas tem MP3? → usa áudio da IA
             - Caso contrário → parado (none)
          */
          {...({ sourceMode:
            isRecording
              ? "microphone"
              : replyAudio
                ? "playback"
                : "none"
          } as any)}

          audioElement={replyAudio}
          onVoiceDetected={setVoiceDetected}
        />

        {isRecording && (
          <span className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg">
            {voiceDetected ? "Ouvindo…" : "Aguardando voz…"}
          </span>
        )}
      </div>

      {/* 🟣 Botão de gravação */}
      <Button
        onClick={toggleRecording}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
        disabled={isSending}
      >
        {isRecording ? (
          <>
            <MicOff className="w-5 h-5 mr-2" /> Parar gravação
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" /> Começar gravação
          </>
        )}
      </Button>

      {/* STATUS */}
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* PLAYER MANUAL DA RESPOSTA */}
      {replyAudioUrl && (
        <div className="w-full max-w-md mt-2 flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">Última resposta da IA:</span>
          <audio controls src={replyAudioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default AIVoiceFlow;
