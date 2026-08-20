import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, ChevronRight, Code2, FileText, Flag, FolderOpen, Globe2, LoaderCircle, Network, Send, ShieldCheck, TerminalSquare, UploadCloud, UserRound } from "lucide-react";
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
  const [activeSurface, setActiveSurface] = useState<"service" | "evidence" | "recovery">("service");
  const [selectedService, setSelectedService] = useState(0);
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
  const visualStyle = {
    "--target-hue": visual.hue,
    "--scene-phase": `${visual.scenePhase}deg`,
    "--scene-offset": `${visual.sceneOffset}%`,
    "--scene-offset-negative": `-${visual.sceneOffset}%`,
  } as CSSProperties;
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
      className={`web-target web-target--${visual.layout} web-target--scene-${visual.scene} web-target--tool-${target.tool} web-target--run-${target.playModel} web-target--${visual.type} web-target--${visual.density} web-target--nav-${visual.navigation}`}
      data-target-signature={visual.signature}
      style={visualStyle}
    >
      <main className="web-target__stage">
        <section className="web-target__app">
          <TargetHeader target={target} visual={visual} id={id} onBack={() => setLocation(`/lab/${id}`)} />
          <TargetSiteStatus target={target} visual={visual} />
          <div className="web-target__layout">
            <div className="web-target__content">
              <WorkspaceDock target={target} activeSurface={activeSurface} onChange={setActiveSurface} />
              {activeSurface === "service" ? <><ServiceRelay target={target} selected={selectedService} onSelect={index => { setSelectedService(index); setReference(`surface-${index + 1}`); }} /><TargetSurface target={target} visual={visual} marker={guide.marker} serviceName={target.tiles[selectedService]} reference={reference} setReference={setReference} onRun={runTarget} pending={practice.isPending} /><ServiceResponse response={response} artifact={artifact} tool={target.tool} /></> : null}
              {activeSurface === "evidence" ? <EvidenceBoard target={target} guide={guide} artifact={artifact} /> : null}
              {activeSurface === "recovery" ? <FlagSubmission flag={flag} setFlag={setFlag} submitFlag={submitFlag} pending={submit.isPending} solved={solved} nextNode={nextNode} onNext={() => setLocation(`/lab/${nextNode}`)} /> : null}
            </div>
            <TargetAside target={target} visual={visual} id={id} />
          </div>
        </section>
      </main>
    </div>
  );
}

function TargetHeader({ target, visual, id, onBack }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual; id: number; onBack: () => void }) {
  return <header className="web-target__header"><button type="button" onClick={onBack} className="web-target__site-return"><ArrowLeft className="h-3.5 w-3.5" /><span>CASE FILE</span></button><div className="web-target__brand"><div className="web-target__brand-mark">{target.tool === "packet-console" || target.tool === "case-terminal" ? <TerminalSquare className="h-4 w-4" /> : target.tool === "object-map" ? <Network className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}</div><div><p className="web-target__brand-name">{target.appName}</p><p className="web-target__origin">{target.origin}</p></div></div><nav className="web-target__nav" aria-label="Target navigation"><span>{visual.navigation === "rail" ? "Workspace" : "Home"}</span><span>{visual.navigation === "quiet" ? "About" : "Help"}</span><UserRound className="h-4 w-4" /></nav><div className="web-target__header-trace"><span className="web-target__live-dot" />CASE-{String(id).padStart(2, "0")} · {target.caseFile?.operatorCue ?? "SURFACE_ACTIVE"}</div></header>;
}

function TargetSiteStatus({ target, visual }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual }) {
  return <div className="web-target__site-status"><span>{target.origin}</span><span>{target.tool.replace(/-/g, " · ")}</span><span>{visual.scene} environment</span></div>;
}

