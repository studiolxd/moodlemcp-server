export const DEFAULT_PORT = 3000;

export const PORT = Number(process.env.PORT || DEFAULT_PORT);
export const HOST = process.env.HOST ?? "0.0.0.0";
export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const LOG_LEVEL = (process.env.LOG_LEVEL ?? "info").toLowerCase();

export const MCP_KEYS_ENDPOINT =
  process.env.MCP_KEYS_ENDPOINT ?? "https://app.moodlemcp.com/api/mcp";

export function safeUrl(u: string): string {
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

export function logInfo(msg: string): void {
  if (LOG_LEVEL === "silent") return;
  console.log(msg);
}
