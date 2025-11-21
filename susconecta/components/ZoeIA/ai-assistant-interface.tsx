"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleThemeToggle } from "@/components/ui/simple-theme-toggle";
import { useToast } from "@/hooks/use-toast";
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
  onOpenDocuments?: (files?: FileList) => void;
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
  const { toast } = useToast();
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const handleOpenDocuments = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }
    if (onOpenDocuments) {
      onOpenDocuments();
      return;
    }
    console.log("[ZoeIA] Abrir fluxo de documentos");
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }

    const pdfFiles = Array.from(files).filter((file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      toast({
        title: "Formato inválido",
        description: "Envie apenas documentos em PDF.",
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    if (onOpenDocuments) {
      const dataTransfer = new DataTransfer();
      pdfFiles.forEach((file) => dataTransfer.items.add(file));
      onOpenDocuments(dataTransfer.files);
    } else {
      pdfFiles.forEach((file) =>
        sendUserMessage(`PDF anexado: ${file.name}`, {
          triggerAssistant: false,
        })
      );
    }

    toast({
      title: pdfFiles.length > 1 ? "PDFs anexados" : "PDF anexado",
      description:
        pdfFiles.length > 1
          ? `${pdfFiles.length} arquivos prontos para a Zoe analisar.`
          : `${pdfFiles[0].name} pronto para a Zoe analisar.`,
    });

    event.target.value = "";
  };
  const handleOpenRealtimeChat = () => {
    if (onOpenChat) {
      onOpenChat();
      return;
    }
    console.log("[ZoeIA] Abrir chat em tempo real");
  };

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
      };

      try {
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
      }
    },
    [upsertSession]
  );

  const sendUserMessage = useCallback(
    (content: string, options?: { triggerAssistant?: boolean }) => {
      const trimmed = content.trim();
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

      if (options?.triggerAssistant === false) {
        return;
      }

      void sendMessageToAssistant(trimmed, sessionToPersist);
    },
    [activeSessionId, buildSessionTopic, history, sendMessageToAssistant, upsertSession]
  );

  const handleSendMessage = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    sendUserMessage(trimmed);
    setQuestion("");
    setHistoryPanelOpen(false);
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-12">
        <motion.section
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/15 via-background to-background/95 p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-indigo-500 to-sky-500 text-base font-semibold text-white shadow-lg">
                  Zoe
                </span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/80">
                    Assistente Clínica Zoe
                  </p>
                  <motion.h1
                    key={typedGreeting}
                    className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {gradientGreeting && (
                      <span className="bg-gradient-to-r from-sky-400 via-primary to-indigo-500 bg-clip-text text-transparent">
                        {gradientGreeting}
                        {plainGreeting ? " " : ""}
                      </span>
                    )}
                    {plainGreeting && <span className="text-foreground">{plainGreeting}</span>}
                    <span
                      className={`ml-1 inline-block h-6 w-[0.12rem] align-middle ${
                        isTypingGreeting ? "animate-pulse bg-primary" : "bg-transparent"
                      }`}
                    />
                  </motion.h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 sm:justify-end">
                {history.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary transition hover:bg-primary/10"
                    onClick={() => setHistoryPanelOpen(true)}
                  >
                    Ver históricos
                  </Button>
                )}
                {history.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-destructive"
                    onClick={handleClearHistory}
                  >
                    Limpar histórico
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm transition hover:bg-primary/10"
                  onClick={startNewConversation}
                >
                  Novo atendimento
                </Button>
                <SimpleThemeToggle />
              </div>
            </div>
            <motion.p
              className="max-w-2xl text-sm text-muted-foreground"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Organizamos exames, orientações e tarefas assistenciais em um painel único para acelerar decisões clínicas. Utilize a Zoe para revisar resultados, registrar percepções e alinhar próximos passos com a equipe de saúde.
            </motion.p>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary shadow-sm"
        >
          <Lock className="h-4 w-4" />
          <span>Suas informações permanecem criptografadas e seguras com a equipe Zoe.</span>
        </motion.div>

        <motion.section
          className="space-y-6 rounded-3xl border border-primary/15 bg-card/70 p-6 shadow-lg backdrop-blur"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-background/50 to-background p-6 text-sm leading-relaxed text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <div className="mb-4 flex items-center gap-3 text-primary">
              <Info className="h-5 w-5" />
              <span className="text-base font-semibold">Informativo importante</span>
            </div>
            <p>
              A Zoe acompanha toda a jornada clínica, consolida exames e registra orientações para que você tenha clareza em cada etapa do cuidado.
              As respostas são informativas e complementam a avaliação de um profissional de saúde qualificado.
            </p>
            <p className="mt-4 font-medium text-foreground">
              Em situações de urgência, entre em contato com a equipe médica presencial ou acione os serviços de emergência da sua região.
            </p>
          </motion.div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={handleOpenDocuments}
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
        </motion.section>

        <motion.section
          className="flex flex-col gap-5 rounded-3xl border border-primary/10 bg-card/70 p-6 shadow-lg backdrop-blur"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {activeSession ? "Atendimento em andamento" : "Inicie uma conversa"}
              </p>
              <p className="text-sm font-semibold text-foreground sm:text-base">
                {activeSession?.topic ?? "O primeiro contato orienta nossas recomendações clínicas"}
              </p>
            </div>
            {activeSession && (
              <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-inner sm:mt-0">
                Atualizado às {formatTime(activeSession.updatedAt)}
              </span>
            )}
          </div>

          <div
            ref={messageListRef}
            className="flex max-h-[45vh] min-h-[220px] flex-col gap-3 overflow-y-auto rounded-2xl border border-border/40 bg-background/70 p-4"
          >
            {activeMessages.length > 0 ? (
              activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/60 bg-background text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    <span
                      className={`mt-2 block text-[0.68rem] uppercase tracking-[0.18em] ${
                        message.sender === "user"
                          ? "text-primary-foreground/75"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-background/80 px-6 py-12 text-center text-sm text-muted-foreground">
                <p className="text-sm font-medium text-foreground">Envie sua primeira mensagem</p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Compartilhe uma dúvida, exame ou orientação que deseja revisar. A Zoe registra o pedido e te retorna com um resumo organizado para a equipe de saúde.
                </p>
              </div>
            )}
          </div>
        </motion.section>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col gap-3 rounded-3xl border border-border bg-card/70 px-4 py-3 shadow-xl sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full border border-border/40 bg-background/60 text-muted-foreground transition hover:text-primary"
              onClick={handleOpenDocuments}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
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
            className="w-full flex-1 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center justify-end gap-2">
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

      </div>

      {historyPanelOpen && (
        <aside className="fixed inset-y-0 right-0 z-[160] w-[min(22rem,80vw)] border-l border-border bg-card shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-sky-500 to-emerald-400 text-sm font-semibold text-white shadow-md">
                  Zoe
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Históricos de atendimento</h2>
                  <p className="text-xs text-muted-foreground">{history.length} registro{history.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setHistoryPanelOpen(false)}
              >
                <span aria-hidden>×</span>
                <span className="sr-only">Fechar históricos</span>
              </Button>
            </div>
            <div className="border-b border-border px-4 py-3">
              <Button
                type="button"
                className="w-full justify-start gap-2 rounded-xl bg-primary text-primary-foreground shadow-md transition hover:shadow-lg"
                onClick={startNewConversation}
              >
                <Plus className="h-4 w-4" />
                Novo atendimento
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
                            isActive ? "border-primary/60 bg-primary/10" : "border-border/60 bg-background/90"
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
              <div className="border-t border-border px-4 py-3">
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
        </aside>
      )}
    </div>
  );
}
