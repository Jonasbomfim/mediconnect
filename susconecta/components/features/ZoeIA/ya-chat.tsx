"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/ya-chat.css";

const API_ENDPOINT = "https://n8n.jonasbomfim.store/webhook/cd7d10e6-bcfc-4f3a-b649-351d12b714f1";
const FALLBACK_RESPONSE = "Tive um problema para responder agora. Tente novamente em alguns instantes.";

type MessageRole = "user" | "assistant";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export function YaChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const appendMessage = useCallback((message: Message) => {
    setMessages((previous) => [...previous, message]);
  }, []);

  const appendAssistantMessage = useCallback(
    (content: string) => {
      const createdAt = new Date().toISOString();
      appendMessage({
        id: `msg-assistant-${createdAt}`,
        role: "assistant",
        content: content || FALLBACK_RESPONSE,
        createdAt,
      });
    },
    [appendMessage]
  );

  const parseAssistantReply = useCallback((payload: string) => {
    if (!payload.trim()) return "";

    try {
      const parsed = JSON.parse(payload) as { reply?: unknown };
      return typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    } catch (error) {
      console.error("[YaChat] Resposta inválida recebida", error, payload);
      return "";
    }
  }, []);

  const sendMessageToAssistant = useCallback(
    async (prompt: string) => {
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
        const replyText = parseAssistantReply(rawPayload) || FALLBACK_RESPONSE;
        appendAssistantMessage(replyText);
      } catch (error) {
        console.error("[YaChat] Falha ao conversar com a API", error);
        appendAssistantMessage(FALLBACK_RESPONSE);
      }
    },
    [appendAssistantMessage, parseAssistantReply]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const createdAt = new Date().toISOString();
    appendMessage({
      id: `msg-user-${createdAt}`,
      role: "user",
      content: trimmed,
      createdAt,
    });

    setInput("");
    console.log("[YaChat] Mensagem enviada", trimmed);
    void sendMessageToAssistant(trimmed);
  };

  const formatTimestamp = (isoDate: string) =>
    new Date(isoDate).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const toggleVoice = () => {
    setIsListening((previous) => !previous);
  };

  return (
    <div className="ya-chat-wrapper">
      <header className="ya-chat-header">
        <div className="ya-chat-avatar">
          <span>Yá</span>
        </div>

        <div className="ya-chat-header-text">
          <p className="ya-chat-title">Assistente Clínico Yá</p>
          <p className="ya-chat-subtitle">
            Tire dúvidas, revise exames e organize sua jornada de cuidado.
          </p>
        </div>

        <button className="ya-chat-header-pill">Atendimento em andamento</button>
      </header>

      <div className="ya-chat-body">
        {messages.length === 0 && (
          <div className="ya-chat-empty">
            <p>Comece uma conversa com o Yá.</p>
            <p className="ya-chat-empty-hint">
              Pergunte sobre exames, consultas, horários, preparo e muito mais.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`ya-chat-message-row ${
              msg.role === "user" ? "ya-chat-row-user" : "ya-chat-row-assistant"
            }`}
          >
            {msg.role === "assistant" && <div className="ya-chat-badge-ya">Yá</div>}

            <div
              className={
                msg.role === "user"
                  ? "ya-chat-bubble ya-chat-bubble-user"
                  : "ya-chat-bubble ya-chat-bubble-assistant"
              }
            >
              <p>{msg.content}</p>
              <span className="ya-chat-time">{formatTimestamp(msg.createdAt)}</span>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form className="ya-chat-input-bar" onSubmit={handleSubmit}>
        <div className="ya-chat-input-wrapper">
          <input
            className="ya-chat-input"
            placeholder="Pergunte qualquer coisa para o Yá..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>

        <button type="submit" className="ya-chat-send-btn">
          Enviar
        </button>

        <button
          type="button"
          className={`ya-chat-voice-btn ${
            isListening ? "ya-chat-voice-btn-active" : ""
          }`}
          onClick={toggleVoice}
        >
          <span className="ya-chat-voice-pulse" />
          <span className="ya-chat-voice-icon" aria-hidden>
            🎙️
          </span>
          <span className="sr-only">
            {isListening ? "Desativar captura de voz" : "Ativar captura de voz"}
          </span>
        </button>
      </form>

      <footer className="ya-chat-footer">
        <p>
          As respostas do Yá são informativas e complementam a avaliação de um
          profissional de saúde qualificado. Em caso de urgência, procure
          atendimento médico imediato.
        </p>
      </footer>
    </div>
  );
}
