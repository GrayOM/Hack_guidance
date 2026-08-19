import { describe, expect, it, vi } from "vitest";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("sonner", () => ({ toast }));

import { isValidMagicLinkEmail, sendSupabaseMagicLink } from "../client/src/hooks/usePlatformAuth";

describe("Supabase email magic link", () => {
  it("rejects malformed email before making an Auth request", async () => {
    const signInWithOtp = vi.fn();

    await expect(sendSupabaseMagicLink("not-an-email", { auth: { signInWithOtp } }, "https://example.test/Hack_guidance/")).resolves.toBe("invalid");
    expect(isValidMagicLinkEmail("not-an-email")).toBe(false);
    expect(signInWithOtp).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("이메일 주소 형식을 확인해 주세요.");
  });

  it("sends a normalized address and shows a success message", async () => {
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });

    await expect(sendSupabaseMagicLink(" analyst@example.test ", { auth: { signInWithOtp } }, "https://example.test/Hack_guidance/")).resolves.toBe("sent");
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "analyst@example.test",
      options: { emailRedirectTo: "https://example.test/Hack_guidance/", shouldCreateUser: true },
    });
    expect(toast.success).toHaveBeenCalledWith("매직 링크를 전송했습니다. 이메일에서 링크를 열어 로그인해 주세요.");
  });

  it("reports Supabase and connection failures without exposing the email address", async () => {
    const rejectedByAuth = vi.fn().mockResolvedValue({ error: { message: "rate limited" } });
    const networkFailure = vi.fn().mockRejectedValue(new Error("network unavailable"));

    await expect(sendSupabaseMagicLink("analyst@example.test", { auth: { signInWithOtp: rejectedByAuth } }, "https://example.test/Hack_guidance/")).resolves.toBe("failed");
    expect(toast.error).toHaveBeenCalledWith("매직 링크를 전송하지 못했습니다: rate limited");

    await expect(sendSupabaseMagicLink("analyst@example.test", { auth: { signInWithOtp: networkFailure } }, "https://example.test/Hack_guidance/")).resolves.toBe("failed");
    expect(toast.error).toHaveBeenCalledWith("매직 링크 전송 중 연결 오류가 발생했습니다.");
  });
});
