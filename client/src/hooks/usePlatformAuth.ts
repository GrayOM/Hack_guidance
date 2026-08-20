import { invokeLearning, isExternalSupabaseDeployment, supabase } from "@/lib/external-supabase";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PlatformUser = { id: string; name?: string | null; email?: string | null };

type PasswordAuthClient = {
  auth: {
    signUp: (input: { email: string; password: string; options: { data: { name: string }; emailRedirectTo: string } }) => Promise<{ data: { session: unknown | null }; error: { message: string } | null }>;
    signInWithPassword: (input: { email: string; password: string }) => Promise<{ error: { message: string } | null }>;
    resetPasswordForEmail?: (email: string, options: { redirectTo: string }) => Promise<{ error: { message: string } | null }>;
    updateUser?: (input: { password: string }) => Promise<{ error: { message: string } | null }>;
  };
};

const appRedirectUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

export function isValidAccountEmail(email: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }
export function isValidDisplayName(name: string) { return /^[가-힣A-Za-z0-9 _-]{2,24}$/.test(name.trim()); }
export function isValidAccountPassword(password: string) { return password.length >= 8 && password.length <= 72; }

export async function registerSupabaseAccount(input: { email: string; password: string; displayName: string }, client: PasswordAuthClient | null = supabase, emailRedirectTo = appRedirectUrl()) {
  const email = input.email.trim();
  const displayName = input.displayName.trim();
  if (!isValidAccountEmail(email)) { toast.error("이메일 주소 형식을 확인해 주세요."); return "invalid" as const; }
  if (!isValidDisplayName(displayName)) { toast.error("공개명은 2~24자의 한글·영문·숫자·공백·밑줄·하이픈만 사용할 수 있습니다."); return "invalid" as const; }
  if (!isValidAccountPassword(input.password)) { toast.error("비밀번호는 8~72자로 입력해 주세요."); return "invalid" as const; }
  if (!client) { toast.error("외부 인증 설정을 확인하지 못했습니다."); return "failed" as const; }
  try {
    const { data, error } = await client.auth.signUp({ email, password: input.password, options: { data: { name: displayName }, emailRedirectTo } });
    if (error) { toast.error("회원가입을 완료하지 못했습니다. 이메일과 공개명을 다시 확인해 주세요."); return "failed" as const; }
    if (data.session) { toast.success("계정 생성과 로그인이 완료되었습니다."); return "signed-in" as const; }
    toast.success("확인 이메일을 전송했습니다. 이메일 인증을 완료하면 공개 프로필과 랭킹에 등록됩니다.");
    return "confirmation-sent" as const;
  } catch { toast.error("회원가입 중 연결 오류가 발생했습니다."); return "failed" as const; }
}

export async function signInSupabaseAccount(input: { email: string; password: string }, client: PasswordAuthClient | null = supabase) {
  const email = input.email.trim();
  if (!isValidAccountEmail(email) || !isValidAccountPassword(input.password)) { toast.error("이메일 또는 비밀번호 형식을 확인해 주세요."); return "invalid" as const; }
  if (!client) { toast.error("외부 인증 설정을 확인하지 못했습니다."); return "failed" as const; }
  try {
    const { error } = await client.auth.signInWithPassword({ email, password: input.password });
    if (error) { toast.error("이메일 또는 비밀번호가 올바르지 않습니다."); return "failed" as const; }
    toast.success("로그인되었습니다.");
    return "signed-in" as const;
  } catch { toast.error("로그인 중 연결 오류가 발생했습니다."); return "failed" as const; }
}

export async function sendPasswordResetEmail(input: { email: string }, client: PasswordAuthClient | null = supabase, redirectTo = appRedirectUrl()) {
  const email = input.email.trim();
  if (!isValidAccountEmail(email)) { toast.error("이메일 주소 형식을 확인해 주세요."); return "invalid" as const; }
  if (!client?.auth.resetPasswordForEmail) { toast.error("외부 인증 설정을 확인하지 못했습니다."); return "failed" as const; }
  try {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) { toast.error("재설정 이메일을 요청하지 못했습니다. 잠시 후 다시 시도해 주세요."); return "failed" as const; }
    toast.success("계정이 있으면 비밀번호 재설정 이메일을 전송했습니다.");
    return "sent" as const;
  } catch { toast.error("재설정 이메일 요청 중 연결 오류가 발생했습니다."); return "failed" as const; }
}

export async function updateSupabasePassword(input: { password: string }, client: PasswordAuthClient | null = supabase) {
  if (!isValidAccountPassword(input.password)) { toast.error("비밀번호는 8~72자로 입력해 주세요."); return "invalid" as const; }
  if (!client?.auth.updateUser) { toast.error("외부 인증 설정을 확인하지 못했습니다."); return "failed" as const; }
  try {
    const { error } = await client.auth.updateUser({ password: input.password });
    if (error) { toast.error("비밀번호를 변경하지 못했습니다. 재설정 링크를 다시 요청해 주세요."); return "failed" as const; }
    toast.success("새 비밀번호가 설정되었습니다.");
    return "updated" as const;
  } catch { toast.error("비밀번호 변경 중 연결 오류가 발생했습니다."); return "failed" as const; }
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
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    const activateConfirmedUser = async (authUser: User | null) => {
      if (!authUser) {
        if (mounted) setUser(null);
        return;
      }
      if (!authUser.email_confirmed_at) {
        if (mounted) {
          setUser(null);
          setError(new Error("이메일 인증을 완료한 뒤 로그인할 수 있습니다."));
        }
        return;
      }
      try {
        await invokeLearning("provisionProfile");
        if (mounted) {
          setUser(mapUser(authUser));
          setError(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setError(new Error("인증된 학습자 프로필을 준비하지 못했습니다."));
        }
      }
    };
    void supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (authError) {
        if (mounted) setError(authError);
        return;
      }
      await activateConfirmedUser(data.user);
    }).catch(() => { if (mounted) setError(new Error("인증 상태를 확인하지 못했습니다.")); }).finally(() => { if (mounted) setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      void activateConfirmedUser(session?.user ?? null);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  const logout = useCallback(async () => { await supabase?.auth.signOut(); setUser(null); setPasswordRecovery(false); }, []);
  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);
  return useMemo(() => ({ user, loading, error, isAuthenticated: Boolean(user), passwordRecovery, clearPasswordRecovery, refresh: async () => {
    const { data, error: authError } = await supabase?.auth.getUser() ?? { data: { user: null }, error: null };
    if (authError || !data.user?.email_confirmed_at) { setUser(null); return; }
    try { await invokeLearning("provisionProfile"); setUser(mapUser(data.user)); } catch { setUser(null); }
  }, logout }), [clearPasswordRecovery, error, loading, logout, passwordRecovery, user]);
}

/** Stable auth contract for Hack Guidance's independent Supabase account system. */
export function usePlatformAuth() { return useSupabaseAuth(); }
export function startPlatformLogin() { window.dispatchEvent(new Event("hack-guidance:open-auth")); }
