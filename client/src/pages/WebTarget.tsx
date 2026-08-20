import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ChevronRight, FileText, Flag, FolderOpen, Globe2, LoaderCircle, LockKeyhole, Send, ShieldCheck, UploadCloud, UserRound } from "lucide-react";
import { toast } from "sonner";
import { challengeById } from "@shared/learning";
import { practiceGuideForNode } from "@/lib/problem-brief";
import { webTargetForNode, webTargetVisualForNode, type WebTargetVisual } from "@/lib/web-targets";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { usePracticeProbe, useSubmitFlag } from "@/hooks/useLearningApi";
import "./web-target.css";

export default function WebTarget() {
  const [, targetParams] = useRoute("/target/:id");
  const [, legacyParams] = useRoute("/workspace/:id");
  const [, setLocation] = useLocation();
  const id = Number(targetParams?.id ?? legacyParams?.id ?? 0);
  const target = webTargetForNode(id);
  const visual = webTargetVisualForNode(id);
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

  if (!target || !challenge || !guide || !visual) return <MissingTarget onBack={() => setLocation("/problems")} />;
  const nextNode = id < 50 ? id + 1 : null;
  const visualStyle = { "--target-hue": visual.hue } as CSSProperties;
  const runTarget = () => {
    if (!isAuthenticated) {
      setResponse("Sign in to Hack Guidance from the challenge directory before sending a request to this training target.");
      toast.message("플랫폼 로그인 후 교육용 웹 타깃 요청을 실행할 수 있습니다.");
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

  return (
    <div
      className={`web-target web-target--${visual.layout} web-target--${visual.type} web-target--${visual.density} web-target--nav-${visual.navigation}`}
      data-target-signature={visual.signature}
      style={visualStyle}
    >
      <BrowserFrame origin={target.origin} route={target.route} onBack={() => setLocation(`/lab/${id}`)} />
      <main className="web-target__stage">
        <section className="web-target__app">
          <TargetHeader target={target} visual={visual} />
          <div className="web-target__layout">
            <div className="web-target__content">
              <TargetSurface target={target} visual={visual} marker={guide.marker} reference={reference} setReference={setReference} onRun={runTarget} pending={practice.isPending} />
              <ServiceResponse response={response} artifact={artifact} />
              <FlagSubmission flag={flag} setFlag={setFlag} submitFlag={submitFlag} pending={submit.isPending} solved={solved} nextNode={nextNode} onNext={() => setLocation(`/lab/${nextNode}`)} />
            </div>
            <TargetAside target={target} visual={visual} id={id} />
          </div>
        </section>
      </main>
    </div>
  );
}

function BrowserFrame({ origin, route, onBack }: { origin: string; route: string; onBack: () => void }) {
  return <header className="web-target__browser"><div className="web-target__browser-inner"><button type="button" onClick={onBack} className="web-target__exit"><ArrowLeft className="h-4 w-4" />나가기</button><div className="web-target__address"><LockKeyhole className="h-3.5 w-3.5" /><span>https://{origin}{route}</span></div><span className="web-target__browser-state">EDUCATION TARGET</span></div></header>;
}

function TargetHeader({ target, visual }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual }) {
  return <header className="web-target__header"><div className="web-target__brand"><div className="web-target__brand-mark"><Globe2 className="h-4 w-4" /></div><div><p className="web-target__brand-name">{target.appName}</p><p className="web-target__origin">{target.origin}</p></div></div><nav className="web-target__nav" aria-label="Target navigation"><span>{visual.navigation === "rail" ? "Workspace" : "Home"}</span><span>{visual.navigation === "quiet" ? "About" : "Help"}</span><UserRound className="h-4 w-4" /></nav></header>;
}

function TargetSurface({ target, visual, marker, reference, setReference, onRun, pending }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual; marker: string; reference: string; setReference: (value: string) => void; onRun: () => void; pending: boolean }) {
  const icon = target.kind === "files" || target.kind === "upload" ? <FolderOpen className="h-5 w-5" /> : target.kind === "api" ? <Send className="h-5 w-5" /> : target.kind === "directory" ? <UserRound className="h-5 w-5" /> : target.kind === "report" || target.kind === "content" ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />;
  const referenceInput = <input value={reference} onChange={event => setReference(event.target.value)} placeholder={target.fieldPlaceholder} className="web-target__input" />;
  const action = <button type="submit" disabled={pending} className="web-target__action">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "처리 중" : target.actionLabel}</button>;
  const title = <div className="web-target__hero"><div className="web-target__hero-icon">{icon}</div><div><p className="web-target__eyebrow">{visual.layout.toUpperCase()} INTERFACE</p><h1>{target.heading}</h1><p>{target.description}</p></div></div>;
  const referenceForm = (label = target.fieldLabel) => <form onSubmit={event => { event.preventDefault(); onRun(); }} className="web-target__form"><label>{label}{referenceInput}</label>{action}</form>;

  if (target.kind === "identity") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__sign-in"><p className="web-target__surface-label">Sign in to {target.appName}</p><label>Work email<input disabled placeholder="name@workspace.example" className="web-target__input" /></label><label>{target.fieldLabel}{referenceInput}</label>{action}<p className="web-target__microcopy">Need help? Recover access or review your active sessions.</p></div><FeatureList tiles={target.tiles} /></section>;
  if (target.kind === "files") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__file-list"><div className="web-target__file-list-title"><span>Shared library</span><span>3 items</span></div>{target.tiles.map((tile, index) => <div key={tile} className="web-target__file-row"><span><FolderOpen className="h-4 w-4" />{tile}</span><small>Updated {index + 1}d ago</small></div>)}</div>{referenceForm("Open item")}</section>;
  if (target.kind === "directory") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__directory"><div><span>Name</span><span>Workspace</span></div>{target.tiles.map((tile, index) => <div key={tile}><span>{tile}</span><span>#{String(104 + index).padStart(3, "0")}</span></div>)}</div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "upload") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__dropzone"><UploadCloud className="h-9 w-9" /><p>Drop a file here to stage it</p><small>No real files leave this isolated training target.</small></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "api") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__code"><p>GET {target.route}?ref=…</p><span>Accept: application/json</span><span>Authorization: Bearer [session]</span><strong>{`{ "status": "ready", "scope": "workspace" }`}</strong></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "content") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__editor"><label>Draft<textarea disabled rows={4} placeholder="Write an update…" /></label><div><span>Plain text</span><span>0 words</span></div></div>{referenceForm(target.fieldLabel)}</section>;
  if (target.kind === "forms") return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__field-grid"><label>Display name<input disabled placeholder="Your name" /></label><label>Email<input disabled placeholder="you@example.com" /></label></div>{referenceForm(target.fieldLabel)}</section>;
  return <section className="web-target__surface" data-service-reference={marker}>{title}<div className="web-target__metric-grid">{target.tiles.map((tile, index) => <div key={tile}><strong>{["12", "04", "01"][index]}</strong><span>{tile}</span></div>)}</div>{referenceForm(target.fieldLabel)}</section>;
}

