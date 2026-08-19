import { useAuth as useManusAuth } from "@/_core/hooks/useAuth";
import { startLogin as startManusLogin } from "@/const";
import { isExternalSupabaseDeployment, supabase } from "@/lib/external-supabase";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PlatformUser = { id: string; name?: string | null; email?: string | null };

type MagicLinkClient = {
  auth: {
    signInWithOtp: (input: { email: string; options: { emailRedirectTo: string; shouldCreateUser?: boolean } }) => Promise<{ error: { message: string } | null }>;
  };
};

export function isValidMagicLinkEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function sendSupabaseMagicLink(
  email: string,
  client: MagicLinkClient | null = supabase,
  emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`,
) {
  const normalizedEmail = email.trim();
  if (!isValidMagicLinkEmail(normalizedEmail)) {
    toast.error("이메일 주소 형식을 확인해 주세요.");
    return "invalid" as const;
  }
  if (!client) {
    toast.error("외부 인증 설정을 확인하지 못했습니다.");
    return "failed" as const;
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo, shouldCreateUser: true },
    });
    if (error) {
      toast.error(`매직 링크를 전송하지 못했습니다: ${error.message}`);
      return "failed" as const;
    }
    toast.success("매직 링크를 전송했습니다. 이메일에서 링크를 열어 로그인해 주세요.");
    return "sent" as const;
  } catch {
    toast.error("매직 링크 전송 중 연결 오류가 발생했습니다.");
    return "failed" as const;
  }
}

function mapUser(user: User | null): PlatformUser | null {
  if (!user) return null;
  const metadataName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  return { id: user.id, name: metadataName ?? user.email?.split("@")[0] ?? "분석자", email: user.email };
}

function useSupabaseAuth() {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser()
      .then(({ data, error: authError }) => {
        setUser(mapUser(data.user));
        setError(authError ?? null);
      })
      .catch(() => setError(new Error("인증 상태를 확인하지 못했습니다.")))
      .finally(() => setLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase?.auth.signOut();
    setUser(null);
  }, []);

  return useMemo(() => ({ user, loading, error, isAuthenticated: Boolean(user), refresh: async () => {
    const { data } = await supabase?.auth.getUser() ?? { data: { user: null } };
    setUser(mapUser(data.user));
  }, logout }), [error, loading, logout, user]);
}

/** Stable auth contract that selects Manus OAuth locally and Supabase Auth in a static external build. */
export function usePlatformAuth() {
  return isExternalSupabaseDeployment ? useSupabaseAuth() : useManusAuth();
}

export function startPlatformLogin() {
  if (!isExternalSupabaseDeployment || !supabase) {
    startManusLogin();
    return;
  }
  const provider = import.meta.env.VITE_SUPABASE_AUTH_PROVIDER || "email";
  if (provider === "email") {
    const email = window.prompt("매직 링크를 받을 이메일을 입력하세요.")?.trim();
    if (!email) return;
    void sendSupabaseMagicLink(email);
    return;
  }
  void supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
}
