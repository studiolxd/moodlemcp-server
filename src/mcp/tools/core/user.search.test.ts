/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callMoodleAPI } from "../../../moodle-client.js";
import type { Tenant } from "../../types.js";

vi.mock("../../../moodle-client.js", () => ({ callMoodleAPI: vi.fn() }));

describe("searchUsers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns users when response is valid", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const criteria = [{ key: "username", value: "jdoe" }];

    const apiResp = {
      users: [
        { id: 1, username: "jdoe", fullname: "John Doe", email: "jdoe@example.org" },
      ],
    };

    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const { searchUsers } = await import("./user.js");
    const res = await searchUsers(tenant, criteria);

    expect(res).toEqual(apiResp);
    expect(callMoodleAPI).toHaveBeenCalledWith(
      tenant.moodleUrl,
      tenant.moodleToken,
      "core_user_get_users",
      { criteria },
      expect.any(Object),
    );
  });

  it("throws validation error for duplicate keys and does not call API", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const criteria = [{ key: "username", value: "a" }, { key: "username", value: "b" }];

    const { searchUsers } = await import("./user.js");
    await expect(searchUsers(tenant, criteria)).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();
  });

  it("throws when response shape is invalid", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const criteria = [{ key: "username", value: "jdoe" }];

    (callMoodleAPI as any).mockResolvedValueOnce({ bad: "shape" });

    const { searchUsers } = await import("./user.js");
    await expect(searchUsers(tenant, criteria)).rejects.toThrow(/Invalid response/);
  });

  it("forwards timeout and signal options", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const criteria = [{ key: "lastname", value: "Smith" }];

    (callMoodleAPI as any).mockResolvedValueOnce({ users: [] });

    const controller = new AbortController();
    const { searchUsers } = await import("./user.js");
    const res = await searchUsers(tenant, criteria, { signal: controller.signal, timeoutMs: 1000 });

    expect(res).toEqual({ users: [] });
    const lastCall = (callMoodleAPI as any).mock.calls[0];
    expect(lastCall[4]).toEqual({ method: "POST", signal: controller.signal, timeoutMs: 1000 });
  });
});