"use client";

import { useEffect, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
};

export function AnimatedNumber({ value, duration = 700, decimals = 0, suffix = "" }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = display;
    const diff = value - from;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(from + diff * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from current display
  }, [value, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString("es-PE");

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
