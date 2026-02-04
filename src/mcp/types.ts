export const ALL_ROLES = [
  "admin",
  "manager",
  "editingteacher",
  "teacher",
  "student",
  "user",
] as const;

export type Role = (typeof ALL_ROLES)[number];

export const ALLOWED_ROLES_SET: ReadonlySet<Role> = new Set<Role>(ALL_ROLES);

export type Tenant = {
  moodleUrl: string;
  moodleToken: string;
  moodleRoles: Role[];
};

export type JSONSchemaProperty = {
  type?: string;
  description?: string;
  enum?: string[];
  default?: unknown;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
};

export type JSONSchema = {
  type: "object";
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
};

export type ToolSpec = {
  name: string;
  moodleFunction: string;
  description: string;
  inputSchema: JSONSchema;
  allowedRoles: Role[];
  examples?: {
    minimal?: Record<string, unknown>;
    typical?: Record<string, unknown>;
  };
};
