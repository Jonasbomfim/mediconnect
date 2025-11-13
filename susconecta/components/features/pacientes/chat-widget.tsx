"use client";

import { useMemo, useState } from "react";
import { Sparkles, MessageCircle, X, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const cannedSuggestions = [
  "Como remarcar minha consulta?",
  "Quais documentos preciso levar?",
  "Quero falar com suporte humano",
];

const supportAvailability = {
  title: "Equipe disponível",
  description: "Seg–Sex das 08h às 18h",
};

interface ChatMessage {
  id: string;
  author: "assistant" | "user";
  text: string;
  timestamp: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      author: "assistant",
      text: "Olá! Sou sua assistente virtual. Posso ajudar a acompanhar consultas, exames e suporte geral.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const toggle = () => setOpen((prev) => !prev);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    setMessages((prev) => [
      ...prev,
      { id: `user-${now}`, author: "user", text: trimmed, timestamp: now },
      {
        id: `assistant-${now}`,
        author: "assistant",
        text: "Recebi sua mensagem! Nossa equipe retornará em breve.",
        timestamp: now,
      },
    ]);
    setInput("");
  };

  const gradientRing = useMemo(
    () => (
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-sky-500 to-emerald-400 opacity-90 blur-sm transition group-hover:blur group-hover:opacity-100"
      />
    ),
    []
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 sm:bottom-8 sm:right-8">
      {open && (
        <div
          id="chat-widget"
          className="w-[min(22rem,90vw)] rounded-3xl border border-primary/20 bg-background shadow-[0_20px_60px_rgba(30,64,175,0.25)] ring-1 ring-primary/10"
        >
          <header className="flex items-start gap-3 rounded-t-3xl bg-gradient-to-r from-primary via-blue-600 to-emerald-500 px-5 py-4 text-primary-foreground">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Assistente RiseUp</p>
              <p className="text-xs text-white/80">Pronta para ajudar no que você precisar</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="rounded-full border border-white/20 p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-[22rem] overflow-y-auto px-5 py-4 space-y-3 text-sm">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.author === "assistant"
                    ? "flex items-start gap-3"
                    : "flex flex-row-reverse items-start gap-3"
                }
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.author === "assistant"
                      ? "bg-primary/10 text-primary"
                      : "bg-gradient-to-br from-primary/10 to-emerald-100 text-primary"
                  }`}
                >
                  {message.author === "assistant" ? <Sparkles className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                </span>
                <div
                  className={`rounded-2xl px-4 py-2 leading-relaxed shadow-sm ${
                    message.author === "assistant"
                      ? "bg-primary/5 text-muted-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-4">
            <div className="mb-3 text-xs text-muted-foreground/80">
              <p className="font-medium text-primary">{supportAvailability.title}</p>
              <p>{supportAvailability.description}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-3">
              {cannedSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="rounded-full border border-primary/20 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 shadow-inner">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Escreva sua mensagem"
                className="border-none px-0 text-sm focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                size="icon"
                className="rounded-full bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90"
                onClick={handleSend}
                aria-label="Enviar mensagem"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="chat-widget"
      >
        {gradientRing}
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-[0_12px_30px_rgba(37,99,235,0.25)] ring-1 ring-primary/10 transition group-hover:scale-[1.03] group-active:scale-95">
          <Sparkles className="h-7 w-7" />
        </span>
      </button>
    </div>
  );
}
