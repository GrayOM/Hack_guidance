import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleDot, FileText, FolderOpen, Link2, LockKeyhole, Search, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import "./case-prototype.css";

type SurfaceId = "brief" | "trail" | "archive";

const surfaces: Array<{ id: SurfaceId; label: string; caption: string; icon: typeof FileText }> = [
  { id: "brief", label: "Case note", caption: "사건 요청서", icon: FileText },
  { id: "trail", label: "Audit trail", caption: "공개 접근 흔적", icon: Link2 },
  { id: "archive", label: "Archive", caption: "배포 자료", icon: FolderOpen },
];

const evidence = [
  { id: "scope", tag: "S-01", title: "공개 검토 범위", detail: "고객 포털의 공개 검토 사본만 조사 대상입니다." },
  { id: "route", tag: "S-02", title: "배포 경로", detail: "갱신 전 문서가 남는 정적 배포 경로를 확인합니다." },
  { id: "marker", tag: "S-03", title: "증거 표식", detail: "교체 대상 문서의 검토 표식을 회수합니다." },
];

export default function CasePrototype() {
  const [, setLocation] = useLocation();
  const [surface, setSurface] = useState<SurfaceId>("brief");
  const [collected, setCollected] = useState<string[]>([]);
  const selectedSurface = surfaces.find(item => item.id === surface)!;
  const collectedItems = useMemo(() => evidence.filter(item => collected.includes(item.id)), [collected]);
  const isReady = collected.length === evidence.length;

  const toggleEvidence = (id: string) => setCollected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return <div className="case-prototype">
    <header className="case-prototype__masthead">
      <button type="button" onClick={() => setLocation("/problems")} className="case-prototype__back"><ArrowLeft size={16} /> Return to inventory</button>
      <div className="case-prototype__wordmark"><span className="case-prototype__wordmark-mark">W</span><span>WREN<br /><em>document room</em></span></div>
      <div className="case-prototype__access"><span className="case-prototype__pulse" /> REVIEW COPY <span>·</span> 14:32 UTC</div>
    </header>

    <main className="case-prototype__canvas">
      <aside className="case-prototype__casebar" aria-label="사건 정보">
        <div>
          <p className="case-prototype__eyebrow">CASE 01 / PROTOTYPE</p>
          <h1>Unsent<br />revision</h1>
          <p className="case-prototype__lede">교체된 공개 문서가 어떤 배포 경로에 남았는지 확인하고, 검토 표식을 수집하세요.</p>
        </div>
        <div className="case-prototype__case-meta">
          <div><span>SEVERITY</span><strong>LOW</strong></div>
          <div><span>DOMAIN</span><strong>docs.wren.local</strong></div>
          <div><span>MODE</span><strong>OBSERVE</strong></div>
        </div>
        <p className="case-prototype__safety"><ShieldAlert size={15} /> 이 프로토타입은 외부 시스템에 요청을 보내지 않는 교육용 화면입니다.</p>
      </aside>

      <section className="case-prototype__workroom" aria-label="Wren 문서 조사실">
        <nav className="case-prototype__tabs" aria-label="서비스 표면">
          {surfaces.map(item => {
            const Icon = item.icon;
            const active = item.id === surface;
            return <button key={item.id} type="button" onClick={() => setSurface(item.id)} className={active ? "is-active" : ""}><Icon size={15} /><span>{item.label}</span><small>{item.caption}</small></button>;
          })}
        </nav>

        <article className="case-prototype__sheet">
          <div className="case-prototype__sheet-topline"><span>{selectedSurface.caption.toUpperCase()}</span><span>READ-ONLY / 01</span></div>
          {surface === "brief" ? <BriefSurface /> : null}
          {surface === "trail" ? <TrailSurface /> : null}
          {surface === "archive" ? <ArchiveSurface /> : null}
        </article>

        <section className="case-prototype__evidence" aria-label="증거 수집">
          <div className="case-prototype__section-heading"><span>Evidence shelf</span><p>조사 중 확인한 근거만 선택합니다.</p></div>
          <div className="case-prototype__evidence-list">
            {evidence.map(item => {
              const selected = collected.includes(item.id);
              return <button type="button" key={item.id} onClick={() => toggleEvidence(item.id)} className={selected ? "is-collected" : ""}><span className="case-prototype__evidence-mark">{selected ? <Check size={14} /> : item.tag}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={16} /></button>;
            })}
          </div>
        </section>
      </section>

      <aside className="case-prototype__packet" aria-label="회수 패킷">
        <div className="case-prototype__packet-header"><CircleDot size={17} /><span>Review packet</span></div>
        <p className="case-prototype__packet-count">{String(collected.length).padStart(2, "0")}<small>/ 03</small></p>
        <div className="case-prototype__packet-list">{collectedItems.length ? collectedItems.map(item => <div key={item.id}><span>{item.tag}</span>{item.title}</div>) : <p>아직 선택한 증거가 없습니다.</p>}</div>
        <div className={isReady ? "case-prototype__packet-ready is-ready" : "case-prototype__packet-ready"}><LockKeyhole size={16} /><div><strong>{isReady ? "검토 패킷 준비 완료" : "회수 채널 대기 중"}</strong><span>{isReady ? "다음 단계에서 플래그 검증기를 연결합니다." : "세 가지 근거를 모아 검토 패킷을 완성하세요."}</span></div></div>
        <button type="button" disabled={!isReady} className="case-prototype__packet-action">Prepare handoff <ChevronRight size={15} /></button>
      </aside>
    </main>
  </div>;
}

