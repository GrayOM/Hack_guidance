export type BlackTraceStage = {
  id: number;
  code: string;
  title: string;
  target: string;
  access: "TRAINEE" | "ANALYST" | "FIELD OPERATOR" | "OPERATOR";
  sceneLabel: string;
  narrative: string;
  actionLabel?: string;
  /** A single suggestive line the operator may choose to open. It points at the layer that
   *  holds the trace without naming the tool: being told the answer is not the game. */
  intel: string;
  /** What the node reports when inspected. Each node tells its own story, and the verdict
   *  is the nudge toward the layer that actually holds the trace. */
  /** The readout the scan prints into the scene. It is evidence that something is missing,
   *  never the trace itself: the counts have to stop matching for the operator to look. */
  scan: { lines: string[]; verdict: string; reveal: { title: string; rows: Array<[string, string]>; note: string } };
  surface: "comment" | "field" | "identity" | "cookie" | "route" | "response" | "redirect" | "header" | "robots" | "vault";
};

export const blackTraceStages: BlackTraceStage[] = [
  { id: 1, code: "CASE #001", title: "Ghost Comment", target: "recon-terminal.lab", access: "TRAINEE", sceneLabel: "SURFACE STATUS: QUIET", narrative: "조사관은 아무것도 발견하지 못했다. 하지만 누군가 기록을 완전히 지우지는 않은 것 같다.", actionLabel: "INSPECT RECORD", intel: "화면에 그려진 것과 서버가 보낸 것이 늘 같지는 않다.", scan: { lines: ["> initiating record scan...", "> parsing visible text nodes...", "> visible entries: 0", "[!] RECORD EMPTY"], verdict: "RECORD EMPTY", reveal: { title: "RECOVERED FRAGMENT", rows: [["text nodes", "3"], ["comment nodes", "1"], ["rendered to screen", "3"]], note: "4개 중 3개만 화면에 그려졌다." } }, surface: "comment" },
  { id: 2, code: "CASE #002", title: "Forgotten Field", target: "auth-terminal.lab", access: "TRAINEE", sceneLabel: "FORM LAYER: SEALED", narrative: "폐기된 인증 단말기에서 오래된 로그인 흔적이 발견되었다. 화면에는 아무 정보도 남아 있지 않다.", actionLabel: "AUTHENTICATE", intel: "제출되는 양식에 눈에 보이는 칸만 들어 있다고 믿지 마라.", scan: { lines: ["> submitting credentials...", "> visible inputs: 1", "> server rejected the form", "[-] AUTH REJECTED"], verdict: "AUTH REJECTED", reveal: { title: "FORM DUMP", rows: [["visible inputs", "1"], ["transmitted fields", "2"], ["field[0]", "user_id"], ["field[1]", "\u2588\u2588\u2588\u2588\u2588\u2588"]], note: "보낸 것은 2개, 보인 것은 1개." } }, surface: "field" },
  { id: 3, code: "CASE #003", title: "Embedded Identity", target: "personnel-archive.lab", access: "TRAINEE", sceneLabel: "IDENTITY MAP: PARTIAL", actionLabel: "READ CARD", narrative: "회수된 접근 카드는 무효 처리되었다. 하지만 카드에는 화면에 표시되지 않는 식별 정보가 남아 있다.", intel: "인쇄된 면이 아니라, 카드 자체가 들고 있는 값을 보라.", scan: { lines: ["> reading personnel card...", "> printed fields: NAME / CLEARANCE / STATUS", "> all values redacted", "[!] IDENTITY REDACTED"], verdict: "IDENTITY REDACTED", reveal: { title: "CARD ATTRIBUTES", rows: [["printed fields", "3"], ["element attributes", "4"], ["unmatched", "1"]], note: "인쇄되지 않은 속성이 하나 남아 있다." } }, surface: "identity" },
  { id: 4, code: "CASE #004", title: "Residual Trace", target: "session-monitor.lab", access: "ANALYST", sceneLabel: "LOCAL TRACE: DETECTED", actionLabel: "CHECK SESSION", narrative: "마지막 접속자는 이미 세션을 종료했다. 하지만 브라우저는 모든 흔적을 잊지는 않는다.", intel: "브라우저는 사이트마다 따로 기억한다. 그 기억은 화면에 없다.", scan: { lines: ["> session monitor online", "> active sessions: 0", "> last operator signed out", "[!] SESSION ENDED"], verdict: "SESSION ENDED", reveal: { title: "LOCAL STORE", rows: [["active sessions", "0"], ["stored keys", "1"], ["scope", "this site only"]], note: "로그아웃 뒤에도 키 하나가 살아남았다." } }, surface: "cookie" },
  { id: 5, code: "CASE #005", title: "Wrong Destination", target: "relay-gateway.lab", access: "ANALYST", sceneLabel: "ROUTE: FORWARDED", narrative: "다음 문은 이미 열렸다. 문제는 우리가 어디로 향하고 있는지다.", actionLabel: "CONTINUE", intel: "도착한 뒤에도 지나온 길은 어딘가에 적혀 있다.", scan: { lines: ["> gateway relay engaged", "> forwarding to next node..."], verdict: "ROUTE FORWARDED", reveal: { title: "RELAY", rows: [["next node", "05"], ["carried parameters", "1"]], note: "이동에 값 하나가 함께 실렸다." } }, surface: "route" },
  { id: 6, code: "CASE #006", title: "Silent Response", target: "remote-node.lab", access: "ANALYST", sceneLabel: "CONNECTION: WAITING", narrative: "폐쇄된 서버에서 희미한 신호가 감지되었다. 화면에 전달된 정보는 거의 없다.", actionLabel: "CONNECT", intel: "요청이 실패해 보여도, 대화는 이미 오갔다.", scan: { lines: ["> establishing connection...", "> handshake accepted", "> ERROR: response discarded", "[-] CONNECTION FAILED"], verdict: "CONNECTION FAILED", reveal: { title: "TRANSPORT", rows: [["request", "sent"], ["status", "200 OK"], ["body bytes", "92"], ["rendered", "0"]], note: "본문은 도착했고, 화면이 버렸다." } }, surface: "response" },
  { id: 7, code: "CASE #007", title: "Follow the Trail", target: "personnel-trace.lab", access: "FIELD OPERATOR", sceneLabel: "REDIRECT: CAPTURED", narrative: "연구원 K는 사건 직전 다른 구역으로 이동했다. 마지막 이동 기록은 손상되어 있다.", actionLabel: "TRACE MOVEMENT", intel: "도착지가 아니라 길을 알려준 쪽에 답이 있다.", scan: { lines: ["> movement trace sent", "> following personnel route...", "[-] RECORD NOT FOUND"], verdict: "RECORD NOT FOUND", reveal: { title: "ROUTE TRACE", rows: [["first response", "302"], ["final response", "404"], ["hops", "2"]], note: "404는 두 번째 응답이다. 첫 번째가 길을 알려줬다." } }, surface: "redirect" },
  { id: 8, code: "CASE #008", title: "Server Whisper", target: "comms-node.lab", access: "FIELD OPERATOR", sceneLabel: "STATUS: ONLINE", narrative: "서버와의 통신은 성공했다. 그러나 화면에 전달된 정보는 거의 없다.", actionLabel: "REQUEST STATUS", intel: "본문이 비었다고 응답이 빈 것은 아니다.", scan: { lines: ["> status requested", "STATUS: ONLINE", "MESSAGE: NO DATA", "[!] BODY EMPTY"], verdict: "BODY EMPTY", reveal: { title: "RESPONSE", rows: [["body", "{ }"], ["header count", "6"], ["non-standard", "1"]], note: "표준이 아닌 헤더가 하나 섞여 있다." } }, surface: "header" },
  { id: 9, code: "CASE #009", title: "Robot Rules", target: "security-index.lab", access: "FIELD OPERATOR", sceneLabel: "AUTOMATION: WATCHING", actionLabel: "PING CRAWLER", narrative: "이 서버에는 사람보다 먼저 길을 확인하는 존재가 있다. 모든 길이 사람에게 공개되는 것은 아니다.", intel: "사람보다 먼저 길을 안내받는 방문자가 있다.", scan: { lines: ["> automated crawler detected", "> requesting indexing policy...", "> human-visible routes: 0", "[!] POLICY NOT RENDERED"], verdict: "POLICY NOT RENDERED", reveal: { title: "CRAWLER EXCHANGE", rows: [["policy requested", "yes"], ["served to crawler", "1 file"], ["served to screen", "0"]], note: "그 파일은 화면 바깥에 있다." } }, surface: "robots" },
  { id: 10, code: "CASE #010", title: "Fragmented Key", target: "vault-node-01.lab", access: "OPERATOR", sceneLabel: "SIGNAL: FRAGMENTED", narrative: "MASTER ACCESS KEY가 손상되어 있다. 복구 가능한 조각은 두 개다.", actionLabel: "RECOVER VAULT", intel: "두 조각은 서로 다른 곳에서 온다. 하나는 이미 눈앞에 있다.", scan: { lines: ["> vault recovery pending", "> fragment 02 received", "STATUS: PARTIAL", "[!] KEY INCOMPLETE"], verdict: "KEY INCOMPLETE", reveal: { title: "VAULT", rows: [["fragment 01", "in page"], ["fragment 02", "received"], ["assembled", "no"]], note: "조각은 둘 다 있다. 아직 이어지지 않았을 뿐." } }, surface: "vault" },
];

