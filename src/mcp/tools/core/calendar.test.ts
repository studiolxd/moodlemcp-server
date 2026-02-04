/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCalendarEvents, CreateCalendarEventInput } from "./calendar.js";
import type { Tenant } from "../../types.js";
import { callMoodleAPI } from "../../../moodle-client.js";

vi.mock("../../../moodle-client.js", () => ({
  callMoodleAPI: vi.fn(),
}));

describe("createCalendarEvents", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns parsed events when response is valid", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };

    const reqEvents: CreateCalendarEventInput[] = [
      {
        name: "Test event",
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
    ];

    const apiResp = {
      events: [
        {
          id: 123,
          name: "Test event",
          format: 1,
          courseid: 0,
          groupid: 0,
          userid: 2,
          instance: 0,
          eventtype: "user",
          timestart: 1769978275,
          timeduration: 0,
          visible: 1,
          sequence: 1,
          timemodified: 111111,
        },
      ],
    };

    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const res = await createCalendarEvents(tenant, reqEvents);

    expect(res).toEqual(apiResp);
    expect(callMoodleAPI).toHaveBeenCalledWith(
      tenant.moodleUrl,
      tenant.moodleToken,
      "core_calendar_create_calendar_events",
      { events: reqEvents },
      expect.any(Object),
    );
  });

  it("throws when API returns invalid response", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };

    const reqEvents: CreateCalendarEventInput[] = [{ name: "Test event" }];

    const badResp = { wrong: "shape" };

    (callMoodleAPI as any).mockResolvedValueOnce(badResp);

    await expect(createCalendarEvents(tenant, reqEvents)).rejects.toThrow(/VALIDATION_ERROR/);
  });

  it("returns warnings when API provides them", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };
    const reqEvents: CreateCalendarEventInput[] = [{ name: "Test event" }];

    const apiResp = {
      events: [
        {
          id: 123,
          name: "Test event",
          format: 1,
          courseid: 0,
          groupid: 0,
          userid: 2,
          instance: 0,
          eventtype: "user",
          timestart: 1769978275,
          timeduration: 0,
          visible: 1,
          sequence: 1,
          timemodified: 111111,
        },
      ],
      warnings: [
        { item: "events", itemid: 0, warningcode: "W1", message: "Minor issue" },
      ],
    };

    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const res = await createCalendarEvents(tenant, reqEvents);
    expect(res.warnings).toEqual(apiResp.warnings);
  });

  it("forwards timeoutMs and signal to callMoodleAPI options", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };
    const reqEvents: CreateCalendarEventInput[] = [{ name: "Test event" }];

    const apiResp = {
      events: [
        {
          id: 123,
          name: "Test event",
          format: 1,
          courseid: 0,
          groupid: 0,
          userid: 2,
          instance: 0,
          eventtype: "user",
          timestart: 1769978275,
          timeduration: 0,
          visible: 1,
          sequence: 1,
          timemodified: 111111,
        },
      ],
    };

    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const controller = new AbortController();
    const res = await createCalendarEvents(tenant, reqEvents, { signal: controller.signal, timeoutMs: 5000 });

    expect(res).toEqual(apiResp);

    // Ensure the options object passed to callMoodleAPI contains our signal and timeout
    const lastCall = (callMoodleAPI as any).mock.calls[0];
    expect(lastCall[4]).toEqual({ method: "POST", signal: controller.signal, timeoutMs: 5000 });
  });

  it("rejects when signal is aborted", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };
    const reqEvents: CreateCalendarEventInput[] = [{ name: "Test event" }];

    // Mock implementation that listens to the provided signal and rejects when aborted
    (callMoodleAPI as any).mockImplementationOnce((moodleUrl: any, token: any, func: any, params: any, opts: any) => {
      return new Promise((resolve, reject) => {
        const sig: AbortSignal | undefined = opts?.signal;
        if (!sig) return; // never resolves
        if (sig.aborted) return reject(new Error("aborted"));
        const onAbort = () => {
          reject(new Error("aborted"));
        };
        sig.addEventListener("abort", onAbort, { once: true });
      });
    });

    const controller = new AbortController();
    const p = createCalendarEvents(tenant, reqEvents, { signal: controller.signal, timeoutMs: 1000 });

    // Abort shortly after starting
    controller.abort();

    await expect(p).rejects.toThrow(/aborted/);
  });

  it("rejects when a timeout occurs", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };
    const reqEvents: CreateCalendarEventInput[] = [{ name: "Test event" }];

    // Simulate that callMoodleAPI fails when timeoutMs is provided
    (callMoodleAPI as any).mockImplementationOnce((moodleUrl: any, token: any, func: any, params: any, opts: any) => {
      if (opts?.timeoutMs) return Promise.reject(new Error("timeout"));
      return Promise.resolve({ events: [] });
    });

    await expect(createCalendarEvents(tenant, reqEvents, { timeoutMs: 1 })).rejects.toThrow(/timeout/);
  });

  describe("getCalendarPermissions", () => {
    it("returns parsed permissions when response is valid", async () => {
      const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };

      const apiResp = {
        canmanageentries: 1,
        canmanageownentries: 0,
        canmanagegroupentries: 0,
      };

      (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

      const { getCalendarPermissions } = await import("./calendar.js");
      const res = await getCalendarPermissions(tenant, 2);

      expect(res).toEqual(apiResp);
      expect(callMoodleAPI).toHaveBeenCalledWith(
        tenant.moodleUrl,
        tenant.moodleToken,
        "core_calendar_get_calendar_permissions",
        { courseid: 2 },
        expect.any(Object),
      );
    });

    it("works when courseid is omitted (defaults) and forwards options", async () => {
      const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };

      const apiResp = {
        canmanageentries: 0,
        canmanageownentries: 1,
        canmanagegroupentries: 0,
      };

      (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

      const { getCalendarPermissions } = await import("./calendar.js");
      const controller = new AbortController();
      const res = await getCalendarPermissions(tenant, undefined, { signal: controller.signal, timeoutMs: 2000 });

      expect(res).toEqual(apiResp);

      const lastCall = (callMoodleAPI as any).mock.calls[(callMoodleAPI as any).mock.calls.length - 1];
      expect(lastCall[4]).toEqual({ method: "GET", signal: controller.signal, timeoutMs: 2000 });
    });

    it("throws when API returns invalid response", async () => {
      const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["user"] };
      (callMoodleAPI as any).mockResolvedValueOnce({ bad: "shape" });

      const { getCalendarPermissions } = await import("./calendar.js");
      await expect(getCalendarPermissions(tenant, 0)).rejects.toThrow(/VALIDATION_ERROR/);
    });
  });
});
