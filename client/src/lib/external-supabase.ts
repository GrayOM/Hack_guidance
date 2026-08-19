import { createClient } from "@supabase/supabase-js";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "https://xouowashfoyobgcdtagt.supabase.co";
const publishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "sb_publishable_3hgnIxSMX-B5D_C8Y8Eh_Q_hUtC9qnl";
const configured = Boolean(url && publishableKey);

export const isExternalSupabaseDeployment = configured;

export const supabase = configured
  ? createClient(url!, publishableKey!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export async function invokeLearning<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  if (!supabase || !url || !publishableKey) throw new Error("외부 Supabase 환경 변수가 설정되지 않았습니다.");
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${url}/functions/v1/hg-learning`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string; message?: string };
  if (!response.ok) throw new Error(body.error ?? body.message ?? "학습 서버에 연결하지 못했습니다.");
  return body;
}
