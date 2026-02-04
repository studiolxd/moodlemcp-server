import { MCP_KEYS_ENDPOINT } from "./config.js";
import { AppError } from "./errors.js";
import { ALLOWED_ROLES_SET, type Tenant, type Role } from "./mcp/types.js";

export async function fetchTenantFromPanel(mcpKey: string): Promise<Tenant> {
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
    throw new AppError("MCP Key not found", 404);
  }

  if (res.status === 403) {
    throw new AppError("MCP Key forbidden", 403);
  }

  const text = await res.text().catch(() => "");
  throw new AppError(
    `MCP Keys endpoint error (${res.status}): ${text || res.statusText}`,
    502,
  );
}
