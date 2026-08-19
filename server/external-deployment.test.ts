import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

describe("external free-tier deployment pack", () => {
  it("keeps real flags out of the migration and exposes only the Edge Function server boundary", async () => {
    const [migration, hardeningMigration, adminMigration, certificateFunctionFix, edgeFunction, redirects, verifyPage, certificatePrint, externalClient, pagesWorkflow, platformAuth, homePage, problemsPage, labPage, recordsPage, rankingPage, certificatePage, consoleNav, signalLogo, appShell, globalCss, securityBackdrop] = await Promise.all([
      readFile(new URL("supabase/migrations/20260819000000_hack_guidance.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000001_harden_hg_security.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000002_add_hg_admin_role.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000003_fix_hg_certificate_function.sql", root), "utf8"),
      readFile(new URL("supabase/functions/learning/index.ts", root), "utf8"),
      readFile(new URL("client/public/_redirects", root), "utf8"),
      readFile(new URL("client/src/pages/VerifyCertificate.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/CertificatePrint.tsx", root), "utf8"),
      readFile(new URL("client/src/lib/external-supabase.ts", root), "utf8"),
      readFile(new URL(".github/workflows/deploy-pages.yml", root), "utf8"),
      readFile(new URL("client/src/hooks/usePlatformAuth.ts", root), "utf8"),
      readFile(new URL("client/src/pages/Home.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Problems.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Lab.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Records.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Ranking.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Certificate.tsx", root), "utf8"),
      readFile(new URL("client/src/components/ConsoleNav.tsx", root), "utf8"),
      readFile(new URL("client/src/components/SignalLogo.tsx", root), "utf8"),
      readFile(new URL("client/src/App.tsx", root), "utf8"),
      readFile(new URL("client/src/index.css", root), "utf8"),
      readFile(new URL("client/src/components/SecurityBackdrop.tsx", root), "utf8"),
    ]);

    expect(migration).toContain("enable row level security");
    expect(migration).toContain("hg_consume_submission_slot");
    expect(migration).toContain("hg_record_problem_completion");
    expect(migration).toContain("hg_issue_clearance_certificate");
    expect(migration).toContain("hg_on_auth_user_created");
    expect(migration).toContain("left join public.hg_learning_progress");
    expect(migration).toContain("count(lp.problem_id)::integer as solved_count");
    expect(migration).not.toContain("drop trigger");
    expect(migration).not.toMatch(/HG\{N\d{2}_[A-Za-z0-9_-]{24}\}/);
    expect(hardeningMigration).toContain("revoke all on function public.hg_consume_submission_slot(uuid) from public, anon, authenticated");
    expect(hardeningMigration).toContain("security_invoker = true");
    expect(hardeningMigration).not.toMatch(/HG\{N\d{2}_[A-Za-z0-9_-]{24}\}/);
    expect(adminMigration).toContain("is_admin boolean not null default false");
    expect(adminMigration).toContain("where p.is_admin = false");
    expect(adminMigration).toContain("grant select on table public.hg_public_ranking to service_role");
    expect(certificateFunctionFix).toContain("v_certificate_code text");
    expect(certificateFunctionFix).toContain("select c.certificate_code into v_certificate_code");
    expect(certificateFunctionFix).toContain("returning public.hg_course_certificates.certificate_code into v_certificate_code");
    expect(edgeFunction).toContain('Deno.env.get("LEARNING_FLAG_MAP")');
    expect(edgeFunction).toContain("hg_consume_submission_slot");
    expect(edgeFunction).toContain("hg_issue_clearance_certificate");
    expect(edgeFunction).toContain('action === "ranking"');
    expect(edgeFunction).toContain('action === "verifyCertificate"');
    expect(edgeFunction).toContain("ranking: (data ?? []).map");
    expect(edgeFunction).toContain("json({ certificate: null })");
    expect(redirects.trim()).toBe("/* /index.html 200");
    expect(verifyPage).not.toContain("@/lib/trpc");
    expect(certificatePrint).toContain("useVerifyCertificate");
    expect(externalClient).toContain("const configured = Boolean(url && publishableKey)");
    expect(pagesWorkflow).toContain("pnpm build:github-pages");
    expect(pagesWorkflow).toContain("actions/deploy-pages@v4");
    expect(platformAuth).toContain("signInWithPassword");
    expect(platformAuth).toContain("auth.signUp");
    expect(platformAuth).not.toContain("signInWithOAuth");
    expect(platformAuth).not.toContain("useManusAuth");
    expect(platformAuth).not.toContain("startManusLogin");
    expect(platformAuth).toContain("이메일 주소 형식을 확인해 주세요.");
    expect(platformAuth).toContain("회원가입과 로그인이 완료되었습니다.");
    expect(platformAuth).toContain("이메일 또는 비밀번호가 올바르지 않습니다.");

    expect(homePage).toContain("useLearningDashboard");
    expect(problemsPage).toContain("useLearningDashboard");
    expect(labPage).toContain("useSubmitFlag");
    expect(labPage).toContain("useReviewDefense");
    expect(labPage).not.toContain("@/lib/trpc");
    expect(labPage).not.toContain("trpc.");
    expect(recordsPage).toContain("useLearningRecords");
    expect(rankingPage).toContain("useLearningRanking");
    expect(rankingPage).toContain("이메일과 비밀번호로 회원가입하면 이곳에 표시됩니다.");
    expect(rankingPage).not.toContain("이메일로 간편 시작하면");
    expect(certificatePage).toContain("useIssueCertificate");
    expect(consoleNav).toContain("usePlatformAuth");
    expect(consoleNav).not.toContain("Hack Guidance 자체 계정");
    expect(consoleNav).not.toContain("PUBLIC ANALYST NAME");
    expect(consoleNav).toContain(">NAME</span>");
    expect(consoleNav).toContain("계정 만들기");
    expect(consoleNav).toContain("/>로그인</button>");
    expect(consoleNav).toContain("로그아웃");
    expect(consoleNav).toContain("registerSupabaseAccount");
    expect(signalLogo).toContain("<svg");
    expect(signalLogo).not.toContain("manus-storage");
    expect(signalLogo).not.toContain("<img");
    expect(appShell).toContain("<SecurityBackdrop />");
    expect(securityBackdrop).toContain("security-backdrop__matrix");
    expect(securityBackdrop).toContain("focusByPath");
    expect(securityBackdrop).toContain("CORE-00");
    expect(securityBackdrop).toContain("INTR-66");
    expect(securityBackdrop).toContain('"g-e"');
    expect(securityBackdrop).toContain("security-backdrop__node-code");
    expect(securityBackdrop).toContain("security-backdrop__node-arrival");
    expect(globalCss).toContain("security-scan-sweep");
    expect(globalCss).toContain("security-backdrop__link--e-c");
    expect(globalCss).toContain("security-backdrop__link--g-e");
    expect(globalCss).toContain("security-backdrop__node--hacker");
    expect(globalCss).toContain("--forward-duration");
    expect(globalCss).toContain("--ack-duration");
    expect(globalCss).toContain("security-packet-arrival");
    expect(globalCss).toContain("security-intrusion-link-glitch");
    expect(globalCss).toContain("security-section-focus");
    expect(globalCss).toContain("prefers-reduced-motion: reduce");
    for (const page of [homePage, problemsPage, labPage, recordsPage, rankingPage, certificatePage, certificatePrint, verifyPage, consoleNav]) {
      expect(page).not.toContain("trpc.learning");
    }
  });
});
