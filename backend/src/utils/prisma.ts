import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function gracefulShutdown() {
  await prisma.$disconnect();
  console.log("Prisma disconnected");
}

process.on("SIGINT", async () => { await gracefulShutdown(); process.exit(0); });
process.on("SIGTERM", async () => { await gracefulShutdown(); process.exit(0); });
