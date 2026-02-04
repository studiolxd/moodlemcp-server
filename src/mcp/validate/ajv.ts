import Ajv, { type SchemaObject } from "ajv";
import type { ErrorObject } from "ajv";
import type { ToolSpec } from "../types.js";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

type ValidateFn = ReturnType<typeof ajv.compile>;
const compiled = new Map<string, ValidateFn>();

export function validateToolArgs(
  spec: ToolSpec,
  args: unknown,
): { ok: boolean; errors: ErrorObject[] | null | undefined } {
  let validate = compiled.get(spec.name);
  if (!validate) {
    validate = ajv.compile(spec.inputSchema as SchemaObject);
    compiled.set(spec.name, validate);
  }

  const ok = validate(args);
  return { ok: !!ok, errors: validate.errors };
}