function WorkspaceDock({ target, activeSurface, onChange }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; activeSurface: "service" | "evidence" | "recovery"; onChange: (surface: "service" | "evidence" | "recovery") => void }) {
  return <nav className="web-target__workspace-dock" aria-label="Investigation workspace"><button className={activeSurface === "service" ? "is-active" : ""} onClick={() => onChange("service")}>SERVICE · {target.appName}</button><button className={activeSurface === "evidence" ? "is-active" : ""} onClick={() => onChange("evidence")}>EVIDENCE VIEW</button><button className={activeSurface === "recovery" ? "is-active" : ""} onClick={() => onChange("recovery")}>RECOVERY DOCK</button></nav>;
}

function ServiceRelay({ target, selected, onSelect }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; selected: number; onSelect: (index: number) => void }) {
  return <div className="web-target__service-relay">{target.tiles.map((tile, index) => <button type="button" key={tile} className={selected === index ? "is-current" : ""} onClick={() => onSelect(index)}><span>0{index + 1}</span>{tile}</button>)}</div>;
}

function EvidenceBoard({ target, guide, artifact }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; guide: NonNullable<ReturnType<typeof practiceGuideForNode>>; artifact: string }) {
  const recovery: Record<typeof target.playModel, string> = { "identity-trail": "세션·복구·역할 경로에서 보호된 표식을 회수", "artifact-hunt": "파일 전달 흔적에서 보호된 아티팩트를 회수", "object-pivot": "객체 경계 전환 결과에서 보호된 표식을 회수", "request-replay": "요청·응답 차이에서 보호된 아티팩트를 회수", "render-trace": "렌더링 문맥에서 노출된 보호 표식을 회수", "incident-review": "연결된 증거 사슬에서 최종 아티팩트를 회수" };
  return <section className="web-target__evidence-board"><p>OBSERVATION WORKSPACE · {target.playModel.replace(/-/g, " ")}</p><h2>{target.caseFile?.title ?? target.heading}</h2><div><span>ENTRY SURFACE</span><strong>{target.origin}{target.route}</strong></div><div><span>RECOVERY PATH</span><strong>{recovery[target.playModel]}</strong></div><div><span>INVESTIGATION MARKER</span><strong>{guide.marker}</strong></div><div><span>RECOVERED ARTIFACT</span><strong>{artifact || "No artifact captured"}</strong></div></section>;
}

