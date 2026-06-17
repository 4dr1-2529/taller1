import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-white">Página no encontrada</h1>
      <p className="max-w-md text-slate-400">La ruta solicitada no existe en el panel.</p>
      <Link
        href="/"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
