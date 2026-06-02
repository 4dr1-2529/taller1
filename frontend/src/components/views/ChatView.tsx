"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { Bot, Hash, MessageCircle, Send } from "lucide-react";
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
      <motion.div
        className="premium-card flex flex-col items-center p-10 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
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
    <motion.div
      className="chat-shell flex h-[min(82vh,720px)] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111214] shadow-2xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[#2b2d31]/80 px-5 py-3.5 backdrop-blur-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-500 shadow-lg shadow-purple-500/25">
          <Hash className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Tutoría · I.E.P. Huancayo
          </h3>
          <p className="text-[11px] text-[#b5bac1]">Sala única de coordinación institucional</p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent">
        {messages.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Bot className="h-8 w-8 text-[#6d6f78]" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Sin mensajes aún</p>
            <p className="mt-1.5 max-w-sm text-xs text-[var(--text-muted)]">
              Coordine alertas de deserción con docentes y psicología.
            </p>
          </motion.div>
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
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="group"
                >
                  {showDate ? (
                    <div className="my-5 flex items-center gap-3">
                      <div className="h-px flex-1 bg-white/10" />
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#6d6f78]">
                        {formatDate(m.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                  ) : null}

                  <div className={clsx("flex items-start gap-3 py-1", mine && "flex-row-reverse")}>
                    {/* Avatar */}
                    {!mine ? (
                      <div
                        className={clsx(
                          "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white shadow-md transition-transform hover:scale-105",
                          grad,
                        )}
                        title={m.senderName}
                      >
                        {initials(m.senderName)}
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0" />
                    )}

                    {/* Message Content */}
                    <div className={clsx("min-w-0 max-w-[min(80%,480px)]", mine && "flex flex-col items-end")}>
                      {/* Sender Info */}
                      <div className={clsx("mb-1 flex flex-wrap items-center gap-2 text-[11px]", mine && "flex-row-reverse")}>
                        <span className="font-semibold text-white">{m.senderName}</span>
                        <span
                          className={clsx(
                            "inline-flex items-center rounded-md bg-gradient-to-r px-1.5 py-0.5 text-[9px] font-semibold text-white",
                            grad,
                          )}
                        >
                          {roleLabel(m.senderRole)}
                        </span>
                        <span className="text-[10px] text-[#6d6f78]">{formatTime(m.createdAt)}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={clsx(
                          "relative inline-block rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-md transition-all hover:shadow-lg",
                          mine
                            ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md"
                            : "bg-[#2b2d31]/90 text-[#dbdee1] backdrop-blur-sm border border-white/5 rounded-bl-md",
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

        {isTyping && text.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => void handleSend(e)}
        className="shrink-0 border-t border-white/10 bg-[#2b2d31]/60 p-4 backdrop-blur-xl"
      >
        <div className="flex items-end gap-3">
          <div className="relative flex-1">
            <input
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Escriba un mensaje para el equipo…"
              maxLength={2000}
              className="w-full rounded-xl border border-white/10 bg-[#1e1f22]/80 px-4 py-3 text-[13px] text-white placeholder-[#6d6f78] outline-none transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#6d6f78]">
              {text.length}/2000
            </span>
          </div>
          <motion.button
            type="submit"
            disabled={sending || !text.trim()}
            whileHover={{ scale: text.trim() ? 1.05 : 1 }}
            whileTap={{ scale: text.trim() ? 0.95 : 1 }}
            className={clsx(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-lg transition-all",
              text.trim()
                ? "bg-gradient-to-br from-violet-600 to-purple-600 shadow-purple-500/25 hover:shadow-purple-500/40"
                : "cursor-not-allowed bg-[#3f4147] text-[#6d6f78]",
            )}
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