function TargetSurface({ target, visual, marker, serviceName, reference, setReference, onRun, pending }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual; marker: string; serviceName?: string; reference: string; setReference: (value: string) => void; onRun: () => void; pending: boolean }) {
  const icon = target.kind === "files" || target.kind === "upload" ? <FolderOpen className="h-5 w-5" /> : target.kind === "api" ? <Send className="h-5 w-5" /> : target.kind === "directory" ? <UserRound className="h-5 w-5" /> : target.kind === "report" || target.kind === "content" ? <FileText className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />;
  const referenceInput = <input value={reference} onChange={event => setReference(event.target.value)} placeholder={target.fieldPlaceholder} className="web-target__input" />;
  const action = <button type="submit" disabled={pending} className="web-target__action">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{pending ? "처리 중" : target.actionLabel}</button>;
  const title = <div className="web-target__hero"><div className="web-target__hero-icon">{icon}</div><div><p className="web-target__eyebrow">{target.caseFile?.operatorCue ?? visual.layout.toUpperCase()} · {target.tool.replace(/-/g, " ")}</p><h1>{target.heading}</h1><p>{serviceName ? `${serviceName} · ${target.description}` : target.description}</p></div></div>;
  const referenceForm = (label = target.fieldLabel) => <form onSubmit={event => { event.preventDefault(); onRun(); }} className="web-target__form"><label>{label}{referenceInput}</label>{action}</form>;
  const shell = (children: ReactNode) => <section className={`web-target__surface web-target__surface--${target.tool}`} data-service-reference={marker} data-tool={target.tool}>{title}<ToolTelemetry target={target} visual={visual} />{children}</section>;

  if (target.kind === "identity") return shell(<><div className="web-target__sign-in"><p className="web-target__surface-label">Access relay · {target.appName}</p><label>Work email<input disabled placeholder="name@workspace.example" className="web-target__input" /></label><label>{target.fieldLabel}{referenceInput}</label>{action}<p className="web-target__microcopy">세션·역할·복구 경로는 이 격리된 사건 환경에서만 분석됩니다.</p></div><FeatureList tiles={target.tiles} /></>);
  if (target.kind === "files") return shell(<><div className="web-target__file-list"><div className="web-target__file-list-title"><span>Recovered artifacts</span><span>3 records</span></div>{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`artifact-${index + 1}`)} className="web-target__file-row"><span><FolderOpen className="h-4 w-4" />{tile}</span><small>OPEN TRACE +{index + 1}d</small></button>)}</div>{referenceForm("Artifact reference")}</>);
  if (target.kind === "directory") return shell(<><div className="web-target__directory"><div><span>Observed object</span><span>Trace ID</span></div>{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`OBJ-${String(104 + index).padStart(3, "0")}`)}><span>{tile}</span><span>OBJ-{String(104 + index).padStart(3, "0")}</span></button>)}</div>{referenceForm(target.fieldLabel)}</>);
  if (target.kind === "upload") return shell(<><div className="web-target__dropzone"><UploadCloud className="h-9 w-9" /><p>Stage an isolated artifact</p><small>실제 파일은 업로드되지 않으며, 검수 경계만 재현합니다.</small></div><div className="web-target__request-presets">{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`intake-${index + 1}`)}>INSPECT {tile}</button>)}</div>{referenceForm(target.fieldLabel)}</>);
  if (target.kind === "api") return shell(<><div className="web-target__code"><div className="web-target__code-top"><Code2 className="h-4 w-4" /><span>REQUEST WORKBENCH</span><span>GET</span></div><p>GET {target.route}?ref=…</p><span>Accept: application/json</span><span>Authorization: Bearer [session]</span><strong>{`{ "channel": "isolated", "scope": "observe", "status": "ready" }`}</strong></div><div className="web-target__request-presets">{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`probe-${index + 1}`)}>LOAD {tile}</button>)}</div>{referenceForm(target.fieldLabel)}</>);
  if (target.kind === "content") return shell(<><div className="web-target__editor"><label>Captured draft<textarea disabled rows={4} placeholder="Incoming content appears here…" /></label><div><span>Render mode: text</span><span>Sanitizer: observe</span></div></div><div className="web-target__request-presets">{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`render-${index + 1}`)}>OPEN {tile}</button>)}</div>{referenceForm(target.fieldLabel)}</>);
  if (target.kind === "forms") return shell(<><div className="web-target__field-grid"><label>Display name<input disabled placeholder="External operator" /></label><label>Email<input disabled placeholder="operator@relay.example" /></label></div><div className="web-target__request-presets">{target.tiles.map((tile, index) => <button type="button" key={tile} onClick={() => setReference(`field-${index + 1}`)}>INSPECT {tile}</button>)}</div>{referenceForm(target.fieldLabel)}</>);
  return shell(<><div className="web-target__metric-grid">{target.tiles.map((tile, index) => <div key={tile}><strong>{["12", "04", "01"][index]}</strong><span>{tile}</span></div>)}</div><div className="web-target__case-log"><span>$ case://{target.origin}{target.route}</span><span>signal: {target.caseFile?.operatorCue ?? "SURFACE_ACTIVE"}</span><span>mode: passive collection</span></div>{referenceForm(target.fieldLabel)}</>);
}

function ToolTelemetry({ target, visual }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual }) {
  return <div className="web-target__tool-telemetry"><span>{target.tool.replace(/-/g, " ")}</span><span>scene::{visual.scene}</span><span>scope::isolated</span></div>;
}

function FeatureList({ tiles }: { tiles: readonly string[] }) {
  return <div className="web-target__feature-list">{tiles.map((tile, index) => <div key={tile}><span>{String(index + 1).padStart(2, "0")}</span><p>{tile}</p></div>)}</div>;
}

