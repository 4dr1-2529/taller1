"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type ChatMessage } from "@/services/api";

const ROOM_ID = "iep-huancayo-tutoria";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
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

export function ChatView() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getChatMessages(ROOM_ID);
      setMessages(res.items);
    } catch {
      /* API offline */
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
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const contenido = text.trim();
    if (!contenido || !isAuthenticated) return;
    setSending(true);
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
      <div className="glass-card rounded-2xl p-8 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-indigo-500" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          El chat interno requiere sesión activa (tutores, docentes, psicología).
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card flex h-[min(70vh,560px)] flex-col overflow-hidden rounded-2xl">
      <header className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-700">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
          <MessageCircle className="h-5 w-5 text-indigo-600" />
          Chat de tutoría — I.E.P. Huancayo
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Sala: {ROOM_ID} · Coordinación docente y alertas tempranas
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Sin mensajes. Inicie la conversación sobre un estudiante en riesgo.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase opacity-80">
                    {m.senderName} · {roleLabel(m.senderRole)}
                  </p>
                  <p className="mt-1">{m.contenido}</p>
                  <p className="mt-1 text-[10px] opacity-70">{formatTime(m.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => void handleSend(e)}
        className="flex gap-2 border-t border-slate-200/80 p-4 dark:border-slate-700"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escriba un mensaje para el equipo de tutoría…"
          maxLength={2000}
          className="flex-1 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900/50"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-500 disabled:opacity-50"
          aria-label="Enviar"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
