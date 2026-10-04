import { createClient } from "npm:@supabase/supabase-js@2";

// Responses are reflected back only to origins on this list. "*" let any site call these
// endpoints with a visitor's bearer token, so the production origin is the default and local
// development ports are kept so a dev build still reaches the same project.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "https://grayom.github.io,http://localhost:5173,http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

function corsHeadersFor(request: Request, methods: string) {
  const origin = request.headers.get("Origin") ?? "";
  // An unlisted origin receives the canonical one, which the browser then rejects.
  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods,
    Vary: "Origin",
  };
}
const displayNamePattern = /^[가-힣A-Za-z0-9 _-]{2,24}$/;
// Traces the client plants in the browser. Their value is derived per operator so that reading
// the JavaScript bundle, or copying someone else's answer, yields nothing usable.
// Keyed by the node's stable name, not by its position. Keyed by position, every reordering of
// the operation had to move this table in step or every submission would be refused with no error
// anywhere; the node's number may now change freely.
const nodeKeys: Record<number, string> = {
  1: "tooltip", 2: "wrong-destination", 3: "ghost-comment", 4: "forgotten-field", 5: "embedded-identity",
  6: "invisible-ink", 7: "off-screen", 8: "template-tag", 9: "shadow-root", 10: "residual-trace",
  11: "local-memory", 12: "until-you-leave", 13: "deeper-store", 14: "robot-rules", 15: "sitemap",
  16: "source-map", 17: "silent-response", 18: "server-whisper", 19: "follow-the-trail", 20: "wrong-method",
  21: "cookie-flags", 22: "claimed-role", 23: "referer", 24: "etag", 25: "range",
  26: "preflight", 27: "status-only", 28: "content-type", 29: "two-requests", 30: "plain-sight",
  31: "bytes-as-text", 32: "percent-signs", 33: "shifted", 34: "one-byte-key", 35: "two-alphabets",
  36: "three-parts", 37: "no-signature", 38: "wrapped-twice", 39: "layer-by-layer", 40: "someone-elses-order",
  41: "negative-quantity", 42: "up-one-level", 43: "role-in-the-token", 44: "twice-at-once", 45: "it-echoes-back",
  46: "it-stays-there", 47: "always-true", 48: "another-table", 49: "yes-or-no", 50: "fragmented-key",
};

const traceLabels: Record<string, string> = {
  tooltip: "the_label_said_more",
  "wrong-destination": "read_the_address",
  "ghost-comment": "ghost_in_the_source",
  "forgotten-field": "hidden_fields_remember",
  "embedded-identity": "attributes_tell_more",
  "invisible-ink": "sent_but_not_painted",
  "off-screen": "pushed_out_of_view",
  "template-tag": "queued_never_drawn",
  "shadow-root": "a_tree_inside_a_tree",
  "residual-trace": "cookies_leave_traces",
  "local-memory": "it_waited_for_you",
  "until-you-leave": "only_while_open",
  "deeper-store": "a_database_in_here",
  "plain-sight": "encoding_is_not_a_lock",
  "bytes-as-text": "bytes_spelled_out",
  "percent-signs": "the_address_kept_it",
  shifted: "the_letters_only_moved",
  "one-byte-key": "one_byte_undid_it_all",
  "two-alphabets": "the_other_alphabet",
  "three-parts": "signed_is_not_hidden",
  "no-signature": "nothing_was_signed",
  "wrapped-twice": "one_more_layer",
  "layer-by-layer": "peel_in_order",
  "fragmented-key": "two_places",
};
const vaultTraceSuffix = "one_key}";
const blackTraceCourseCode = "black-trace-10-node-clearance";
const blackTraceNodeCount = 50;