function ServiceResponse({ response, artifact, tool }: { response: string; artifact: string; tool: NonNullable<ReturnType<typeof webTargetForNode>>["tool"] }) {
  const prompt = tool === "packet-console" ? "response://packet" : tool === "case-terminal" ? "case-log" : tool === "artifact-vault" ? "vault-index" : "observed-response";
  return <div aria-live="polite" className={`web-target__response web-target__response--${tool}`}><p><span className="web-target__live-dot" />{prompt} · isolated trace</p><span>{response}</span>{artifact ? <div className="web-target__artifact"><small>Recovered artifact</small><code>{artifact}</code></div> : null}</div>;
}

function FlagSubmission({ flag, setFlag, submitFlag, pending, solved, nextNode, onNext }: { flag: string; setFlag: (value: string) => void; submitFlag: () => void; pending: boolean; solved: boolean; nextNode: number | null; onNext: () => void }) {
  return <section className="web-target__submission"><div className="web-target__submission-heading"><Flag className="h-4 w-4" /><div><h2>Hack Guidance 플래그 제출</h2><p>이 웹 타깃에서 회수한 플래그를 직접 입력합니다.</p></div></div><div className="web-target__submission-row"><input value={flag} onChange={event => setFlag(event.target.value)} onKeyDown={event => { if (event.key === "Enter") submitFlag(); }} placeholder="HG{...}" /><button type="button" onClick={submitFlag} disabled={pending}><ShieldCheck className="h-4 w-4" />{pending ? "검증 중" : "플래그 제출"}</button></div>{solved && nextNode ? <button type="button" onClick={onNext} className="web-target__next">다음 문제 브리프 열기 <ChevronRight className="h-4 w-4" /></button> : null}</section>;
}

function TargetAside({ target, visual, id }: { target: NonNullable<ReturnType<typeof webTargetForNode>>; visual: WebTargetVisual; id: number }) {
  const labels: Record<typeof target.playModel, { title: string; next: string }> = { "identity-trail": { title: "SESSION TRAIL", next: "세션·복구·역할 표식을 비교" }, "artifact-hunt": { title: "ARTIFACT HUNT", next: "파일 이름과 전달 흔적을 수집" }, "object-pivot": { title: "OBJECT PIVOT", next: "객체 번호와 소유권 경계를 대조" }, "request-replay": { title: "REQUEST REPLAY", next: "요청 형태와 응답 차이를 관찰" }, "render-trace": { title: "RENDER TRACE", next: "입력과 렌더링 문맥을 추적" }, "incident-review": { title: "INCIDENT REVIEW", next: "증거를 연결해 사건 흐름을 정리" } };
  const model = labels[target.playModel];
  return <aside className="web-target__aside"><p className="web-target__aside-label">{model.title}</p><h2>RUN #{String(id).padStart(2, "0")}</h2><p>{target.caseFile?.brief}</p><div className="web-target__aside-list"><div><AsideIcon index={0} /><span>SURFACE · {target.appName}</span></div><div><AsideIcon index={1} /><span>MODEL · {target.playModel.replace(/-/g, " ")}</span></div><div><AsideIcon index={2} /><span>NEXT · {model.next}</span></div></div><div className="web-target__case"><span>Case signature</span><strong>{target.caseFile?.operatorCue ?? `NODE-${id}`}</strong><small>{visual.signature} · {visual.density}</small></div><div className="web-target__telemetry"><span>LINK</span><strong>LOCAL / ENCRYPTED</strong><span>OBSERVATION</span><strong>PASSIVE MODE</strong></div></aside>;
}

function AsideIcon({ index }: { index: number }) {
  return index === 0 ? <FileText className="h-4 w-4" /> : index === 1 ? <FolderOpen className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />;
}

function MissingTarget({ onBack }: { onBack: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 p-6 text-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Target unavailable</p><h1 className="mt-3 text-2xl font-semibold text-slate-900">요청한 교육용 웹 타깃을 찾을 수 없습니다.</h1><button type="button" onClick={onBack} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">문제 목록으로 돌아가기</button></div></main>;
}
