import type { ToolSpec } from "../../types.js";

export const core_webservice_tools: ToolSpec[] = [
  {
    name: "core_webservice_get_site_info",
    moodleFunction: "core_webservice_get_site_info",
    description: "Gets general information about the Moodle site.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager", "teacher", "noneditingteacher", "student", "authenticateduser"],
    examples: {
      minimal: {},
    },
  },
];