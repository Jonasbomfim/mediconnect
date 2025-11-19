"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import { Clock, Mic, Plus, HeartPulse } from "lucide-react";

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
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messageListRef = useRef<HTMLElement | null>(null);
  const voiceTimeoutRef = useRef<number>();
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

  const formatDateTime = useCallback(
    (value: string) =>
      new Date(value).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  const formatTime = useCallback(
    (value: string) =>
      new Date(value).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  useEffect(() => {
    if (history.length === 0) {
      setActiveSessionId(null);
      setManualSelection(false);
      return;
    }

    // Não reabrir automaticamente a última conversa ao montar/atualizar o histórico.
    // Apenas garantir que o id ativo ainda existe. Caso contrário, limpar seleção.
    if (activeSessionId) {
      const exists = history.some((session) => session.id === activeSessionId);
      if (!exists) {
        setActiveSessionId(null);
      }
    }
  }, [history, activeSessionId]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeMessages.length]);

  // always allow scrolling; auto-scroll handled on message updates

  // removed scroll-lock logic to always allow natural scrolling inside the chat main

  // header stays fixed; messages area will scroll independently

  useEffect(() => {
    setTypedGreeting("");
    setTypedIndex(0);
    setIsTypingGreeting(true);
  }, []);

  useEffect(() => {
    if (!isTypingGreeting) return;
    if (typedIndex >= greetingWords.length) {
      setIsTypingGreeting(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setTypedGreeting((previous) =>
        previous
          ? `${previous} ${greetingWords[typedIndex]}`
          : greetingWords[typedIndex]
      );
      setTypedIndex((previous) => previous + 1);
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [greetingWords, isTypingGreeting, typedIndex]);

  const buildSessionTopic = useCallback((content: string) => {
    const normalized = content.trim();
    if (!normalized) return "Atendimento";
    return normalized.length > 60 ? `${normalized.slice(0, 57)}…` : normalized;
  }, []);

  const upsertSession = useCallback(
    (session: ChatSession) => {
      if (onAddHistory) {
        onAddHistory(session);
      } else {
        setInternalHistory((previous) => {
          const index = previous.findIndex((item) => item.id === session.id);
          if (index >= 0) {
            const updated = [...previous];
            updated[index] = session;
            return updated;
          }
          return [...previous, session];
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
        const latestSession =
          historyRef.current.find((session) => session.id === sessionId) ?? baseSession;
        const assistantMessage: ChatMessage = {
          id: `msg-assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sender: "assistant",
          content,
          createdAt,
        };

        const updatedSession: ChatSession = {
          ...latestSession,
          updatedAt: assistantMessage.createdAt,
          messages: [...latestSession.messages, assistantMessage],
        };

        upsertSession(updatedSession);
        setIsAssistantTyping(false);
      };

      try {
        setIsAssistantTyping(true);
        const response = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: prompt }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawPayload = await response.text();
        let replyText = "";

        if (rawPayload.trim().length > 0) {
          try {
            const parsed = JSON.parse(rawPayload) as { reply?: unknown };
            replyText = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
          } catch (parseError) {
            console.error("[ZoeIA] Resposta JSON inválida", parseError, rawPayload);
          }
        }

        appendAssistantMessage(replyText || FALLBACK_RESPONSE);
      } catch (error) {
        console.error("[ZoeIA] Falha ao obter resposta da API", error);
        appendAssistantMessage(FALLBACK_RESPONSE);
      } finally {
        setIsAssistantTyping(false);
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

    const existingSession = history.find((session) => session.id === activeSessionId) ?? null;

    const sessionToPersist: ChatSession = existingSession
      ? {
          ...existingSession,
          updatedAt: userMessage.createdAt,
          topic:
            existingSession.messages.length === 0
              ? buildSessionTopic(trimmed)
              : existingSession.topic,
          messages: [...existingSession.messages, userMessage],
        }
      : {
          id: `session-${now.getTime()}`,
          startedAt: now.toISOString(),
          updatedAt: userMessage.createdAt,
          topic: buildSessionTopic(trimmed),
          messages: [userMessage],
        };

    upsertSession(sessionToPersist);
    console.log("[ZoeIA] Mensagem registrada na Zoe", trimmed);
    setQuestion("");
    setHistoryPanelOpen(false);

    // after sending, auto-scroll will run via effect

    void sendMessageToAssistant(trimmed, sessionToPersist);
  };

  const handleOpenDocuments = () => {
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

  const handleClearHistory = () => {
    if (onClearHistory) {
      onClearHistory();
    } else {
      setInternalHistory([]);
    }
    setActiveSessionId(null);
    setManualSelection(false);
    setQuestion("");
    setHistoryPanelOpen(false);
  };

  const handleSelectSession = useCallback((sessionId: string) => {
    setManualSelection(true);
    setActiveSessionId(sessionId);
    setHistoryPanelOpen(false);
  }, []);

  const startNewConversation = useCallback(() => {
    setManualSelection(true);
    setActiveSessionId(null);
    setQuestion("");
    setHistoryPanelOpen(false);
  }, []);

  const messageVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        window.clearTimeout(voiceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen w-full flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md shadow-sm dark:border-slate-800 dark:bg-slate-950/70"
      >
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow">
              <HeartPulse className="h-4 w-4" aria-hidden />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Zoe</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Assistente clínica digital</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-slate-200/80 px-3 py-1.5 text-slate-600 transition hover:text-blue-600 dark:border-slate-800 dark:text-slate-200"
              onClick={() => setHistoryPanelOpen(true)}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              Histórico
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border border-blue-500/60 px-4 py-1.5 text-blue-600 dark:text-blue-400"
              onClick={startNewConversation}
            >
              Nova conversa
            </Button>
            <SimpleThemeToggle />
          </div>
        </div>
      </motion.header>

      <div className="flex-1 overflow-hidden">
        <motion.main
          ref={messageListRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.2 }}
          className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col px-4"
        >
          <div className="flex-1 space-y-6 overflow-y-auto pb-36 pt-6">
            {activeMessages.length > 0 ? (
              activeMessages.map((message) => (
                <motion.div
                  key={message.id}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.sender === "assistant" ? (
                    <div className="flex max-w-[90%] items-start gap-3">
                      <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                        <HeartPulse className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="flex flex-1 flex-col gap-2 rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 text-sm leading-relaxed shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                        <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-100">{message.content}</p>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">{formatTime(message.createdAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-[85%] flex-col gap-2 rounded-3xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-sm leading-relaxed text-white shadow-sm">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <span className="text-[11px] font-medium text-blue-100">{formatTime(message.createdAt)}</span>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <motion.div
                  initial={{ opacity: 0.9, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white/90 p-6 text-center shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white">
                    <HeartPulse className="h-5 w-5" aria-hidden />
                  </span>
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Pronto para ajudar</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Descreva sua dúvida clínica ou exame e receba orientações instantâneas.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 rounded-full bg-blue-600 text-white hover:bg-blue-500"
                    onClick={() => {
                      const sample = "Preciso de ajuda com meus exames.";
                      setQuestion(sample);
                    }}
                  >
                    Sugerir mensagem
                  </Button>
                </motion.div>
              </div>
            )}

            {isAssistantTyping && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.18 }}
                className="flex justify-start"
              >
                <div className="flex max-w-[70%] items-center gap-2 rounded-3xl border border-slate-200 bg-white/90 px-5 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
                  <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-blue-600" />
                  <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: "0.18s" }} />
                  <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: "0.32s" }} />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Zoe digitando</span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4">
        <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full border border-slate-200/80 text-slate-500 transition hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
              onClick={handleOpenDocuments}
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
              placeholder="Faça uma pergunta para a Zoe..."
              className="h-12 flex-1 border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => {
                setIsListening(true);
                handleOpenRealtimeChat();
                if (voiceTimeoutRef.current) {
                  window.clearTimeout(voiceTimeoutRef.current);
                }
                voiceTimeoutRef.current = window.setTimeout(() => setIsListening(false), 1300);
              }}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:border-slate-700 dark:text-slate-300 ${
                isListening ? "shadow-[0_0_18px_rgba(37,99,235,0.35)] text-blue-600" : ""
              }`}
              aria-label="Abrir chat em tempo real com voz"
            >
              {isListening && <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" aria-hidden />}
              <Mic className="relative h-4 w-4" aria-hidden />
            </button>
            <Button
              type="button"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500 disabled:opacity-60"
              onClick={handleSendMessage}
              disabled={!question.trim()}
            >
              Enviar
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {historyPanelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[150] bg-background/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setHistoryPanelOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-[160] w-[320px] max-w-[100vw] rounded-l-2xl border-l border-border/40 bg-card/95 shadow-[0_8px_24px_rgba(2,6,23,0.12)] backdrop-blur-md"
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border/40 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-sm font-semibold text-primary-foreground shadow-sm dark:via-primary/70 dark:to-primary/80">
                      Zoe
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold">Históricos de atendimento</h2>
                      <p className="text-xs text-muted-foreground">{history.length} registro{history.length === 1 ? "" : "s"}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground transition hover:text-primary"
                    onClick={() => setHistoryPanelOpen(false)}
                  >
                    <span aria-hidden>×</span>
                    <span className="sr-only">Fechar históricos</span>
                  </Button>
                </div>

                <div className="border-b border-border/40 px-4 py-3">
                  <Button
                    type="button"
                    className="w-full justify-start gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-[0_14px_32px_rgba(79,70,229,0.28)] transition hover:scale-[1.01]"
                    onClick={startNewConversation}
                  >
                    <Plus className="h-4 w-4" />
                    Nova conversa
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum atendimento registrado ainda. Envie uma mensagem para começar um acompanhamento.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3 text-sm">
                      {[...history].reverse().map((session) => {
                        const lastMessage = session.messages[session.messages.length - 1];
                        const isActive = session.id === activeSessionId;
                        return (
                          <li key={session.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectSession(session.id)}
                              className={`flex w-full flex-col gap-2 rounded-xl border px-3 py-3 text-left shadow-sm transition hover:border-primary hover:shadow-md ${
                                isActive ? "border-primary/50 bg-primary/10" : "border-border/60 bg-card/80"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="line-clamp-2 font-semibold text-foreground">{session.topic}</p>
                                <span className="text-xs text-muted-foreground">{formatDateTime(session.updatedAt)}</span>
                              </div>
                              {lastMessage && (
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {lastMessage.sender === "assistant" ? "Zoe: " : "Você: "}
                                  {lastMessage.content}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {session.messages.length} mensagem{session.messages.length === 1 ? "" : "s"}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="border-t border-border/40 px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center text-xs font-medium text-muted-foreground transition hover:text-destructive"
                      onClick={handleClearHistory}
                    >
                      Limpar todo o histórico
                    </Button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