function FeatureList({ tiles }: { tiles: readonly string[] }) {
  return <div className="web-target__feature-list">{tiles.map((tile, index) => <div key={tile}><span>{String(index + 1).padStart(2, "0")}</span><p>{tile}</p></div>)}</div>;
}

function ServiceResponse({ response, artifact }: { response: string; artifact: string }) {
  return <div aria-live="polite" className="web-target__response"><p>Service response</p><span>{response}</span>{artifact ? <div className="web-target__artifact"><small>Recovered artifact</small><code>{artifact}</code></div> : null}</div>;
}

function FlagSubmission({ flag, setFlag, submitFlag, pending, solved, nextNode, onNext }: { flag: string; setFlag: (value: string) => void; submitFlag: () => void; pending: boolean; solved: boolean; nextNode: number | null; onNext: () => void }) {
  return <section className="web-target__submission"><div className="web-target__submission-heading"><Flag className="h-4 w-4" /><div><h2>Hack Guidance 플래그 제출</h2><p>이 웹 타깃에서 회수한 플래그를 직접 입력합니다.</p></div></div><div className="web-target__submission-row"><input value={flag} onChange={event => setFlag(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitFlag(); }} placeholder="HG{...}" /><button type="button" onClick={submitFlag} disabled={pending}><ShieldCheck className="h-4 w-4" />{pending ? "검증 중" : "플래그 제출"}</button></div>{solved && nextNode ? <button type="button" onClick={onNext} className="web-target__next">다음 문제 브리프 열기 <ChevronRight className="h-4 w-4" /></button> : null}</section>;
}

function TargetAside({ target, visual, id }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual; id: number }) {
  return <aside className="web-target__aside"><p className="web-target__aside-label">Isolated training target</p><h2>{target.appName}</h2><p>이 서비스는 외부 시스템과 분리된 교육용 웹 타깃입니다. 실제 계정이나 실제 데이터를 사용하지 않습니다.</p><div className="web-target__aside-list">{target.tiles.map((tile, index) => <div key={tile}><AsideIcon index={index} /><span>{tile}</span></div>)}</div><div className="web-target__case"><span>Case node</span><strong>#{String(id).padStart(2, "0")}</strong><small>{visual.signature} · {visual.density}</small></div></aside>;
}

function AsideIcon({ index }: { index: number }) {
  return index === 0 ? <FileText className="h-4 w-4" /> : index === 1 ? <FolderOpen className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />;
}

function MissingTarget({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Target unavailable</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">요청한 교육용 웹 타깃을 찾을 수 없습니다.</h1><button type="button" onClick={onBack} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">문제 목록으로 돌아가기</button></div></main>;
}
