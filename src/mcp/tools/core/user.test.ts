/// <reference types="vitest" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { callMoodleAPI } from "../../../moodle-client.js";
import type { Tenant } from "../../types.js";
import type { CreateUserInput } from "./user.js";

vi.mock("../../../moodle-client.js", () => ({ callMoodleAPI: vi.fn() }));

describe("createUsers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns created users when response is valid", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users: CreateUserInput[] = [
      { username: "jdoe", firstname: "John", lastname: "Doe", email: "jdoe@example.org" },
    ];

    const apiResp = [{ id: 42, username: "jdoe" }];
    (callMoodleAPI as any).mockResolvedValueOnce(apiResp);

    const { createUsers } = await import("./user.js");
    const res = await createUsers(tenant, users);

    expect(res).toEqual(apiResp);
    expect(callMoodleAPI).toHaveBeenCalledWith(
      tenant.moodleUrl,
      tenant.moodleToken,
      "core_user_create_users",
      { users },
      expect.any(Object),
    );
  });

  it("throws when response shape is invalid", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users: CreateUserInput[] = [
      { username: "jdoe", firstname: "John", lastname: "Doe", email: "jdoe@example.org" },
    ];

    (callMoodleAPI as any).mockResolvedValueOnce({ bad: "shape" });

    const { createUsers } = await import("./user.js");
    await expect(createUsers(tenant, users)).rejects.toThrow(/Invalid response/);
  });

  it("throws validation error for bad input and doesn't call API", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };

    // invalid email
    const badUsers: CreateUserInput[] = [
      { username: "jdoe", firstname: "John", lastname: "Doe", email: "not-an-email" },
    ];

    const { createUsers } = await import("./user.js");
    await expect(createUsers(tenant, badUsers)).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();

    // missing required field (username)
    const badUsers2: any[] = [{ firstname: "John", lastname: "Doe", email: "jdoe@example.org" }];
    await expect(createUsers(tenant, badUsers2)).rejects.toThrow(/VALIDATION_ERROR/);
    expect(callMoodleAPI).not.toHaveBeenCalled();
  });

  it("forwards timeout and signal options", async () => {
    const tenant: Tenant = { moodleUrl: "https://moodle.test", moodleToken: "token", moodleRoles: ["admin"] };
    const users: CreateUserInput[] = [
      { username: "jdoe", firstname: "John", lastname: "Doe", email: "jdoe@example.org" },
    ];

    (callMoodleAPI as any).mockResolvedValueOnce([{ id: 1, username: "jdoe" }]);

    const controller = new AbortController();
    const { createUsers } = await import("./user.js");
    const res = await createUsers(tenant, users, { signal: controller.signal, timeoutMs: 3000 });

    expect(res).toEqual([{ id: 1, username: "jdoe" }]);
    const lastCall = (callMoodleAPI as any).mock.calls[0];
    expect(lastCall[4]).toEqual({ method: "POST", signal: controller.signal, timeoutMs: 3000 });
  });
});