"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import { Clock, Mic, Plus } from "lucide-react";

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
  const messageListRef = useRef<HTMLDivElement | null>(null);
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

    if (!activeSessionId && !manualSelection) {
      setActiveSessionId(history[history.length - 1].id);
      return;
    }

    const exists = history.some((session) => session.id === activeSessionId);
    if (!exists && !manualSelection) {
      setActiveSessionId(history[history.length - 1].id);
    }
  }, [history, activeSessionId, manualSelection]);

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeMessages.length]);

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

  const VoiceTriggerButton = () => (
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
      className={`group relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/50 bg-muted text-primary transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-primary/15 ${
        isListening ? "shadow-[0_0_0_6px_rgba(79,70,229,0.18)]" : "shadow-sm"
      }`}
      aria-label="Abrir chat em tempo real com voz"
    >
      <span
        className={`absolute inset-0 rounded-full bg-primary/20 transition duration-300 ${
          isListening ? "opacity-100" : "opacity-0 group-hover:opacity-80 group-focus-visible:opacity-80"
        }`}
        aria-hidden
      />
      {isListening && (
        <span className="absolute -inset-2 rounded-full border border-primary/40 opacity-80 blur-[1px]" aria-hidden />
      )}
      <Mic className={`relative h-5 w-5 ${isListening ? "animate-pulse" : ""}`} aria-hidden />
    </button>
  );

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
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <div className="shrink-0">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                onClick={() => setHistoryPanelOpen(true)}
              >
                <Clock className="h-4 w-4" aria-hidden />
                Histórico
              </Button>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-sm font-semibold text-primary-foreground shadow-sm dark:via-primary/70 dark:to-primary/80">
                Zoe
              </span>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Assistente Zoe</p>
                <motion.h1
                  key={typedGreeting}
                  className="text-xl font-semibold sm:text-2xl"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {gradientGreeting && (
                    <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent dark:from-primary/70 dark:to-primary/40">
                      {gradientGreeting}
                      {plainGreeting ? " " : ""}
                    </span>
                  )}
                  {plainGreeting && <span>{plainGreeting}</span>}
                  <span
                    className={`ml-1 inline-block h-5 w-[0.12rem] align-middle ${
                      isTypingGreeting ? "animate-pulse bg-primary" : "bg-transparent"
                    }`}
                  />
                </motion.h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                  onClick={startNewConversation}
                >
                  Nova conversa
                </Button>
              )}
              <SimpleThemeToggle />
            </div>
          </div>
          <div className="px-4 pb-4 sm:px-6">
            <p className="text-lg font-semibold">Olá, eu sou Zoe.</p>
            <p className="text-sm text-muted-foreground">Como posso ajudar você hoje?</p>
          </div>
        </motion.header>
        </div>

        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex-1 overflow-hidden"
        >
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto px-6 py-4 pb-28"
          >
            <div className="max-w-4xl w-full mx-auto">
              {activeMessages.length > 0 ? (
                activeMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.25 }}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[78%] items-end gap-3 ${
                        message.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {message.sender === "user" ? "Você" : "Zoe"}
                      </span>
                      <div
                        className={`w-full rounded-[18px] px-5 py-4 text-sm leading-relaxed shadow-sm transition ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/80 text-foreground"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        <span
                          className={`mt-2 block text-[0.68rem] uppercase tracking-[0.18em] ${
                            message.sender === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
                  <p className="text-sm font-medium text-foreground">Envie sua primeira mensagem</p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Compartilhe uma dúvida ou descreva uma orientação. A Zoe registra o pedido e organiza a resposta para você.
                  </p>
                </div>
              )}

              {isAssistantTyping && (
                <motion.div
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                >
                  <div className="flex max-w-[60%] items-end gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      Zoe
                    </span>
                    <div className="rounded-[18px] border border-border/60 bg-card/90 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 animate-bounce rounded-full bg-primary" />
                        <span
                          className="inline-flex h-2 w-2 animate-bounce rounded-full bg-primary"
                          style={{ animationDelay: "0.18s" }}
                        />
                        <span
                          className="inline-flex h-2 w-2 animate-bounce rounded-full bg-primary"
                          style={{ animationDelay: "0.32s" }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.main>

        <div className="fixed left-0 right-0 bottom-0 z-50">
          <div className="max-w-4xl w-full mx-auto">
            <div className="border-t bg-background p-4">
              <div className="flex items-center gap-2 rounded-[26px] border border-border/60 bg-card/80 p-2 shadow-[0_18px_35px_rgba(15,23,42,0.18)] sm:p-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full border border-border/60 text-muted-foreground transition hover:text-primary"
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
                placeholder="Escreva sua mensagem"
                className="h-11 flex-1 rounded-full border-0 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <div className="flex items-center gap-2 sm:gap-3">
                <Button
                  type="button"
                  className="rounded-full bg-gradient-to-r from-primary via-primary to-primary/70 px-5 text-primary-foreground shadow-[0_14px_35px_rgba(79,70,229,0.35)] transition hover:scale-[1.01]"
                  onClick={handleSendMessage}
                  disabled={!question.trim()}
                >
                  Enviar
                </Button>
                <VoiceTriggerButton />
              </div>
              </div>
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
              className="fixed inset-y-0 right-0 z-[160] w-[min(22rem,80vw)] border-l border-border/60 bg-card/95 shadow-[0_-20px_60px_rgba(15,23,42,0.16)] backdrop-blur-md"
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
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

                <div className="border-b border-border/60 px-4 py-3">
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
                                <p className="font-semibold text-foreground line-clamp-2">{session.topic}</p>
                                <span className="text-xs text-muted-foreground">{formatDateTime(session.updatedAt)}</span>
                              </div>
                              {lastMessage && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
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
                  <div className="border-t border-border/60 px-4 py-3">
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
          <style jsx>{`
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      );
    }
