import type { ToolSpec, Tenant } from "../../types.js";
import { callMoodleAPI } from "../../../moodle-client.js";
import { validateSchema } from "../../validate/ajv.js";
import { formatValidationError } from "../../validate/formatAjvError.js";

// Request parameters for the day view
export type CalendarDayViewParams = {
  year: number; // required
  month: number; // required
  day: number; // required
  courseid?: number; // default 1
  categoryid?: number | null; // default null
};

// Nested structures in the response
export type CalendarIcon = {
  key: string;
  component: string;
  alttext: string;
  iconurl: string;
  iconclass: string;
  purpose: string;
};

export type CalendarCategory = {
  id: number;
  name: string;
  idnumber: string;
  description?: string;
  parent: number;
  coursecount: number;
  visible: number;
  timemodified: number;
  depth: number;
  nestedname: string;
  url: string;
};

export type CalendarCourse = {
  id: number;
  fullname: string;
  shortname: string;
  idnumber: string;
  summary: string;
  summaryformat: number;
  startdate: number;
  enddate: number;
  visible: number;
  showactivitydates: number;
  showcompletionconditions: number;
  pdfexportfont: string;
  fullnamedisplay: string;
  viewurl: string;
  courseimage: string;
  progress?: number;
  hasprogress: number;
  isfavourite: number;
  hidden: number;
  timeaccess?: number;
  showshortname: number;
  coursecategory: string;
};

export type CalendarSubscription = {
  displayeventsource: number;
  subscriptionname?: string;
  subscriptionurl?: string;
};

export type CalendarAction = {
  name: string;
  url: string;
  itemcount: number;
  actionable: number;
  showitemcount: number;
};

export type CalendarEvent = {
  id: number;
  name: string;
  description?: string;
  descriptionformat: number;
  location?: string;
  categoryid?: number;
  groupid?: number;
  userid?: number;
  repeatid?: number;
  eventcount?: number;
  component?: string;
  modulename?: string;
  activityname?: string;
  activitystr?: string;
  instance?: number;
  eventtype: string;
  timestart: number;
  timeduration: number;
  timesort: number;
  timeusermidnight: number;
  visible: number;
  timemodified: number;
  overdue?: number;
  icon?: CalendarIcon;
  category?: CalendarCategory;
  course?: CalendarCourse;
  subscription?: CalendarSubscription;
  canedit: number;
  candelete: number;
  deleteurl: string;
  editurl: string;
  viewurl: string;
  formattedtime: string;
  formattedlocation: string;
  isactionevent: number;
  iscourseevent: number;
  iscategoryevent: number;
  groupname?: string;
  normalisedeventtype: string;
  normalisedeventtypetext: string;
  action?: CalendarAction;
  purpose: string;
  branded?: number;
  url: string;
  islastday: number;
  popupname: string;
  mindaytimestamp?: number;
  mindayerror?: string;
  maxdaytimestamp?: number;
  maxdayerror?: string;
  draggable: number;
};

export type CalendarDate = {
  seconds: number;
  minutes: number;
  hours: number;
  mday: number;
  wday: number;
  mon: number;
  year: number;
  yday: number;
  weekday: string;
  month: string;
  timestamp: number;
};

export type CalendarDayViewResponse = {
  events: CalendarEvent[];
  defaulteventcontext: number;
  filter_selector: string;
  courseid: number;
  categoryid?: number;
  neweventtimestamp: number;
  date: CalendarDate;
  periodname: string;
  previousperiod: CalendarDate;
  previousperiodlink: string;
  previousperiodname: string;
  nextperiod: CalendarDate;
  nextperiodname: string;
  nextperiodlink: string;
  larrow: string;
  rarrow: string;
};

// --- Types for creating events ---
export type CreateCalendarEventInput = {
  name: string;
  description?: string | null;
  format?: number; // default 1
  courseid?: number; // default 0
  groupid?: number; // default 0
  repeats?: number; // default 0
  eventtype?: string; // default 'user'
  timestart?: number; // default example value
  timeduration?: number; // default 0
  visible?: number; // default 1
  sequence?: number; // default 1
};

export type CreatedCalendarEvent = {
  id: number;
  name: string;
  description?: string;
  format: number;
  courseid: number;
  groupid: number;
  userid: number;
  repeatid?: number;
  modulename?: string;
  instance: number;
  eventtype: string;
  timestart: number;
  timeduration: number;
  visible: number;
  uuid?: string;
  sequence: number;
  timemodified: number;
  subscriptionid?: number;
};

export type CalendarWarning = {
  item?: string;
  itemid?: number;
  warningcode: string;
  message: string;
};

export type CreateCalendarEventsResponse = {
  events: CreatedCalendarEvent[];
  warnings?: CalendarWarning[];
};

export type CalendarPermissionsResponse = {
  canmanageentries: number;
  canmanageownentries: number;
  canmanagegroupentries: number;
  warnings?: CalendarWarning[];
};

