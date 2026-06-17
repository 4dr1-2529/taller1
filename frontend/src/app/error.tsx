"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center text-white">
        <h1 className="text-2xl font-semibold">Error inesperado</h1>
        <p className="max-w-md text-slate-400">Ocurrió un problema al cargar el panel.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800"
          >
            Inicio
          </Link>
        </div>
      </body>
    </html>
  );
}
