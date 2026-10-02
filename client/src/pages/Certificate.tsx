import { Award, BadgeCheck, ExternalLink, Loader2, LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";
import { ConsoleNav } from "@/components/ConsoleNav";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { useAccountProfile, useIssueCertificate } from "@/hooks/useLearningApi";

import { blackTraceNodeCount } from "@shared/black-trace";

const TOTAL_NODES = blackTraceNodeCount;

export default function Certificate() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const profile = useAccountProfile({ enabled: isAuthenticated, retry: false });
  const issue = useIssueCertificate({ onSuccess: () => profile.refetch() });

  if (!isAuthenticated) {
    return (
      <Shell>
        <section className="max-w-md text-center">
          <Award className="mx-auto h-9 w-9 text-teal-300" />
          <p className="mt-5 font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CLEARANCE ARCHIVE</p>
          <h1 className="mt-3 text-2xl font-semibold">수료 기록은 로그인 후 확인할 수 있습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">BLACK TRACE의 10개 노드를 모두 회수하면 수료증을 발급할 수 있습니다.</p>
          <button onClick={startPlatformLogin} className="mt-6 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024]">로그인</button>
        </section>
      </Shell>
    );
  }

  if (profile.isLoading) {
    return <Shell><p className="text-sm text-slate-400">수료 조건을 확인하고 있습니다.</p></Shell>;
  }

  const solved: number = profile.data?.summary?.solvedCount ?? 0;
  const certificate = profile.data?.certificate ?? null;
  const remaining = Math.max(0, TOTAL_NODES - solved);
  const eligible = remaining === 0;

  return (
    <Shell wide>
      <p className="font-mono-ui text-[10px] tracking-[0.2em] text-teal-300">CLEARANCE ARCHIVE // BLACK TRACE</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">수료증</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        10개 노드를 모두 회수하면 수료증이 발급됩니다. 발급된 인증번호는 로그인 없이도 공개 검증 화면에서 확인할 수 있습니다.
      </p>

      <section className="hnet-panel mt-8 border border-[#315057] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono-ui text-[10px] tracking-[0.16em] text-slate-500">RECOVERED NODES</p>
            <p className="mt-2 font-mono-ui text-2xl text-teal-200">{solved} <span className="text-slate-600">/ {TOTAL_NODES}</span></p>
          </div>
          {certificate ? <BadgeCheck className="h-9 w-9 text-teal-300" /> : eligible ? <Award className="h-9 w-9 text-amber-200" /> : <LockKeyhole className="h-8 w-8 text-slate-600" />}
        </div>
        <div className="mt-5 h-1.5 w-full bg-[#0c1b1e]">
          <div className="h-full bg-teal-300 transition-[width] duration-500" style={{ width: `${(solved / TOTAL_NODES) * 100}%` }} />
        </div>

        {certificate ? (
          <div className="mt-7 border-t border-[#294247] pt-6">
            <p className="font-mono-ui text-[10px] tracking-[0.16em] text-teal-300">VERIFICATION CODE</p>
            <p className="mt-2 break-all font-mono-ui text-lg tracking-[0.06em] text-teal-100">{certificate.certificateCode}</p>
            <p className="mt-2 text-xs text-slate-500">발급일 {new Date(certificate.issuedAt).toLocaleDateString("ko-KR")}</p>
            <button
              onClick={() => setLocation(`/certificate/print/${encodeURIComponent(certificate.certificateCode)}`)}
              className="mt-6 inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200"
            >
              수료증 보기 · 인쇄 <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        ) : eligible ? (
          <div className="mt-7 border-t border-[#294247] pt-6">
            <p className="text-sm leading-6 text-slate-300">모든 노드를 회수했습니다. 수료증을 발급할 수 있습니다.</p>
            <button
              onClick={() => issue.mutate(undefined)}
              disabled={issue.isPending}
              className="mt-5 inline-flex items-center gap-2 bg-teal-300 px-4 py-2.5 text-sm font-semibold text-[#092024] transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {issue.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />발급 중</> : <><Award className="h-4 w-4" />수료증 발급</>}
            </button>
            {issue.isError ? <p role="alert" className="mt-3 text-xs text-rose-300">수료증을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null}
          </div>
        ) : (
          <div className="mt-7 border-t border-[#294247] pt-6">
            <p className="text-sm leading-6 text-slate-400">노드 {remaining}개를 더 회수하면 수료증을 발급할 수 있습니다.</p>
            <button
              onClick={() => setLocation("/black-trace")}
              className="mt-5 inline-flex items-center gap-2 border border-teal-300/40 px-4 py-2.5 text-sm text-teal-100 transition hover:border-teal-300 hover:bg-teal-300/[0.08]"
            >
              작전 보드 열기
            </button>
          </div>
        )}
      </section>

      <p className="mt-6 text-xs leading-5 text-slate-600">
        이 수료증은 Hack Guidance의 브라우저 정찰 학습 과정 완료 기록입니다. 국가 공인 또는 전문 자격증이 아닙니다.
      </p>
    </Shell>
  );
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="hacknet-shell min-h-screen bg-[#060b0d] text-[#e7f2ef]">
      <ConsoleNav />
      {wide
        ? <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</main>
        : <main className="grid min-h-[calc(100vh-5rem)] place-items-center p-6">{children}</main>}
    </div>
  );
}
