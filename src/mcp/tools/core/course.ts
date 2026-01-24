import type { ToolSpec } from "../../types.js";

export const core_course_tools: ToolSpec[] = [
  {
    name: "core_course_get_courses",
    moodleFunction: "core_course_get_courses",
    description: "Gets the list of available courses in Moodle.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager"],
    examples: {
      minimal: {},
    },
  },
];