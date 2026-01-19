#!/usr/bin/env node
import "dotenv/config";
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { callMoodleAPI } from "./moodle-client.js";

const PORT = Number(process.env.PORT || 3000);
const app = express();
app.use(express.json());

// ====== 1) “Base de datos” mínima en memoria (desde .env) ======
type Tenant = {
  apiKey: string;
  moodleUrl: string;
  moodleToken: string;
};

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// Las API keys también pueden ir en .env (recomendado)
const TENANTS: Tenant[] = [
  {
    apiKey: process.env.TENANT1_APIKEY || "key_demo_1",
    moodleUrl: mustEnv("TENANT1_MOODLEURL"),
    moodleToken: mustEnv("TENANT1_MOODLETOKEN"),
  },
  {
    apiKey: process.env.TENANT2_APIKEY || "key_demo_2",
    moodleUrl: mustEnv("TENANT2_MOODLEURL"),
    moodleToken: mustEnv("TENANT2_MOODLETOKEN"),
  },
];

function findTenant(apiKey: string): Tenant | undefined {
  return TENANTS.find((t) => t.apiKey === apiKey);
}

// ====== 2) Sesiones: sessionId -> tenant ======
type SessionCtx = {
  transport: StreamableHTTPServerTransport;
  mcpServer: Server;
  tenant: Tenant;
};

const sessions = new Map<string, SessionCtx>();

function getSessionIdFromReq(req: Request): string | undefined {
  return req.header("Mcp-Session-Id") || req.header("mcp-session-id") || undefined;
}

// Crea un MCP Server “atado” al tenant (closure)
function createServerForTenant(tenant: Tenant): Server {
  const mcpServer = new Server(
    { name: "moodle-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_site_info",
          description: "Obtiene información general del sitio Moodle",
          inputSchema: { type: "object", properties: {} },
        },
        {
          name: "get_courses",
          description: "Obtiene la lista de cursos disponibles en Moodle",
          inputSchema: { type: "object", properties: {} },
        },
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case "get_site_info":
          result = await callMoodleAPI(
            tenant.moodleUrl,
            tenant.moodleToken,
            "core_webservice_get_site_info",
            {}
          );
          break;

        case "get_courses":
          result = await callMoodleAPI(
            tenant.moodleUrl,
            tenant.moodleToken,
            "core_course_get_courses",
            {}
          );
          break;

        default:
          throw new Error(`Herramienta desconocida: ${name}`);
      }

      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
    }
  });

  return mcpServer;
}

// ====== 3) Endpoint MCP con apiKey en la URL ======
app.all("/mcp/:apiKey", async (req: Request, res: Response) => {
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

    // Si NO hay sesión, valida apiKey y crea sesión
    const apiKeyParam = req.params.apiKey;
const apiKey = Array.isArray(apiKeyParam) ? apiKeyParam[0] : apiKeyParam;

if (!apiKey) {
  res.status(400).send("Missing API key");
  return;
}

const tenant = findTenant(apiKey);
if (!tenant) {
  res.status(401).send("Invalid API key");
  return;
}

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

app.listen(PORT, () => {
  console.log(`🚀 MCP multi-tenant on http://localhost:${PORT}/mcp/<API_KEY>`);
});