import type { ToolSpec } from "../../types.js";

export const core_enrol_tools: ToolSpec[] = [
  {
    name: "core_enrol_get_users_courses",
    moodleFunction: "core_enrol_get_users_courses",
    description: "Returns the list of courses the given user is enrolled in.",
    inputSchema: {
      type: "object",
      properties: {
        userid: { type: "number" },
      },
      required: ["userid"],
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager", "teacher", "noneditingteacher", "student"],
    examples: {
      minimal: { userid: 123 },
    },
  },
];