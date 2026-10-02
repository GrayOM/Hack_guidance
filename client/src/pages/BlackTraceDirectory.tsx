import { useState } from "react";
import { ChevronDown, LockKeyhole, Play, Radio, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { blackTraceNodeCount, blackTraceStages, nextBlackTraceRank } from "@shared/black-trace";
import { useBlackTraceProgress } from "@/hooks/useBlackTrace";
import { startPlatformLogin, usePlatformAuth } from "@/hooks/usePlatformAuth";
import { ConsoleNav } from "@/components/ConsoleNav";
import "./black-trace.css";

/** Locked intel keeps its shape but not its words, so the board reads as sealed, not as blank. */
const redact = (text: string) => text.split(/(\s+)/).map(part => (/^\s+$/.test(part) ? part : "█".repeat(Math.min(part.length, 9)))).join("");

export default function BlackTraceDirectory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = usePlatformAuth();
  const progress = useBlackTraceProgress(isAuthenticated);
  const completed = progress.data?.completedStages ?? [];
  const current = progress.data?.currentStage ?? 1;
  const unlocked = (stage: number) => stage <= current || completed.includes(stage);
  const percent = Math.round((completed.length / blackTraceNodeCount) * 100);
  const nextRank = nextBlackTraceRank(current);
  return <><ConsoleNav /><div className="bt-shell bt-directory">
    <header className="bt-topbar"><div className="bt-brand"><Radio size={16} /> OPERATION: <strong>BLACK TRACE</strong></div><div className="bt-topbar-status"><span className="bt-status-dot" /> SYSTEM CHANNEL / ONLINE</div></header>
    <main className="bt-directory__body">
      <section className="bt-directory__intro"><p className="bt-kicker">BROWSER RECONNAISSANCE TRAINING</p><h1>연구망에 비정상 통신 흔적이 남아 있습니다.</h1><p>화면에 보이는 것과 브라우저가 남긴 기록을 뒤져 마지막 접근 키를 회수하세요.</p><div className="bt-directory__access"><span>ACCESS LEVEL</span><strong>{progress.data?.accessLevel ?? "GUEST"}</strong>{nextRank ? <small>다음 등급 {nextRank.name} · 노드 {Math.max(1, nextRank.at - current)}개 남음</small> : <small>최고 등급에 도달했습니다</small>}</div></section>
      <section className="bt-directory__stages"><FieldBriefing solved={completed.length} /><div className="bt-progress"><div><span>OPERATION PROGRESS</span><strong>{completed.length} / {blackTraceNodeCount} NODES CLEARED</strong></div><div className="bt-progress__track"><i style={{ width: `${percent}%` }} /></div></div>
        {!isAuthenticated ? <div className="bt-login-callout"><ShieldCheck size={19} /><div><strong>진행 상황을 저장하려면 로그인하세요.</strong><span>문제는 로그인 없이도 볼 수 있습니다. 다만 제출과 해금 기록은 로그인해야 남습니다.</span></div><button onClick={startPlatformLogin}>로그인</button></div> : null}
        <div className="bt-stage-list">{blackTraceStages.map(stage => {
          const done = completed.includes(stage.id);
          const open = unlocked(stage.id);
          // A locked node shows its slot but not its contents. Nine rows of plain grey titles read
          // as a wall; redacted intel reads as something still to be opened.
          const away = stage.id - current;
          return <button key={stage.id} onClick={() => open && setLocation(`/black-trace/${stage.id}`)} disabled={!open} className={done ? "is-cleared" : open ? "is-active" : "is-locked"}>
            <span className="bt-stage-list__number">{String(stage.id).padStart(2, "0")}</span>
            <span className="bt-stage-list__info">
              <strong>{open ? stage.title : redact(stage.title)}</strong>
              <small>{open ? stage.target : redact(stage.target)}</small>
            </span>
            <span className="bt-stage-list__state">{done ? "CLEARED" : open ? "ACTIVE" : away === 1 ? "NEXT" : `-${away}`}</span>
            {done ? <ShieldCheck size={17} /> : open ? <Play size={17} /> : <LockKeyhole size={16} />}
          </button>;
        })}</div>
    </section></main>
  </div></>;
}

/**
 * The operation is written for people who just finished learning to build things. They know HTML;
 * most of them have never opened the Network panel. Nothing on the site said what the browser's own
 * tools are, so a visitor who could brute-force the first nodes still had no idea the sixth was
 * even a thing you could look at. The site is called Hack Guidance and had no guidance in it.
 *
 * This names the tools and what each panel shows. It names no node and no answer: knowing that a
 * request has headers is not knowing which header, and that gap is the operation.
 */
function FieldBriefing({ solved }: { solved: number }) {
  // Someone who has cleared nodes has already found the tools, so it starts folded for them.
  const [open, setOpen] = useState(solved === 0);
  const panels = [
    { name: "Elements", shows: "화면에 그려진 HTML 전체. 눈에 보이는 글자 말고도 주석, 숨은 입력칸, 태그에 붙은 속성이 전부 여기 있습니다." },
    { name: "Network", shows: "브라우저가 서버와 주고받은 요청과 응답. 응답 본문, 헤더, 중간에 거쳐 간 이동까지 한 건씩 남습니다." },
    { name: "Application", shows: "이 사이트가 브라우저에 저장해 둔 것. 쿠키와 저장소가 여기 모입니다. (Firefox는 저장소 탭)" },
  ];
  return <section className={`bt-briefing${open ? " is-open" : ""}`}>
    <button type="button" onClick={() => setOpen(value => !value)}>
      <ShieldCheck size={15} /> FIELD BRIEFING — 브라우저 개발자도구
      <ChevronDown size={15} className="bt-briefing__chevron" />
    </button>
    {open ? <div className="bt-briefing__body">
      <p className="bt-briefing__lead">이 작전은 브라우저가 이미 보여주는 것을 읽는 훈련입니다. 도구를 새로 설치할 필요는 없습니다. <strong>F12</strong>를 누르면 (Mac은 <strong>Cmd + Option + I</strong>) 아래 패널이 열립니다.</p>
      <dl>{panels.map(panel => <div key={panel.name}><dt>{panel.name}</dt><dd>{panel.shows}</dd></div>)}</dl>
      <p className="bt-briefing__note">어느 노드에서 어느 패널을 봐야 하는지는 적지 않았습니다. 그것을 고르는 것이 이 작전입니다.</p>
    </div> : null}
  </section>;
}
