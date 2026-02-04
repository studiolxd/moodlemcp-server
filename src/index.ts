#!/usr/bin/env node
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { createServerForTenant } from "./mcp/createServerForTenant.js";
import { AppError } from "./errors.js";
import { fetchTenantFromPanel } from "./auth.js";
import { PORT, HOST, NODE_ENV, MCP_KEYS_ENDPOINT, logInfo, safeUrl } from "./config.js";
import { getSession, setSession, deleteSession } from "./sessions.js";

const app = express();
app.use(express.json());

// ====== Helpers ======

function getSessionIdFromReq(req: Request): string | undefined {
  return req.header("Mcp-Session-Id") || req.header("mcp-session-id") || undefined;
}

async function dispatchToTransport(
  transport: StreamableHTTPServerTransport,
  req: Request,
  res: Response,
): Promise<void> {
  if (req.method.toUpperCase() === "POST") {
    await transport.handleRequest(req, res, req.body);
  } else {
    await transport.handleRequest(req, res);
  }
}

// ====== Endpoint MCP ======
app.all("/mcp/:mcpKey", async (req: Request, res: Response) => {
  try {
    const sessionId = getSessionIdFromReq(req);

    // Si ya hay sesion, usa la existente
    if (sessionId) {
      const ctx = getSession(sessionId);
      if (!ctx) {
        res.status(404).send("Unknown Mcp-Session-Id");
        return;
      }
      await dispatchToTransport(ctx.transport, req, res);
      return;
    }

    // Si NO hay sesion, valida mcpKey contra el panel y crea sesion
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
    await dispatchToTransport(transport, req, res);

    // Guarda sesion cuando ya exista sessionId
    if (transport.sessionId) {
      setSession(transport.sessionId, {
        transport,
        mcpServer,
        tenant,
        lastActivity: Date.now(),
      });

      transport.onclose = () => {
        if (transport.sessionId) deleteSession(transport.sessionId);
      };
    }
  } catch (err: unknown) {
    const status = err instanceof AppError ? err.statusCode : 500;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[mcp-handler]", err);
    if (!res.headersSent) res.status(status).send(msg);
  }
});

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  const baseUrl =
    NODE_ENV === "production"
      ? `http://${HOST}:${PORT}`
      : `http://localhost:${PORT}`;

  logInfo(`moodle-mcp-server started`);
  logInfo(`   env: ${NODE_ENV}`);
  logInfo(`   listen: ${HOST}:${PORT}`);
  logInfo(`   mcp endpoint: ${baseUrl}/mcp/<MCP_KEY>`);
  logInfo(`   health: ${baseUrl}/health`);
  logInfo(`   panel endpoint: ${safeUrl(MCP_KEYS_ENDPOINT)}`);
});
