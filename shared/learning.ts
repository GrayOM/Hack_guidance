/**
 * Public learning content for all 50 safe, closed analysis labs.
 * The option set is public by design; answer matching is computed independently on the server.
 */
export type LearningOption = { id: string; label: string };

export type LearningChallenge = {
  id: number;
  level: number;
  title: string;
  category: string;
  objective: string;
  evidenceLabel: string;
  evidence: string[];
  question: string;
  options: LearningOption[];
  hints: string[];
  defense: string;
};

type ChallengeSeed = Omit<LearningChallenge, "options" | "hints"> & {
  correct: string;
  distractors: [string, string];
  hints?: [string, string, string];
};

const optionIds = ["a", "b", "c"] as const;

function createChallenge(seed: ChallengeSeed): LearningChallenge {
  const correctIndex = (seed.id - 1) % optionIds.length;
  const labels = [...seed.distractors];
  labels.splice(correctIndex, 0, seed.correct);
  return {
    id: seed.id,
    level: seed.level,
    title: seed.title,
    category: seed.category,
    objective: seed.objective,
    evidenceLabel: seed.evidenceLabel,
    evidence: seed.evidence,
    question: seed.question,
    options: optionIds.map((id, index) => ({ id, label: labels[index] })),
    hints: seed.hints ?? [
      "먼저 화면에 보이는 값이 브라우저가 보관하는 정보인지, 서버가 관리하는 정보인지 구분해 보세요.",
      "단서가 이동하는 경로와 누가 그 값을 바꿀 수 있는지 함께 확인하세요.",
      "안전한 설계에서는 서버가 허용 범위와 권한을 검증해야 합니다.",
    ],
    defense: seed.defense,
  };
}

