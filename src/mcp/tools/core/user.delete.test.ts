/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callMoodleAPI } from "../../../moodle-client.js";
import { deleteUsers } from "./user.js";
import type { Tenant } from "../../types.js";

vi.mock("../../../moodle-client.js", () => ({ callMoodleAPI: vi.fn() }));

describe("deleteUsers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("resolves when API returns boolean true", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    (callMoodleAPI as any).mockResolvedValueOnce(true);

    const res = await deleteUsers(tenant, [1, 2]);
    expect(res).toBe(true);
    expect(callMoodleAPI).toHaveBeenCalledWith(
      tenant.moodleUrl,
      tenant.moodleToken,
      "core_user_delete_users",
      { userids: [1, 2] },
      expect.any(Object),
    );
  });

  it("resolves when API returns object (empty)", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    (callMoodleAPI as any).mockResolvedValueOnce({});

    const res = await deleteUsers(tenant, [3]);
    expect(res).toEqual({});
  });

  it("throws on invalid response", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    (callMoodleAPI as any).mockResolvedValueOnce("not-valid");

    await expect(deleteUsers(tenant, [4])).rejects.toThrow(/Invalid response/);
  });

  it("validates input and throws without calling API", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };

    await expect(deleteUsers(tenant, [])).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();

    // non-number id
    await expect(deleteUsers(tenant, [1, ("x" as any)])).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();
  });

  it("forwards timeout and signal options", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    (callMoodleAPI as any).mockResolvedValueOnce(true);

    const controller = new AbortController();
    const res = await deleteUsers(tenant, [5], { signal: controller.signal, timeoutMs: 1500 });
    expect(res).toBe(true);

    const lastCall = (callMoodleAPI as any).mock.calls[0];
    expect(lastCall[4]).toEqual({ method: "POST", signal: controller.signal, timeoutMs: 1500 });
  });
});