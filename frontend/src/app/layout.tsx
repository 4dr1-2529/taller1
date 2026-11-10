import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLENKIR · Riesgo de deserción estudiantil",
  description:
    "Sistema predictivo con modelos de aprendizaje automático, datos académicos y actividad en plataforma virtual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="app-bg flex min-h-full flex-col">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
