import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const displayNamePattern = /^[가-힣A-Za-z0-9 _-]{2,24}$/;
// Traces the client plants in the browser. Their value is derived per operator so that reading
// the JavaScript bundle, or copying someone else's answer, yields nothing usable.
const traceLabels: Record<number, string> = {
  1: "ghost_in_the_source",
  2: "hidden_fields_remember",
  3: "attributes_tell_more",
  4: "cookies_leave_traces",
  5: "read_the_address",
  10: "two_places",
};
const vaultTraceSuffix = "one_key}";

// Traces the operator can only obtain by making the request, so they are not bundle-readable.
const channelFlags: Record<number, string> = {
  6: "FLAG{the_server_did_answer}",
  7: "FLAG{follow_the_location}",
  8: "FLAG{headers_can_whisper}",
  9: "FLAG{robots_know_the_way}",
};

const traceSecret = Deno.env.get("BLACK_TRACE_SECRET") ?? "";
const traceEncoder = new TextEncoder();

async function deriveTraceToken(userId: string, stage: number) {
  const key = await crypto.subtle.importKey("raw", traceEncoder.encode(traceSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, traceEncoder.encode(`black-trace:${userId}:${stage}`));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

function composeTrace(stage: number, token: string | null) {
  const label = traceLabels[stage];
  if (!label) return null;
  const body = token ? `${label}_${token}` : label;
  return stage === 10 ? `FLAG{${body}_` : `FLAG{${body}}`;
}

/** Without BLACK_TRACE_SECRET the derived stages fall back to their pre-rotation values, so a
 *  deployment that forgets the secret keeps the operation solvable instead of breaking it. */
async function expectedTrace(userId: string, stage: number) {
  if (channelFlags[stage]) return channelFlags[stage];
  if (!traceLabels[stage]) return null;
  const token = traceSecret ? await deriveTraceToken(userId, stage) : null;
  const planted = composeTrace(stage, token);
  return stage === 10 ? `${planted}${vaultTraceSuffix}` : planted;
}

async function completedStagesFor(service: { from: (table: string) => any }, userId: string) {
  const { data, error } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", userId).order("stage");
  if (error) return null;
  return (data ?? []).map((row: { stage: number }) => row.stage);
}

function firstOpenStage(completedStages: number[]) {
  return Array.from({ length: 10 }, (_, index) => index + 1).find(stage => !completedStages.includes(stage)) ?? 10;
}

// GUEST means "not signed in" and is never returned here: these actions require a session, so
// the entry tier of a signed-in operator is TRAINEE.
function blackTraceAccess(stage: number) {
  if (stage >= 10) return "OPERATOR";
  if (stage >= 7) return "FIELD OPERATOR";
  if (stage >= 4) return "ANALYST";
  return "TRAINEE";
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

  if (action === "ranking") {
    const [{ data: profiles, error: profileError }, { data: progress, error: progressError }] = await Promise.all([
      service.from("hg_profiles").select("id, display_name"),
      service.from("hg_black_trace_progress").select("user_id, completed_at"),
    ]);
    if (profileError || progressError) return json({ error: "Unable to load operation ranking" }, 500);
    const totals = new Map<string, { solvedCount: number; lastSolvedAt: string | null }>();
    for (const record of progress ?? []) {
      const current = totals.get(record.user_id) ?? { solvedCount: 0, lastSolvedAt: null };
      totals.set(record.user_id, {
        solvedCount: current.solvedCount + 1,
        lastSolvedAt: !current.lastSolvedAt || record.completed_at > current.lastSolvedAt ? record.completed_at : current.lastSolvedAt,
      });
    }
    const ranking = (profiles ?? []).map(profile => ({
      userId: profile.id,
      name: profile.display_name,
      solvedCount: totals.get(profile.id)?.solvedCount ?? 0,
      lastSolvedAt: totals.get(profile.id)?.lastSolvedAt ?? null,
    })).sort((left, right) => {
      if (right.solvedCount !== left.solvedCount) return right.solvedCount - left.solvedCount;
      const leftTime = left.lastSolvedAt ? Date.parse(left.lastSolvedAt) : Number.MAX_SAFE_INTEGER;
      const rightTime = right.lastSolvedAt ? Date.parse(right.lastSolvedAt) : Number.MAX_SAFE_INTEGER;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return left.name.localeCompare(right.name, "ko");
    });
    return json({ ranking });
  }
  if (action === "verifyCertificate") return json({ certificate: null });

  const user = await requireUser(request);
  if (!user) return json({ error: "Please sign in" }, 401);
  if (!user.email_confirmed_at) return json({ error: "Please confirm your email address" }, 403);

  if (action === "provisionProfile") {
    const { data: displayName, error } = await service.rpc("hg_provision_confirmed_profile", { p_user_id: user.id });
    if (error) {
      // A stable reason lets the browser explain the failure without exposing database detail.
      const code = typeof (error as { code?: unknown }).code === "string" ? (error as { code: string }).code : "";
      const reason = code === "42501" ? "email_not_confirmed" : code === "22023" ? "display_name_required" : "profile_unavailable";
      return json({ error: "Unable to create learner profile", reason }, 500);
    }
    // Accounts created outside the sign-up form hold no name metadata, so their profile carries a
    // generated default that the operator should replace on the profile screen.
    const metadataName = typeof user.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
    return json({ profile: { displayName }, namePending: !displayNamePattern.test(metadataName) });
  }

  if (action === "profile") {
    const [{ data: profile, error: profileError }, { data: progress, error: progressError }] = await Promise.all([
      service.from("hg_profiles").select("display_name, created_at, updated_at").eq("id", user.id).maybeSingle(),
      service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id),
    ]);
    if (profileError || progressError || !profile) return json({ error: "Unable to load profile" }, 500);
    return json({ profile: { displayName: profile.display_name, createdAt: profile.created_at, updatedAt: profile.updated_at }, summary: { solvedCount: progress?.length ?? 0, defenseReviewCount: 0, hasCertificate: false } });
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

  if (action === "blackTraceSurface") {
    const stage = typeof payload?.stage === "number" ? payload.stage : 0;
    if (!traceLabels[stage]) return json({ stage, token: null });
    const completedStages = await completedStagesFor(service, user.id);
    if (!completedStages) return json({ error: "Unable to verify operation progress" }, 500);
    // A trace is never handed out for a node the operator has not reached, so future answers
    // cannot be collected ahead of time.
    if (stage > firstOpenStage(completedStages) && !completedStages.includes(stage)) {
      return json({ error: "Clear the previous node first" }, 409);
    }
    return json({ stage, token: traceSecret ? await deriveTraceToken(user.id, stage) : null });
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
    const expected = await expectedTrace(user.id, stage);
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

  if (action === "dashboard") {
    const { data, error } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id).order("stage");
    if (error) return json({ error: "Unable to load operation dashboard" }, 500);
    return json({ completedIds: (data ?? []).map(record => record.stage), defenseReviewedIds: [], certificate: null });
  }
  if (action === "records") {
    const { data, error } = await service.from("hg_black_trace_progress").select("stage, hint_count, completed_at").eq("user_id", user.id).order("stage");
    if (error) return json({ error: "Unable to load operation records" }, 500);
    return json({ records: (data ?? []).map(record => ({ stage: record.stage, hintCount: record.hint_count, completedAt: record.completed_at })) });
  }
  if (action === "practice") return json({ verified: false, message: "현재 등록된 문제가 없습니다." }, 410);
  if (action === "submit") return json({ correct: false, message: "현재 등록된 문제가 없습니다." });
  if (action === "reviewDefense") return json({ success: false, message: "현재 등록된 문제가 없습니다." });
  if (action === "issueCertificate") return json({ issued: false, remaining: { modules: null } });

  return json({ error: "Unsupported action" }, 400);
});
