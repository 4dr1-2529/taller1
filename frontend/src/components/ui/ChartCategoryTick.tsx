"use client";

/** Wrap a category label without truncating its content or changing the series. */
export function ChartCategoryTick({ x = 0, y = 0, payload, vertical = false }: {
  x?: number; y?: number; payload?: { value: string | number }; vertical?: boolean;
}) {
  const lines = String(payload?.value ?? "").match(/.{1,16}(?:\s|$)|.{1,16}/g) ?? [];
  return <text x={x} y={y} textAnchor={vertical ? "end" : "middle"} fill="var(--text-muted)" fontSize={12}>
    {lines.map((line, index) => <tspan key={index} x={x} dy={index ? 14 : vertical ? -(lines.length - 1) * 7 : 14}>{line.trim()}</tspan>)}
  </text>;
}
