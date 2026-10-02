export type BlackTraceStage = {
  id: number;
  /** Stable name for this node's puzzle, independent of where it sits in the order.
   *  The trace is derived from this and not from the number, so inserting a node or moving
   *  one no longer changes anybody's answers and no table has to be kept in step. */
  key: string;
  code: string;
  title: string;
  target: string;
  access: "TRAINEE" | "INFILTRATOR" | "FIELD OPERATOR" | "OPERATOR";
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
  surface:
    | "tooltip" | "comment" | "field" | "identity" | "invisible-ink" | "off-screen" | "template-tag" | "shadow-root"
    | "cookie" | "local-memory" | "until-you-leave" | "deeper-store"
    | "route" | "robots" | "sitemap" | "source-map"
    | "response" | "redirect" | "header" | "request" | "vault";
};

export const blackTraceStages: BlackTraceStage[] = [
  { id: 1, key: "tooltip", code: "CASE #001", title: "Idle Tooltip", target: "intake-desk.lab", access: "TRAINEE", sceneLabel: "LABEL LAYER: PRESENT", actionLabel: "READ LABEL", narrative: "접수 단말기부터 잡는다. 겉에 걸린 것은 안내 문구뿐이지만, 이런 화면은 만든 사람의 메모를 그대로 달고 다닌다.", intel: "화면에 나온 글자가 그 요소가 가진 글자의 전부는 아니다.", scan: { verdict: "LABEL TRUNCATED" }, lesson: { risk: "설명이나 안내를 담는 속성에 내부 메모를 적어 두는 일이 흔하다. 화면이 줄여서 보여줄 뿐 값은 그대로 전달된다.", fix: "사용자에게 보일 문구만 넣고, 담당자 메모나 내부 코드는 넣지 않는다." }, surface: "tooltip" },
  { id: 2, key: "wrong-destination", code: "CASE #002", title: "Wrong Destination", target: "relay-gateway.lab", access: "TRAINEE", sceneLabel: "ROUTE: FORWARDED", narrative: "중계 관문을 통과한다. 통과 자체는 막히지 않는다. 이 관문이 무엇을 같이 들고 넘어가는지가 문제다.", actionLabel: "CONTINUE", intel: "도착하고 나서도 지나온 경로는 어딘가에 적혀 남는다.", scan: { verdict: "ROUTE FORWARDED" }, lesson: { risk: "URL은 브라우저 기록, 서버 접근 로그, Referer 헤더에 동시에 남는다. 토큰이나 개인정보를 쿼리에 실으면 세 곳에 한 번에 기록된다.", fix: "민감한 값은 쿼리가 아니라 본문으로 보내고, 외부로 나가는 Referer를 제한한다." }, surface: "route" },
  { id: 3, key: "ghost-comment", code: "CASE #003", title: "Ghost Comment", target: "recon-terminal.lab", access: "TRAINEE", sceneLabel: "SURFACE STATUS: QUIET", narrative: "정찰 단말을 장악했다. 운영자가 기록을 지웠지만, 지우는 쪽은 언제나 눈에 보이는 것부터 지운다.", actionLabel: "INSPECT RECORD", intel: "화면에 그려진 것이 서버가 보낸 전부는 아니다.", scan: { verdict: "RECORD EMPTY" }, lesson: { risk: "개발 중 남긴 주석이 운영 빌드에 그대로 올라가면 내부 경로, 임시 계정, 처리 로직이 소스 보기만으로 드러난다. 공격자는 코드를 읽는 것이 아니라 주석을 읽는다.", fix: "배포 빌드에서 주석을 제거하고, 민감한 메모는 소스가 아니라 이슈 트래커에 남긴다." }, surface: "comment" },
  { id: 4, key: "forgotten-field", code: "CASE #004", title: "Forgotten Field", target: "auth-terminal.lab", access: "TRAINEE", sceneLabel: "FORM LAYER: SEALED", narrative: "폐기 처리된 인증 단말이다. 화면으로는 한 글자도 넣을 수 없다. 그런데 이 단말은 아직 무언가를 전송하고 있다.", actionLabel: "AUTHENTICATE", intel: "보내는 칸의 수와 보이는 칸의 수가 같으리라는 법은 없다.", scan: { verdict: "AUTH REJECTED" }, lesson: { risk: "숨은 입력칸은 사용자가 고칠 수 있다. 값이 HTML에 적혀 있지 않아도 스크립트가 채워 넣은 뒤 그대로 전송되므로, 가격이나 권한이나 식별자를 여기에 담으면 조작된 값이 서버에 도달한다.", fix: "화면에서 숨겼다는 것은 통제가 아니다. 값은 서버가 세션 기준으로 다시 판단한다." }, surface: "field" },
  { id: 5, key: "embedded-identity", code: "CASE #005", title: "Embedded Identity", target: "personnel-archive.lab", access: "TRAINEE", sceneLabel: "IDENTITY MAP: PARTIAL", actionLabel: "READ CARD", narrative: "인사 기록고에 붙었다. 쥐고 있는 출입 카드는 이미 정지된 것인데, 이 시스템은 여전히 이 카드를 다른 카드와 구분한다.", intel: "인쇄된 면이 카드의 전부는 아니다.", scan: { verdict: "IDENTITY REDACTED" }, lesson: { risk: "DOM 속성은 누구나 읽는다. 내부 식별자나 권한 정보를 붙여 두면 목록 화면 한 번으로 전량 수집된다.", fix: "화면이 실제로 쓰는 값만 내려보내고, 내부 식별자는 서버에서만 다룬다." }, surface: "identity" },
  { id: 6, key: "invisible-ink", code: "CASE #006", title: "Invisible Ink", target: "archive-viewer.lab", access: "TRAINEE", sceneLabel: "RENDER LAYER: PARTIAL", actionLabel: "RENDER DOCUMENT", narrative: "열람실 단말을 잡았다. 요청한 문서는 전부 내려왔다. 화면이 그중 일부만 그리기로 했을 뿐이다.", intel: "그리지 않기로 한 것과 보내지 않은 것은 다르다.", scan: { verdict: "BLOCK NOT PAINTED" }, lesson: { risk: "화면에서 감추는 처리는 전달을 막지 못한다. 권한이 없는 항목을 숨기기만 하면 내용은 그대로 내려가 있다.", fix: "볼 수 없는 항목은 아예 내려보내지 않는다. 감추기는 화면 정리이지 접근 통제가 아니다." }, surface: "invisible-ink" },
  { id: 7, key: "off-screen", code: "CASE #007", title: "Off Screen", target: "layout-engine.lab", access: "TRAINEE", sceneLabel: "VIEWPORT: CLIPPED", actionLabel: "MEASURE LAYOUT", narrative: "배치 엔진을 들여다본다. 세어 본 요소 수와 화면에 보이는 수가 맞지 않는다. 하나는 화면 바깥에 서 있다.", intel: "보이지 않는다고 해서 없는 자리는 아니다.", scan: { verdict: "ELEMENT OUT OF VIEW" }, lesson: { risk: "보조기술용으로 화면 밖에 두는 기법은 정상이지만, 그 자리에 내부 값을 두면 읽기는 더 쉬워진다.", fix: "화면 밖 요소에도 공개해도 되는 값만 둔다." }, surface: "off-screen" },
  { id: 8, key: "template-tag", code: "CASE #008", title: "Unrendered Block", target: "render-queue.lab", access: "INFILTRATOR", sceneLabel: "TEMPLATE: STANDBY", actionLabel: "INSPECT QUEUE", narrative: "렌더 대기열에 들어왔다. 조건이 맞는 사용자에게만 보여줄 조각들이 이미 전부 내려와 쌓여 있다.", intel: "아직 자리를 잡지 않은 것이 아직 오지 않은 것은 아니다.", scan: { verdict: "TEMPLATE NOT INSTANTIATED" }, lesson: { risk: "조건부로 보여줄 화면 조각을 미리 내려보내면, 조건을 만족하지 못한 사용자도 그 내용을 전부 가지고 있게 된다.", fix: "권한이나 조건에 따라 달라지는 화면 조각은 서버가 그때 내려보낸다." }, surface: "template-tag" },
  { id: 9, key: "shadow-root", code: "CASE #009", title: "Shadow Root", target: "widget-host.lab", access: "INFILTRATOR", sceneLabel: "SHADOW TREE: ATTACHED", actionLabel: "OPEN COMPONENT", narrative: "이 구역의 부품 하나가 평범한 조회에 걸리지 않는다. 자기 안쪽 문서를 따로 들고 다니기 때문이다.", intel: "문서는 하나가 아니다. 어떤 부품은 자기 안쪽 문서를 따로 들고 다닌다.", scan: { verdict: "SHADOW TREE SEALED" }, lesson: { risk: "구성요소 안쪽은 바깥 검색에 걸리지 않을 뿐 숨겨진 것이 아니다. 캡슐화를 보안 경계로 쓰면 그 안의 값이 그대로 노출된다.", fix: "캡슐화는 코드 구조이지 접근 통제가 아니다. 민감한 값은 어느 쪽에도 두지 않는다." }, surface: "shadow-root" },
  { id: 10, key: "residual-trace", code: "CASE #010", title: "Residual Trace", target: "session-monitor.lab", access: "INFILTRATOR", sceneLabel: "LOCAL TRACE: DETECTED", actionLabel: "CHECK SESSION", narrative: "직전 운영자가 세션을 닫고 나갔다. 나간 자리를 그대로 두고 가는 운영자는 생각보다 많다.", intel: "브라우저는 사이트마다 따로 기억해 둔다.", scan: { verdict: "SESSION ENDED" }, lesson: { risk: "쿠키는 브라우저에 평문으로 남고 스크립트가 읽을 수 있다. 세션이나 개인정보를 그대로 담으면 XSS 한 번에 전부 새어 나간다.", fix: "세션 쿠키에 HttpOnly·Secure·SameSite를 적용하고, 식별자 외의 값은 담지 않는다." }, surface: "cookie" },
  { id: 11, key: "local-memory", code: "CASE #011", title: "Local Memory", target: "profile-cache.lab", access: "INFILTRATOR", sceneLabel: "PERSISTENT STORE: WARM", actionLabel: "READ CACHE", narrative: "이 단말은 같은 사용자를 여러 번 맞이했다. 다시 묻지 않으려고 적어 둔 것이 아직 그대로 있다.", intel: "다시 묻지 않으려면 어딘가에 적어 두어야 한다. 그 자리는 탭을 닫아도 남는다.", scan: { verdict: "CACHE RETAINED" }, lesson: { risk: "브라우저 저장소는 평문이고 스크립트가 전부 읽는다. 토큰이나 개인정보를 두면 XSS 한 번에 영구 저장된 값까지 함께 나간다.", fix: "인증 정보는 저장소가 아니라 HttpOnly 쿠키로 다루고, 저장소에는 복구 가능한 설정값만 둔다." }, surface: "local-memory" },
  { id: 12, key: "until-you-leave", code: "CASE #012", title: "Until You Leave", target: "session-cache.lab", access: "INFILTRATOR", sceneLabel: "VOLATILE STORE: HOT", actionLabel: "READ SESSION", narrative: "탭이 닫히면 사라질 값이다. 다행히 이 탭은 아직 열려 있다.", intel: "탭이 살아 있는 동안만 남는 자리도 있다.", scan: { verdict: "SESSION VALUE LIVE" }, lesson: { risk: "휘발성이라는 이유로 민감한 값을 두는 경우가 많지만, 세션이 살아 있는 동안에는 스크립트가 언제든 읽는다.", fix: "휘발성은 보호가 아니다. 저장 위치가 아니라 값의 성격으로 판단한다." }, surface: "until-you-leave" },
  { id: 13, key: "deeper-store", code: "CASE #013", title: "Deeper Store", target: "offline-db.lab", access: "INFILTRATOR", sceneLabel: "OBJECT STORE: OPEN", actionLabel: "QUERY DATABASE", narrative: "이 서비스는 연결이 끊겨도 돌아가려고 자체 데이터베이스를 들고 있다. 그 안에 업무 기록이 그대로 들어 있다.", intel: "브라우저가 가진 저장 수단은 열쇠-값 한 쌍이 전부가 아니다.", scan: { verdict: "RECORD FOUND" }, lesson: { risk: "오프라인 캐시에 업무 데이터를 담으면 단말기를 잃는 순간 그 데이터도 함께 간다. 로그아웃해도 지워지지 않는 경우가 많다.", fix: "오프라인 저장 대상은 최소화하고, 로그아웃 시 삭제 절차를 반드시 둔다." }, surface: "deeper-store" },
  { id: 14, key: "robot-rules", code: "CASE #014", title: "Robot Rules", target: "security-index.lab", access: "INFILTRATOR", sceneLabel: "AUTOMATION: WATCHING", actionLabel: "PING CRAWLER", narrative: "이 서버를 찾아오는 쪽은 사람만이 아니다. 자동 수집기에게 먼저 건네는 안내가 따로 있다.", intel: "그 안내문은 사람이 읽으라고 둔 자리에 있지 않다.", scan: { verdict: "POLICY NOT RENDERED" }, lesson: { risk: "robots.txt는 숨기는 장치가 아니라 공개 문서다. 숨기고 싶은 경로를 적는 순간 그 경로를 광고하게 된다.", fix: "접근 통제는 인증과 권한으로 한다. robots.txt에 비공개 경로를 적지 않는다." }, surface: "robots" },
  { id: 15, key: "sitemap", code: "CASE #015", title: "Index of Everything", target: "search-index.lab", access: "INFILTRATOR", sceneLabel: "INDEX FILE: SERVED", actionLabel: "FETCH INDEX", narrative: "검색 노출용 목록을 받아 왔다. 화면 어디에서도 연결되지 않은 주소가 거기 섞여 있다.", intel: "안내용으로 만든 목록이 가장 성실한 안내서가 되기도 한다.", scan: { verdict: "ORPHAN PATH LISTED" }, lesson: { risk: "검색 노출용 목록에 관리 화면이나 시험용 경로가 섞여 들어가면, 링크가 없어 못 찾던 주소가 한 번에 공개된다.", fix: "목록은 공개해도 되는 경로만 담아 생성하고, 생성 결과를 배포 전에 검토한다." }, surface: "sitemap" },
  { id: 16, key: "source-map", code: "CASE #016", title: "Before the Build", target: "build-output.lab", access: "FIELD OPERATOR", sceneLabel: "SOURCE MAP: AVAILABLE", actionLabel: "TRACE BUILD", narrative: "배포된 스크립트는 알아보기 어렵게 압축되어 있다. 그런데 압축을 되돌릴 안내서가 같은 자리에 함께 올라와 있다.", intel: "압축된 코드를 되돌려 읽는 쪽은 사람만이 아니다. 그 안내서도 같이 배포된다.", scan: { verdict: "ORIGINAL SOURCE RECOVERED" }, lesson: { risk: "소스 맵이 운영에 올라가면 압축은 아무 의미가 없다. 주석, 변수명, 내부 경로가 담긴 원본이 그대로 복원된다.", fix: "운영 빌드에서는 소스 맵을 배포하지 않거나, 접근을 사내로 제한한다." }, surface: "source-map" },
  { id: 17, key: "silent-response", code: "CASE #017", title: "Silent Response", target: "remote-node.lab", access: "FIELD OPERATOR", sceneLabel: "CONNECTION: WAITING", narrative: "폐쇄된 줄 알았던 노드가 응답한다. 화면에는 아무것도 뜨지 않는데, 회선에는 분명히 무언가 지나갔다.", actionLabel: "CONNECT", intel: "실패한 것처럼 보여도 주고받은 것은 이미 있다.", scan: { verdict: "CONNECTION FAILED" }, lesson: { risk: "화면이 쓰지 않는 필드까지 응답에 담기면, 보이지 않는다는 이유로 안전하다고 착각하게 된다. 응답 본문은 그대로 열람된다.", fix: "응답은 화면이 실제로 쓰는 필드만 구성한다. 모델 전체를 그대로 직렬화하지 않는다." }, surface: "response" },
  { id: 18, key: "server-whisper", code: "CASE #018", title: "Server Whisper", target: "comms-node.lab", access: "FIELD OPERATOR", sceneLabel: "STATUS: ONLINE", narrative: "통신 노드는 정상이다. 회선은 계속 살아 있는데 넘어오는 내용만 비어 있다.", actionLabel: "REQUEST STATUS", intel: "본문이 비었다고 응답까지 빈 것은 아니다.", scan: { verdict: "BODY EMPTY" }, lesson: { risk: "커스텀 헤더는 화면에 보이지 않지만 응답을 열면 그대로 보인다. 디버그용 헤더가 운영에 남는 사고는 흔하다.", fix: "운영 응답에서 디버그·내부 헤더를 제거하고, 서버와 프레임워크 버전 노출도 함께 줄인다." }, surface: "header" },
  { id: 19, key: "follow-the-trail", code: "CASE #019", title: "Follow the Trail", target: "personnel-trace.lab", access: "FIELD OPERATOR", sceneLabel: "REDIRECT: CAPTURED", narrative: "대상은 작전 직전에 구역을 옮겼다. 도착지에는 아무것도 없다. 길을 알려준 쪽이 따로 있다.", actionLabel: "TRACE MOVEMENT", intel: "길을 알려준 쪽과 도착한 쪽은 서로 다른 응답이다.", scan: { verdict: "RECORD NOT FOUND" }, lesson: { risk: "리다이렉트 응답의 Location에 값을 실으면 최종 화면이 아니라 중간 응답에 그것이 남는다. 중간 응답은 접근 로그와 브라우저 기록에 그대로 쌓인다.", fix: "인증 값을 URL로 넘기지 않는다. 넘겨야 한다면 일회용 단기 토큰으로 제한한다." }, surface: "redirect" },
  { id: 20, key: "wrong-method", code: "CASE #020", title: "Wrong Verb", target: "intake-api.lab", access: "FIELD OPERATOR", sceneLabel: "METHOD: REFUSED", actionLabel: "SEND REQUEST", narrative: "접수 창구는 열려 있는데 문을 두드리는 방식이 틀렸다. 같은 주소가 다른 방식에는 다르게 답한다.", intel: "주소 하나가 방식 하나만 받는 것은 아니다.", scan: { verdict: "METHOD NOT ALLOWED" }, lesson: { risk: "읽기 전용으로 알려진 주소가 다른 메서드에는 전혀 다르게 응답하는 경우가 있다. 점검 범위를 메서드 단위로 넓히지 않으면 통째로 빠진다.", fix: "허용 메서드를 명시적으로 제한하고, 허용하지 않는 메서드는 처리 전에 거절한다." }, surface: "request" },
  { id: 21, key: "cookie-flags", code: "CASE #021", title: "Flags on the Cookie", target: "session-issuer.lab", access: "FIELD OPERATOR", sceneLabel: "SET-COOKIE: OBSERVED", actionLabel: "REQUEST SESSION", narrative: "창구가 세션을 하나 발급한다. 값 자체는 평범한데, 그 값에 함께 붙어 나오는 설정이 평범하지 않다.", intel: "쿠키는 값만으로 이루어져 있지 않다.", scan: { verdict: "COOKIE ATTRIBUTES EXPOSED" }, lesson: { risk: "쿠키의 보호 설정은 값과 함께 응답에 그대로 적혀 나온다. HttpOnly나 Secure가 빠진 세션은 발급 순간에 드러난다.", fix: "세션 쿠키에 HttpOnly·Secure·SameSite를 빠짐없이 지정하고, 발급 응답을 점검 항목에 포함한다." }, surface: "request" },
  { id: 22, key: "claimed-role", code: "CASE #022", title: "Who Is Asking", target: "content-gate.lab", access: "FIELD OPERATOR", sceneLabel: "ROLE CHECK: ACTIVE", actionLabel: "SEND REQUEST", narrative: "이 관문은 찾아온 쪽이 자기를 뭐라고 밝히는지 보고 답을 바꾼다. 밝히는 쪽은 서버가 아니다.", intel: "서버는 확인하지 않는다. 요청이 스스로 밝힌 말을 믿을 뿐이다.", scan: { verdict: "ROLE ACCEPTED AS CLAIMED" }, lesson: { risk: "요청 헤더로 권한을 판단하는 통제는 그 헤더를 직접 적어 보내면 그대로 넘어간다. 관리 기능을 이렇게 가르는 사례가 흔하다.", fix: "클라이언트가 보낸 값은 식별이 아니라 참고 정보다. 권한은 세션으로 판단한다." }, surface: "request" },
  { id: 23, key: "referer", code: "CASE #023", title: "Where You Came From", target: "partner-portal.lab", access: "FIELD OPERATOR", sceneLabel: "ORIGIN CHECK: ACTIVE", actionLabel: "SEND REQUEST", narrative: "제휴 포털은 내부 화면에서 넘어온 요청만 받는다. 어디서 왔는지는 요청에 적혀 있다.", intel: "어디서 왔는지를 적는 쪽은 서버가 아니다.", scan: { verdict: "ORIGIN HEADER TRUSTED" }, lesson: { risk: "출처 헤더로 접근을 가르는 통제는 헤더를 직접 적어 보내면 무력화된다. 결제나 다운로드 경로에서 자주 발견된다.", fix: "출처 헤더는 통계용으로만 쓰고, 접근 판단은 세션과 서버 측 토큰으로 한다." }, surface: "request" },
  { id: 24, key: "etag", code: "CASE #024", title: "The Tag Remembered", target: "asset-cache.lab", access: "OPERATOR", sceneLabel: "VALIDATOR: PRESENT", actionLabel: "REQUEST ASSET", narrative: "같은 파일을 두 번 요청하면 서버는 두 번째에 본문을 보내지 않는다. 대신 그것이 같은 파일임을 알아보는 표를 쓴다.", intel: "서버가 본문을 아낄 때 쓰는 표에도 내용이 담긴다.", scan: { verdict: "VALIDATOR LEAKS CONTENT" }, lesson: { risk: "캐시 검증용 값에 파일 내용의 해시나 내부 버전, 경로가 담기는 구현이 있다. 본문을 받지 않고도 내부 구조를 추정할 수 있다.", fix: "검증 값은 내용과 무관한 난수나 불투명한 버전으로 만든다." }, surface: "request" },
  { id: 25, key: "range", code: "CASE #025", title: "Ask for a Piece", target: "archive-store.lab", access: "OPERATOR", sceneLabel: "RANGE: SUPPORTED", actionLabel: "REQUEST PART", narrative: "보관소는 큰 파일을 통째로만 내주지 않는다. 몇 번째 바이트부터 몇 번째까지인지 말하면 그 부분만 보낸다.", intel: "전부 달라고만 할 필요는 없다.", scan: { verdict: "PARTIAL CONTENT SERVED" }, lesson: { risk: "부분 요청을 허용하면 접근 통제가 전체 다운로드만 검사하는 구현에서 조각을 모아 우회할 수 있다.", fix: "부분 요청에도 동일한 권한 검사를 적용하고, 범위 값의 유효성을 검증한다." }, surface: "request" },
  { id: 26, key: "preflight", code: "CASE #026", title: "The Question Before", target: "cross-origin.lab", access: "OPERATOR", sceneLabel: "PREFLIGHT: ANSWERED", actionLabel: "SEND PREFLIGHT", narrative: "브라우저는 본 요청을 보내기 전에 먼저 묻는다. 그 물음에 대한 답에도 서버의 사정이 적혀 있다.", intel: "본 요청 전에 오가는 대화가 따로 있다.", scan: { verdict: "PREFLIGHT DISCLOSES POLICY" }, lesson: { risk: "사전 요청 응답에는 허용 메서드와 허용 헤더가 모두 적힌다. 공개되지 않은 기능의 존재가 여기서 드러난다.", fix: "허용 목록을 필요한 범위로 좁히고, 사전 요청 응답에 내부 전용 항목을 싣지 않는다." }, surface: "request" },
  { id: 27, key: "status-only", code: "CASE #027", title: "No Body, Still Speaks", target: "ack-node.lab", access: "OPERATOR", sceneLabel: "STATUS: 204", actionLabel: "SEND ACK", narrative: "이 노드는 본문을 보내지 않는다. 상태 줄 하나로 끝낸다. 그렇다고 아무것도 보내지 않은 것은 아니다.", intel: "본문이 없다는 것과 응답이 없다는 것은 다르다.", scan: { verdict: "EMPTY BODY RESPONSE" }, lesson: { risk: "본문이 없는 응답은 점검에서 건너뛰기 쉽다. 헤더만으로 정보를 전달하는 구현이 그 틈에 남는다.", fix: "본문 유무와 무관하게 응답 전체를 점검 대상으로 둔다." }, surface: "request" },
  { id: 28, key: "content-type", code: "CASE #028", title: "Served as the Wrong Thing", target: "report-export.lab", access: "OPERATOR", sceneLabel: "CONTENT TYPE: MISMATCH", actionLabel: "FETCH EXPORT", narrative: "내려받은 파일이 화면에 제대로 열리지 않는다. 내용이 잘못된 것이 아니라, 서버가 종류를 잘못 적어 보냈다.", intel: "브라우저가 못 여는 것과 내용이 없는 것은 다르다.", scan: { verdict: "TYPE MISDECLARED" }, lesson: { risk: "응답 종류를 잘못 적으면 브라우저가 내용을 그대로 글자로 펼친다. 반대로 사용자 입력이 섞인 응답이 문서로 선언되면 스크립트가 실행된다.", fix: "응답 종류를 내용에 맞게 지정하고, X-Content-Type-Options로 추측을 막는다." }, surface: "request" },
  { id: 29, key: "two-requests", code: "CASE #029", title: "The First Answer Was a Map", target: "dispatch-node.lab", access: "OPERATOR", sceneLabel: "HANDOFF: STAGED", actionLabel: "OPEN DISPATCH", narrative: "배차 노드는 한 번에 답하지 않는다. 첫 응답은 다음에 어디로 물어야 하는지를 알려줄 뿐이다.", intel: "응답 하나가 끝이 아닐 수도 있다.", scan: { verdict: "HANDOFF REQUIRED" }, lesson: { risk: "여러 단계로 나뉜 흐름은 각 단계가 따로 점검되면서 전체 연결이 빠진다. 중간 단계만 통과하면 끝까지 가는 구현이 남는다.", fix: "흐름 전체를 하나의 권한 경계로 보고, 각 단계에서 동일한 검사를 반복한다." }, surface: "request" },
  { id: 30, key: "fragmented-key", code: "CASE #030", title: "Fragmented Key", target: "vault-node-01.lab", access: "OPERATOR", sceneLabel: "SIGNAL: FRAGMENTED", narrative: "금고 노드다. MASTER ACCESS KEY는 둘로 쪼개져 있고, 두 조각이 같은 곳에 있지 않다.", actionLabel: "RECOVER VAULT", intel: "한 조각은 이미 이 화면에 있다. 나머지는 물어봐야 온다.", scan: { verdict: "KEY INCOMPLETE" }, lesson: { risk: "조각 하나하나는 사소해 보여도, 서로 다른 곳에서 모은 정보를 합치면 완전한 접근 수단이 된다. 진단에서 개별로는 '영향 없음'으로 넘긴 항목들이 묶여 사고가 된다.", fix: "노출 항목은 단독이 아니라 조합 기준으로 평가한다." }, surface: "vault" },
];