const seeds: ChallengeSeed[] = [
  { id: 1, level: 1, title: "브라우저에서 이루어지는 인증 확인", category: "페이지 소스", objective: "인증 판단이 브라우저와 서버 중 어디에서 이루어져야 하는지 구분합니다.", evidenceLabel: "인증 화면의 스크립트", evidence: ["if (username === expectedUser && password === expectedPassword) {", "  showSuccess();", "}"], question: "사용자 인증의 최종 판단은 어디에서 수행해야 할까요?", correct: "서버에서 수행", distractors: ["브라우저에서만 수행", "스타일시트에서 수행"], defense: "인증과 권한 부여는 서버에서 수행하고, 비밀번호는 안전하게 해싱하여 보관합니다." },
  { id: 2, level: 1, title: "다운로드 기능에서 발생하는 소스 코드 노출", category: "파일 응답", objective: "다운로드 응답이 파일 이름과 콘텐츠를 어떻게 전달하는지 확인합니다.", evidenceLabel: "다운로드 응답 헤더", evidence: ["Content-Disposition: attachment; filename=lesson.php", "Content-Type: application/octet-stream", "GET /lesson?download=true"], question: "다운로드 기능에서 가장 먼저 제한해야 할 것은 무엇일까요?", correct: "사용자에게 노출할 파일의 범위", distractors: ["브라우저 창의 크기", "페이지의 글꼴"], defense: "다운로드 대상은 허용 목록으로 제한하고, 서버 소스와 설정 파일은 웹 경로 밖에 보관합니다." },
  { id: 3, level: 1, title: "쿠키 기반 권한 확인", category: "쿠키", objective: "브라우저 쿠키와 서버 측 권한 검증의 차이를 이해합니다.", evidenceLabel: "브라우저 저장 정보", evidence: ["Set-Cookie: user=guest", "Cookie: user=guest", "role check: request.cookie.user"], question: "권한을 판단할 때 서버가 신뢰해서는 안 되는 값은 무엇일까요?", correct: "브라우저가 보낸 역할 쿠키 값", distractors: ["서버가 조회한 권한 정보", "서버가 관리하는 세션 정보"], defense: "권한은 서버가 관리하는 세션 또는 데이터베이스의 권한 정보로 검증합니다." },
  { id: 4, level: 1, title: "메시지가 출력되는 위치", category: "출력 문맥", objective: "입력값이 HTML과 스크립트 중 어디에 출력되는지 관찰합니다.", evidenceLabel: "출력 코드", evidence: ["const message = input.value;", "alert(message);", "render(message);"], question: "입력값을 안전하게 다루기 전에 먼저 확인해야 할 것은 무엇일까요?", correct: "입력값이 출력되는 문맥", distractors: ["입력창의 색상", "사용자의 화면 해상도"], defense: "출력 문맥에 맞춰 데이터를 인코딩하고, 가능한 경우 안전한 DOM API를 사용합니다." },
  { id: 5, level: 1, title: "입력 검증과 정규표현식", category: "입력 검증", objective: "형식 검증과 안전한 처리의 차이를 구분합니다.", evidenceLabel: "입력 형식 규칙", evidence: ["pattern = /^[a-z0-9._%+-]+@example\\.com$/", "if (pattern.test(input)) {", "  accept(input);", "}"], question: "클라이언트 측 형식 검증만으로 충분하지 않은 이유는 무엇일까요?", correct: "요청은 브라우저 밖에서도 전송할 수 있기 때문", distractors: ["애니메이션이 느려지기 때문", "화면 배치가 달라지기 때문"], defense: "서버에서 형식·길이·범위·권한을 다시 검증하고, 이후 사용 문맥에 맞게 처리합니다." },
  { id: 6, level: 1, title: "폼 데이터 비교", category: "폼 데이터", objective: "폼 입력값이 어떤 이름으로 요청에 포함되는지 읽습니다.", evidenceLabel: "폼 요청", evidence: ["POST /profile", "displayName=learner", "newsletter=true"], question: "서버에서 검증해야 하는 대상은 무엇일까요?", correct: "요청으로 전달된 모든 입력값", distractors: ["입력창의 안내 문구", "마우스 커서 위치"], defense: "서버는 모든 입력값을 허용 목록 기준으로 검증하고, 예기치 않은 필드는 무시합니다." },
  { id: 7, level: 1, title: "리디렉션 추적", category: "리디렉션", objective: "응답 상태 코드와 Location 헤더의 관계를 확인합니다.", evidenceLabel: "리디렉션 응답", evidence: ["HTTP/1.1 302 Found", "Location: /dashboard", "Set-Cookie: session=..."], question: "리디렉션 대상 주소를 사용할 때 우선 검증해야 할 것은 무엇일까요?", correct: "허용된 내부 경로인지 여부", distractors: ["사용자의 스피커 설정", "사용자의 시간대"], defense: "리디렉션 대상은 서버가 정의한 내부 경로 또는 허용 목록으로 제한합니다." },
  { id: 8, level: 1, title: "캐시의 흔적", category: "캐시", objective: "브라우저 캐시에 남기면 안 되는 정보의 특성을 구분합니다.", evidenceLabel: "응답 캐시 지시문", evidence: ["Cache-Control: public, max-age=3600", "Content-Type: text/html", "Account overview"], question: "개인 정보가 포함된 페이지에 적절한 캐시 정책은 무엇일까요?", correct: "공유 캐시에 저장되지 않도록 제한", distractors: ["누구나 재사용할 수 있도록 공개", "영구적으로 브라우저에 저장"], defense: "개인 정보와 인증 후 화면에는 적절한 Cache-Control 지시문을 설정합니다." },
  { id: 9, level: 1, title: "robots.txt 확인", category: "공개 경로", objective: "검색 제외 규칙과 접근제어의 차이를 구분합니다.", evidenceLabel: "robots.txt", evidence: ["User-agent: *", "Disallow: /internal/", "Disallow: /backup/"], question: "robots.txt가 보안 접근제어 수단이 될 수 없는 이유는 무엇일까요?", correct: "경로 정보가 공개되며 접근 자체를 막지 않기 때문", distractors: ["색인 속도가 느리기 때문", "파일 색상이 없기 때문"], defense: "민감한 경로에는 서버 측 인증과 권한 검증을 적용하고, 공개 경로에 두지 않습니다." },
  { id: 10, level: 1, title: "Level 1 평가", category: "종합 관찰", objective: "페이지·요청·쿠키를 관찰해 서버가 검증해야 하는 지점을 구분합니다.", evidenceLabel: "분석 요약", evidence: ["client-side role=admin", "GET /report?redirect=https://...", "Cache-Control: public"], question: "세 가지 신호에서 공통적으로 확인해야 할 보안 원칙은 무엇일까요?", correct: "클라이언트 입력과 공개 응답을 서버 기준으로 검증", distractors: ["화면 장식을 더 많이 추가", "응답을 무조건 빠르게 전송"], defense: "보안 설계는 클라이언트가 보낸 값보다 서버의 검증과 최소 공개 원칙을 우선합니다." },
  { id: 11, level: 2, title: "GET 요청 분석", category: "HTTP 요청", objective: "주소에 포함된 값과 서버의 검증 책임을 구분합니다.", evidenceLabel: "요청 주소", evidence: ["GET /search?topic=session", "Host: lab.local", "Accept: text/html"], question: "주소의 topic 값은 서버에서 어떻게 다뤄야 할까요?", correct: "허용 형식과 길이를 검증", distractors: ["항상 신뢰", "화면에만 숨김"], defense: "쿼리 파라미터도 모든 사용자 입력처럼 검증하고, 안전한 방식으로 사용합니다." },
  { id: 12, level: 2, title: "POST 요청 분석", category: "HTTP 요청", objective: "POST 요청이라고 해서 자동으로 안전해지지 않는다는 점을 이해합니다.", evidenceLabel: "요청 본문", evidence: ["POST /profile", "Content-Type: application/json", "{\"nickname\":\"learner\"}"], question: "POST 요청의 입력값에 필요한 처리는 무엇일까요?", correct: "서버 측 검증과 권한 확인", distractors: ["브라우저 표시만 확인", "요청 방식만 변경"], defense: "요청 방식과 관계없이 모든 입력은 서버에서 유효성·권한·문맥을 검증합니다." },
  { id: 13, level: 2, title: "인증 상태 구분", category: "인증", objective: "로그인 여부와 권한 수준이 서로 다른 확인 항목임을 구분합니다.", evidenceLabel: "응답 상태", evidence: ["HTTP/1.1 200 OK", "session=active", "role=viewer"], question: "로그인한 사용자에게 관리자 기능을 제공하기 전 확인할 것은 무엇일까요?", correct: "해당 기능에 필요한 권한", distractors: ["로그인 화면의 색상", "브라우저 종류"], defense: "인증 후에도 각 요청마다 기능별 권한을 서버에서 검증합니다." },
  { id: 14, level: 2, title: "세션 유지 시간", category: "세션", objective: "세션 만료 정책이 계정 보호에 미치는 영향을 이해합니다.", evidenceLabel: "세션 설정", evidence: ["Set-Cookie: session=...", "Max-Age=86400", "HttpOnly; Secure"], question: "민감한 서비스에서 세션 만료 시간을 설계할 때 우선 고려할 것은 무엇일까요?", correct: "사용 편의와 계정 노출 위험의 균형", distractors: ["쿠키 이름의 길이", "페이지 배경색"], defense: "민감도에 맞는 만료 시간과 재인증 정책을 적용하고 로그아웃 시 세션을 무효화합니다." },
  { id: 15, level: 2, title: "권한 검증이 빠진 화면", category: "접근제어", objective: "메뉴를 숨기는 것과 서버가 접근을 막는 것의 차이를 확인합니다.", evidenceLabel: "화면 경로", evidence: ["/admin/reports", "menuVisible=false", "HTTP/1.1 200 OK"], question: "관리자 메뉴를 숨긴 것만으로 보호가 되지 않는 이유는 무엇일까요?", correct: "주소를 직접 요청할 수 있기 때문", distractors: ["글씨가 작아지기 때문", "아이콘이 보이지 않기 때문"], defense: "화면 표시 여부와 별개로 서버 엔드포인트에서 권한을 확인합니다." },
  { id: 16, level: 2, title: "다운로드 응답 분석", category: "파일 응답", objective: "다운로드 응답에 포함된 메타데이터를 읽습니다.", evidenceLabel: "응답 헤더", evidence: ["Content-Disposition: attachment", "filename=report.pdf", "X-Content-Type-Options: nosniff"], question: "사용자가 제어하는 파일 이름을 응답에 넣기 전에 해야 할 일은 무엇일까요?", correct: "안전한 파일 이름으로 정규화", distractors: ["글꼴만 변경", "다운로드 버튼 숨김"], defense: "파일 이름과 MIME 유형은 서버가 결정하거나 안전한 허용 규칙으로 정규화합니다." },
  { id: 17, level: 2, title: "파일 이름 검증", category: "파일 처리", objective: "파일 이름, 확장자, 실제 콘텐츠가 별도 검증 대상임을 이해합니다.", evidenceLabel: "업로드 메타데이터", evidence: ["name=profile.png", "declaredType=image/png", "size=180KB"], question: "파일 업로드에서 확장자만 검사하면 부족한 이유는 무엇일까요?", correct: "이름과 실제 콘텐츠가 다를 수 있기 때문", distractors: ["파일이 너무 빨리 올라가기 때문", "아이콘이 바뀌기 때문"], defense: "확장자·MIME·실제 콘텐츠를 함께 검사하고, 업로드 파일은 실행 경로와 분리합니다." },
  { id: 18, level: 2, title: "입력 형식 검증", category: "검증", objective: "입력 형식과 비즈니스 규칙을 함께 검토합니다.", evidenceLabel: "입력 규칙", evidence: ["length: 1..30", "allowed: letters, numbers", "required: true"], question: "형식 검증 외에 서버가 추가로 확인해야 할 것은 무엇일까요?", correct: "업무 규칙과 사용자 권한", distractors: ["브라우저 확대 비율", "입력창 테두리"], defense: "형식 검증, 범위 검증, 권한 검증을 분리하고 모두 서버에서 수행합니다." },
  { id: 19, level: 2, title: "오류 응답 읽기", category: "오류 처리", objective: "사용자에게 필요한 안내와 내부 정보 노출을 구분합니다.", evidenceLabel: "오류 메시지", evidence: ["DatabaseError: relation users", "stack: internal/module", "HTTP/1.1 500"], question: "외부 사용자에게 제공해야 할 오류 응답은 어떻게 구성해야 할까요?", correct: "일반화된 안내와 추적 가능한 오류 코드", distractors: ["전체 내부 스택 정보", "서버 경로 전체"], defense: "상세 오류는 서버 로그에 남기고, 사용자에게는 안전한 안내와 오류 코드를 제공합니다." },
  { id: 20, level: 2, title: "Level 2 평가", category: "요청과 인증", objective: "요청 방식·세션·권한·오류 처리의 공통 원칙을 정리합니다.", evidenceLabel: "분석 요약", evidence: ["POST /settings", "role=viewer", "HTTP/1.1 500"], question: "이 요청을 안전하게 처리하는 서버의 우선 순서는 무엇일까요?", correct: "인증·권한·입력 검증 후 안전한 오류 처리", distractors: ["응답 꾸미기부터 처리", "클라이언트 값 그대로 사용"], defense: "요청 처리 순서는 인증, 권한, 입력 검증, 안전한 실행, 최소 정보 응답으로 구성합니다." },
  { id: 21, level: 3, title: "출력 문맥 이해", category: "출력", objective: "데이터가 출력되는 위치에 따라 처리 방식이 달라짐을 확인합니다.", evidenceLabel: "템플릿 코드", evidence: ["<p>{displayName}</p>", "<a href={profileUrl}>", "script value=message"], question: "출력 데이터를 처리할 때 먼저 결정해야 할 것은 무엇일까요?", correct: "출력 문맥에 맞는 인코딩 방식", distractors: ["화면의 테마 색상", "사용자의 기기 종류"], defense: "HTML·속성·URL·스크립트 등 문맥별로 적절한 인코딩과 안전한 API를 사용합니다." },
  { id: 22, level: 3, title: "안전한 인코딩", category: "출력", objective: "표현과 실행을 분리하는 인코딩의 목적을 이해합니다.", evidenceLabel: "표시 데이터", evidence: ["displayName = <sample>", "template renders text", "untrusted input"], question: "안전한 텍스트 출력의 핵심 목표는 무엇일까요?", correct: "입력값을 데이터로만 표시", distractors: ["입력값을 더 크게 표시", "입력값을 자동 실행"], defense: "신뢰하지 않는 값은 실행 가능한 코드가 아닌 텍스트 데이터로 다룹니다." },
  { id: 23, level: 3, title: "검색 요청 구조", category: "데이터 조회", objective: "검색 조건과 조회 로직을 분리해 생각합니다.", evidenceLabel: "검색 조건", evidence: ["query=security", "sort=recent", "limit=20"], question: "검색 조건을 데이터 조회에 반영할 때 안전한 방식은 무엇일까요?", correct: "정해진 매개변수와 허용 값으로 전달", distractors: ["문자열을 그대로 조합", "클라이언트에 판단 위임"], defense: "데이터 조회는 매개변수화된 쿼리와 허용 목록 기반 정렬 기준을 사용합니다." },
  { id: 24, level: 3, title: "질의 조건식", category: "데이터 조회", objective: "사용자 입력이 데이터 조건으로 쓰일 때의 검증 기준을 학습합니다.", evidenceLabel: "조회 설계", evidence: ["WHERE status = ?", "ORDER BY approvedField", "LIMIT ?"], question: "정렬 기준처럼 구조에 영향을 주는 입력은 어떻게 처리해야 할까요?", correct: "미리 정의한 허용 값과 매핑", distractors: ["입력 문자열을 그대로 사용", "화면에서만 감춤"], defense: "필드명·정렬 방향처럼 매개변수화할 수 없는 구조는 허용 목록으로 매핑합니다." },
  { id: 25, level: 3, title: "파일 경로 처리", category: "파일 처리", objective: "사용자 입력과 서버 파일 경로를 직접 결합하지 않는 이유를 이해합니다.", evidenceLabel: "파일 조회 요청", evidence: ["GET /documents?file=guide", "storage key: docs/guide.pdf", "allowlist: guide, policy"], question: "파일을 조회할 때 안전한 식별 방식은 무엇일까요?", correct: "허용된 문서 식별자를 서버 경로에 매핑", distractors: ["사용자 경로를 그대로 결합", "전체 서버 경로를 노출"], defense: "사용자 입력을 실제 파일 경로로 직접 사용하지 않고, 서버가 관리하는 식별자 매핑을 사용합니다." },
  { id: 26, level: 3, title: "업로드 검증", category: "파일 처리", objective: "업로드 파일은 신뢰하지 않는 입력이라는 점을 확인합니다.", evidenceLabel: "업로드 정책", evidence: ["allowed: png, jpg", "maxSize: 2MB", "storage: private bucket"], question: "안전한 업로드 설계의 핵심은 무엇일까요?", correct: "검증한 파일을 비실행 저장소에 보관", distractors: ["원래 이름으로 공개 경로 저장", "확장자만 확인"], defense: "파일을 다단계 검증하고, 임의 이름으로 저장하며, 실행 가능한 웹 경로와 분리합니다." },
  { id: 27, level: 3, title: "오류 정보 노출", category: "오류 처리", objective: "오류 화면에 포함하면 안 되는 내부 정보를 구분합니다.", evidenceLabel: "오류 보고", evidence: ["requestId=R-1042", "database host hidden", "user message: retry later"], question: "문제 추적을 위해 사용자에게 보여주기 적합한 정보는 무엇일까요?", correct: "개인정보가 없는 요청 식별자", distractors: ["데이터베이스 접속 문자열", "서버 내부 경로"], defense: "요청 식별자는 안전하게 공유하고, 민감한 구현 세부 사항은 서버 로그에만 남깁니다." },
  { id: 28, level: 3, title: "브라우저 저장소", category: "클라이언트 저장", objective: "브라우저에 저장하기 적절한 정보의 범위를 이해합니다.", evidenceLabel: "저장소 항목", evidence: ["theme=dark", "draftNote=...", "sessionToken=..."], question: "브라우저 저장소에 보관하면 특히 주의해야 할 값은 무엇일까요?", correct: "세션과 권한에 영향을 주는 민감한 토큰", distractors: ["화면 테마", "정렬 방식"], defense: "민감한 인증 정보의 저장 위치와 보호 속성은 위협 모델에 맞춰 설계합니다." },
  { id: 29, level: 3, title: "입력 흐름 검토", category: "데이터 흐름", objective: "입력값이 수신부터 출력까지 거치는 단계를 추적합니다.", evidenceLabel: "데이터 흐름", evidence: ["form input", "server validation", "database write", "profile output"], question: "입력 검증은 어느 시점에 수행해야 할까요?", correct: "신뢰 경계를 넘는 모든 주요 단계", distractors: ["화면을 그린 뒤 한 번만", "저장 후에만"], defense: "입력값은 수신 시 검증하고, 저장·조회·출력 각 문맥에서도 필요한 안전 처리를 적용합니다." },
  { id: 30, level: 3, title: "Level 3 평가", category: "입력과 출력", objective: "입력·조회·파일·출력의 안전한 데이터 흐름을 종합합니다.", evidenceLabel: "분석 요약", evidence: ["input → validate", "query → parameterize", "output → encode"], question: "안전한 데이터 흐름을 가장 잘 설명하는 것은 무엇일까요?", correct: "각 단계의 목적에 맞게 검증과 처리를 적용", distractors: ["한 번 검증하면 이후 생략", "클라이언트가 모두 처리"], defense: "데이터는 신뢰 경계를 지날 때마다 목적에 맞는 검증과 안전한 처리가 필요합니다." },
  { id: 31, level: 4, title: "리소스 식별자 확인", category: "접근제어", objective: "식별자를 아는 것과 접근 권한을 갖는 것은 다름을 이해합니다.", evidenceLabel: "리소스 요청", evidence: ["GET /records/104", "currentUser=learner", "record.ownerId=102"], question: "리소스 요청을 처리하기 전에 서버가 확인해야 할 것은 무엇일까요?", correct: "현재 사용자의 해당 리소스 접근 권한", distractors: ["URL 길이", "브라우저 언어"], defense: "모든 객체 접근은 현재 사용자와 리소스의 권한 관계를 서버에서 검증합니다." },
  { id: 32, level: 4, title: "사용자별 데이터", category: "접근제어", objective: "목록 화면의 필터링과 상세 조회의 권한 검증을 구분합니다.", evidenceLabel: "목록 조회", evidence: ["SELECT own records", "detail id=104", "role=member"], question: "목록에서 다른 사용자의 항목이 안 보인다고 안전하다고 할 수 없는 이유는 무엇일까요?", correct: "상세 요청도 별도로 권한을 검증해야 하기 때문", distractors: ["목록이 너무 길기 때문", "정렬이 바뀌기 때문"], defense: "목록·상세·수정·삭제 등 모든 엔드포인트에서 일관된 접근제어를 적용합니다." },
  { id: 33, level: 4, title: "권한 검증 흐름", category: "접근제어", objective: "인증과 인가를 요청 처리 순서에 맞게 배치합니다.", evidenceLabel: "처리 순서", evidence: ["authenticate user", "authorize action", "load resource"], question: "민감한 작업을 처리하는 올바른 순서는 무엇일까요?", correct: "사용자 확인 후 권한을 확인하고 작업 수행", distractors: ["작업부터 실행", "화면 표시만 확인"], defense: "인증, 권한 확인, 입력 검증을 작업 이전에 수행하고 결과를 기록합니다." },
  { id: 34, level: 4, title: "세션 상태 재확인", category: "세션", objective: "권한 변경 이후에도 서버 상태를 다시 확인해야 함을 이해합니다.", evidenceLabel: "세션 정보", evidence: ["session user=42", "role changed at 10:30", "requested action=export"], question: "사용자 역할이 변경된 뒤 민감한 요청에서 필요한 조치는 무엇일까요?", correct: "최신 권한 상태를 확인", distractors: ["기존 화면만 유지", "클라이언트 캐시만 확인"], defense: "중요한 권한은 서버의 최신 상태를 기준으로 검증하고 세션 갱신 정책을 둡니다." },
  { id: 35, level: 4, title: "토큰 구조 읽기", category: "토큰", objective: "토큰에 담긴 정보와 서버 검증의 역할을 구분합니다.", evidenceLabel: "토큰 메타데이터", evidence: ["header: algorithm", "payload: subject, expiry", "signature: verified server-side"], question: "토큰을 받은 서버가 반드시 확인해야 할 것은 무엇일까요?", correct: "서명·만료·발급 조건의 유효성", distractors: ["토큰 글자 수만", "화면에 보이는 이름만"], defense: "토큰은 서버에서 서명과 만료를 검증하고, 필요한 최소 권한만 부여합니다." },
  { id: 36, level: 4, title: "API 응답 필드", category: "API", objective: "응답에는 목적에 필요한 최소 정보만 포함해야 함을 이해합니다.", evidenceLabel: "API 응답", evidence: ["{ id, displayName, email, internalNote }", "endpoint: /api/profile", "role: member"], question: "클라이언트에 반환하기 전 검토해야 할 것은 무엇일까요?", correct: "화면 목적에 필요하지 않은 필드의 제외", distractors: ["응답 색상", "네트워크 아이콘"], defense: "API는 최소 권한과 최소 공개 원칙에 따라 필요한 필드만 반환합니다." },
  { id: 37, level: 4, title: "요청 빈도 제한", category: "서비스 보호", objective: "요청 빈도 제한이 계정과 서비스 보호에 기여하는 방식을 이해합니다.", evidenceLabel: "요청 기록", evidence: ["POST /login", "attempts=12/min", "status=429"], question: "반복 요청에 대한 적절한 서버 대응은 무엇일까요?", correct: "의미 있는 제한과 재시도 안내", distractors: ["모든 요청을 무제한 허용", "오류를 숨김"], defense: "민감한 작업에는 사용자·IP·행동 기준의 제한과 안전한 재시도 정책을 적용합니다." },
  { id: 38, level: 4, title: "감사 로그", category: "기록", objective: "보안 관련 기록에 필요한 정보와 개인정보 최소화를 함께 고려합니다.", evidenceLabel: "감사 이벤트", evidence: ["actor=user42", "action=export", "timestamp=UTC", "requestId=R-21"], question: "감사 로그가 추적에 유용하려면 무엇을 포함해야 할까요?", correct: "행위자·행동·시각·안전한 요청 식별자", distractors: ["사용자 비밀번호", "전체 세션 값"], defense: "감사 로그에는 추적에 필요한 최소 정보만 기록하고 민감한 비밀값은 제외합니다." },
  { id: 39, level: 4, title: "접근 정책 검토", category: "정책", objective: "기능별 최소 권한 원칙을 정책으로 표현합니다.", evidenceLabel: "권한 매트릭스", evidence: ["viewer: read", "editor: read, edit", "admin: manage"], question: "최소 권한 원칙에 맞는 정책은 무엇일까요?", correct: "역할마다 필요한 기능만 허용", distractors: ["모든 역할에 관리 권한 부여", "권한을 전혀 정의하지 않음"], defense: "역할과 기능의 관계를 명확히 정의하고, 기본값은 허용이 아닌 거부로 설계합니다." },
  { id: 40, level: 4, title: "Level 4 평가", category: "권한과 API", objective: "리소스·세션·토큰·API의 신뢰 경계를 종합합니다.", evidenceLabel: "분석 요약", evidence: ["resource owner mismatch", "token expiry", "API excessive fields"], question: "이 사례들의 공통된 방어 원칙은 무엇일까요?", correct: "서버 기준의 권한 검증과 최소 공개", distractors: ["클라이언트 표시만 개선", "요청을 더 길게 유지"], defense: "민감한 리소스와 API는 서버 권한 검증·토큰 검증·최소 공개 원칙을 함께 적용합니다." },
  { id: 41, level: 5, title: "정보 수집 정리", category: "종합 분석", objective: "관찰한 정보를 사실·가설·확인 결과로 분류합니다.", evidenceLabel: "분석 노트", evidence: ["fact: response header", "hypothesis: stale cache", "verified: server setting"], question: "분석 기록을 신뢰성 있게 만드는 방법은 무엇일까요?", correct: "사실과 가설을 구분해 근거를 남김", distractors: ["추측만 기록", "결론만 기록"], defense: "분석 보고서는 관찰한 사실, 검증 방법, 결과, 권장 조치를 분리해 기록합니다." },
  { id: 42, level: 5, title: "단서 우선순위", category: "종합 분석", objective: "영향과 재현 가능성을 기준으로 분석 순서를 정합니다.", evidenceLabel: "관찰 목록", evidence: ["public header", "role mismatch", "minor style issue"], question: "분석 우선순위를 정할 때 가장 적절한 기준은 무엇일까요?", correct: "영향도와 확인 가능한 근거", distractors: ["화면에서 가장 큰 글자", "가장 오래된 항목"], defense: "보안 분석은 영향도, 노출 범위, 재현 가능성, 방어 가능성을 함께 고려합니다." },
  { id: 43, level: 5, title: "인증 흐름 검토", category: "종합 분석", objective: "로그인부터 권한 확인까지의 경계를 한 흐름으로 봅니다.", evidenceLabel: "흐름 다이어그램", evidence: ["login → session", "session → role check", "role check → resource"], question: "인증 흐름에서 누락되면 위험이 큰 단계는 무엇일까요?", correct: "요청마다 수행하는 권한 확인", distractors: ["로고 표시", "화면 전환 효과"], defense: "인증은 시작점이며, 민감한 리소스마다 인가를 서버에서 재확인합니다." },
  { id: 44, level: 5, title: "입력과 출력 연결", category: "종합 분석", objective: "하나의 입력값이 여러 출력 문맥으로 이동할 수 있음을 추적합니다.", evidenceLabel: "데이터 경로", evidence: ["form → database", "database → report", "report → browser"], question: "재사용되는 데이터의 안전성을 유지하려면 무엇이 필요할까요?", correct: "각 출력 지점의 문맥별 처리", distractors: ["처음 한 번만 검증", "데이터 형식을 고정하지 않음"], defense: "저장된 데이터도 재출력될 때마다 현재 문맥에 맞는 안전 처리를 적용합니다." },
  { id: 45, level: 5, title: "파일 처리 검토", category: "종합 분석", objective: "파일 업로드·저장·다운로드의 전체 경로를 검토합니다.", evidenceLabel: "파일 수명주기", evidence: ["upload validation", "private storage", "authorized download"], question: "파일 수명주기 전반에서 공통으로 확인할 것은 무엇일까요?", correct: "허용 범위·접근 권한·안전한 저장 위치", distractors: ["파일 아이콘", "다운로드 버튼 색상"], defense: "파일은 수신·저장·제공 단계마다 검증, 권한 확인, 공개 범위 제한이 필요합니다." },
  { id: 46, level: 5, title: "API 경계 분석", category: "종합 분석", objective: "API 입력과 응답의 신뢰 경계를 정리합니다.", evidenceLabel: "API 계약", evidence: ["input schema", "authorization check", "response projection"], question: "안전한 API 계약의 핵심 요소는 무엇일까요?", correct: "입력 스키마·권한 검증·최소 응답", distractors: ["응답 크기만 증가", "클라이언트 판단만 사용"], defense: "API는 명확한 입력 계약, 서버 권한 확인, 최소 데이터 응답을 기본으로 설계합니다." },
  { id: 47, level: 5, title: "권한 검증 결과 보고", category: "종합 분석", objective: "발견한 권한 문제를 재현 가능하고 방어 중심으로 보고합니다.", evidenceLabel: "보고서 초안", evidence: ["affected action", "expected authorization", "observed response"], question: "좋은 보안 보고서에 필요한 내용은 무엇일까요?", correct: "영향·재현 근거·권장 방어책", distractors: ["추측성 표현만", "화면 캡처만"], defense: "보고서는 사실 기반의 영향 분석과 구체적인 방어 권고를 포함해야 합니다." },
  { id: 48, level: 5, title: "방어 방법 비교", category: "방어 설계", objective: "하나의 문제에 여러 방어 계층이 필요할 수 있음을 이해합니다.", evidenceLabel: "방어 후보", evidence: ["server validation", "role check", "safe response", "audit log"], question: "단일 방어에 의존하지 않는 설계의 장점은 무엇일까요?", correct: "한 계층의 실수를 다른 계층이 완화", distractors: ["화면을 더 복잡하게 만듦", "검증을 생략할 수 있음"], defense: "중요한 기능은 검증·권한·안전한 출력·기록 등 서로 보완하는 방어 계층을 사용합니다." },
  { id: 49, level: 5, title: "최종 분석 준비", category: "종합 분석", objective: "결론 전에 근거와 제한 사항을 검토합니다.", evidenceLabel: "점검 목록", evidence: ["evidence linked", "scope stated", "defense recommended"], question: "분석 결론을 제출하기 전 마지막으로 확인할 것은 무엇일까요?", correct: "근거·범위·권장 조치의 일치", distractors: ["제목 글꼴", "마우스 위치"], defense: "결론은 확인한 사실의 범위를 넘지 않아야 하며, 남은 불확실성도 명시합니다." },
  { id: 50, level: 5, title: "Level 5 평가", category: "최종 평가", objective: "관찰·검증·방어 권고를 연결해 분석 결과를 완성합니다.", evidenceLabel: "최종 사례", evidence: ["untrusted input", "missing authorization", "excess response field"], question: "이 사례의 우선 방어 조합으로 가장 적절한 것은 무엇일까요?", correct: "서버 검증·권한 확인·최소 공개·기록", distractors: ["클라이언트 안내문만 추가", "모든 기능을 공개"], defense: "웹 보안의 기본은 신뢰 경계마다 서버 검증을 수행하고, 필요한 정보만 공개하며, 결과를 안전하게 기록하는 것입니다." },
];

export const learningChallenges = seeds.map(createChallenge);
export const challengeById = (id: number) => learningChallenges.find(challenge => challenge.id === id);
export const getChallengeAnswerId = (id: number) => optionIds[(id - 1) % optionIds.length];
