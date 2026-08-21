import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const displayNamePattern = /^[가-힣A-Za-z0-9 _-]{2,24}$/;
const blackTraceFlags: Record<number, string> = {
  1: "FLAG{ghost_in_the_source}",
  2: "FLAG{hidden_fields_remember}",
  3: "FLAG{attributes_tell_more}",
  4: "FLAG{cookies_leave_traces}",
  5: "FLAG{read_the_address}",
  6: "FLAG{the_server_did_answer}",
  7: "FLAG{follow_the_location}",
  8: "FLAG{headers_can_whisper}",
  9: "FLAG{robots_know_the_way}",
  10: "FLAG{two_places_one_key}",
};

function blackTraceAccess(stage: number) {
  if (stage >= 10) return "OPERATOR";
  if (stage >= 7) return "FIELD OPERATOR";
  if (stage >= 4) return "ANALYST";
  return "GUEST";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } });
}

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof payload?.action === "string" ? payload.action : "";

  if (action === "checkDisplayName") {
    const displayName = typeof payload?.displayName === "string" ? payload.displayName.trim() : "";
    if (!displayNamePattern.test(displayName)) return json({ available: false, valid: false });
    const { data, error } = await service.rpc("hg_display_name_available", { p_display_name: displayName, p_exclude_user_id: null });
    return error ? json({ error: "Unable to check display name" }, 500) : json({ available: Boolean(data), valid: true });
  }

  if (action === "ranking") return json({ ranking: [] });
  if (action === "verifyCertificate") return json({ certificate: null });

  const user = await requireUser(request);
  if (!user) return json({ error: "Please sign in" }, 401);
  if (!user.email_confirmed_at) return json({ error: "Please confirm your email address" }, 403);

  if (action === "provisionProfile") {
    const { data: displayName, error } = await service.rpc("hg_provision_confirmed_profile", { p_user_id: user.id });
    return error ? json({ error: "Unable to create learner profile" }, 500) : json({ profile: { displayName } });
  }

  if (action === "profile") {
    const { data: profile, error } = await service.from("hg_profiles").select("display_name, created_at, updated_at").eq("id", user.id).maybeSingle();
    if (error || !profile) return json({ error: "Unable to load profile" }, 500);
    return json({ profile: { displayName: profile.display_name, createdAt: profile.created_at, updatedAt: profile.updated_at }, summary: { solvedCount: 0, defenseReviewCount: 0, hasCertificate: false } });
  }

  if (action === "updateDisplayName") {
    const displayName = typeof payload?.displayName === "string" ? payload.displayName.trim() : "";
    if (!displayNamePattern.test(displayName)) return json({ error: "Invalid display name" }, 400);
    const { data: available, error: availabilityError } = await service.rpc("hg_display_name_available", { p_display_name: displayName, p_exclude_user_id: user.id });
    if (availabilityError) return json({ error: "Unable to check display name" }, 500);
    if (!available) return json({ error: "Display name is unavailable" }, 409);
    const { data: profile, error: profileError } = await service.from("hg_profiles").update({ display_name: displayName, updated_at: new Date().toISOString() }).eq("id", user.id).select("display_name, updated_at").maybeSingle();
    if (profileError?.code === "23505") return json({ error: "Display name is unavailable" }, 409);
    if (profileError || !profile) return json({ error: "Unable to update display name" }, 500);
    const { error: metadataError } = await service.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, name: displayName } });
    return metadataError ? json({ error: "Unable to synchronize profile" }, 500) : json({ profile: { displayName: profile.display_name, updatedAt: profile.updated_at } });
  }

  if (action === "blackTraceProgress") {
    const { data, error } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id).order("stage");
    if (error) return json({ error: "Unable to load operation progress" }, 500);
    const completedStages = (data ?? []).map(row => row.stage as number);
    const currentStage = Array.from({ length: 10 }, (_, index) => index + 1).find(stage => !completedStages.includes(stage)) ?? 10;
    return json({ completedStages, currentStage, accessLevel: blackTraceAccess(completedStages.length >= 10 ? 10 : currentStage), completed: completedStages.length === 10 });
  }

  if (action === "blackTraceSubmit") {
    const stage = typeof payload?.stage === "number" ? payload.stage : 0;
    const flag = typeof payload?.flag === "string" ? payload.flag.trim() : "";
    const hintCount = typeof payload?.hintCount === "number" ? Math.max(0, Math.min(2, Math.floor(payload.hintCount))) : 0;
    const expected = blackTraceFlags[stage];
    if (!expected) return json({ correct: false, message: "Unknown operation node" }, 400);
    const { data: existing, error: progressError } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id).order("stage");
    if (progressError) return json({ error: "Unable to verify operation progress" }, 500);
    const completedStages = (existing ?? []).map(row => row.stage as number);
    const firstOpen = Array.from({ length: 10 }, (_, index) => index + 1).find(node => !completedStages.includes(node)) ?? 10;
    if (!completedStages.includes(stage) && stage > firstOpen) return json({ correct: false, message: "Clear the previous node first" }, 409);
    if (flag !== expected) return json({ correct: false, message: "INVALID ACCESS KEY" });
    const { error: saveError } = await service.from("hg_black_trace_progress").upsert({ user_id: user.id, stage, hint_count: hintCount }, { onConflict: "user_id,stage" });
    if (saveError) return json({ error: "Unable to store recovered trace" }, 500);
    const nextStages = completedStages.includes(stage) ? completedStages : [...completedStages, stage].sort((a, b) => a - b);
    return json({ correct: true, alreadyCompleted: completedStages.includes(stage), completedStages: nextStages, accessLevel: blackTraceAccess(stage), operationComplete: nextStages.length === 10 });
  }

  if (action === "dashboard") return json({ completedIds: [], defenseReviewedIds: [], certificate: null });
  if (action === "records") return json({ records: [] });
  if (action === "practice") return json({ verified: false, message: "현재 등록된 문제가 없습니다." }, 410);
  if (action === "submit") return json({ correct: false, message: "현재 등록된 문제가 없습니다." });
  if (action === "reviewDefense") return json({ success: false, message: "현재 등록된 문제가 없습니다." });
  if (action === "issueCertificate") return json({ issued: false, remaining: { modules: null } });

  return json({ error: "Unsupported action" }, 400);
});
