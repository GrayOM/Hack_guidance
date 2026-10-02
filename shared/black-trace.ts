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
  /** Shown only after the node is cleared. Why the thing just found is a defect, and what a
   *  report would recommend. Withheld until then so it never doubles as a hint. */
  lesson: { risk: string; fix: string };
  surface: "comment" | "field" | "identity" | "cookie" | "route" | "response" | "redirect" | "header" | "robots" | "vault";
};

export const blackTraceStages: BlackTraceStage[] = [
  { id: 1, code: "CASE #001", title: "Wrong Destination", target: "relay-gateway.lab", access: "TRAINEE", sceneLabel: "ROUTE: FORWARDED", narrative: "다음 문은 이미 열렸다. 다만 이 통로가 무엇을 함께 들고 가는지는 아직 확인되지 않았다.", actionLabel: "CONTINUE", intel: "도착하고 나서도 지나온 길은 어딘가에 적혀 남는다.", scan: { verdict: "ROUTE FORWARDED" }, lesson: { risk: "URL은 브라우저 기록, 서버 접근 로그, Referer 헤더에 동시에 남는다. 토큰이나 개인정보를 쿼리에 실으면 세 곳에 한 번에 기록된다.", fix: "민감한 값은 쿼리가 아니라 본문으로 보내고, 외부로 나가는 Referer를 제한한다." }, surface: "route" },
  { id: 2, code: "CASE #002", title: "Ghost Comment", target: "recon-terminal.lab", access: "TRAINEE", sceneLabel: "SURFACE STATUS: QUIET", narrative: "앞서 들어온 조사관은 빈손으로 돌아갔다. 다만 기록을 지운 쪽도 그리 꼼꼼하지는 않았다.", actionLabel: "INSPECT RECORD", intel: "화면에 그려진 것이 서버가 보낸 전부는 아니다.", scan: { verdict: "RECORD EMPTY" }, lesson: { risk: "개발 중 남긴 주석이 운영 빌드에 그대로 올라가면 내부 경로, 임시 계정, 처리 로직이 소스 보기만으로 드러난다. 공격자는 코드를 읽는 것이 아니라 주석을 읽는다.", fix: "배포 빌드에서 주석을 제거하고, 민감한 메모는 소스가 아니라 이슈 트래커에 남긴다." }, surface: "comment" },
  { id: 3, code: "CASE #003", title: "Forgotten Field", target: "auth-terminal.lab", access: "TRAINEE", sceneLabel: "FORM LAYER: SEALED", narrative: "폐기된 인증 단말기다. 화면에 남은 정보는 없는데, 이 단말은 아직도 무언가를 보내고 있다.", actionLabel: "AUTHENTICATE", intel: "보내는 칸의 수와 보이는 칸의 수가 같으리라는 법은 없다.", scan: { verdict: "AUTH REJECTED" }, lesson: { risk: "숨은 입력칸은 사용자가 고칠 수 있다. 값이 HTML에 적혀 있지 않아도 스크립트가 채워 넣은 뒤 그대로 전송되므로, 가격이나 권한이나 식별자를 여기에 담으면 조작된 값이 서버에 도달한다.", fix: "화면에서 숨겼다는 것은 통제가 아니다. 값은 서버가 세션 기준으로 다시 판단한다." }, surface: "field" },
  { id: 4, code: "CASE #004", title: "Embedded Identity", target: "personnel-archive.lab", access: "ANALYST", sceneLabel: "IDENTITY MAP: PARTIAL", actionLabel: "READ CARD", narrative: "회수한 접근 카드는 이미 무효 처리됐다. 그런데도 보관 시스템은 이 카드를 여전히 구분해낸다.", intel: "인쇄된 면이 카드의 전부는 아니다.", scan: { verdict: "IDENTITY REDACTED" }, lesson: { risk: "DOM 속성은 누구나 읽는다. 내부 식별자나 권한 정보를 붙여 두면 목록 화면 한 번으로 전량 수집된다.", fix: "화면이 실제로 쓰는 값만 내려보내고, 내부 식별자는 서버에서만 다룬다." }, surface: "identity" },
  { id: 5, code: "CASE #005", title: "Residual Trace", target: "session-monitor.lab", access: "ANALYST", sceneLabel: "LOCAL TRACE: DETECTED", actionLabel: "CHECK SESSION", narrative: "마지막 접속자는 세션을 닫고 떠났다. 떠난 자리가 깨끗하게 비어 있는 경우는 드물다.", intel: "브라우저는 사이트마다 따로 기억해 둔다.", scan: { verdict: "SESSION ENDED" }, lesson: { risk: "쿠키는 브라우저에 평문으로 남고 스크립트가 읽을 수 있다. 세션이나 개인정보를 그대로 담으면 XSS 한 번에 전부 새어 나간다.", fix: "세션 쿠키에 HttpOnly·Secure·SameSite를 적용하고, 식별자 외의 값은 담지 않는다." }, surface: "cookie" },
  { id: 6, code: "CASE #006", title: "Robot Rules", target: "security-index.lab", access: "ANALYST", sceneLabel: "AUTOMATION: WATCHING", actionLabel: "PING CRAWLER", narrative: "이 서버를 찾아오는 쪽은 사람만이 아니다. 먼저 다녀가는 쪽은 안내를 따로 받는다.", intel: "그 안내문은 사람이 읽으라고 둔 자리에 있지 않다.", scan: { verdict: "POLICY NOT RENDERED" }, lesson: { risk: "robots.txt는 숨기는 장치가 아니라 공개 문서다. 숨기고 싶은 경로를 적는 순간 그 경로를 광고하게 된다.", fix: "접근 통제는 인증과 권한으로 한다. robots.txt에 비공개 경로를 적지 않는다." }, surface: "robots" },
  { id: 7, code: "CASE #007", title: "Silent Response", target: "remote-node.lab", access: "FIELD OPERATOR", sceneLabel: "CONNECTION: WAITING", narrative: "폐쇄된 줄 알았던 서버가 응답했다. 그런데 화면에는 아무것도 뜨지 않는다.", actionLabel: "CONNECT", intel: "실패한 것처럼 보여도 주고받은 것은 이미 있다.", scan: { verdict: "CONNECTION FAILED" }, lesson: { risk: "화면이 쓰지 않는 필드까지 응답에 담기면, 보이지 않는다는 이유로 안전하다고 착각하게 된다. 응답 본문은 그대로 열람된다.", fix: "응답은 화면이 실제로 쓰는 필드만 구성한다. 모델 전체를 그대로 직렬화하지 않는다." }, surface: "response" },
  { id: 8, code: "CASE #008", title: "Server Whisper", target: "comms-node.lab", access: "FIELD OPERATOR", sceneLabel: "STATUS: ONLINE", narrative: "통신은 정상이다. 회선은 계속 살아 있는데 넘어오는 내용만 비어 있다.", actionLabel: "REQUEST STATUS", intel: "본문이 비었다고 응답까지 빈 것은 아니다.", scan: { verdict: "BODY EMPTY" }, lesson: { risk: "커스텀 헤더는 화면에 보이지 않지만 응답을 열면 그대로 보인다. 디버그용 헤더가 운영에 남는 사고는 흔하다.", fix: "운영 응답에서 디버그·내부 헤더를 제거하고, 서버와 프레임워크 버전 노출도 함께 줄인다." }, surface: "header" },
  { id: 9, code: "CASE #009", title: "Follow the Trail", target: "personnel-trace.lab", access: "FIELD OPERATOR", sceneLabel: "REDIRECT: CAPTURED", narrative: "연구원 K는 사건 직전에 구역을 옮겼다. 도착지 기록은 남았지만, 그곳에는 아무것도 없다.", actionLabel: "TRACE MOVEMENT", intel: "길을 알려준 쪽과 도착한 쪽은 서로 다른 응답이다.", scan: { verdict: "RECORD NOT FOUND" }, lesson: { risk: "리다이렉트 응답의 Location에 값을 실으면 최종 화면이 아니라 중간 응답에 그것이 남는다. 중간 응답은 접근 로그와 브라우저 기록에 그대로 쌓인다.", fix: "인증 값을 URL로 넘기지 않는다. 넘겨야 한다면 일회용 단기 토큰으로 제한한다." }, surface: "redirect" },
  { id: 10, code: "CASE #010", title: "Fragmented Key", target: "vault-node-01.lab", access: "OPERATOR", sceneLabel: "SIGNAL: FRAGMENTED", narrative: "MASTER ACCESS KEY는 둘로 쪼개져 있다. 두 조각이 같은 곳에 있지는 않다.", actionLabel: "RECOVER VAULT", intel: "한 조각은 이미 이 화면에 있다. 나머지는 물어봐야 온다.", scan: { verdict: "KEY INCOMPLETE" }, lesson: { risk: "조각 하나하나는 사소해 보여도, 서로 다른 곳에서 모은 정보를 합치면 완전한 접근 수단이 된다. 진단에서 개별로는 '영향 없음'으로 넘긴 항목들이 묶여 사고가 된다.", fix: "노출 항목은 단독이 아니라 조합 기준으로 평가한다." }, surface: "vault" },
];

/**
 * Stages whose trace the client itself plants in the browser (DOM, cookie, URL). Their value
 * must therefore be derived per operator on the server, or the single JavaScript bundle hands
 * every visitor the whole answer sheet. The remaining stages are issued by the trace channel.
 */
export const traceLabels: Record<number, string> = {
  1: "read_the_address",
  2: "ghost_in_the_source",
  3: "hidden_fields_remember",
  4: "attributes_tell_more",
  5: "cookies_leave_traces",
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
