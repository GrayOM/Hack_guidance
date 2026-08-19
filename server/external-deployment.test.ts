import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const root = new URL("../", import.meta.url);

describe("external free-tier deployment pack", () => {
  it("keeps real flags out of the migration and exposes only the Edge Function server boundary", async () => {
    const [migration, hardeningMigration, edgeFunction, redirects, verifyPage, certificatePrint, externalClient, pagesWorkflow, platformAuth, homePage, problemsPage, labPage, recordsPage, rankingPage, certificatePage, consoleNav, signalLogo] = await Promise.all([
      readFile(new URL("supabase/migrations/20260819000000_hack_guidance.sql", root), "utf8"),
      readFile(new URL("supabase/migrations/20260819000001_harden_hg_security.sql", root), "utf8"),
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
    ]);

    expect(migration).toContain("enable row level security");
    expect(migration).toContain("hg_consume_submission_slot");
    expect(migration).toContain("hg_record_problem_completion");
    expect(migration).toContain("hg_issue_clearance_certificate");
    expect(migration).not.toContain("drop trigger");
    expect(migration).not.toMatch(/HG\{N\d{2}_[A-Za-z0-9_-]{24}\}/);
    expect(hardeningMigration).toContain("revoke all on function public.hg_consume_submission_slot(uuid) from public, anon, authenticated");
    expect(hardeningMigration).toContain("security_invoker = true");
    expect(hardeningMigration).not.toMatch(/HG\{N\d{2}_[A-Za-z0-9_-]{24}\}/);
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
    expect(externalClient).toContain('VITE_EXTERNAL_SUPABASE === "true"');
    expect(pagesWorkflow).toContain("pnpm build:github-pages");
    expect(pagesWorkflow).toContain("actions/deploy-pages@v4");
    expect(platformAuth).toContain("signInWithOtp");
    expect(platformAuth).toContain("이메일 주소 형식을 확인해 주세요.");
    expect(platformAuth).toContain("매직 링크를 전송했습니다.");
    expect(platformAuth).toContain("매직 링크를 전송하지 못했습니다");

    expect(homePage).toContain("useLearningDashboard");
    expect(problemsPage).toContain("useLearningDashboard");
    expect(labPage).toContain("useSubmitFlag");
    expect(labPage).toContain("useReviewDefense");
    expect(labPage).not.toContain("@/lib/trpc");
    expect(labPage).not.toContain("trpc.");
    expect(recordsPage).toContain("useLearningRecords");
    expect(rankingPage).toContain("useLearningRanking");
    expect(certificatePage).toContain("useIssueCertificate");
    expect(consoleNav).toContain("usePlatformAuth");
    expect(consoleNav).toContain("이메일 매직 링크 로그인");
    expect(consoleNav).toContain("로그아웃");
    expect(consoleNav).toContain("sendSupabaseMagicLink");
    expect(signalLogo).toContain("<svg");
    expect(signalLogo).not.toContain("manus-storage");
    expect(signalLogo).not.toContain("<img");
    for (const page of [homePage, problemsPage, labPage, recordsPage, rankingPage, certificatePage, certificatePrint, verifyPage, consoleNav]) {
      expect(page).not.toContain("trpc.learning");
    }
  });
});
