"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import { Clock, Info, Lock, MessageCircle, Plus, Upload } from "lucide-react";

const API_ENDPOINT = "https://n8n.jonasbomfim.store/webhook/cd7d10e6-bcfc-4f3a-b649-351d12b714f1";
const FALLBACK_RESPONSE = "Tive um problema para responder agora. Tente novamente em alguns instantes.";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  startedAt: string;
  updatedAt: string;
  topic: string;
  messages: ChatMessage[];
}

interface AIAssistantInterfaceProps {
  onOpenDocuments?: () => void;
  onOpenChat?: () => void;
  history?: ChatSession[];
  onAddHistory?: (session: ChatSession) => void;
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
  const [internalHistory, setInternalHistory] = useState<ChatSession[]>(externalHistory ?? []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [manualSelection, setManualSelection] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null); // arquivo PDF selecionado
  const history = internalHistory;
  const historyRef = useRef<ChatSession[]>(history);
  const baseGreeting = "Olá, eu sou Zoe. Como posso ajudar hoje?";
  const greetingWords = useMemo(() => baseGreeting.split(" "), [baseGreeting]);
  const [typedGreeting, setTypedGreeting] = useState("");
  const [typedIndex, setTypedIndex] = useState(0);
  const [isTypingGreeting, setIsTypingGreeting] = useState(true);

  const [gradientGreeting, plainGreeting] = useMemo(() => {
    if (!typedGreeting) return ["", ""] as const;
    const separatorIndex = typedGreeting.indexOf("Como");
    if (separatorIndex === -1) {
      return [typedGreeting, ""] as const;
    }
    const gradientPart = typedGreeting.slice(0, separatorIndex).trimEnd();
    const plainPart = typedGreeting.slice(separatorIndex).trimStart();
    return [gradientPart, plainPart] as const;
  }, [typedGreeting]);

  useEffect(() => {
    if (externalHistory) {
      setInternalHistory(externalHistory);
    }
  }, [externalHistory]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const activeSession = useMemo(
    () => history.find((session) => session.id === activeSessionId) ?? null,
    [history, activeSessionId]
  );

  const activeMessages = activeSession?.messages ?? [];

  const formatTime = useCallback(
    (value: string) =>
      new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const upsertSession = useCallback(
    (session: ChatSession) => {
      if (onAddHistory) {
        onAddHistory(session);
      } else {
        setInternalHistory((prev) => {
          const index = prev.findIndex((s) => s.id === session.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = session;
            return updated;
          }
          return [...prev, session];
        });
      }
      setActiveSessionId(session.id);
      setManualSelection(false);
    },
    [onAddHistory]
  );

  const sendMessageToAssistant = useCallback(
    async (prompt: string, baseSession: ChatSession) => {
      const sessionId = baseSession.id;

      const appendAssistantMessage = (content: string) => {
        const createdAt = new Date().toISOString();
        const assistantMessage: ChatMessage = {
          id: `msg-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sender: "assistant",
          content,
          createdAt,
        };

        const latestSession =
          historyRef.current.find((s) => s.id === sessionId) ?? baseSession;

        const updatedSession: ChatSession = {
          ...latestSession,
          updatedAt: createdAt,
          messages: [...latestSession.messages, assistantMessage],
        };

        upsertSession(updatedSession);
      };

      try {
        let replyText = "";
        let response: Response;

        if (pdfFile) {
          // Monta FormData conforme especificação: campos 'pdf' e 'message'
          const formData = new FormData();
            formData.append("pdf", pdfFile);
            formData.append("message", prompt);
          response = await fetch(API_ENDPOINT, {
            method: "POST",
            body: formData, // multipart/form-data gerenciado pelo browser
          });
        } else {
          response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: prompt }),
          });
        }

        const rawPayload = await response.text();

        if (rawPayload.trim()) {
          try {
            const parsed = JSON.parse(rawPayload) as { message?: unknown; reply?: unknown };
            if (typeof parsed.reply === "string") {
              replyText = parsed.reply.trim();
            } else if (typeof parsed.message === "string") {
              replyText = parsed.message.trim();
            }
          } catch (error) {
            console.error("[ZoeIA] Resposta JSON inválida", error, rawPayload);
          }
        }

        appendAssistantMessage(replyText || FALLBACK_RESPONSE);
      } catch (error) {
        console.error("[ZoeIA] Erro ao buscar resposta da API", error);
        appendAssistantMessage(FALLBACK_RESPONSE);
      }
    },
    [upsertSession, pdfFile]
  );

  const handleSendMessage = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    const now = new Date();
    const userMessage: ChatMessage = {
      id: `msg-user-${now.getTime()}`,
      sender: "user",
      content: trimmed,
      createdAt: now.toISOString(),
    };

    const session = history.find((s) => s.id === activeSessionId);
    const sessionToUse: ChatSession = session
      ? {
          ...session,
          updatedAt: userMessage.createdAt,
          messages: [...session.messages, userMessage],
        }
      : {
          id: `session-${now.getTime()}`,
          startedAt: now.toISOString(),
          updatedAt: userMessage.createdAt,
          topic: trimmed.length > 60 ? `${trimmed.slice(0, 57)}…` : trimmed,
          messages: [userMessage],
        };

    upsertSession(sessionToUse);
    setQuestion("");
    setHistoryPanelOpen(false);
    void sendMessageToAssistant(trimmed, sessionToUse);
  };

  const handleSelectPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
    // Permite re-selecionar o mesmo arquivo
    e.target.value = "";
  };

  const removePdf = () => setPdfFile(null);

  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4">
      {/* Área superior exibindo PDF selecionado */}
      {pdfFile && (
        <div className="flex items-center justify-between border rounded-lg p-3 bg-muted/50">
          <div className="flex items-center gap-3 min-w-0">
            <Upload className="w-5 h-5 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" title={pdfFile.name}>{pdfFile.name}</p>
              <p className="text-xs text-muted-foreground">
                PDF anexado • {(pdfFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={removePdf}>
            Remover
          </Button>
        </div>
      )}

      {/* Lista de mensagens */}
      <div
        ref={messageListRef}
        className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3 bg-background"
      >
        {activeMessages.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Envie uma pergunta.</p>
        )}
        {activeMessages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-xs text-sm whitespace-pre-wrap ${
                m.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {m.content}
              <div className="mt-1 text-[10px] opacity-70">
                {formatTime(m.createdAt)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input & ações */}
      <div className="flex items-center gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => pdfInputRef.current?.click()}
          >
            PDF
          </Button>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleSelectPdf}
          />
        </div>
        <Input
          placeholder="Digite sua pergunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button onClick={handleSendMessage} disabled={!question.trim()}>
          Enviar
        </Button>
      </div>
      <div className="text-xs text-muted-foreground">
        {pdfFile
          ? "A próxima mensagem será enviada junto ao PDF como multipart/form-data."
          : "Selecione um PDF para anexar ao próximo envio."}
      </div>
    </div>
  );
}
