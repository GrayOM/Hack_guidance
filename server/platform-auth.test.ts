import { describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

import { isValidAccountEmail, isValidAccountPassword, isValidDisplayName, registerSupabaseAccount, sendPasswordResetEmail, signInSupabaseAccount, updateSupabasePassword } from "../client/src/hooks/usePlatformAuth";

describe("Supabase independent email and password account", () => {
  it("rejects malformed registration input before making an Auth request", async () => {
    const signUp = vi.fn();

    await expect(registerSupabaseAccount({ email: "not-an-email", password: "safe-password", displayName: "Analyst" }, { auth: { signUp, signInWithPassword: vi.fn() } }, "https://example.test/Hack_guidance/")).resolves.toBe("invalid");
    expect(isValidAccountEmail("not-an-email")).toBe(false);
    expect(isValidDisplayName("A")).toBe(false);
    expect(isValidAccountPassword("short")).toBe(false);
    expect(signUp).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("이메일 주소 형식을 확인해 주세요.");
  });

  it("creates a named account without exposing the password", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: {} }, error: null });

    await expect(registerSupabaseAccount({ email: " analyst@example.test ", password: "safe-password", displayName: " GrayOM Analyst " }, { auth: { signUp, signInWithPassword: vi.fn() } }, "https://example.test/Hack_guidance/")).resolves.toBe("signed-in");
    expect(signUp).toHaveBeenCalledWith({
      email: "analyst@example.test",
      password: "safe-password",
      options: { data: { name: "GrayOM Analyst" }, emailRedirectTo: "https://example.test/Hack_guidance/" },
    });
    expect(toast.success).toHaveBeenCalledWith("계정 생성과 로그인이 완료되었습니다.");
  });

  it("waits for email confirmation before announcing public profile registration", async () => {
    const signUp = vi.fn().mockResolvedValue({ data: { session: null }, error: null });

    await expect(registerSupabaseAccount({ email: "analyst@example.test", password: "safe-password", displayName: "GrayOM Analyst" }, { auth: { signUp, signInWithPassword: vi.fn() } }, "https://example.test/Hack_guidance/")).resolves.toBe("confirmation-sent");
    expect(toast.success).toHaveBeenCalledWith("확인 이메일을 전송했습니다. 이메일 인증을 완료하면 공개 프로필과 랭킹에 등록됩니다.");
  });

  it("logs in with a password and reports credential failures generically", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const rejectedSignIn = vi.fn().mockResolvedValue({ error: { message: "invalid credentials" } });
    const client = { auth: { signUp: vi.fn(), signInWithPassword } };

    await expect(signInSupabaseAccount({ email: "analyst@example.test", password: "safe-password" }, client)).resolves.toBe("signed-in");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "analyst@example.test", password: "safe-password" });

    await expect(signInSupabaseAccount({ email: "analyst@example.test", password: "safe-password" }, { auth: { signUp: vi.fn(), signInWithPassword: rejectedSignIn } })).resolves.toBe("failed");
    expect(toast.error).toHaveBeenCalledWith("이메일 또는 비밀번호가 올바르지 않습니다.");
  });

  it("sends a password reset email only for a valid address and directs it to the update screen", async () => {
    const resetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), resetPasswordForEmail } };

    await expect(sendPasswordResetEmail({ email: " analyst@example.test " }, client, "https://example.test/Hack_guidance/")).resolves.toBe("sent");
    expect(resetPasswordForEmail).toHaveBeenCalledWith("analyst@example.test", { redirectTo: "https://example.test/Hack_guidance/" });

    await expect(sendPasswordResetEmail({ email: "broken" }, client, "https://example.test/Hack_guidance/")).resolves.toBe("invalid");
    expect(resetPasswordForEmail).toHaveBeenCalledTimes(1);
  });

  it("updates a password only after local length validation", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), updateUser } };

    await expect(updateSupabasePassword({ password: "short" }, client)).resolves.toBe("invalid");
    expect(updateUser).not.toHaveBeenCalled();
    await expect(updateSupabasePassword({ password: "safe-password" }, client)).resolves.toBe("updated");
    expect(updateUser).toHaveBeenCalledWith({ password: "safe-password" });
  });
});
