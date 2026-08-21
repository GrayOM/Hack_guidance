import { LockKeyhole, Play, Radio, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { blackTraceStages } from "@shared/black-trace";
import { useBlackTraceProgress } from "@/hooks/useBlackTrace";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import "./black-trace.css";

export default function BlackTraceDirectory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const progress = useBlackTraceProgress(isAuthenticated);
  const completed = progress.data?.completedStages ?? [];
  const current = progress.data?.currentStage ?? 1;
  const unlocked = (stage: number) => stage <= current || completed.includes(stage);
  const percent = Math.round((completed.length / 10) * 100);
  return <div className="bt-shell bt-directory">
    <header className="bt-topbar"><div className="bt-brand"><Radio size={16} /> OPERATION: <strong>BLACK TRACE</strong></div><div className="bt-topbar-status"><span className="bt-status-dot" /> SYSTEM CHANNEL / ONLINE</div></header>
    <main className="bt-directory__body">
      <section className="bt-directory__intro"><p className="bt-kicker">BROWSER RECONNAISSANCE TRAINING</p><h1>비정상 통신 흔적이<br />연구망에 남아 있습니다.</h1><p>화면에 드러난 것과 브라우저에 남은 기록을 조사해 마지막 접근 키를 회수하세요.</p><div className="bt-directory__access"><span>ACCESS LEVEL</span><strong>{progress.data?.accessLevel ?? "GUEST"}</strong></div></section>
      <section className="bt-directory__stages"><div className="bt-progress"><div><span>OPERATION PROGRESS</span><strong>{completed.length} / 10 NODES CLEARED</strong></div><div className="bt-progress__track"><i style={{ width: `${percent}%` }} /></div></div>
        {!isAuthenticated ? <div className="bt-login-callout"><ShieldCheck size={19} /><div><strong>진행 기록을 저장하려면 로그인하세요.</strong><span>문제 화면은 확인할 수 있고, 플래그 제출과 다음 노드 해금은 로그인 뒤 저장됩니다.</span></div><button onClick={startPlatformLogin}>로그인</button></div> : null}
        <div className="bt-stage-list">{blackTraceStages.map(stage => { const done = completed.includes(stage.id); const open = unlocked(stage.id); return <button key={stage.id} onClick={() => open && setLocation(`/black-trace/${stage.id}`)} disabled={!open} className={done ? "is-cleared" : open ? "is-active" : "is-locked"}><span className="bt-stage-list__number">{String(stage.id).padStart(2, "0")}</span><span className="bt-stage-list__info"><strong>{stage.title}</strong><small>{stage.target}</small></span><span className="bt-stage-list__state">{done ? "CLEARED" : open ? "ACTIVE" : "LOCKED"}</span>{done ? <ShieldCheck size={17} /> : open ? <Play size={17} /> : <LockKeyhole size={16} />}</button>; })}</div>
    </section></main>
  </div>;
}
