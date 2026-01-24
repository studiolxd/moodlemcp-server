export const ALL_ROLES = [
  "admin",
  "manager",
  "teacher",
  "noneditingteacher",
  "student",
  "authenticateduser",
] as const;

export type Role = (typeof ALL_ROLES)[number];

export const ALLOWED_ROLES_SET: ReadonlySet<Role> = new Set<Role>(ALL_ROLES);

export type Tenant = {
  moodleUrl: string;
  moodleToken: string;
  moodleRole: Role[];
};

export type JSONSchema = {
  type: "object";
  properties?: Record<string, any>;
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
    minimal?: any;
    typical?: any;
  };
};
