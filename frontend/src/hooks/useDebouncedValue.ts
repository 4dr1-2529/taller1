"use client";

import { useEffect, useState } from "react";

/**
 * Retrasa la propagación de un valor. Se usa sólo en búsquedas TEXTUALES que
 * consultan al backend, para no disparar una petición por tecla
 * (los selects/filtros siguen reaccionando de inmediato).
 */
export function useDebouncedValue<T>(value: T, delayMs = 320): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
