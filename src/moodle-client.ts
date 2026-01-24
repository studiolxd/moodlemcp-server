/**
 * Moodle REST client with improved error reporting and optional POST support.
 *
 * - Better error details (status, statusText, body snippet, Moodle exception fields)
 * - Handles non-JSON responses gracefully
 * - Supports GET (default) and POST
 * - Uses AbortSignal / timeout
 */
export async function callMoodleAPI(
  moodleUrl: string,
  token: string,
  functionName: string,
  params: Record<string, any>,
  options?: {
    method?: "GET" | "POST";
    signal?: AbortSignal;
    timeoutMs?: number;
  },
): Promise<any> {
  const url = `${moodleUrl.replace(/\/+$/, "")}/webservice/rest/server.php`;

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
  const timeoutMs = options?.timeoutMs ?? 30_000;
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
      const snippet = rawText.slice(0, 800);
      throw new Error(
        `Moodle HTTP error (${response.status} ${response.statusText}) calling ${functionName}. Body: ${snippet}`,
      );
    }

    // Parse JSON if possible (Moodle should return JSON but may not in some edge cases)
    let data: any;
    if (contentType.includes("application/json") || looksLikeJson(rawText)) {
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          `Moodle response was not valid JSON calling ${functionName}. Content-Type: ${contentType}. Body: ${rawText.slice(
            0,
            800,
          )}`,
        );
      }
    } else {
      // Unexpected but possible (misconfig/proxy). Return raw text.
      return rawText;
    }

    // Moodle reports errors inside JSON (exception/errorcode/message)
    if (data?.exception) {
      const exception = String(data.exception);
      const errorcode = data.errorcode ? String(data.errorcode) : undefined;
      const message = data.message ? String(data.message) : "Error de la API de Moodle";
      const debuginfo = data.debuginfo ? String(data.debuginfo) : undefined;

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

function flattenParams(params: Record<string, any>): Record<string, string> {
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
      for (const [k, v] of Object.entries(value as Record<string, any>)) {
        if (v === null || v === undefined) continue;
        flattened[`${key}[${k}]`] = String(v);
      }
    } else {
      flattened[key] = String(value);
    }
  }

  return flattened;
}