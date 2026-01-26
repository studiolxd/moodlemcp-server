#!/usr/bin/env node
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServerForTenant } from "./mcp/createServerForTenant.js";
import { ALLOWED_ROLES_SET, type Tenant, type Role } from "./mcp/types.js";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json());

// ====== Config del panel ======
const MCP_KEYS_ENDPOINT =
  process.env.MCP_KEYS_ENDPOINT ?? "https://app.moodlemcp.com/api/mcp";

async function fetchTenantFromPanel(mcpKey: string): Promise<Tenant> {
  const res = await fetch(MCP_KEYS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "moodle-mcp-server/1.0",
    },
    body: JSON.stringify({ mcpKey }),
  });

  if (res.status === 200) {
    const data = (await res.json()) as {
      moodleUrl?: string;
      moodleToken?: string;
      moodleRoles?: Role[] | Role | string;
    };

    const rolesRaw = data?.moodleRoles;
    const roles = Array.isArray(rolesRaw)
      ? rolesRaw
      : typeof rolesRaw === "string"
        ? [rolesRaw as Role]
        : undefined;

    if (!data?.moodleUrl || !data?.moodleToken || !roles) {
      throw new Error(
        "Invalid response from MCP Keys endpoint (missing moodleUrl/moodleToken/moodleRoles)",
      );
    }

    // Runtime guard: panel puede devolver cualquier string aunque TS diga Role
    if (roles.length === 0) {
      throw new Error("Invalid moodleRoles from MCP Keys endpoint: empty array");
    }

    const invalidRole = roles.find(
      (role) => typeof role !== "string" || !ALLOWED_ROLES_SET.has(role as Role),
    );
    if (invalidRole) {
      throw new Error(
        `Invalid moodleRoles from MCP Keys endpoint: ${String(invalidRole)}`,
      );
    }

    return {
      moodleUrl: data.moodleUrl,
      moodleToken: data.moodleToken,
      moodleRoles: roles,
    };
  }

  // Mantén semántica: 404 no existe; 403 revocada/suspendida/expirada
  if (res.status === 404) {
    const err = new Error("MCP Key not found");
    // @ts-expect-error attach status
    err.statusCode = 404;
    throw err;
  }

  if (res.status === 403) {
    const err = new Error("MCP Key forbidden");
    // @ts-expect-error attach status
    err.statusCode = 403;
    throw err;
  }

  const text = await res.text().catch(() => "");
  const err = new Error(
    `MCP Keys endpoint error (${res.status}): ${text || res.statusText}`,
  );
  // @ts-expect-error attach status
  err.statusCode = 502;
  throw err;
}

// ====== Sesiones: sessionId -> tenant ======
type SessionCtx = {
  transport: StreamableHTTPServerTransport;
  mcpServer: Server;
  tenant: Tenant;
};

const sessions = new Map<string, SessionCtx>();

function getSessionIdFromReq(req: Request): string | undefined {
  return req.header("Mcp-Session-Id") || req.header("mcp-session-id") || undefined;
}

// ====== Endpoint MCP ======
app.all("/mcp/:mcpKey", async (req: Request, res: Response) => {
  try {
    const method = req.method.toUpperCase();
    const sessionId = getSessionIdFromReq(req);

    // Si ya hay sesión, usa la existente
    if (sessionId) {
      const ctx = sessions.get(sessionId);
      if (!ctx) {
        res.status(404).send("Unknown Mcp-Session-Id");
        return;
      }
      if (method === "POST") await ctx.transport.handleRequest(req, res, req.body);
      else await ctx.transport.handleRequest(req, res);
      return;
    }

    // Si NO hay sesión, valida mcpKey contra el panel y crea sesión
    const mcpKeyParam = req.params.mcpKey;
    const mcpKey = Array.isArray(mcpKeyParam) ? mcpKeyParam[0] : mcpKeyParam;

    if (!mcpKey) {
      res.status(400).send("Missing MCP key");
      return;
    }

    const tenant = await fetchTenantFromPanel(mcpKey);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const mcpServer = createServerForTenant(tenant);
    await mcpServer.connect(transport);

    // Maneja request de inicio
    if (method === "POST") await transport.handleRequest(req, res, req.body);
    else await transport.handleRequest(req, res);

    // Guarda sesión cuando ya exista sessionId
    if (transport.sessionId) {
      sessions.set(transport.sessionId, { transport, mcpServer, tenant });

      transport.onclose = () => {
        if (transport.sessionId) sessions.delete(transport.sessionId);
      };
    }
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const msg = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) res.status(status).send(msg);
  }
});

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase();

function logInfo(msg: string) {
  if (LOG_LEVEL === "silent") return;  
  console.log(msg);
}

function safeUrl(u: string) {
  try {
    const url = new URL(u);
    url.search = "";
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return u;
  }
}

app.listen(PORT, () => {
  const env = process.env.NODE_ENV ?? "development";
  const host = process.env.HOST ?? "0.0.0.0";
  const baseUrl =
    env === "production"
      ? `http://${host}:${PORT}`
      : `http://localhost:${PORT}`;

  logInfo(`✅ moodle-mcp-server started`);
  logInfo(`   env: ${env}`);
  logInfo(`   listen: ${host}:${PORT}`);
  logInfo(`   mcp endpoint: ${baseUrl}/mcp/<MCP_KEY>`);
  logInfo(`   health: ${baseUrl}/health`);
  logInfo(`   panel endpoint: ${safeUrl(MCP_KEYS_ENDPOINT)}`);
});
