import { PrismaClient } from '@prisma/client';
const globalDb = globalThis as unknown as { sidangDb?: PrismaClient };
export const db = globalDb.sidangDb ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalDb.sidangDb = db;