/**
 * Stages whose trace the client itself plants in the browser (DOM, cookie, URL). Their value
 * must therefore be derived per operator on the server, or the single JavaScript bundle hands
 * every visitor the whole answer sheet. The remaining stages are issued by the trace channel.
 */
export const traceLabels: Record<string, string> = {
  tooltip: "the_label_said_more",
  "wrong-destination": "read_the_address",
  "ghost-comment": "ghost_in_the_source",
  "forgotten-field": "hidden_fields_remember",
  "embedded-identity": "attributes_tell_more",
  "invisible-ink": "sent_but_not_painted",
  "off-screen": "pushed_out_of_view",
  "template-tag": "queued_never_drawn",
  "shadow-root": "a_tree_inside_a_tree",
  "residual-trace": "cookies_leave_traces",
  "local-memory": "it_waited_for_you",
  "until-you-leave": "only_while_open",
  "deeper-store": "a_database_in_here",
  "fragmented-key": "two_places",
};

/** Stage 10 is split in two: the browser holds part one, the trace channel answers with this. */
export const vaultTraceSuffix = "one_key}";

/**
 * Builds the trace planted in the browser for a stage. A null token reproduces the pre-rotation
 * value, which keeps the stages solvable while the learning function has no operator secret.
 */
export function composeTrace(key: string, token: string | null) {
  const label = traceLabels[key];
  if (!label) return null;
  const body = token ? `${label}_${token}` : label;
  return key === "fragmented-key" ? `FLAG{${body}_` : `FLAG{${body}}`;
}

/** The clearance ladder the operation advances through, used to show what the next node unlocks. */
export const blackTraceRanks = [
  { at: 1, name: "TRAINEE" },
  { at: 8, name: "INFILTRATOR" },
  { at: 16, name: "FIELD OPERATOR" },
  { at: 24, name: "OPERATOR" },
] as const;

/** One number for the whole operation. It was written as a literal in eight places, which is how
 *  the certificate ended up requiring a node count the course no longer had. */
export const blackTraceNodeCount = blackTraceStages.length;

export function nextBlackTraceRank(currentStage: number) {
  return blackTraceRanks.find(rank => rank.at > currentStage) ?? null;
}

export const blackTraceStageById = (id: number) => blackTraceStages.find(stage => stage.id === id);
/** GUEST is reserved for a visitor without a session; a known stage always has a real tier. */
export const blackTraceAccessForStage = (stage: number) => blackTraceStageById(stage)?.access ?? "GUEST";
