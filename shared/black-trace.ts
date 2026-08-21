export type BlackTraceStage = {
  id: number;
  code: string;
  title: string;
  target: string;
  access: "GUEST" | "ANALYST" | "FIELD OPERATOR" | "OPERATOR";
  sceneLabel: string;
  narrative: string;
  actionLabel?: string;
  hints: [string, string];
  surface: "comment" | "field" | "identity" | "cookie" | "route" | "response" | "redirect" | "header" | "robots" | "vault";
};

export const blackTraceStages: BlackTraceStage[] = [
  { id: 1, code: "CASE #001", title: "Ghost Comment", target: "recon-terminal.lab", access: "GUEST", sceneLabel: "SURFACE STATUS: QUIET", narrative: "조사관은 아무것도 발견하지 못했다. 하지만 누군가 기록을 완전히 지우지는 않은 것 같다.", actionLabel: "INSPECT RECORD", hints: ["화면에 보이는 것이 페이지의 전부는 아니다.", "브라우저가 실제로 받은 HTML 구조를 확인해보자."], surface: "comment" },
  { id: 2, code: "CASE #002", title: "Forgotten Field", target: "auth-terminal.lab", access: "GUEST", sceneLabel: "FORM LAYER: SEALED", narrative: "폐기된 인증 단말기에서 오래된 로그인 흔적이 발견되었다. 화면에는 아무 정보도 남아 있지 않다.", actionLabel: "AUTHENTICATE", hints: ["비어 있는 화면에도 양식의 흔적은 남을 수 있다.", "인증 화면의 구조를 조금 더 가까이 살펴보자."], surface: "field" },
  { id: 3, code: "CASE #003", title: "Embedded Identity", target: "personnel-archive.lab", access: "GUEST", sceneLabel: "IDENTITY MAP: PARTIAL", narrative: "회수된 접근 카드는 무효 처리되었다. 하지만 카드에는 화면에 표시되지 않는 식별 정보가 남아 있다.", hints: ["카드가 보여주는 정보가 전부는 아닐 수 있다.", "카드 자체의 기록을 살펴보자."], surface: "identity" },
  { id: 4, code: "CASE #004", title: "Residual Trace", target: "session-monitor.lab", access: "ANALYST", sceneLabel: "LOCAL TRACE: DETECTED", narrative: "마지막 접속자는 이미 세션을 종료했다. 하지만 브라우저는 모든 흔적을 잊지는 않는다.", hints: ["이전 접속의 흔적은 화면보다 가까운 곳에 남는다.", "브라우저가 사이트를 위해 저장한 기록을 확인해보자."], surface: "cookie" },
  { id: 5, code: "CASE #005", title: "Wrong Destination", target: "relay-gateway.lab", access: "ANALYST", sceneLabel: "ROUTE: FORWARDED", narrative: "다음 문은 이미 열렸다. 문제는 우리가 어디로 향하고 있는지다.", actionLabel: "CONTINUE", hints: ["이동한 뒤에도 경로는 남아 있다.", "현재 보고 있는 주소를 다시 확인해보자."], surface: "route" },
  { id: 6, code: "CASE #006", title: "Silent Response", target: "remote-node.lab", access: "ANALYST", sceneLabel: "CONNECTION: WAITING", narrative: "폐쇄된 서버에서 희미한 신호가 감지되었다. 화면에 전달된 정보는 거의 없다.", actionLabel: "CONNECT", hints: ["실패처럼 보여도 통신 자체는 발생했을 수 있다.", "버튼을 누른 순간 생긴 요청의 응답을 확인해보자."], surface: "response" },
  { id: 7, code: "CASE #007", title: "Follow the Trail", target: "personnel-trace.lab", access: "FIELD OPERATOR", sceneLabel: "REDIRECT: CAPTURED", narrative: "연구원 K는 사건 직전 다른 구역으로 이동했다. 마지막 이동 기록은 손상되어 있다.", actionLabel: "TRACE MOVEMENT", hints: ["이동한 결과 말고, 이동이 시작된 순간을 살펴보자.", "요청이 남긴 응답 헤더에 다음 위치가 있다."], surface: "redirect" },
  { id: 8, code: "CASE #008", title: "Server Whisper", target: "comms-node.lab", access: "FIELD OPERATOR", sceneLabel: "STATUS: ONLINE", narrative: "서버와의 통신은 성공했다. 그러나 화면에 전달된 정보는 거의 없다.", actionLabel: "REQUEST STATUS", hints: ["응답 본문이 전부는 아니다.", "서버가 응답과 함께 보낸 헤더를 확인해보자."], surface: "header" },
  { id: 9, code: "CASE #009", title: "Robot Rules", target: "security-index.lab", access: "FIELD OPERATOR", sceneLabel: "AUTOMATION: WATCHING", narrative: "이 서버에는 사람보다 먼저 길을 확인하는 존재가 있다. 모든 길이 사람에게 공개되는 것은 아니다.", hints: ["자동화된 방문자에게 주는 안내가 따로 있다.", "사이트 루트에 있는 공개 안내 파일을 떠올려보자."], surface: "robots" },
  { id: 10, code: "CASE #010", title: "Fragmented Key", target: "vault-node-01.lab", access: "OPERATOR", sceneLabel: "SIGNAL: FRAGMENTED", narrative: "MASTER ACCESS KEY가 손상되어 있다. 복구 가능한 조각은 두 개다.", actionLabel: "RECOVER VAULT", hints: ["첫 번째 조각은 이 화면의 구조에 남아 있다.", "두 번째 조각은 복구 요청 뒤에 도착한다."], surface: "vault" },
];

export const blackTraceStageById = (id: number) => blackTraceStages.find(stage => stage.id === id);
export const blackTraceAccessForStage = (stage: number) => blackTraceStageById(stage)?.access ?? "GUEST";
