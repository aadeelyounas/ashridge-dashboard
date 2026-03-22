import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Connection is created once per cold start, then reused
// Neon uses WebSocket so it doesn't block server startup
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Check your .env file.");
  _db = drizzle(neon(url), { schema });
  return _db;
}

// Proxy: forwards all property access to the lazily-initialized db instance
// This allows `await db.select().from(...)` to work correctly in API routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(_target, prop: string) {
    if (prop === "then" || prop === "toJSON") return undefined;
    // select / update / delete / insert — forward directly to real db
    return (...args: unknown[]) => {
      const real = getDb();
      return (real as any)[prop](...args);
    };
  },
});
