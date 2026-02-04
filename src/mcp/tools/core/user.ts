import type { ToolSpec, Tenant, JSONSchema } from "../../types.js";
import { callMoodleAPI } from "../../../moodle-client.js";
import { validateSchema } from "../../validate/ajv.js";
import { formatValidationError } from "../../validate/formatAjvError.js";

// Simple logging helpers (kept minimal to avoid pulling a logging library)
function safeTenantUrl(tenant: { moodleUrl: string }) {
  try {
    const u = new URL(tenant.moodleUrl);
    u.search = "";
    u.username = "";
    u.password = "";
    return u.toString();
  } catch {
    return tenant.moodleUrl;
  }
}

function getLogLevel(): number {
  const lvl = (((globalThis as any).process?.env?.LOG_LEVEL) ?? "info").toLowerCase();
  switch (lvl) {
    case "silent":
      return 0;
    case "warn":
      return 1;
    case "info":
      return 2;
    case "debug":
      return 3;
    default:
      return 2;
  }
}

function logInfo(msg: string) {
  if (getLogLevel() >= 2) console.log(msg);
}

function logWarn(msg: string) {
  if (getLogLevel() >= 1) console.warn(msg);
}

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

// --- Search users types and schemas ---
export type SearchCriteriaItem = {
  key: string;
  value: string;
};

export type SearchUsersParams = {
  criteria: SearchCriteriaItem[];
};

export type SearchUserCustomField = {
  type: string;
  value: string;
  displayvalue?: string;
  name?: string;
  shortname?: string;
};

export type SearchUserPreference = {
  name: string;
  value: string;
};

export type SearchUser = {
  id: number;
  username?: string;
  firstname?: string;
  lastname?: string;
  fullname: string;
  email?: string;
  address?: string;
  phone1?: string;
  phone2?: string;
  department?: string;
  institution?: string;
  idnumber?: string;
  interests?: string;
  firstaccess?: number;
  lastaccess?: number;
  auth?: string;
  suspended?: number;
  confirmed?: number;
  lang?: string;
  calendartype?: string;
  theme?: string;
  timezone?: string;
  mailformat?: number;
  trackforums?: number;
  description?: string;
  descriptionformat?: number;
  city?: string;
  country?: string;
  profileimageurlsmall?: string;
  profileimageurl?: string;
  customfields?: SearchUserCustomField[];
  preferences?: SearchUserPreference[];
};

export type Warning = {
  item?: string;
  itemid?: number;
  warningcode: string;
  message: string;
};

export type SearchUsersResponse = {
  users: SearchUser[];
  warnings?: Warning[];
};

export const searchUsersInputSchema: JSONSchema = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string", minLength: 1 },
        },
        required: ["key", "value"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["criteria"],
  additionalProperties: false,
};

const searchUserSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    username: { type: "string" },
    firstname: { type: "string" },
    lastname: { type: "string" },
    fullname: { type: "string" },
    email: { type: "string" },
    address: { type: "string" },
    phone1: { type: "string" },
    phone2: { type: "string" },
    department: { type: "string" },
    institution: { type: "string" },
    idnumber: { type: "string" },
    interests: { type: "string" },
    firstaccess: { type: "number" },
    lastaccess: { type: "number" },
    auth: { type: "string" },
    suspended: { type: "number" },
    confirmed: { type: "number" },
    lang: { type: "string" },
    calendartype: { type: "string" },
    theme: { type: "string" },
    timezone: { type: "string" },
    mailformat: { type: "number" },
    trackforums: { type: "number" },
    description: { type: "string" },
    descriptionformat: { type: "number" },
    city: { type: "string" },
    country: { type: "string" },
    profileimageurlsmall: { type: "string" },
    profileimageurl: { type: "string" },
    customfields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          value: { type: "string" },
          displayvalue: { type: "string" },
          name: { type: "string" },
          shortname: { type: "string" },
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
          name: { type: "string" },
          value: { type: "string" },
        },
        required: ["name", "value"],
        additionalProperties: false,
      },
    },
  },
  required: ["id", "fullname"],
  additionalProperties: false,
};

export const searchUsersResponseSchema = {
  type: "object",
  properties: {
    users: { type: "array", items: searchUserSchema },
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          itemid: { type: "number" },
          warningcode: { type: "string" },
          message: { type: "string" },
        },
        required: ["warningcode", "message"],
        additionalProperties: false,
      },
    },
  },
  required: ["users"],
  additionalProperties: false,
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

export const updateUsersInputSchema: JSONSchema = {
  type: "object",
  properties: {
    users: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "number" },
          username: { type: "string", minLength: 1, pattern: "^\\S+$" },
          auth: { type: "string" },
          suspended: { type: "number" },
          password: { type: "string" },
          firstname: { type: "string" },
          lastname: { type: "string" },
          email: { type: "string", format: "email" },
          maildisplay: { type: "number", enum: [0, 1] },
          city: { type: "string" },
          country: { type: "string", minLength: 2, maxLength: 2 },
          timezone: { type: "string" },
          description: { type: "string" },
          userpicture: { type: "number" },
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
        required: ["id"],
        additionalProperties: false,
      },
      minItems: 1,
    },
  },
  required: ["users"],
  additionalProperties: false,
};

