import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" aria-label="Cargando login" />
    </div>
  );
}