/**
 * Stages whose trace the client itself plants in the browser (DOM, cookie, URL). Their value
 * must therefore be derived per operator on the server, or the single JavaScript bundle hands
 * every visitor the whole answer sheet. The remaining stages are issued by the trace channel.
 */
export const traceLabels: Record<number, string> = {
  1: "ghost_in_the_source",
  2: "hidden_fields_remember",
  3: "attributes_tell_more",
  4: "cookies_leave_traces",
  5: "read_the_address",
  10: "two_places",
};

/** Stage 10 is split in two: the browser holds part one, the trace channel answers with this. */
export const vaultTraceSuffix = "one_key}";

/**
 * Builds the trace planted in the browser for a stage. A null token reproduces the pre-rotation
 * value, which keeps the stages solvable while the learning function has no operator secret.
 */
export function composeTrace(stage: number, token: string | null) {
  const label = traceLabels[stage];
  if (!label) return null;
  const body = token ? `${label}_${token}` : label;
  return stage === 10 ? `FLAG{${body}_` : `FLAG{${body}}`;
}

/** The clearance ladder the operation advances through, used to show what the next node unlocks. */
export const blackTraceRanks = [
  { at: 1, name: "TRAINEE" },
  { at: 4, name: "ANALYST" },
  { at: 7, name: "FIELD OPERATOR" },
  { at: 10, name: "OPERATOR" },
] as const;

export function nextBlackTraceRank(currentStage: number) {
  return blackTraceRanks.find(rank => rank.at > currentStage) ?? null;
}

export const blackTraceStageById = (id: number) => blackTraceStages.find(stage => stage.id === id);
/** GUEST is reserved for a visitor without a session; a known stage always has a real tier. */
export const blackTraceAccessForStage = (stage: number) => blackTraceStageById(stage)?.access ?? "GUEST";