export const updateUsersResponseSchema = {
  type: "object",
  properties: {
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          item: { type: "string" },
          itemid: { type: "number" },
          warningcode: { type: "string" },
          message: { type: "string" },
        },
        required: ["warningcode", "message"],
        additionalProperties: false,
      },
    },
  },
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
  {
    name: "core_user_get_users",
    moodleFunction: "core_user_get_users",
    description: "Search for users matching the provided criteria.",
    inputSchema: searchUsersInputSchema,
    allowedRoles: ["admin", "manager", "teacher", "editingteacher"],
    examples: {
      minimal: {
        criteria: [{ key: "username", value: "jdoe" }],
      },
      typical: {
        criteria: [{ key: "lastname", value: "Smith" }, { key: "auth", value: "manual" }],
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

  // LOG: creation
  try {
    const url = safeTenantUrl(tenant);
    const names = users.map((u) => u.username ?? u.email ?? String((u as any).id ?? "<unknown>")) .slice(0, 5);

    logInfo(`[core_user_create_users] tenant=${url} creating ${users.length} users: ${names.join(", ")}${users.length > 5 ? "..." : ""}`);
    if (users.length > 50) logWarn(`[core_user_create_users] creating large batch of users: ${users.length}`);
  } catch (err) {
    // never fail due to logging
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

  // LOG: deletion
  try {
    const url = safeTenantUrl(tenant);
    logWarn(`[core_user_delete_users] tenant=${url} deleting ${userids.length} users: ${userids.slice(0, 10).join(", ")}${userids.length > 10 ? "..." : ""}`);
    if (userids.length > 20) logWarn(`[core_user_delete_users] large delete batch: ${userids.length}`);
  } catch (err) {
    /* no-op */
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

/**
 * Update one or more users.
 * - Accepts an array of user objects where `id` is required and other fields are optional.
 */
export async function updateUsers(
  tenant: Tenant,
  users: Array<Record<string, any>>,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<{ warnings?: Warning[] } | void> {
  // Validate input shape
  const { ok: inOk, errors: inErrors } = validateSchema(updateUsersInputSchema, { users });
  if (!inOk) {
    const fakeSpec = { name: "core_user_update_users", inputSchema: updateUsersInputSchema } as any;
    const payload = formatValidationError(fakeSpec, inErrors);
    const e: any = new Error(`VALIDATION_ERROR: ${JSON.stringify(payload)}`);
    e.code = "VALIDATION_ERROR";
    throw e;
  }

  // LOG: update
  try {
    const url = safeTenantUrl(tenant);
    const ids = users.map((u: any) => u.id).slice(0, 10).join(",");
    logInfo(`[core_user_update_users] tenant=${url} updating ${users.length} users ids=${ids}${users.length > 10 ? "..." : ""}`);
    if (users.length > 50) logWarn(`[core_user_update_users] large update batch: ${users.length}`);
  } catch (err) {
    /* no-op */
  }

  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_user_update_users",
    { users },
    { method: "POST", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  const { ok, errors } = validateSchema(updateUsersResponseSchema, resp);
  if (!ok) {
    const fakeSpec = { name: "core_user_update_users:response", inputSchema: updateUsersResponseSchema } as any;
    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(`Invalid response from core_user_update_users: ${JSON.stringify(payload)}`);
  }

  return resp as { warnings?: Warning[] } | void;
}

/**
 * Search for users matching the provided criteria.
 * - criteria: an array of { key, value } pairs. Values cannot be empty. Keys must be unique.
 */
export async function searchUsers(
  tenant: Tenant,
  criteria: SearchCriteriaItem[],
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<SearchUsersResponse> {
  // Validate input shape
  const { ok: inOk, errors: inErrors } = validateSchema(searchUsersInputSchema, { criteria });
  if (!inOk) {
    const fakeSpec = { name: "core_user_get_users", inputSchema: searchUsersInputSchema } as any;
    const payload = formatValidationError(fakeSpec, inErrors);
    const e: any = new Error(`VALIDATION_ERROR: ${JSON.stringify(payload)}`);
    e.code = "VALIDATION_ERROR";
    throw e;
  }

  // Enforce unique keys
  const keys = criteria.map((c) => c.key);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) {
    const payload = {
      error: "VALIDATION_ERROR",
      message: "Duplicate criteria keys are not allowed.",
      duplicateKeys: Array.from(new Set(dupes)),
    };
    const e: any = new Error(`VALIDATION_ERROR: ${JSON.stringify(payload)}`);
    e.code = "VALIDATION_ERROR";
    throw e;
  }

  // LOG: search
  try {
    const url = safeTenantUrl(tenant);
    const keysStr = criteria.map((c) => c.key).slice(0, 10).join(",");
    logInfo(`[core_user_get_users] tenant=${url} criteriaKeys=${keysStr}${criteria.length > 10 ? "..." : ""}`);
    if (!criteria.length) logWarn(`[core_user_get_users] called without criteria; this may be slow or timeout`);
  } catch (err) {
    /* no-op */
  }

  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_user_get_users",
    { criteria },
    { method: "POST", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  const { ok, errors } = validateSchema(searchUsersResponseSchema, resp);
  if (!ok) {
    const fakeSpec = { name: "core_user_get_users:response", inputSchema: searchUsersResponseSchema } as any;
    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(`Invalid response from core_user_get_users: ${JSON.stringify(payload)}`);
  }

  return resp as SearchUsersResponse;
}

export default {};
