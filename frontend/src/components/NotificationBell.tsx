"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type ApiNotification } from "@/services/api";

export function NotificationBell() {
  const reduced = useReducedMotion();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ApiNotification[]>([]);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getNotifications();
      setItems(res.items);
    } catch {
      setItems([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
    if (!isAuthenticated) return;
    const id = setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, [isAuthenticated, load]);

  const unread = items.filter((n) => !n.leida).length;

  if (!isAuthenticated) return null;

  async function markRead(id: string) {
    await api.markNotificationRead(id);
    void load();
  }

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          void load();
        }}
        whileHover={reduced ? undefined : { scale: 1.02 }}
        whileTap={reduced ? undefined : { scale: 0.98 }}
        className="header-icon relative"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              className="absolute right-0.5 top-0.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--brand-navy)] px-1 text-[10px] font-bold text-white "
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 cursor-default border-0 bg-transparent p-0"
              aria-label="Cerrar notificaciones"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="notification-panel"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-b border-[var(--border-subtle)] px-4 py-3">
                <p className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                  Notificaciones
                  {unread > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-[var(--accent-muted)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                      {unread}
                    </span>
                  )}
                </p>
              </div>

              <ul className="max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                  <li className="flex flex-col items-center gap-2 px-4 py-10 text-center text-xs text-[var(--text-muted)]">
                    <Bell className="h-5 w-5 opacity-40" />
                    Sin notificaciones
                  </li>
                ) : (
                  items.map((n) => (
                    <motion.li
                      key={n.id}
                      className={`group border-b border-[var(--border-subtle)] px-4 py-3 transition-colors hover:bg-white/[0.03] ${
                        !n.leida ? "bg-[var(--surface-muted)]" : ""
                      }`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[var(--text-primary)]">{n.titulo}</p>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">{n.mensaje}</p>
                        </div>
                        {!n.leida && (
                          <motion.button
                            type="button"
                            onClick={() => void markRead(n.id)}
                            whileHover={reduced ? undefined : { scale: 1.02 }}
                            whileTap={reduced ? undefined : { scale: 0.98 }}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--accent)] hover:bg-[var(--accent-muted)]"
                            aria-label="Marcar como leída"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.li>
                  ))
                )}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