function BriefSurface() {
  return <div className="case-prototype__document"><p className="case-prototype__document-kicker">FROM: RELEASE OPERATIONS</p><h2>문서 교체 요청이 완료됐지만, 이전 공개본의 배포 위치가 확인되지 않았습니다.</h2><p>Wren 고객 문서실은 정적 배포를 사용합니다. 운영팀은 외부 요청을 재현하지 않고 공개 문서, 배포 이력, 문서 메타데이터만으로 노출 범위를 검토해 달라고 요청했습니다.</p><blockquote>“새 문서는 배포됐습니다. 다만 이전 revision의 공개 경로가 정리됐는지 검증 기록이 없습니다.”</blockquote><div className="case-prototype__document-note"><Search size={17} /><span><strong>조사 목표</strong> 이전 revision이 남을 수 있는 공개 배포 경로와 검토 표식을 연결하세요.</span></div></div>;
}

function TrailSurface() {
  return <div className="case-prototype__trail"><div><time>14:04:12</time><span>release/2026.08.21 → <b>published</b></span></div><div><time>14:04:11</time><span>docs/revision-06.pdf → <b>superseded</b></span></div><div className="is-signal"><time>13:47:39</time><span>static/releases/revision-06/ → <b>cache retained</b><small>검토 대상 후보</small></span></div><div><time>13:42:05</time><span>editorial note → <b>sealed</b></span></div></div>;
}

function ArchiveSurface() {
  return <div className="case-prototype__archive"><div className="case-prototype__archive-path">/public/releases/<strong>revision-06</strong>/</div><div className="case-prototype__archive-row"><span>..</span><span>상위 경로</span><small>—</small></div><div className="case-prototype__archive-row"><span>DOC</span><span>handoff-summary.txt</span><small>1.8 KB</small></div><div className="case-prototype__archive-row is-revision"><span>PDF</span><span>revision-06.pdf</span><small>842 KB</small></div><div className="case-prototype__archive-row"><span>TXT</span><span>review-marker.txt</span><small>96 B</small></div><p>읽기 전용 보관함입니다. 항목을 선택해도 실제 다운로드나 외부 요청은 발생하지 않습니다.</p></div>;
}
