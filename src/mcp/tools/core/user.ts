import type { ToolSpec, Tenant, JSONSchema } from "../../types.js";
import { callMoodleAPI } from "../../../moodle-client.js";
import { validateSchema } from "../../validate/ajv.js";
import { formatValidationError } from "../../validate/formatAjvError.js";

// --- Types ---
export type CreateUserCustomField = {
  type: string;
  value: string;
};

export type CreateUserPreference = {
  type: string;
  value: string;
};

export type CreateUserInput = {
  createpassword?: number;
  username: string;
  auth?: string;
  password?: string;
  firstname: string;
  lastname: string;
  email: string;
  maildisplay?: number;
  city?: string;
  country?: string;
  timezone?: string;
  description?: string;
  firstnamephonetic?: string;
  lastnamephonetic?: string;
  middlename?: string;
  alternatename?: string;
  interests?: string;
  idnumber?: string;
  institution?: string;
  department?: string;
  phone1?: string;
  phone2?: string;
  address?: string;
  lang?: string;
  calendartype?: string;
  theme?: string;
  mailformat?: number;
  customfields?: CreateUserCustomField[];
  preferences?: CreateUserPreference[];
};

export type CreatedUser = {
  id: number;
  username: string;
};

export type CreateUsersResponse = CreatedUser[];

// --- AJV schemas ---
export const createdUserSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
  },
  required: ["id", "username"],
  additionalProperties: false,
};

export const createUsersResponseSchema = {
  type: "array",
  items: createdUserSchema,
};

export const deleteUsersResponseSchema = {
  // Moodle may return boolean true or an empty object; accept both shapes
  anyOf: [{ type: "boolean" }, { type: "object" }],
};

export const createUsersInputSchema: JSONSchema = {
  type: "object",
  properties: {
    users: {
      type: "array",
      items: {
        type: "object",
        properties: {
          createpassword: { type: "number" },
          username: { type: "string", minLength: 1, pattern: "^\\S+$" },
          auth: { type: "string" },
          password: { type: "string" },
          firstname: { type: "string", minLength: 1 },
          lastname: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          maildisplay: { type: "number", enum: [0, 1] },
          city: { type: "string" },
          country: { type: "string", minLength: 2, maxLength: 2 },
          timezone: { type: "string" },
          description: { type: "string" },
          firstnamephonetic: { type: "string" },
          lastnamephonetic: { type: "string" },
          middlename: { type: "string" },
          alternatename: { type: "string" },
          interests: { type: "string" },
          idnumber: { type: "string" },
          institution: { type: "string" },
          department: { type: "string" },
          phone1: { type: "string" },
          phone2: { type: "string" },
          address: { type: "string" },
          lang: { type: "string", minLength: 2 },
          calendartype: { type: "string" },
          theme: { type: "string" },
          mailformat: { type: "number" },
          customfields: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                value: { type: "string" },
              },
              required: ["type", "value"],
              additionalProperties: false,
            },
          },
          preferences: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                value: { type: "string" },
              },
              required: ["type", "value"],
              additionalProperties: false,
            },
          },
        },
        required: ["username", "firstname", "lastname", "email"],
        additionalProperties: false,
      },
    },
  },
  required: ["users"],
  additionalProperties: false,
};

export const core_user_tools: ToolSpec[] = [
  {
    name: "core_user_create_users",
    moodleFunction: "core_user_create_users",
    description: "Create one or more users in Moodle.",
    inputSchema: createUsersInputSchema,
    allowedRoles: ["admin", "manager"],
    examples: {
      minimal: {
        users: [
          {
            username: "jdoe",
            firstname: "John",
            lastname: "Doe",
            email: "jdoe@example.org",
          },
        ],
      },
    },
  },
  {
    name: "core_user_delete_users",
    moodleFunction: "core_user_delete_users",
    description: "Delete one or more users by id.",
    inputSchema: {
      type: "object",
      properties: {
        userids: { type: "array", items: { type: "number" }, minItems: 1 },
      },
      required: ["userids"],
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager"],
    examples: {
      minimal: {
        userids: [42],
      },
    },
  },
];

/**
 * Helper to call core_user_create_users and validate response shape.
 */
export async function createUsers(
  tenant: Tenant,
  users: CreateUserInput[],
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<CreateUsersResponse> {
  // Validate input before sending to Moodle
  const { ok: inOk, errors: inErrors } = validateSchema(createUsersInputSchema, { users });
  if (!inOk) {
    const fakeSpec = {
      name: "core_user_create_users",
      inputSchema: createUsersInputSchema,
    } as any;

    const payload = formatValidationError(fakeSpec, inErrors);
    const e: any = new Error(`VALIDATION_ERROR: ${JSON.stringify(payload)}`);
    e.code = "VALIDATION_ERROR";
    throw e;
  }

  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_user_create_users",
    { users },
    { method: "POST", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  const { ok, errors } = validateSchema(createUsersResponseSchema, resp);
  if (!ok) {
    const fakeSpec = {
      name: "core_user_create_users:response",
      inputSchema: createUsersResponseSchema,
    } as any;

    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(`Invalid response from core_user_create_users: ${JSON.stringify(payload)}`);
  }

  return resp as CreateUsersResponse;
}

/**
 * Helper to delete users by id.
 * - Accepts an array of user IDs (`userids`).
 */
export async function deleteUsers(
  tenant: Tenant,
  userids: number[],
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<boolean | Record<string, any>> {
  // Validate input shape
  const { ok: inOk, errors: inErrors } = validateSchema(
    { type: "object", properties: { userids: { type: "array", items: { type: "number" }, minItems: 1 } }, required: ["userids"], additionalProperties: false },
    { userids },
  );
  if (!inOk) {
    const fakeSpec = { name: "core_user_delete_users", inputSchema: { type: "object" } } as any;
    const payload = formatValidationError(fakeSpec, inErrors);
    const e: any = new Error(`VALIDATION_ERROR: ${JSON.stringify(payload)}`);
    e.code = "VALIDATION_ERROR";
    throw e;
  }

  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_user_delete_users",
    { userids },
    { method: "POST", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  const { ok, errors } = validateSchema(deleteUsersResponseSchema, resp);
  if (!ok) {
    const fakeSpec = {
      name: "core_user_delete_users:response",
      inputSchema: deleteUsersResponseSchema,
    } as any;

    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(`Invalid response from core_user_delete_users: ${JSON.stringify(payload)}`);
  }

  return resp as boolean | Record<string, any>;
}

export default {};
