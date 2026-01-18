#!/usr/bin/env node
import express, { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { callMoodleAPI } from "./moodle-client.js";

const MOODLE_CONFIG = {
  url: process.env.MOODLE_URL || "https://tu-moodle.com",
  token: process.env.MOODLE_TOKEN || "tu-token-aqui",
};

const PORT = Number(process.env.PORT || 3000);

const app = express();
app.use(express.json());

// (Opcional) si vas a consumir desde navegador, necesitarías CORS + exponer Mcp-Session-Id.
// La spec y SDKs mencionan esto.  [oai_citation:5‡PyPI](https://pypi.org/project/mcp/?utm_source=chatgpt.com)

// 1) MCP Server (uno, global)
const mcpServer = new Server(
  { name: "moodle-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 2) Tools
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
          MOODLE_CONFIG.url,
          MOODLE_CONFIG.token,
          "core_webservice_get_site_info",
          {}
        );
        break;

      case "get_courses":
        result = await callMoodleAPI(
          MOODLE_CONFIG.url,
          MOODLE_CONFIG.token,
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

// 3) Mapa de sesiones -> transport
const transportsBySessionId = new Map<string, StreamableHTTPServerTransport>();

function getSessionIdFromReq(req: Request): string | undefined {
  // Header estándar: Mcp-Session-Id  [oai_citation:6‡PyPI](https://pypi.org/project/mcp/?utm_source=chatgpt.com)
  const v = req.header("Mcp-Session-Id") || req.header("mcp-session-id");
  return v || undefined;
}

async function getOrCreateTransport(req: Request): Promise<StreamableHTTPServerTransport> {
  const incomingSessionId = getSessionIdFromReq(req);
  if (incomingSessionId) {
    const existing = transportsBySessionId.get(incomingSessionId);
    if (existing) return existing;
    // Si llega un sessionId que no conocemos, el propio transport puede rechazar según spec,
    // pero aquí devolvemos 404 luego en handle si no existe.
    // (Preferimos 404 explícito para debug.)
    throw Object.assign(new Error("Unknown session id"), { statusCode: 404 });
  }

  // No hay sessionId: es probablemente una inicialización. Creamos un transport stateful.
  // En stateful mode: el SDK genera/adjunta un sessionId a respuestas de init.  [oai_citation:7‡app.unpkg.com](https://app.unpkg.com/%40cloudbase/mcp%401.0.0-beta.26/files/dist/cjs/transport/server/streamableHTTP/index.d.ts?utm_source=chatgpt.com)
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  // Conecta server <-> transport (por sesión)
  await mcpServer.connect(transport);

  // Cuando el transport ya tenga sessionId (normalmente durante init), lo guardamos.
  // Nota: en la práctica suele estar disponible tras el primer handleRequest.
  return transport;
}

app.all("/mcp", async (req: Request, res: Response) => {
  try {
    // Para POST necesitamos body; para GET/DELETE normalmente no.
    const method = req.method.toUpperCase();

    // Si viene con sessionId desconocido -> 404 (más claro)
    const incomingSessionId = getSessionIdFromReq(req);
    if (incomingSessionId && !transportsBySessionId.has(incomingSessionId)) {
      res.status(404).send("Unknown Mcp-Session-Id");
      return;
    }

    const transport =
      incomingSessionId
        ? transportsBySessionId.get(incomingSessionId)!
        : await getOrCreateTransport(req);

    // IMPORTANTE: delegar en handleRequest. Ejemplos del SDK usan req/res/(body).  [oai_citation:8‡app.unpkg.com](https://app.unpkg.com/%40cloudbase/mcp%401.0.0-beta.26/files/dist/cjs/transport/server/streamableHTTP/index.d.ts?utm_source=chatgpt.com)
    if (method === "POST") {
      await transport.handleRequest(req, res, req.body);
    } else {
      await transport.handleRequest(req, res);
    }

    // Si era una sesión nueva, guarda el sessionId cuando esté disponible
    if (!incomingSessionId && transport.sessionId) {
      transportsBySessionId.set(transport.sessionId, transport);

      transport.onclose = () => {
        if (transport.sessionId) transportsBySessionId.delete(transport.sessionId);
      };
    }
  } catch (err: any) {
    const status = err?.statusCode ?? 500;
    const msg = err instanceof Error ? err.message : String(err);
    if (!res.headersSent) res.status(status).send(msg);
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 MCP (Streamable HTTP, stateful) on http://localhost:${PORT}/mcp`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});