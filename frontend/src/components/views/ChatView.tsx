"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Bot, Hash, MessageCircle, Send, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type ChatMessage } from "@/services/api";

const ROOM_ID = "iep-huancayo-tutoria";

const ROLE_COLORS: Record<string, string> = {
  admin: "from-violet-500 to-purple-600",
  docente: "from-cyan-500 to-blue-600",
  tutor: "from-emerald-500 to-teal-600",
  psicologo: "from-pink-500 to-rose-600",
  estudiante: "from-amber-500 to-orange-600",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administración",
    docente: "Docente",
    tutor: "Tutoría",
    psicologo: "Psicología",
    estudiante: "Estudiante",
  };
  return labels[role] ?? role;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-indigo-400"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
      <span className="text-xs text-[var(--text-muted)]">Escribiendo…</span>
    </div>
  );
}

export function ChatView() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getChatMessages(ROOM_ID);
      setMessages(res.items);
    } catch {
      /* offline */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
    if (!isAuthenticated) return;
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [isAuthenticated, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function handleTextChange(value: string) {
    setText(value);
    if (value.trim()) {
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 1200);
    } else {
      setIsTyping(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const contenido = text.trim();
    if (!contenido || !isAuthenticated) return;
    setSending(true);
    setIsTyping(false);
    try {
      const res = await api.sendChat(ROOM_ID, contenido);
      setMessages((prev) => [...prev, res.message]);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo enviar");
    } finally {
      setSending(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <motion.div className="premium-card flex flex-col items-center p-10 text-center">
        <MessageCircle className="mb-4 h-12 w-12 text-indigo-400" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Chat institucional</h3>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          Coordinación entre tutoría, docentes y psicología.
        </p>
        <Link href="/login" className="btn-primary mt-6">
          Iniciar sesión
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div className="chat-shell premium-card flex h-[min(78vh,640px)] flex-col overflow-hidden">
      <header className="chat-header flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/30">
            <Hash className="h-5 w-5 text-white" />
          </span>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Tutoría · I.E.P. Huancayo</h3>
            <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                En línea
              </span>
              · {ROOM_ID}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-info hidden sm:inline-flex">
            <Sparkles className="h-3 w-3" />
            IA activa
          </span>
          <span className="badge-success">
            <Users className="h-3 w-3" />
            Equipo
          </span>
        </div>
      </header>

      <div className="chat-messages flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot className="mb-3 h-10 w-10 text-[var(--text-muted)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Sin mensajes aún</p>
            <p className="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
              Coordine alertas de deserción con docentes y psicología.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const mine = m.senderId === user?.id;
              const showDate =
                idx === 0 ||
                formatDate(m.createdAt) !== formatDate(messages[idx - 1]?.createdAt ?? "");
              const grad = ROLE_COLORS[m.senderRole] ?? "from-slate-500 to-slate-600";

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {showDate ? (
                    <p className="chat-date-divider my-4 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                      {formatDate(m.createdAt)}
                    </p>
                  ) : null}
                  <div className={clsx("flex gap-2.5", mine ? "flex-row-reverse" : "flex-row")}>
                    {!mine ? (
                      <span
                        className={clsx(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white shadow-md",
                          grad,
                        )}
                        title={m.senderName}
                      >
                        {initials(m.senderName)}
                      </span>
                    ) : null}
                    <div className={clsx("max-w-[min(85%,420px)]", mine && "text-right")}>
                      <div
                        className={clsx(
                          "mb-1 flex flex-wrap items-center gap-2 text-[10px]",
                          mine && "justify-end",
                        )}
                      >
                        <span className="font-semibold text-[var(--text-primary)]">{m.senderName}</span>
                        <span className="badge-info py-0">{roleLabel(m.senderRole)}</span>
                        <span className="text-[var(--text-muted)]">{formatTime(m.createdAt)}</span>
                      </div>
                      <div
                        className={clsx(
                          "chat-bubble inline-block px-4 py-2.5 text-sm leading-relaxed shadow-md",
                          mine ? "chat-bubble-mine" : "chat-bubble-other",
                        )}
                      >
                        {m.contenido}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        {isTyping && text.trim() ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => void handleSend(e)}
        className="chat-composer flex gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface)]/60 p-4 backdrop-blur-md"
      >
        <input
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Escriba un mensaje para el equipo…"
          maxLength={2000}
          className="input-premium flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn-primary shrink-0 px-4"
          aria-label="Enviar"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </motion.div>
  );
}
