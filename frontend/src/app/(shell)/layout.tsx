"use client";

import { Providers } from "@/components/Providers";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
