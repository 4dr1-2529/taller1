"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:shadow-lg hover:shadow-violet-500/10"
      aria-label={theme === "dark" ? "Modo claro" : "Modo oscuro"}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {theme === "dark" ? (
          <Sun className="relative z-10 h-5 w-5 text-amber-300 transition-colors group-hover:text-amber-200" />
        ) : (
          <Moon className="relative z-10 h-5 w-5 text-violet-300 transition-colors group-hover:text-violet-200" />
        )}
      </motion.div>
    </motion.button>
  );
}
