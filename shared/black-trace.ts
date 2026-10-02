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
  /** The stamp the node leaves once its instrument has reported. Everything else the node
   *  shows lives in that instrument, because each node is operated differently. */
  scan: { verdict: string };
  surface: "comment" | "field" | "identity" | "cookie" | "route" | "response" | "redirect" | "header" | "robots" | "vault";
};

export const blackTraceStages: BlackTraceStage[] = [
  { id: 1, code: "CASE #001", title: "Ghost Comment", target: "recon-terminal.lab", access: "TRAINEE", sceneLabel: "SURFACE STATUS: QUIET", narrative: "앞서 들어온 조사관은 빈손으로 돌아갔다. 다만 기록을 지운 쪽도 그리 꼼꼼하지는 않았다.", actionLabel: "INSPECT RECORD", intel: "화면에 그려진 것이 서버가 보낸 전부는 아니다.", scan: { verdict: "RECORD EMPTY" }, surface: "comment" },
  { id: 2, code: "CASE #002", title: "Forgotten Field", target: "auth-terminal.lab", access: "TRAINEE", sceneLabel: "FORM LAYER: SEALED", narrative: "폐기된 인증 단말기다. 화면에 남은 정보는 없는데, 이 단말은 아직도 무언가를 보내고 있다.", actionLabel: "AUTHENTICATE", intel: "보내는 칸의 수와 보이는 칸의 수가 같으리라는 법은 없다.", scan: { verdict: "AUTH REJECTED" }, surface: "field" },
  { id: 3, code: "CASE #003", title: "Embedded Identity", target: "personnel-archive.lab", access: "TRAINEE", sceneLabel: "IDENTITY MAP: PARTIAL", actionLabel: "READ CARD", narrative: "회수한 접근 카드는 이미 무효 처리됐다. 그런데도 보관 시스템은 이 카드를 여전히 구분해낸다.", intel: "인쇄된 면이 카드의 전부는 아니다.", scan: { verdict: "IDENTITY REDACTED" }, surface: "identity" },
  { id: 4, code: "CASE #004", title: "Residual Trace", target: "session-monitor.lab", access: "ANALYST", sceneLabel: "LOCAL TRACE: DETECTED", actionLabel: "CHECK SESSION", narrative: "마지막 접속자는 세션을 닫고 떠났다. 떠난 자리가 깨끗하게 비어 있는 경우는 드물다.", intel: "브라우저는 사이트마다 따로 기억해 둔다.", scan: { verdict: "SESSION ENDED" }, surface: "cookie" },
  { id: 5, code: "CASE #005", title: "Wrong Destination", target: "relay-gateway.lab", access: "ANALYST", sceneLabel: "ROUTE: FORWARDED", narrative: "다음 문은 이미 열렸다. 다만 이 통로가 무엇을 함께 들고 가는지는 아직 확인되지 않았다.", actionLabel: "CONTINUE", intel: "도착하고 나서도 지나온 길은 어딘가에 적혀 남는다.", scan: { verdict: "ROUTE FORWARDED" }, surface: "route" },
  { id: 6, code: "CASE #006", title: "Silent Response", target: "remote-node.lab", access: "ANALYST", sceneLabel: "CONNECTION: WAITING", narrative: "폐쇄된 줄 알았던 서버가 응답했다. 그런데 화면에는 아무것도 뜨지 않는다.", actionLabel: "CONNECT", intel: "실패한 것처럼 보여도 주고받은 것은 이미 있다.", scan: { verdict: "CONNECTION FAILED" }, surface: "response" },
  { id: 7, code: "CASE #007", title: "Follow the Trail", target: "personnel-trace.lab", access: "FIELD OPERATOR", sceneLabel: "REDIRECT: CAPTURED", narrative: "연구원 K는 사건 직전에 구역을 옮겼다. 도착지 기록은 남았지만, 그곳에는 아무것도 없다.", actionLabel: "TRACE MOVEMENT", intel: "길을 알려준 쪽과 도착한 쪽은 서로 다른 응답이다.", scan: { verdict: "RECORD NOT FOUND" }, surface: "redirect" },
  { id: 8, code: "CASE #008", title: "Server Whisper", target: "comms-node.lab", access: "FIELD OPERATOR", sceneLabel: "STATUS: ONLINE", narrative: "통신은 정상이다. 회선은 계속 살아 있는데 넘어오는 내용만 비어 있다.", actionLabel: "REQUEST STATUS", intel: "본문이 비었다고 응답까지 빈 것은 아니다.", scan: { verdict: "BODY EMPTY" }, surface: "header" },
  { id: 9, code: "CASE #009", title: "Robot Rules", target: "security-index.lab", access: "FIELD OPERATOR", sceneLabel: "AUTOMATION: WATCHING", actionLabel: "PING CRAWLER", narrative: "이 서버를 찾아오는 쪽은 사람만이 아니다. 먼저 다녀가는 쪽은 안내를 따로 받는다.", intel: "그 안내문은 사람이 읽으라고 둔 자리에 있지 않다.", scan: { verdict: "POLICY NOT RENDERED" }, surface: "robots" },
  { id: 10, code: "CASE #010", title: "Fragmented Key", target: "vault-node-01.lab", access: "OPERATOR", sceneLabel: "SIGNAL: FRAGMENTED", narrative: "MASTER ACCESS KEY는 둘로 쪼개져 있다. 두 조각이 같은 곳에 있지는 않다.", actionLabel: "RECOVER VAULT", intel: "한 조각은 이미 이 화면에 있다. 나머지는 물어봐야 온다.", scan: { verdict: "KEY INCOMPLETE" }, surface: "vault" },
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