// Traces the operator can only obtain by making the request, so they are not bundle-readable.
const channelFlags: Record<string, string> = {
  "robot-rules": "FLAG{robots_know_the_way}",
  sitemap: "FLAG{the_index_listed_it}",
  "source-map": "FLAG{the_build_kept_the_original}",
  "silent-response": "FLAG{the_server_did_answer}",
  "server-whisper": "FLAG{headers_can_whisper}",
  "follow-the-trail": "FLAG{follow_the_location}",
  "wrong-method": "FLAG{the_verb_was_the_lock}",
  "cookie-flags": "FLAG{the_flag_rode_the_cookie}",
  "claimed-role": "FLAG{it_believed_what_you_claimed}",
  referer: "FLAG{it_trusted_where_you_came_from}",
  etag: "FLAG{the_validator_remembered}",
  range: "FLAG{you_asked_for_a_piece}",
  preflight: "FLAG{the_question_before_the_question}",
  "status-only": "FLAG{no_body_still_speaks}",
  "content-type": "FLAG{declared_as_the_wrong_thing}",
  "two-requests": "FLAG{the_first_answer_was_a_map}",
  // Chapter 5: the isolated mock application (hg-range) holds these; the operator reaches them by
  // driving that application, never by reading this bundle or the client's.
  "someone-elses-order": "FLAG{the_id_was_the_only_check}",
  "role-in-the-token": "FLAG{the_token_said_so}",
  "up-one-level": "FLAG{it_walked_out_of_the_folder}",
  "twice-at-once": "FLAG{both_passed_the_check}",
  "negative-quantity": "FLAG{the_total_went_the_wrong_way}",
  "it-echoes-back": "FLAG{the_page_ran_your_words}",
  "it-stays-there": "FLAG{it_waited_for_the_next_reader}",
  "always-true": "FLAG{the_condition_was_yours}",
  "another-table": "FLAG{the_result_set_grew}",
  "yes-or-no": "FLAG{one_letter_at_a_time}",
};

// Generous enough that a shared network browsing the public pages never notices it.
const publicCallLimit = 120;

const traceSecret = Deno.env.get("BLACK_TRACE_SECRET") ?? "";
const traceEncoder = new TextEncoder();

