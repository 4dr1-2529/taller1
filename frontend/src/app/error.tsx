"use client";

import Link from "next/link";

/**
 * Error boundary del segmento raíz.
 *
 * NO debe declarar `<html>` ni `<body>`: este componente envuelve `page.js`
 * *dentro* del root layout (`app/layout.tsx`), que ya los renderiza. Según la
 * convención de archivos de Next, solo `global-error.tsx` —que reemplaza al
 * root layout— debe definirlos. Ver `app/global-error.tsx`.
 */
export default function ErrorBoundary({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-center text-white">
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
    </section>
  );
}
