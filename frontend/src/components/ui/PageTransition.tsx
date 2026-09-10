"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : fadeUp.initial}
      animate={fadeUp.animate}
      exit={reduced ? undefined : fadeUp.exit}
      transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
