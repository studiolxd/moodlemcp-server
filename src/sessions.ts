import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Tenant } from "./mcp/types.js";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes

export type SessionContext = {
  transport: StreamableHTTPServerTransport;
  mcpServer: Server;
  tenant: Tenant;
  lastActivity: number;
};

const sessions = new Map<string, SessionContext>();

export function getSession(sessionId: string): SessionContext | undefined {
  const ctx = sessions.get(sessionId);
  if (ctx) {
    ctx.lastActivity = Date.now();
  }
  return ctx;
}

export function setSession(sessionId: string, ctx: SessionContext): void {
  ctx.lastActivity = Date.now();
  sessions.set(sessionId, ctx);
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

function cleanupStaleSessions(): void {
  const now = Date.now();
  for (const [id, ctx] of sessions) {
    if (now - ctx.lastActivity > SESSION_TTL_MS) {
      try {
        ctx.transport.close?.();
      } catch {
        // ignore close errors during cleanup
      }
      sessions.delete(id);
    }
  }
}

// Start periodic cleanup
const cleanupTimer = setInterval(cleanupStaleSessions, CLEANUP_INTERVAL_MS);
cleanupTimer.unref(); // don't keep process alive just for cleanup
