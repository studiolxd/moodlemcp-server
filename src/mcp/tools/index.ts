import type { ToolSpec } from "../types.js";
import { core_webservice_tools } from "./core/webservice.js";
import { core_calendar_tools } from "./core/calendar.js";
import { core_course_tools } from "./core/course.js";
import { core_enrol_tools } from "./core/enrol.js";
import { core_user_tools } from "./core/user.js";

export const ALL_TOOLS: ToolSpec[] = [
  ...core_webservice_tools,
  ...core_calendar_tools,
  ...core_course_tools,
  ...core_enrol_tools,
  ...core_user_tools,
];

export function createToolMap(tools: ToolSpec[]) {
  const map = new Map<string, ToolSpec>();
  for (const t of tools) {
    if (map.has(t.name)) throw new Error(`Duplicate tool name: ${t.name}`);
    map.set(t.name, t);
  }
  return map;
}