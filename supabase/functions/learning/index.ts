import { createClient } from "npm:@supabase/supabase-js@2";

type FlagMap = Record<string, string>;

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function loadFlagMap(): FlagMap {
  const raw = Deno.env.get("LEARNING_FLAG_MAP");
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(([id, flag]) =>
        /^([1-9]|[1-4][0-9]|50)$/.test(id) &&
        typeof flag === "string" &&
        /^HG\{[A-Za-z0-9_-]{4,80}\}$/.test(flag),
      ),
    );
  } catch {
    return {};
  }
}

const flagMap = loadFlagMap();
const levels = new Map(Array.from({ length: 50 }, (_, index) => [index + 1, Math.floor(index / 10) + 1]));

async function requireUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof payload?.action === "string" ? payload.action : "";

  if (action === "ranking") {
    const { data, error } = await service.from("hg_public_ranking").select("rank, user_id, display_name, solved_count, last_solved_at").limit(100);
    return error ? json({ error: "Unable to load ranking" }, 500) : json({
      ranking: (data ?? []).map(row => ({
        rank: row.rank,
        userId: row.user_id,
        name: row.display_name,
        solvedCount: row.solved_count,
        lastSolvedAt: row.last_solved_at,
      })),
    });
  }

  if (action === "verifyCertificate") {
    const certificateCode = typeof payload?.certificateCode === "string" ? payload.certificateCode.trim() : "";
    const { data, error } = await service.from("hg_public_certificate_verification")
      .select("user_id, certificate_code, course_code, completed_modules, issued_at, display_name")
      .eq("certificate_code", certificateCode).maybeSingle();
    if (error) return json({ error: "Unable to verify certificate" }, 500);
    if (!data) return json({ certificate: null });
    const { count, error: countError } = await service.from("hg_learning_progress")
      .select("id", { count: "exact", head: true }).eq("user_id", data.user_id).eq("defense_reviewed", true);
    if (countError) return json({ error: "Unable to verify certificate" }, 500);
    return json({ certificate: {
      learnerName: data.display_name,
      completedModules: data.completed_modules,
      passedAssessments: 5,
      defenseReviewCount: count ?? 0,
      issuedAt: data.issued_at,
      certificateCode: data.certificate_code,
    } });
  }

  const user = await requireUser(request);
  if (!user) return json({ error: "Please sign in" }, 401);

  if (action === "dashboard" || action === "records") {
    const { data, error } = await service.from("hg_learning_progress")
      .select("problem_id, level, hint_count, defense_reviewed, completed_at, updated_at")
      .eq("user_id", user.id).order("problem_id");
    if (error) return json({ error: "Unable to load learning records" }, 500);

    if (action === "records") return json({ records: data });
    const { data: certificate } = await service.from("hg_course_certificates")
      .select("certificate_code, course_code, completed_modules, issued_at")
      .eq("user_id", user.id).maybeSingle();
    return json({
      completedIds: data.filter(row => row.completed_at).map(row => row.problem_id),
      defenseReviewedIds: data.filter(row => row.defense_reviewed).map(row => row.problem_id),
      certificate: certificate ? {
        certificateCode: certificate.certificate_code,
        courseCode: certificate.course_code,
        completedModules: certificate.completed_modules,
        issuedAt: certificate.issued_at,
      } : null,
    });
  }

  if (action === "submit") {
    const problemId = Number(payload?.problemId);
    const hintCount = Number(payload?.hintCount);
    const flag = typeof payload?.flag === "string" ? payload.flag.trim().replace(/\s/g, "") : "";
    const level = levels.get(problemId);
    if (!level || !Number.isInteger(hintCount) || hintCount < 0 || hintCount > 3 || flag.length < 4 || flag.length > 96) {
      return json({ correct: false, message: "제출 형식이 올바르지 않습니다." }, 400);
    }

    const { data: allowed, error: rateError } = await service.rpc("hg_consume_submission_slot", { p_user_id: user.id });
    if (rateError) return json({ error: "Unable to check submission rate" }, 500);
    if (!allowed) return json({ correct: false, message: "제출 시도가 많습니다. 잠시 뒤에 다시 시도하세요." }, 429);
    if (flagMap[String(problemId)] !== flag) {
      return json({ correct: false, message: "플래그가 일치하지 않습니다. 단서와 증거를 다시 확인해 보세요." });
    }

    const { data, error } = await service.rpc("hg_record_problem_completion", {
      p_user_id: user.id, p_problem_id: problemId, p_level: level, p_hint_count: hintCount,
    });
    if (error || !data?.[0]) return json({ error: "Unable to save solution" }, 500);
    return json({
      correct: true,
      message: data[0].already_completed ? "이미 해결한 문제입니다. 기존 해결 기록을 유지합니다." : "플래그가 확인되었습니다. 이 문제를 해결했습니다.",
      solvedAt: data[0].solved_at,
    });
  }

  if (action === "reviewDefense") {
    const problemId = Number(payload?.problemId);
    if (!levels.has(problemId)) return json({ error: "지원하지 않는 문제입니다." }, 400);
    const { data, error } = await service.rpc("hg_mark_defense_reviewed", { p_user_id: user.id, p_problem_id: problemId });
    if (error) return json({ error: "Unable to save defense review" }, 500);
    return data ? json({ success: true }) : json({ error: "문제를 해결한 뒤 대응 노트를 확인할 수 있습니다." }, 409);
  }

  if (action === "issueCertificate") {
    const { data, error } = await service.rpc("hg_issue_clearance_certificate", { p_user_id: user.id });
    if (error || !data?.[0]) return json({ error: "Unable to issue certificate" }, 500);
    return json({
      issued: data[0].issued,
      certificateCode: data[0].certificate_code,
      remaining: { modules: data[0].remaining_modules },
    });
  }

  return json({ error: "Unsupported action" }, 400);
});
