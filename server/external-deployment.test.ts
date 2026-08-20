import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

describe("external free-tier deployment pack", () => {
  it("keeps real flags out of the migration and exposes only the Edge Function server boundary", async () => {
    const [migration, hardeningMigration, adminRoleRemovalMigration, accountMigration, confirmedProfilesMigration, certificateFunctionFix, edgeFunction, redirects, verifyPage, certificatePrint, externalClient, learningApi, pagesWorkflow, platformAuth, homePage, problemsPage, labPage, webTargetPage, webTargets, recordsPage, rankingPage, certificatePage, consoleNav, myPage, passwordRecoveryPage, signalLogo, appShell, globalCss, securityBackdrop] = await Promise.all([
      readFile(new URL("supabase/migrations/20260819000000_hack_guidance.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000001_harden_hg_security.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260820000004_remove_hg_admin_role.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260820000005_account_recovery_and_profiles.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260820000006_confirmed_email_profiles.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000003_fix_hg_certificate_function.sql", root), "utf8"),
      readFile(new URL("supabase/functions/learning/index.ts", root), "utf8"),
      readFile(new URL("client/public/_redirects", root), "utf8"),
      readFile(new URL("client/src/pages/VerifyCertificate.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/CertificatePrint.tsx", root), "utf8"),
      readFile(new URL("client/src/lib/external-supabase.ts", root), "utf8"),
      readFile(new URL("client/src/hooks/useLearningApi.ts", root), "utf8"),
      readFile(new URL(".github/workflows/deploy-pages.yml", root), "utf8"),
      readFile(new URL("client/src/hooks/usePlatformAuth.ts", root), "utf8"),
      readFile(new URL("client/src/pages/Home.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Problems.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Lab.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/WebTarget.tsx", root), "utf8"),
      readFile(new URL("client/src/lib/web-targets.ts", root), "utf8"),
      readFile(new URL("client/src/pages/Records.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Ranking.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/Certificate.tsx", root), "utf8"),
      readFile(new URL("client/src/components/ConsoleNav.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/MyPage.tsx", root), "utf8"),
      readFile(new URL("client/src/pages/PasswordRecovery.tsx", root), "utf8"),
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
    expect(adminRoleRemovalMigration).toContain("drop column if exists is_admin");
    expect(adminRoleRemovalMigration).not.toContain("where p.is_admin = false");
    expect(adminRoleRemovalMigration).toContain("grant select on table public.hg_public_ranking to service_role");
    expect(accountMigration).toContain("hg_profiles_display_name_ci_unique");
    expect(accountMigration).toContain("hg_display_name_available");
    expect(accountMigration).toContain("revoke all on function public.hg_display_name_available");
    expect(confirmedProfilesMigration).toContain("drop trigger if exists hg_on_auth_user_created");
    expect(confirmedProfilesMigration).toContain("u.email_confirmed_at is null");
    expect(confirmedProfilesMigration).toContain("hg_provision_confirmed_profile");
    expect(confirmedProfilesMigration).toContain("Email confirmation is required");
    expect(certificateFunctionFix).toContain("v_certificate_code text");
    expect(certificateFunctionFix).toContain("select c.certificate_code into v_certificate_code");
    expect(certificateFunctionFix).toContain("returning public.hg_course_certificates.certificate_code into v_certificate_code");
    expect(edgeFunction).toContain('Deno.env.get("LEARNING_FLAG_MAP")');
    expect(edgeFunction).toContain("hg_consume_submission_slot");
    expect(edgeFunction).toContain("hg_issue_clearance_certificate");
    expect(edgeFunction).toContain('action === "ranking"');
    expect(edgeFunction).toContain('action === "verifyCertificate"');
    expect(edgeFunction).toContain('action === "checkDisplayName"');
    expect(edgeFunction).toContain('action === "profile"');
    expect(edgeFunction).toContain('action === "updateDisplayName"');
    expect(edgeFunction).toContain('action === "provisionProfile"');
    expect(edgeFunction).toContain('action === "practice"');
    expect(edgeFunction).toContain("wargameCommandSignature");
    expect(edgeFunction).toContain("hg_wargame_rules");
    expect(edgeFunction).not.toContain("expectedPracticeInput");
    expect(edgeFunction).toContain("user.email_confirmed_at");
    expect(edgeFunction).toContain("hg_provision_confirmed_profile");
    expect(edgeFunction).toContain("updateUserById");
    expect(edgeFunction).toContain("ranking: (data ?? []).map");
    expect(edgeFunction).toContain("json({ certificate: null })");
    expect(redirects.trim()).toBe("/* /index.html 200");
    expect(verifyPage).not.toContain("@/lib/trpc");
    expect(certificatePrint).toContain("useVerifyCertificate");
    expect(externalClient).toContain("const configured = Boolean(url && publishableKey)");
    expect(learningApi).toContain('externalQuery<{ records: unknown[] }>("records", "records", {}, options)');
    expect(learningApi).toContain("Array.isArray(response.data?.records) ? response.data.records : []");
    expect(pagesWorkflow).toContain("pnpm build:github-pages");
    expect(pagesWorkflow).toContain("actions/deploy-pages@v4");
    expect(platformAuth).toContain("signInWithPassword");
    expect(platformAuth).toContain("auth.signUp");
    expect(platformAuth).not.toContain("signInWithOAuth");
    expect(platformAuth).not.toContain("useManusAuth");
    expect(platformAuth).not.toContain("startManusLogin");
    expect(platformAuth).toContain("이메일 주소 형식을 확인해 주세요.");
    expect(platformAuth).toContain("이메일 인증을 완료하면 공개 프로필과 랭킹에 등록됩니다.");
    expect(platformAuth).toContain('invokeLearning("provisionProfile")');
    expect(platformAuth).toContain("이메일 인증을 완료하면 공개 프로필과 랭킹에 등록됩니다.");
    expect(platformAuth).toContain("이메일 또는 비밀번호가 올바르지 않습니다.");
    expect(platformAuth).toContain("resetPasswordForEmail");
    expect(platformAuth).toContain('event === "PASSWORD_RECOVERY"');
    expect(platformAuth).toContain("updateSupabasePassword");

    expect(homePage).toContain("useLearningDashboard");
    expect(homePage).toContain("문제를 풀고");
    expect(homePage).toContain("Hack Guidance는 보안 단서를 분석해 플래그를 확보하는 문제 풀이 보드입니다.");
    expect(problemsPage).toContain("useLearningDashboard");
    expect(problemsPage).toContain("WARGAME DIRECTORY");
    expect(problemsPage).toContain("독립 사례");
    expect(labPage).toContain("CASE BRIEF");
    expect(labPage).toContain("WEB TARGET OPEN");
    expect(labPage).toContain("별도의 교육용 웹 서비스");
    expect(webTargetPage).toContain("EDUCATION TARGET");
    expect(webTargetPage).toContain("data-service-reference");
    expect(webTargetPage).toContain("Recovered artifact");
    expect(webTargetPage).toContain("Hack Guidance 플래그 제출");
    expect(webTargetPage).toContain("`${guide.operation} ${reference.trim()}`");
    expect(webTargetPage).not.toContain("WARGAME COMMAND CONSOLE");
    expect(webTargets).toContain("id: 50");
    expect(labPage).not.toContain("@/lib/trpc");
    expect(labPage).not.toContain("trpc.");
    expect(webTargetPage).not.toContain("practiceInput");
    expect(webTargetPage).not.toContain("role=admin");
    expect(recordsPage).toContain("useLearningRecords");
    expect(rankingPage).toContain("useLearningRanking");
    expect(rankingPage).toContain("이메일 인증 뒤 이곳에 표시됩니다.");
    expect(rankingPage).toContain("이메일 인증을 완료한 분석자만");
    expect(rankingPage).not.toContain("이메일로 간편 시작하면");
    expect(certificatePage).toContain("useIssueCertificate");
    expect(consoleNav).toContain("usePlatformAuth");
    expect(consoleNav).not.toContain("Hack Guidance 자체 계정");
    expect(consoleNav).not.toContain("PUBLIC ANALYST NAME");
    expect(consoleNav).toContain(">NAME</span>");
    expect(consoleNav).toContain("계정 만들기");
    expect(consoleNav).toContain("/>로그인</button>");
    expect(consoleNav).toContain("회원가입");
    expect(consoleNav).toContain("공개명");
    expect(consoleNav).not.toContain("공개 분석자명");
    expect(consoleNav).toContain("registerSupabaseAccount");
    expect(consoleNav).toContain("sendPasswordResetEmail");
    expect(consoleNav).toContain("비밀번호를 잊으셨나요? 이메일로 재설정");
    expect(consoleNav).toContain("이미 사용 중인 공개명입니다.");
    expect(consoleNav).toContain("이메일 인증을 완료하면 입력한 공개명이 공개 랭킹에");
    expect(consoleNav).toContain('if (result === "signed-in")');
    expect(consoleNav).toContain('setLoginOpen(false);');
    expect(consoleNav).toContain('setAuthMode("signin");');
    expect(consoleNav).toContain('setLocation("/me")');
    expect(myPage).toContain("공개명 저장");
    expect(myPage).toContain("LEARNING SUMMARY");
    expect(passwordRecoveryPage).toContain("새 비밀번호 설정");
    expect(appShell).toContain('path="/me"');
    expect(appShell).toContain('path="/account/password"');
    expect(appShell).toContain('path="/workspace/:id"');
    expect(appShell).toContain('path="/target/:id"');
    expect(appShell).toContain('<div className="hacknet-shell"><Routes /></div>');
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
    expect(securityBackdrop).toContain('"g-b"');
    expect(securityBackdrop).toContain('"g-d"');
    expect(securityBackdrop).toContain("security-backdrop__node-defense");
    expect(globalCss).toContain("security-scan-sweep");
    expect(globalCss).toContain("security-backdrop__link--e-c");
    expect(globalCss).toContain("security-backdrop__link--g-e");
    expect(globalCss).toContain("security-backdrop__node--hacker");
    expect(globalCss).toContain("--forward-duration");
    expect(globalCss).toContain("--ack-duration");
    expect(globalCss).toContain("security-packet-arrival");
    expect(globalCss).toContain("security-intrusion-link-glitch");
    expect(globalCss).toContain("security-defense-packet");
    expect(globalCss).toContain("security-core-defense");
    expect(globalCss).toContain("security-section-focus");
    expect(globalCss).toContain("prefers-reduced-motion: reduce");
    for (const page of [homePage, problemsPage, labPage, recordsPage, rankingPage, certificatePage, certificatePrint, verifyPage, consoleNav]) {
      expect(page).not.toContain("trpc.learning");
    }
  });
});
