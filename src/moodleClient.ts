const MOODLE_REST_PATH = "/webservice/rest/server.php";
const DEFAULT_TIMEOUT_MS = 30_000;
const ERROR_SNIPPET_MAX_LENGTH = 800;

export async function callMoodleAPI(
  moodleUrl: string,
  token: string,
  functionName: string,
  params: Record<string, unknown>,
  options?: {
    method?: "GET" | "POST";
    signal?: AbortSignal;
    timeoutMs?: number;
  },
): Promise<unknown> {
  const url = `${moodleUrl.replace(/\/+$/, "")}${MOODLE_REST_PATH}`;

  const flat = flattenParams(params);

  const baseParams: Record<string, string> = {
    wstoken: token,
    wsfunction: functionName,
    moodlewsrestformat: "json",
  };

  const method = options?.method ?? "GET";

  // Optional timeout
  const controller = options?.signal ? null : new AbortController();
  const signal = options?.signal ?? controller?.signal;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout =
    controller && timeoutMs > 0
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    let response: Response;

    if (method === "POST") {
      // Moodle REST server accepts application/x-www-form-urlencoded
      const body = new URLSearchParams({ ...baseParams, ...flat });

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal,
      });
    } else {
      const searchParams = new URLSearchParams({ ...baseParams, ...flat });
      response = await fetch(`${url}?${searchParams.toString()}`, { signal });
    }

    // Read body once (supports JSON and non-JSON error bodies)
    const contentType = response.headers.get("content-type") ?? "";
    const rawText = await response.text();

    if (!response.ok) {
      console.error(`[moodle-api] HTTP ${response.status} calling ${functionName}:`, rawText.slice(0, ERROR_SNIPPET_MAX_LENGTH));
      throw new Error(
        `Moodle HTTP error (${response.status} ${response.statusText}) calling ${functionName}.`,
      );
    }

    // Parse JSON if possible (Moodle should return JSON but may not in some edge cases)
    let data: unknown;
    if (contentType.includes("application/json") || looksLikeJson(rawText)) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        console.error(`[moodle-api] Invalid JSON from ${functionName}:`, rawText.slice(0, ERROR_SNIPPET_MAX_LENGTH));
        throw new Error(
          `Moodle response was not valid JSON calling ${functionName}. Content-Type: ${contentType}.`,
        );
      }
    } else {
      // Unexpected but possible (misconfig/proxy). Return raw text.
      return rawText;
    }

    // Moodle reports errors inside JSON (exception/errorcode/message)
    const moodleData = data as Record<string, unknown> | null;
    if (moodleData?.exception) {
      const exception = String(moodleData.exception);
      const errorcode = moodleData.errorcode ? String(moodleData.errorcode) : undefined;
      const message = moodleData.message ? String(moodleData.message) : "Error de la API de Moodle";
      const debuginfo = moodleData.debuginfo ? String(moodleData.debuginfo) : undefined;

      const details = [
        `exception=${exception}`,
        errorcode ? `errorcode=${errorcode}` : null,
        debuginfo ? `debuginfo=${debuginfo}` : null,
      ]
        .filter(Boolean)
        .join(" ");

      throw new Error(
        `Moodle API error calling ${functionName}: ${message}${details ? ` (${details})` : ""}`,
      );
    }

    return data;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function flattenParams(params: Record<string, unknown>): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          for (const [k, v] of Object.entries(item)) {
            if (v === null || v === undefined) continue;
            flattened[`${key}[${index}][${k}]`] = String(v);
          }
        } else {
          flattened[`${key}[${index}]`] = String(item);
        }
      });
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v === null || v === undefined) continue;
        flattened[`${key}[${k}]`] = String(v);
      }
    } else {
      flattened[key] = String(value);
    }
  }

  return flattened;
}