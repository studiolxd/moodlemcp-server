export async function callMoodleAPI(
  moodleUrl: string,
  token: string,
  functionName: string,
  params: Record<string, any>
): Promise<any> {
  const url = `${moodleUrl}/webservice/rest/server.php`;

  const searchParams = new URLSearchParams({
    wstoken: token,
    wsfunction: functionName,
    moodlewsrestformat: "json",
    ...flattenParams(params),
  });

  const response = await fetch(`${url}?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: any = await response.json();

  // Moodle reporta errores en JSON
  if (data?.exception) {
    throw new Error(data.message || "Error de la API de Moodle");
  }

  return data;
}

function flattenParams(params: Record<string, any>): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          for (const [k, v] of Object.entries(item)) {
            flattened[`${key}[${index}][${k}]`] = String(v);
          }
        } else {
          flattened[`${key}[${index}]`] = String(item);
        }
      });
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, any>)) {
        flattened[`${key}[${k}]`] = String(v);
      }
    } else {
      flattened[key] = String(value);
    }
  }

  return flattened;
}