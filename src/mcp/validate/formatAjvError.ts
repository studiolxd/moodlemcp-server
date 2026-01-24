import type { ErrorObject } from "ajv";
import type { ToolSpec } from "../types.js";

export function formatValidationError(spec: ToolSpec, errors: ErrorObject[] | null | undefined) {
  const allowedProperties = spec.inputSchema.properties
    ? Object.keys(spec.inputSchema.properties)
    : [];

  const missingRequired: string[] = [];
  const unexpectedProperties: string[] = [];
  const fieldErrors: Array<{
    path: string;
    issue: string;
    expected?: string;
    details?: any;
  }> = [];

  for (const e of errors ?? []) {
    if (e.keyword === "required") {
      const mp = (e.params as any)?.missingProperty;
      if (mp) missingRequired.push(mp);
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "missing_required",
        expected: mp ? `property '${mp}'` : undefined,
        details: e.params,
      });
      continue;
    }

    if (e.keyword === "additionalProperties") {
      const ap = (e.params as any)?.additionalProperty;
      if (ap) unexpectedProperties.push(ap);
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "unexpected_property",
        expected: allowedProperties.length ? `only: ${allowedProperties.join(", ")}` : "no extra properties",
        details: e.params,
      });
      continue;
    }

    if (e.keyword === "type") {
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "wrong_type",
        expected: (e.params as any)?.type,
        details: e.params,
      });
      continue;
    }

    fieldErrors.push({
      path: e.instancePath || "/",
      issue: e.keyword,
      details: { message: e.message, params: e.params },
    });
  }

  const uniq = (arr: string[]) => Array.from(new Set(arr));

  const payload: any = {
    error: "VALIDATION_ERROR",
    tool: spec.name,
    message:
      "Arguments do not match inputSchema. Fix arguments and retry the same tool call. Do not add keys outside allowedProperties.",
    allowedProperties,
    missingRequired: uniq(missingRequired),
    unexpectedProperties: uniq(unexpectedProperties),
    fieldErrors,
  };

  if (spec.examples?.minimal) payload.exampleArgumentsMinimal = spec.examples.minimal;
  if (spec.examples?.typical) payload.exampleArgumentsTypical = spec.examples.typical;

  return payload;
}