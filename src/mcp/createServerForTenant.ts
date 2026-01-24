import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Tenant } from "./types.js";
import { ALL_TOOLS, createToolMap } from "./tools/index.js";
import { callMoodleAPI } from "../moodle-client.js";
import { validateToolArgs } from "./validate/ajv.js";
import { formatValidationError } from "./validate/formatAjvError.js";

export function createServerForTenant(tenant: Tenant): Server {
  const mcpServer = new Server(
    { name: "moodle-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  const toolMap = createToolMap(ALL_TOOLS);

  // 1) listTools: filtra por rol SIEMPRE
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = ALL_TOOLS
      .filter((t) => t.allowedRoles.includes(tenant.moodleRole))
      .map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

    return { tools };
  });

  // 2) callTool: router genérico + check rol + AJV
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params as any;

    const spec = toolMap.get(name);
    if (!spec) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "UNKNOWN_TOOL", tool: name }, null, 2) }],
        isError: true,
      };
    }

    // Roles obligatorios (defensa en profundidad)
    if (!spec.allowedRoles.includes(tenant.moodleRole)) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "FORBIDDEN_TOOL",
                tool: spec.name,
                role: tenant.moodleRole,
                message: "This tool is not allowed for your role.",
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    const input = args ?? {};

    // AJV: valida arguments
    const { ok, errors } = validateToolArgs(spec, input);
    if (!ok) {
      const payload = formatValidationError(spec, errors);
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        isError: true,
      };
    }

    try {
      const result = await callMoodleAPI(
        tenant.moodleUrl,
        tenant.moodleToken,
        spec.moodleFunction,
        input,
      );

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: "MOODLE_API_ERROR",
                tool: spec.name,
                message: msg,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  });

  return mcpServer;
}