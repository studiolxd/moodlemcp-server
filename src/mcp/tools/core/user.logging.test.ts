/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callMoodleAPI } from "../../../moodle-client.js";
import type { Tenant } from "../../types.js";

vi.mock("../../../moodle-client.js", () => ({ callMoodleAPI: vi.fn() }));

const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };

describe("logging respects LOG_LEVEL", () => {
  let logSpy: any;
  let warnSpy: any;
  let prev: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    prev = (globalThis as any).process?.env?.LOG_LEVEL;
  });

  afterEach(() => {
    process.env.LOG_LEVEL = prev;
    vi.restoreAllMocks();
  });

  it("silent suppresses both info and warn", async () => {
    (globalThis as any).process.env.LOG_LEVEL = "silent";
    const { createUsers } = await import("./user.js");
    await (callMoodleAPI as any).mockResolvedValueOnce([]);
    await expect(createUsers(tenant, [{ username: "a", firstname: "A", lastname: "B", email: "a@b.com" }])).resolves.toBeTruthy();
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("info enables info and warn", async () => {
    (globalThis as any).process.env.LOG_LEVEL = "info";
    const { deleteUsers } = await import("./user.js");
    (callMoodleAPI as any).mockResolvedValueOnce(true);
    await deleteUsers(tenant, [1]);
    expect(logSpy).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });

  it("warn disables info but enables warn", async () => {
    (globalThis as any).process.env.LOG_LEVEL = "warn";
    const { updateUsers } = await import("./user.js");
    (callMoodleAPI as any).mockResolvedValueOnce({});
    await updateUsers(tenant, [{ id: 1 }]);
    expect(logSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});