export const calendarPermissionsResponseSchema = {
  type: "object",
  properties: {
    canmanageentries: { type: "number" },
    canmanageownentries: { type: "number" },
    canmanagegroupentries: { type: "number" },
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
  required: ["canmanageentries", "canmanageownentries", "canmanagegroupentries"],
  additionalProperties: false,
};

// --- AJV response schemas ---
export const createdCalendarEventSchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
    description: { type: "string" },
    format: { type: "number" },
    courseid: { type: "number" },
    groupid: { type: "number" },
    userid: { type: "number" },
    repeatid: { type: "number" },
    modulename: { type: "string" },
    instance: { type: "number" },
    eventtype: { type: "string" },
    timestart: { type: "number" },
    timeduration: { type: "number" },
    visible: { type: "number" },
    uuid: { type: "string" },
    sequence: { type: "number" },
    timemodified: { type: "number" },
    subscriptionid: { type: "number" },
  },
  required: [
    "id",
    "name",
    "format",
    "courseid",
    "groupid",
    "userid",
    "instance",
    "eventtype",
    "timestart",
    "timeduration",
    "visible",
    "sequence",
    "timemodified",
  ],
  additionalProperties: false,
};

export const createCalendarEventsResponseSchema = {
  type: "object",
  properties: {
    events: { type: "array", items: createdCalendarEventSchema },
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
  required: ["events"],
  additionalProperties: false,
};

export const core_calendar_tools: ToolSpec[] = [
  {
    name: "core_calendar_get_day_view",
    moodleFunction: "core_calendar_get_day_view",
    description: "Fetch the day view data for a calendar.",
    inputSchema: {
      type: "object",
      properties: {
        year: { type: "number" },
        month: { type: "number" },
        day: { type: "number" },
        courseid: { type: "number" },
        categoryid: { type: "number" },
      },
      required: ["year", "month", "day"],
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager", "editingteacher", "teacher", "student", "user"],
    examples: {
      minimal: { year: 2026, month: 2, day: 1 },
    },
  },
  {
    name: "core_calendar_create_calendar_events",
    moodleFunction: "core_calendar_create_calendar_events",
    description: "Create one or more calendar events.",
    inputSchema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: ["string", "null"] },
              format: { type: "number" },
              courseid: { type: "number" },
              groupid: { type: "number" },
              repeats: { type: "number" },
              eventtype: { type: "string" },
              timestart: { type: "number" },
              timeduration: { type: "number" },
              visible: { type: "number" },
              sequence: { type: "number" },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
      },
      required: ["events"],
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager", "editingteacher", "teacher", "student", "user"],
    examples: {
      minimal: {
        events: [
          {
            name: "Example event",
            description: null,
            format: 1,
            courseid: 0,
            groupid: 0,
            repeats: 0,
            eventtype: "user",
            timestart: 1769978275,
            timeduration: 0,
            visible: 1,
            sequence: 1,
          },
        ],
      },
    },
  },
  {
    name: "core_calendar_get_calendar_permissions",
    moodleFunction: "core_calendar_get_calendar_permissions",
    description: "Convenience function to retrieve permissions/access information for a course calendar.",
    inputSchema: {
      type: "object",
      properties: {
        courseid: { type: "number" },
      },
      additionalProperties: false,
    },
    allowedRoles: ["admin", "manager", "editingteacher", "teacher", "student", "user"],
    examples: {
      minimal: { courseid: 0 },
      typical: { courseid: 2 },
    },
  },
];

/**
 * Helper to create calendar events for a tenant.
 * - Uses POST to send the events array in the expected Moodle format.
 */
export async function createCalendarEvents(
  tenant: Tenant,
  events: CreateCalendarEventInput[],
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<CreateCalendarEventsResponse> {
  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_calendar_create_calendar_events",
    { events },
    { method: "POST", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  // Validate response shape with AJV
  const { ok, errors } = validateSchema(createCalendarEventsResponseSchema, resp);
  if (!ok) {
    const fakeSpec = {
      name: "core_calendar_create_calendar_events:response",
      inputSchema: createCalendarEventsResponseSchema,
    } as any;

    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(
      `Invalid response from core_calendar_create_calendar_events: ${JSON.stringify(payload)}`,
    );
  }

  return resp as CreateCalendarEventsResponse;
}

/**
 * Helper to get calendar permissions for a tenant/course.
 * - courseid is optional (default 0 for site calendar)
 */
export async function getCalendarPermissions(
  tenant: Tenant,
  courseid?: number,
  options?: { signal?: AbortSignal; timeoutMs?: number },
): Promise<CalendarPermissionsResponse> {
  const params = courseid === undefined ? {} : { courseid };

  const resp = await callMoodleAPI(
    tenant.moodleUrl,
    tenant.moodleToken,
    "core_calendar_get_calendar_permissions",
    params,
    { method: "GET", signal: options?.signal, timeoutMs: options?.timeoutMs },
  );

  const { ok, errors } = validateSchema(calendarPermissionsResponseSchema, resp);
  if (!ok) {
    const fakeSpec = {
      name: "core_calendar_get_calendar_permissions:response",
      inputSchema: calendarPermissionsResponseSchema,
    } as any;

    const payload = formatValidationError(fakeSpec, errors);
    throw new Error(
      `Invalid response from core_calendar_get_calendar_permissions: ${JSON.stringify(payload)}`,
    );
  }

  return resp as CalendarPermissionsResponse;
}

export default {};
