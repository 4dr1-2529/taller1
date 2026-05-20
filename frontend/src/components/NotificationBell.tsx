"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { api, type ApiNotification } from "@/services/api";

export function NotificationBell() {
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
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          void load();
        }}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
            Notificaciones
          </p>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">Sin notificaciones</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`border-b border-slate-50 px-4 py-3 text-sm dark:border-slate-800 ${
                    !n.leida ? "bg-indigo-50/50 dark:bg-indigo-950/30" : ""
                  }`}
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{n.titulo}</p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{n.mensaje}</p>
                  {!n.leida ? (
                    <button
                      type="button"
                      onClick={() => void markRead(n.id)}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      Marcar como leída
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