async function deriveTraceToken(userId: string, nodeKey: string) {
  const key = await crypto.subtle.importKey("raw", traceEncoder.encode(traceSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, traceEncoder.encode(`black-trace:${userId}:${nodeKey}`));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

function composeTrace(nodeKey: string, token: string | null) {
  const label = traceLabels[nodeKey];
  if (!label) return null;
  const body = token ? `${label}_${token}` : label;
  return nodeKey === "fragmented-key" ? `FLAG{${body}_` : `FLAG{${body}}`;
}

/** Without BLACK_TRACE_SECRET the derived stages fall back to their pre-rotation values, so a
 *  deployment that forgets the secret keeps the operation solvable instead of breaking it. */
async function expectedTrace(userId: string, stage: number) {
  const nodeKey = nodeKeys[stage];
  if (!nodeKey) return null;
  if (channelFlags[nodeKey]) return channelFlags[nodeKey];
  if (!traceLabels[nodeKey]) return null;
  const token = traceSecret ? await deriveTraceToken(userId, nodeKey) : null;
  const planted = composeTrace(nodeKey, token);
  return nodeKey === "fragmented-key" ? `${planted}${vaultTraceSuffix}` : planted;
}

/**
 * Consumes one of the operator's submissions for the current minute. The ledger and the routine
 * already existed in the database but nothing called them, so flag submission was unbounded.
 *
 * A limiter failure must not stop an honest operator from submitting, so this fails open and
 * records the problem in the function log instead.
 */
async function allowSubmission(service: { rpc: (name: string, args: Record<string, unknown>) => any }, userId: string) {
  const { data, error } = await service.rpc("hg_consume_submission_slot", { p_user_id: userId });
  if (error) {
    console.error("submission rate limit unavailable", error);
    return true;
  }
  return data !== false;
}

/**
 * The unauthenticated actions have no session to meter, so they are metered per caller instead.
 * The address is hashed before it reaches the ledger: the limiter needs to tell callers apart,
 * not to know who they are. A generous ceiling keeps shared networks working while bounding a
 * loop that would otherwise run the function and the database without end.
 */
async function publicClientKey(request: Request) {
  // The leftmost X-Forwarded-For entry is whatever the caller claimed, so keying on it let anyone
  // sidestep the ceiling by randomising the header. Only a value the edge writes itself counts:
  // the CDN header first because it is overwritten at every hop, then the platform header, then
  // the entry appended closest to us. With none of them the bucket is shared, which limits the
  // whole world together rather than nobody at all.
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const hops = forwarded.split(",").map(hop => hop.trim()).filter(Boolean);
  const address = request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || hops[hops.length - 1]
    || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", traceEncoder.encode(`public-rate:${traceSecret}:${address}`));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/**
 * Spends one of the caller's public calls and reports what is left. The count is returned rather
 * than a verdict so the handler can publish it: a boolean made a deployment that carries the
 * ceiling indistinguishable from one that does not, since both answer 200 under the limit.
 */
async function consumePublicSlot(service: { rpc: (name: string, args: Record<string, unknown>) => any }, request: Request) {
  const { data, error } = await service.rpc("hg_consume_public_slot", { p_client_key: await publicClientKey(request) });
  if (error) {
    // A limiter outage must not take the public pages down with it.
    console.error("public rate limit unavailable", error);
    return { allowed: true, remaining: null as number | null };
  }
  const attempts = typeof data === "number" ? data : 0;
  return { allowed: attempts <= publicCallLimit, remaining: Math.max(0, publicCallLimit - attempts) };
}

async function completedStagesFor(service: { from: (table: string) => any }, userId: string) {
  const { data, error } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", userId).order("stage");
  if (error) return null;
  return (data ?? []).map((row: { stage: number }) => row.stage);
}

function firstOpenStage(completedStages: number[]) {
  return Array.from({ length: blackTraceNodeCount }, (_, index) => index + 1).find(stage => !completedStages.includes(stage)) ?? blackTraceNodeCount;
}

// GUEST means "not signed in" and is never returned here: these actions require a session, so
// the entry tier of a signed-in operator is TRAINEE.
const accessTiers = ["TRAINEE", "INFILTRATOR", "FIELD OPERATOR", "OPERATOR"] as const;

// The first node of each tier. These were four even quarters of the node count, which promoted an
// operator in the middle of a chapter; every boundary is now the first node of a chapter, so a
// promotion means a kind of work is finished. Mirrors blackTraceTierStarts in
// shared/black-trace.ts, and a test fails if the two lists drift apart.
const accessTierStarts = [1, 14, 30, 40];

function blackTraceAccess(stage: number) {
  let tier = 0;
  for (let index = 1; index < accessTiers.length; index += 1) {
    if (stage >= accessTierStarts[index]) tier = index;
  }
  return accessTiers[tier];
}

function jsonWriter(cors: Record<string, string>) {
  return (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8" } });
}

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

Deno.serve(async request => {
  const corsHeaders = corsHeadersFor(request, "POST, OPTIONS");
  let json = jsonWriter(corsHeaders);
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof payload?.action === "string" ? payload.action : "";

  // Metered before any unauthenticated work is done, so a loop cannot run the database either.
  if ((["checkDisplayName", "ranking", "verifyCertificate"] as string[]).includes(action)) {
    const slot = await consumePublicSlot(service, request);
    // Published on every answer, so whether the ceiling is actually deployed is read from one
    // response instead of guessed from how a burst of 120 behaved.
    json = jsonWriter({
      ...corsHeaders,
      "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining",
      "X-RateLimit-Limit": String(publicCallLimit),
      ...(slot.remaining === null ? {} : { "X-RateLimit-Remaining": String(slot.remaining) }),
    });
    if (!slot.allowed) {
      return json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", reason: "rate_limited" }, 429);
    }
  }

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
  if (action === "verifyCertificate") {
    const code = typeof payload?.certificateCode === "string" ? payload.certificateCode.trim().toUpperCase() : "";
    // The printed code is the only input, so its shape is checked before touching the table.
    if (!/^HG-WSF-[0-9]{4}-[A-F0-9]{18}$/.test(code)) return json({ certificate: null });
    const { data, error } = await service
      .from("hg_public_certificate_verification")
      .select("certificate_code, course_code, completed_modules, issued_at, display_name")
      .eq("certificate_code", code)
      .maybeSingle();
    if (error) return json({ error: "Unable to verify the certificate" }, 500);
    if (!data) return json({ certificate: null });
    return json({
      certificate: {
        certificateCode: data.certificate_code,
        courseCode: data.course_code,
        completedModules: data.completed_modules,
        issuedAt: data.issued_at,
        learnerName: data.display_name,
      },
    });
  }

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
    const { data: certificate } = await service
      .from("hg_course_certificates")
      .select("certificate_code, completed_modules, issued_at")
      .eq("user_id", user.id)
      .eq("course_code", blackTraceCourseCode)
      .maybeSingle();
    const solvedCount = progress?.length ?? 0;
    return json({
      profile: { displayName: profile.display_name, createdAt: profile.created_at, updatedAt: profile.updated_at },
      summary: {
        solvedCount,
        defenseReviewCount: 0,
        hasCertificate: Boolean(certificate),
        certificateEligible: solvedCount >= blackTraceNodeCount,
      },
      certificate: certificate
        ? { certificateCode: certificate.certificate_code, completedModules: certificate.completed_modules, issuedAt: certificate.issued_at }
        : null,
    });
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
    return json({ stage, token: traceSecret && nodeKeys[stage] ? await deriveTraceToken(user.id, nodeKeys[stage]) : null });
  }

  if (action === "blackTraceProgress") {
    const { data, error } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id).order("stage");
    if (error) return json({ error: "Unable to load operation progress" }, 500);
    const completedStages = (data ?? []).map(row => row.stage as number);
    const currentStage = firstOpenStage(completedStages);
    return json({ completedStages, currentStage, accessLevel: blackTraceAccess(completedStages.length >= blackTraceNodeCount ? blackTraceNodeCount : currentStage), completed: completedStages.length === blackTraceNodeCount });
  }

  if (action === "blackTraceSubmit") {
    // Counted before any other work so that malformed and repeated attempts are bounded too.
    if (!await allowSubmission(service, user.id)) {
      return json({ error: "제출이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.", reason: "rate_limited" }, 429);
    }
    const stage = typeof payload?.stage === "number" ? payload.stage : 0;
    const flag = typeof payload?.flag === "string" ? payload.flag.trim() : "";
    const hintCount = typeof payload?.hintCount === "number" ? Math.max(0, Math.min(2, Math.floor(payload.hintCount))) : 0;
    const expected = await expectedTrace(user.id, stage);
    if (!expected) return json({ correct: false, message: "Unknown operation node" }, 400);
    const { data: existing, error: progressError } = await service.from("hg_black_trace_progress").select("stage").eq("user_id", user.id).order("stage");
    if (progressError) return json({ error: "Unable to verify operation progress" }, 500);
    const completedStages = (existing ?? []).map(row => row.stage as number);
    const firstOpen = firstOpenStage(completedStages);
    if (!completedStages.includes(stage) && stage > firstOpen) return json({ correct: false, message: "Clear the previous node first" }, 409);
    if (flag !== expected) return json({ correct: false, message: "INVALID ACCESS KEY" });
    const { error: saveError } = await service.from("hg_black_trace_progress").upsert({ user_id: user.id, stage, hint_count: hintCount }, { onConflict: "user_id,stage" });
    if (saveError) return json({ error: "Unable to store recovered trace" }, 500);
    const nextStages = completedStages.includes(stage) ? completedStages : [...completedStages, stage].sort((a, b) => a - b);
    return json({ correct: true, alreadyCompleted: completedStages.includes(stage), completedStages: nextStages, accessLevel: blackTraceAccess(stage), operationComplete: nextStages.length === blackTraceNodeCount });
  }

  if (action === "records") {
    const { data, error } = await service.from("hg_black_trace_progress").select("stage, hint_count, completed_at").eq("user_id", user.id).order("stage");
    if (error) return json({ error: "Unable to load operation records" }, 500);
    return json({ records: (data ?? []).map(record => ({ stage: record.stage, hintCount: record.hint_count, completedAt: record.completed_at })) });
  }
  if (action === "issueCertificate") {
    const { data, error } = await service.rpc("hg_issue_clearance_certificate", { p_user_id: user.id });
    if (error) return json({ error: "Unable to issue the certificate" }, 500);
    // The routine returns a single row: (issued, certificate_code, remaining_modules).
    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.issued) return json({ issued: false, remaining: { modules: row?.remaining_modules ?? blackTraceNodeCount } });
    return json({ issued: true, certificateCode: row.certificate_code, remaining: { modules: 0 } });
  }

  return json({ error: "Unsupported action" }, 400);
});
