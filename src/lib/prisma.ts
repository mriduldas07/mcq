import { PrismaClient } from "@prisma/client";

// PrismaClient singleton for Next.js hot reload stability
// Prevents "Can't reach database server" errors during development
// Official Prisma recommendation: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "info", "warn", "error"] : ["error"],
  });

// In development, store on globalThis to survive hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
