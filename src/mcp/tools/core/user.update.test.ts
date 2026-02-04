/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callMoodleAPI } from "../../../moodle-client.js";
import type { Tenant } from "../../types.js";

vi.mock("../../../moodle-client.js", () => ({ callMoodleAPI: vi.fn() }));

describe("updateUsers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns warnings when API returns them", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users = [{ id: 1, email: "new@example.org" }];

    const apiResp = { warnings: [{ warningcode: "W1", message: "ok" }] };
    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const { updateUsers } = await import("./user.js");
    const res = await updateUsers(tenant, users);
    expect(res).toEqual(apiResp);
  });

  it("validates input and throws when id missing", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const bad: any = [{ email: "a@example.org" }];

    const { updateUsers } = await import("./user.js");
    await expect(updateUsers(tenant, bad)).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();
  });

  it("throws on invalid response shape", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users = [{ id: 1 }];
    (callMoodleAPI as any).mockResolvedValueOnce("not-valid");

    const { updateUsers } = await import("./user.js");
    await expect(updateUsers(tenant, users)).rejects.toThrow(/Invalid response/);
  });

  it("forwards timeout and signal options", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users = [{ id: 7 }];
    (callMoodleAPI as any).mockResolvedValueOnce({});

    const controller = new AbortController();
    const { updateUsers } = await import("./user.js");
    const res = await updateUsers(tenant, users, { signal: controller.signal, timeoutMs: 7000 });

    expect(res).toEqual({});
    const lastCall = (callMoodleAPI as any).mock.calls[0];
    expect(lastCall[4]).toEqual({ method: "POST", signal: controller.signal, timeoutMs: 7000 });
  });
});