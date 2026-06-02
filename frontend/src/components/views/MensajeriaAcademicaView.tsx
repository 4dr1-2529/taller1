"use client";

import { useCallback, useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type AcademicMessage, type MessageRoom } from "@/services/api";
import { PageSection } from "@/components/ui/PageSection";
import { SELECT_CLASS, INPUT_CLASS } from "@/lib/ui";

export function MensajeriaAcademicaView({ useApi = true }: { useApi?: boolean }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<MessageRoom[]>([]);
  const [roomId, setRoomId] = useState("");
  const [messages, setMessages] = useState<AcademicMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalText, setGlobalText] = useState("");

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.getMessageRooms();
      setRooms(res.rooms);
      if (res.rooms[0] && !roomId) setRoomId(res.rooms[0].roomId);
    } catch {
      setRooms([]);
    }
  }, [roomId]);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await api.getMessages(roomId);
      setMessages(res.items);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!roomId || !useApi) return;
    void api.markMessagesRead(roomId).catch(() => undefined);
  }, [roomId, useApi]);

  async function send() {
    if (!text.trim() || !roomId) return;
    const room = rooms.find((r) => r.roomId === roomId);
    try {
      await api.sendMessage({
        roomId,
        contenido: text.trim(),
        scope: room?.scope,
        recipientUserId: room?.scope === "directo" ? undefined : undefined,
      });
      setText("");
      void loadMessages();
      toast.success("Mensaje enviado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar");
    }
  }

  async function sendGlobal() {
    if (!globalText.trim() || user?.role !== "admin") return;
    try {
      await api.sendMessage({
        roomId: "global:institucional",
        contenido: globalText.trim(),
        scope: "global",
      });
      setGlobalText("");
      toast.success("Comunicado global publicado");
      setRoomId("global:institucional");
      void loadMessages();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function sendToTeachers() {
    if (!globalText.trim() || user?.role !== "admin") return;
    try {
      await api.sendMessage({
        roomId: "canal:profesores",
        contenido: globalText.trim(),
        scope: "profesores",
      });
      setGlobalText("");
      toast.success("Mensaje enviado a profesores");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  const canReply = user?.role === "estudiante" || user?.role === "docente" || user?.role === "admin";

  return (
    <PageSection
      icon={Mail}
      title="Mensajería Académica"
      description="Comunicados institucionales, avisos de curso y mensajes directos profesor–estudiante."
    >
      {user?.role === "admin" && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="premium-card rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Comunicado global</p>
            <textarea
              className={`${INPUT_CLASS} mt-2 min-h-[80px]`}
              value={globalText}
              onChange={(e) => setGlobalText(e.target.value)}
              placeholder="Mensaje para toda la comunidad educativa…"
            />
            <button type="button" className="btn-primary mt-2 text-sm" onClick={() => void sendGlobal()}>
              Publicar comunicado
            </button>
          </div>
          <div className="premium-card rounded-xl p-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Mensaje a profesores</p>
            <textarea
              className={`${INPUT_CLASS} mt-2 min-h-[80px]`}
              value={globalText}
              onChange={(e) => setGlobalText(e.target.value)}
              placeholder="Instrucciones o coordinación docente…"
            />
            <button type="button" className="btn-secondary mt-2 text-sm" onClick={() => void sendToTeachers()}>
              Enviar a profesores
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="premium-card rounded-xl p-4 lg:col-span-1">
          <label className="text-xs font-semibold uppercase text-[var(--text-muted)]">Conversación</label>
          <select className={`${SELECT_CLASS} mt-2 w-full`} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {rooms.map((r) => (
              <option key={r.roomId} value={r.roomId}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="premium-card flex min-h-[320px] flex-col rounded-xl p-4 lg:col-span-2">
          <div className="flex-1 space-y-3 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Cargando…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Sin mensajes en este canal.</p>
            ) : (
              messages.map((m) => (
                <article
                  key={m.id}
                  className={
                    m.remitente?.id === user?.id
                      ? "ml-8 rounded-xl bg-violet-500/15 p-3"
                      : "mr-8 rounded-xl bg-[var(--surface)]/60 p-3"
                  }
                >
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    {m.remitente?.nombre ?? "—"}{" "}
                    <span className="font-normal text-[var(--text-muted)]">
                      · {m.remitente?.rol ?? ""}
                      {!m.leida && m.remitente?.id !== user?.id ? " · No leído" : ""}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{m.contenido}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {new Date(m.fecha ?? m.createdAt ?? "").toLocaleString("es-PE")}
                  </p>
                </article>
              ))
            )}
          </div>
          {canReply && (
            <div className="mt-4 flex gap-2 border-t border-[var(--border-subtle)] pt-4">
              <input
                className={INPUT_CLASS}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={user?.role === "estudiante" ? "Responder al profesor…" : "Escribir mensaje…"}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
              />
              <button type="button" className="btn-primary shrink-0 px-4" onClick={() => void send()} aria-label="Enviar">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </PageSection>
  );
}
