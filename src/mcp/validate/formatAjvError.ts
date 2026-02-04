import type { ErrorObject } from "ajv";
import type { ToolSpec } from "../types.js";

interface FieldError {
  path: string;
  issue: string;
  expected?: string;
  details?: Record<string, unknown>;
}

export interface ValidationErrorPayload {
  error: "VALIDATION_ERROR";
  tool: string;
  message: string;
  allowedProperties: string[];
  missingRequired: string[];
  unexpectedProperties: string[];
  fieldErrors: FieldError[];
  exampleArgumentsMinimal?: unknown;
  exampleArgumentsTypical?: unknown;
}

export function formatValidationError(
  spec: ToolSpec,
  errors: ErrorObject[] | null | undefined,
): ValidationErrorPayload {
  const allowedProperties = spec.inputSchema.properties
    ? Object.keys(spec.inputSchema.properties)
    : [];

  const missingRequired: string[] = [];
  const unexpectedProperties: string[] = [];
  const fieldErrors: FieldError[] = [];

  for (const e of errors ?? []) {
    if (e.keyword === "required") {
      const mp = (e.params as Record<string, unknown>)?.missingProperty as string | undefined;
      if (mp) missingRequired.push(mp);
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "missing_required",
        expected: mp ? `property '${mp}'` : undefined,
        details: e.params as Record<string, unknown>,
      });
      continue;
    }

    if (e.keyword === "additionalProperties") {
      const ap = (e.params as Record<string, unknown>)?.additionalProperty as string | undefined;
      if (ap) unexpectedProperties.push(ap);
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "unexpected_property",
        expected: allowedProperties.length ? `only: ${allowedProperties.join(", ")}` : "no extra properties",
        details: e.params as Record<string, unknown>,
      });
      continue;
    }

    if (e.keyword === "type") {
      fieldErrors.push({
        path: e.instancePath || "/",
        issue: "wrong_type",
        expected: (e.params as Record<string, unknown>)?.type as string | undefined,
        details: e.params as Record<string, unknown>,
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

  const payload: ValidationErrorPayload = {
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
