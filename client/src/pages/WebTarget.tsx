import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Check, ChevronRight, FileText, Flag, FolderOpen, Globe2, LoaderCircle, LockKeyhole, Search, Send, ShieldCheck, UploadCloud, UserRound } from "lucide-react";
import { toast } from "sonner";
import { challengeById } from "@shared/learning";
import { practiceGuideForNode } from "@/lib/problem-brief";
import { webTargetForNode, type WebTargetKind } from "@/lib/web-targets";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { usePracticeProbe, useSubmitFlag } from "@/hooks/useLearningApi";

const kindTone: Record<WebTargetKind, string> = {
  identity: "from-sky-500/20 via-slate-900 to-slate-950",
  files: "from-amber-500/15 via-stone-950 to-stone-950",
  directory: "from-indigo-500/20 via-slate-950 to-slate-950",
  forms: "from-emerald-500/15 via-slate-950 to-slate-950",
  api: "from-violet-500/20 via-slate-950 to-slate-950",
  report: "from-cyan-500/15 via-slate-950 to-slate-950",
  upload: "from-orange-500/15 via-stone-950 to-stone-950",
  content: "from-rose-500/15 via-slate-950 to-slate-950",
};

export default function WebTarget() {
  const [, targetParams] = useRoute("/target/:id");
  const [, legacyParams] = useRoute("/workspace/:id");
  const [, setLocation] = useLocation();
  const id = Number(targetParams?.id ?? legacyParams?.id ?? 0);
  const target = webTargetForNode(id);
  const challenge = useMemo(() => challengeById(id), [id]);
  const guide = challenge ? practiceGuideForNode(challenge.id) : null;
  const { isAuthenticated } = usePlatformAuth();
  const [reference, setReference] = useState("");
  const [artifact, setArtifact] = useState("");
  const [flag, setFlag] = useState("");
  const [response, setResponse] = useState("Ready. Use this isolated service as you would a normal web application.");
  const [solved, setSolved] = useState(false);
  const practice = usePracticeProbe({
    onSuccess: result => {
      if (result.verified && result.capture) {
        setArtifact(result.capture);
        setResponse("The service returned a protected artifact. Copy it into the platform submission field when you are ready.");
        toast.success("웹 타깃에서 플래그 아티팩트를 회수했습니다.");
      } else setResponse(result.message ?? "The requested resource is not available for this account.");
    },
    onError: () => setResponse("The isolated service could not complete this request. Check your login state and try again."),
  });
  const submit = useSubmitFlag({
    onSuccess: result => {
      if (result.correct) {
        setSolved(true);
        toast.success(result.message);
      } else toast.error(result.message);
    },
    onError: () => toast.error("플래그를 제출하지 못했습니다. 연결 상태를 확인해 주세요."),
  });

  if (!target || !challenge || !guide) return <MissingTarget onBack={() => setLocation("/problems")} />;
  const nextNode = id < 50 ? id + 1 : null;
  const runTarget = () => {
    if (!isAuthenticated) {
      startPlatformLogin();
      return;
    }
    if (!reference.trim()) {
      setResponse("Enter a reference from the service surface before sending the request.");
      return;
    }
    setResponse("Contacting the isolated training service…");
    practice.mutate({ problemId: id, method: guide.operation.toUpperCase(), input: `${guide.operation} ${reference.trim()}` });
  };
  const submitFlag = () => {
    if (!isAuthenticated) {
      startPlatformLogin();
      return;
    }
    if (!flag.trim()) {
      toast.message("웹 타깃에서 회수한 플래그를 직접 입력해 주세요.");
      return;
    }
    submit.mutate({ problemId: id, flag, hintCount: 0 });
  };

  return <div className="min-h-screen bg-[#f4f7fb] text-slate-900"><BrowserFrame origin={target.origin} route={target.route} onBack={() => setLocation(`/lab/${id}`)} /><main className={`min-h-[calc(100vh-57px)] bg-gradient-to-br ${kindTone[target.kind]} px-4 py-8 sm:px-6 lg:py-12`}><section className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/30"><TargetHeader target={target} /><div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_290px]"><div className="p-6 sm:p-8"><TargetSurface target={target} marker={guide.marker} reference={reference} setReference={setReference} onRun={runTarget} pending={practice.isPending} /><div aria-live="polite" className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Service response</p><p className="mt-2 text-sm leading-6 text-slate-700">{response}</p>{artifact ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Recovered artifact</p><code className="mt-2 block break-all text-sm text-emerald-950">{artifact}</code></div> : null}</div><section className="mt-8 border-t border-slate-200 pt-6"><div className="flex items-center gap-2"><Flag className="h-4 w-4 text-slate-700" /><h2 className="text-sm font-semibold">Hack Guidance 플래그 제출</h2></div><p className="mt-2 text-sm leading-6 text-slate-500">이 웹 타깃에서 회수한 플래그를 직접 입력합니다. 플래그 검증과 해결 기록은 플랫폼 서버에서만 처리됩니다.</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={flag} onChange={event => setFlag(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitFlag(); }} placeholder="HG{...}" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 font-mono text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" /><button type="button" onClick={submitFlag} disabled={submit.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submit.isPending ? "검증 중" : "플래그 제출"}</button></div>{solved && nextNode ? <button type="button" onClick={() => setLocation(`/lab/${nextNode}`)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900">다음 문제 브리프 열기 <ChevronRight className="h-4 w-4" /></button> : null}</section></div><aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Isolated training target</p><h2 className="mt-3 text-base font-semibold text-slate-900">{target.appName}</h2><p className="mt-2 text-sm leading-6 text-slate-500">이 서비스는 외부 시스템과 분리된 교육용 웹 타깃입니다. 실제 계정이나 실제 데이터를 사용하지 않습니다.</p><div className="mt-6 space-y-3">{target.tiles.map((tile, index) => <div key={tile} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600"><TileIcon index={index} /><span>{tile}</span></div>)}</div><div className="mt-8 rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Case node</p><p className="mt-2 font-mono text-sm text-slate-700">#{String(id).padStart(2, "0")}</p><p className="mt-2 text-xs leading-5 text-slate-500">브리프의 증거와 이 서비스의 표면을 함께 분석해 보세요.</p></div></aside></div></section></main></div>;
}

function BrowserFrame({ origin, route, onBack }: { origin: string; route: string; onBack: () => void }) {
  return <header className="border-b border-slate-300 bg-slate-100 px-3 py-2"><div className="mx-auto flex max-w-6xl items-center gap-3"><button type="button" onClick={onBack} className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm text-slate-600 hover:bg-slate-200"><ArrowLeft className="h-4 w-4" />나가기</button><div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5 shrink-0 text-emerald-600" /><span className="truncate">https://{origin}{route}</span></div><span className="hidden font-mono text-[10px] tracking-[0.14em] text-slate-400 sm:inline">EDUCATION TARGET</span></div></header>;
}

function TargetHeader({ target }: { target: ReturnType<typeof webTargetForNode> & {} }) {
  if (!target) return null;
  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white"><Globe2 className="h-4 w-4" /></div><div><p className="font-semibold text-slate-900">{target.appName}</p><p className="text-xs text-slate-500">{target.origin}</p></div></div><nav className="flex items-center gap-4 text-sm text-slate-500"><span>Home</span><span>Help</span><UserRound className="h-4 w-4" /></nav></header>;
}

function TargetSurface({ target, marker, reference, setReference, onRun, pending }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; marker: string; reference: string; setReference: (value: string) => void; onRun: () => void; pending: boolean }) {
  const referenceInput = <input value={reference} onChange={event => setReference(event.target.value)} placeholder={target.fieldPlaceholder} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />;
  const action = <button type="submit" disabled={pending} className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "처리 중" : target.actionLabel}</button>;
  const title = <div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">{target.kind === "files" || target.kind === "upload" ? <FolderOpen className="h-5 w-5" /> : target.kind === "api" ? <Send className="h-5 w-5" /> : target.kind === "directory" ? <UserRound className="h-5 w-5" /> : target.kind === "report" || target.kind === "content" ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}</div><div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{target.heading}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">{target.description}</p></div></div>;
  const tiles = <div className="mt-8 grid gap-3 sm:grid-cols-3">{target.tiles.map((tile, index) => <div key={tile} className="rounded-xl border border-slate-200 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{String(index + 1).padStart(2, "0")}</p><p className="mt-2 text-sm font-medium text-slate-700">{tile}</p></div>)}</div>;
  const referenceForm = (label = target.fieldLabel) => <form onSubmit={event => { event.preventDefault(); onRun(); }} className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5"><label className="block text-sm font-medium text-slate-700">{label}{referenceInput}</label>{action}</form>;

  if (target.kind === "identity") return <section data-service-reference={marker}>{title}<div className="mt-8 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-6"><p className="text-sm font-semibold text-slate-800">Sign in to {target.appName}</p><label className="mt-5 block text-sm font-medium text-slate-700">Work email<input disabled placeholder="name@workspace.example" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-400" /></label><label className="mt-4 block text-sm font-medium text-slate-700">{target.fieldLabel}{referenceInput}</label>{action}<p className="mt-5 text-xs leading-5 text-slate-400">Need help? Recover access or review your active sessions.</p></div>{tiles}</section>;
  if (target.kind === "files") return <section data-service-reference={marker}>{title}<div className="mt-8 overflow-hidden rounded-xl border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"><span>Shared library</span><span>3 items</span></div>{target.tiles.map((tile, index) => <div key={tile} className="flex items-center justify-between border-b border-slate-100 px-4 py-4 last:border-0"><div className="flex items-center gap-3"><FolderOpen className="h-4 w-4 text-amber-600" /><span className="text-sm text-slate-700">{tile}</span></div><span className="text-xs text-slate-400">Updated {index + 1}d ago</span></div>)}</div>{referenceForm("Open item")}</section>;
  if (target.kind === "directory") return <section data-service-reference={marker}>{title}<div className="mt-8 rounded-xl border border-slate-200"><div className="grid grid-cols-[1fr_120px] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400"><span>Name</span><span>Workspace</span></div>{target.tiles.map((tile, index) => <div key={tile} className="grid grid-cols-[1fr_120px] px-4 py-4 text-sm text-slate-700"><span>{tile}</span><span className="text-slate-400">#{String(104 + index).padStart(3, "0")}</span></div>)}</div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "upload") return <section data-service-reference={marker}>{title}<div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center"><UploadCloud className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-700">Drop a file here to stage it</p><p className="mt-1 text-xs text-slate-500">No real files leave this isolated training target.</p></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "api") return <section data-service-reference={marker}>{title}<div className="mt-8 rounded-xl bg-slate-950 p-5 font-mono text-sm text-slate-200"><p className="text-emerald-300">GET {target.route}?ref=…</p><p className="mt-4 text-slate-400">Accept: application/json</p><p className="mt-1 text-slate-400">Authorization: Bearer [session]</p><p className="mt-4 text-sky-200">{`{ "status": "ready", "scope": "workspace" }`}</p></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "content") return <section data-service-reference={marker}>{title}<div className="mt-8 rounded-xl border border-slate-200 p-5"><label className="block text-sm font-medium text-slate-700">Draft<textarea disabled rows={4} placeholder="Write an update…" className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" /></label></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "forms") return <section data-service-reference={marker}>{title}<div className="mt-8 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Display name<input disabled placeholder="Your name" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" /></label><label className="text-sm font-medium text-slate-700">Email<input disabled placeholder="you@example.com" className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" /></label></div>{referenceForm(target.fieldLabel)}</section>;
  return <section data-service-reference={marker}>{title}<div className="mt-8 grid gap-4 sm:grid-cols-3">{target.tiles.map((tile, index) => <div key={tile} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-2xl font-semibold text-slate-900">{["12", "04", "01"][index]}</p><p className="mt-2 text-sm text-slate-500">{tile}</p></div>)}</div>{referenceForm(target.fieldLabel)}</section>;
}

function TileIcon({ index }: { index: number }) {
  return index === 0 ? <FileText className="h-4 w-4 text-slate-400" /> : index === 1 ? <FolderOpen className="h-4 w-4 text-slate-400" /> : <ShieldCheck className="h-4 w-4 text-slate-400" />;
}

function MissingTarget({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Target unavailable</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">요청한 교육용 웹 타깃을 찾을 수 없습니다.</h1><button type="button" onClick={onBack} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">문제 목록으로 돌아가기</button></div></main>;
}
