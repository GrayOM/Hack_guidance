import { createClient } from "@supabase/supabase-js";

// The project address and publishable key are deployment configuration, not application source.
// Baking defaults in here meant rotating them required a code change, and the build could not
// tell a missing configuration apart from the fallback. They now come from the build environment.
export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
export const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "";
const url = supabaseUrl;
const publishableKey = supabasePublishableKey;
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
  const body = await response.json().catch(() => ({})) as T & { error?: string; message?: string; reason?: string };
  if (!response.ok) {
    // The reason code travels with the error so callers can explain the failure to the operator.
    const failure = new Error(body.error ?? body.message ?? "학습 서버에 연결하지 못했습니다.") as Error & { reason?: string };
    if (typeof body.reason === "string") failure.reason = body.reason;
    throw failure;
  }
  return body;
}
