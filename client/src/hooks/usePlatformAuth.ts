import { useAuth as useManusAuth } from "@/_core/hooks/useAuth";
import { startLogin as startManusLogin } from "@/const";
import { isExternalSupabaseDeployment, supabase } from "@/lib/external-supabase";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PlatformUser = { id: string; name?: string | null; email?: string | null };

type PasswordAuthClient = {
  auth: {
    signUp: (input: { email: string; password: string; options: { data: { name: string }; emailRedirectTo: string } }) => Promise<{ data: { session: unknown | null }; error: { message: string } | null }>;
    signInWithPassword: (input: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
  };
};

export function isValidAccountEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidDisplayName(name: string) {
  return /^[가-힣A-Za-z0-9 _-]{2,24}$/.test(name.trim());
}

export function isValidAccountPassword(password: string) {
  return password.length >= 8 && password.length <= 72;
}

export async function registerSupabaseAccount(
  input: { email: string; password: string; displayName: string },
  client: PasswordAuthClient | null = supabase,
  emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`,
) {
  const email = input.email.trim();
  const displayName = input.displayName.trim();
  if (!isValidAccountEmail(email)) {
    toast.error("이메일 주소 형식을 확인해 주세요.");
    return "invalid" as const;
  }
  if (!isValidDisplayName(displayName)) {
    toast.error("분석자명은 2~24자의 한글·영문·숫자·공백·밑줄·하이픈만 사용할 수 있습니다.");
    return "invalid" as const;
  }
  if (!isValidAccountPassword(input.password)) {
    toast.error("비밀번호는 8~72자로 입력해 주세요.");
    return "invalid" as const;
  }
  if (!client) {
    toast.error("외부 인증 설정을 확인하지 못했습니다.");
    return "failed" as const;
  }

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password: input.password,
      options: { data: { name: displayName }, emailRedirectTo },
    });
    if (error) {
      toast.error(`회원가입을 완료하지 못했습니다: ${error.message}`);
      return "failed" as const;
    }
    if (data.session) {
      toast.success("회원가입과 로그인이 완료되었습니다. 공개 랭킹에 등록했습니다.");
      return "signed-in" as const;
    }
    toast.success("확인 이메일을 전송했습니다. 메일의 링크를 열면 회원가입이 완료됩니다.");
    return "confirmation-sent" as const;
  } catch {
    toast.error("회원가입 중 연결 오류가 발생했습니다.");
    return "failed" as const;
  }
}

export async function signInSupabaseAccount(
  input: { email: string; password: string },
  client: PasswordAuthClient | null = supabase,
) {
  const email = input.email.trim();
  if (!isValidAccountEmail(email) || !isValidAccountPassword(input.password)) {
    toast.error("이메일 또는 비밀번호 형식을 확인해 주세요.");
    return "invalid" as const;
  }
  if (!client) {
    toast.error("외부 인증 설정을 확인하지 못했습니다.");
    return "failed" as const;
  }
  try {
    const { error } = await client.auth.signInWithPassword({ email, password: input.password });
    if (error) {
      toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
      return "failed" as const;
    }
    toast.success("로그인되었습니다.");
    return "signed-in" as const;
  } catch {
    toast.error("로그인 중 연결 오류가 발생했습니다.");
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
  if (!isExternalSupabaseDeployment) {
    startManusLogin();
    return;
  }
  window.dispatchEvent(new Event("hack-guidance:open-auth"));
}
