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
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: prompt }),
        });

        const rawPayload = await response.text();
        let replyText = "";

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
    [upsertSession]
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

  return <div>/* restante da interface (UI) omitida para focar na lógica */</div>;
}
