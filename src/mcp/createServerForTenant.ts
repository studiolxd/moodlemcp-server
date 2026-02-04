import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { Tenant } from "./types.js";
import { ALL_TOOLS, createToolMap } from "./tools/index.js";
import { callMoodleAPI } from "../moodleClient.js";
import { validateToolArgs } from "./validate/ajv.js";
import { formatValidationError } from "./validate/formatAjvError.js";

function errorResult(payload: object) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    isError: true,
  };
}

export function createServerForTenant(tenant: Tenant): Server {
  const mcpServer = new Server(
    { name: "moodle-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  const toolMap = createToolMap(ALL_TOOLS);
  const tenantRoles = tenant.moodleRoles;
  const hasAllowedRole = (allowedRoles: Tenant["moodleRoles"]) =>
    allowedRoles.some((role) => tenantRoles.includes(role));

  // 1) listTools: filtra por rol SIEMPRE
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = ALL_TOOLS
      .filter((t) => hasAllowedRole(t.allowedRoles))
      .map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      }));

    return { tools };
  });

  // 2) callTool: router generico + check rol + AJV
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const spec = toolMap.get(name);
    if (!spec) {
      return errorResult({ error: "UNKNOWN_TOOL", tool: name });
    }

    // Roles obligatorios (defensa en profundidad)
    if (!hasAllowedRole(spec.allowedRoles)) {
      return errorResult({
        error: "FORBIDDEN_TOOL",
        tool: spec.name,
        roles: tenant.moodleRoles,
        message: "This tool is not allowed for your role.",
      });
    }

    const input = args ?? {};

    // AJV: valida arguments
    const { ok, errors } = validateToolArgs(spec, input);
    if (!ok) {
      return errorResult(formatValidationError(spec, errors));
    }

    try {
      const result = await callMoodleAPI(
        tenant.moodleUrl,
        tenant.moodleToken,
        spec.moodleFunction,
        input,
      );

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return errorResult({
        error: "MOODLE_API_ERROR",
        tool: spec.name,
        message: msg,
      });
    }
  });

  return mcpServer;
}
