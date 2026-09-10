"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";

export function ThemeToggle() {
  const reduced = useReducedMotion();
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={reduced ? undefined : { scale: 1.02 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="header-icon"
      aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: reduced ? 0 : theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-[var(--accent)]" />
        ) : (
          <Moon className="h-5 w-5 text-[var(--accent)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
