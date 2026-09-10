"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.25 }}>
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
    </MotionConfig>
  );
}
