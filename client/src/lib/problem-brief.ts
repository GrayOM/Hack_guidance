export type ProblemBrief = {
  label: string;
  marker: string;
  mission: string;
  successCondition: string;
  operation: "inspect" | "replay" | "trace" | "probe" | "report";
  action: string;
};

type BriefSeed = Omit<ProblemBrief, "action">;

const briefs: Record<number, BriefSeed> = {
  1: { label: "CLIENT TRUST", marker: "auth-client", mission: "인증 결과를 결정하는 코드가 브라우저 안에만 존재하는지 조사하세요.", successCondition: "클라이언트 값과 서버 인증 판단의 경계를 식별합니다.", operation: "inspect" },
  2: { label: "DOWNLOAD TRACE", marker: "download-header", mission: "다운로드 응답이 의도하지 않은 파일 정보를 흘리는지 조사하세요.", successCondition: "응답 헤더에서 노출된 처리 단서를 확인합니다.", operation: "inspect" },
  3: { label: "COOKIE TRUST", marker: "cookie-role", mission: "권한 판단에 사용되는 브라우저 저장값의 신뢰 경계를 조사하세요.", successCondition: "쿠키 값과 서버 권한 검증의 차이를 확인합니다.", operation: "trace" },
  4: { label: "OUTPUT SINK", marker: "alert-sink", mission: "사용자 메시지가 도달하는 출력 문맥을 추적하세요.", successCondition: "입력값이 실행이 아닌 데이터로 처리돼야 하는 지점을 확인합니다.", operation: "trace" },
  5: { label: "VALIDATION GAP", marker: "email-pattern", mission: "형식 검사만으로 보호되지 않는 입력 경로를 조사하세요.", successCondition: "클라이언트 검증과 서버 검증의 차이를 확인합니다.", operation: "inspect" },
  6: { label: "FORM REPLAY", marker: "profile-form", mission: "프로필 변경 요청의 필드 경계를 재현해 보세요.", successCondition: "서버가 허용하지 않은 필드를 무시해야 함을 확인합니다.", operation: "replay" },
  7: { label: "REDIRECT TRACE", marker: "redirect-target", mission: "리디렉션 대상이 어디에서 신뢰되는지 조사하세요.", successCondition: "허용되지 않은 외부 이동 경로의 위험을 확인합니다.", operation: "inspect" },
  8: { label: "CACHE SIGNAL", marker: "cache-policy", mission: "민감한 화면에 적용된 캐시 정책을 조사하세요.", successCondition: "공개 캐시와 인증 후 응답의 충돌을 확인합니다.", operation: "inspect" },
  9: { label: "PUBLIC PATHS", marker: "robots-paths", mission: "검색 제외 파일에 남은 민감 경로를 조사하세요.", successCondition: "숨김 규칙과 접근제어의 차이를 확인합니다.", operation: "inspect" },
  10: { label: "TRUST REPORT", marker: "trust-boundary", mission: "초기 구역의 신뢰 경계 문제를 하나의 조사 결과로 정리하세요.", successCondition: "클라이언트 신뢰·리디렉션·캐시 문제의 공통 원칙을 연결합니다.", operation: "report" },
  11: { label: "REQUEST REPLAY", marker: "get-search", mission: "검색 요청의 주소 입력이 서버에 도달하는 경로를 재현하세요.", successCondition: "쿼리 문자열도 서버 입력 검증 대상임을 확인합니다.", operation: "replay" },
  12: { label: "BODY REPLAY", marker: "post-profile", mission: "프로필 갱신 요청 본문의 검증 경계를 재현하세요.", successCondition: "요청 방식이 검증 책임을 대신하지 못함을 확인합니다.", operation: "replay" },
  13: { label: "SESSION ROLE", marker: "session-role", mission: "인증 상태와 권한 수준이 분리되는 세션 신호를 조사하세요.", successCondition: "로그인 여부만으로 높은 권한이 부여되지 않음을 확인합니다.", operation: "inspect" },
  14: { label: "SESSION LIFETIME", marker: "session-ttl", mission: "세션 유지 시간이 민감 기능에 미치는 영향을 조사하세요.", successCondition: "세션 만료와 재인증의 필요성을 확인합니다.", operation: "inspect" },
  15: { label: "HIDDEN ROUTE", marker: "admin-report", mission: "숨겨진 메뉴와 실제 서버 접근 통제의 차이를 재현하세요.", successCondition: "표시 여부와 서버 인가가 별개임을 확인합니다.", operation: "probe" },
  16: { label: "DOWNLOAD META", marker: "download-metadata", mission: "파일 다운로드 응답의 메타데이터 처리 경로를 조사하세요.", successCondition: "서버가 파일 이름과 MIME 정보를 통제해야 함을 확인합니다.", operation: "inspect" },
  17: { label: "UPLOAD FACTS", marker: "upload-metadata", mission: "업로드 메타데이터가 실제 파일을 보장하는지 조사하세요.", successCondition: "이름·선언형식·콘텐츠 검증의 분리를 확인합니다.", operation: "inspect" },
  18: { label: "RULE BOUNDARY", marker: "validation-rule", mission: "형식 규칙 뒤에 남는 비즈니스 검증 경계를 조사하세요.", successCondition: "범위와 권한 검증의 필요성을 확인합니다.", operation: "inspect" },
  19: { label: "ERROR TRACE", marker: "error-detail", mission: "오류 응답이 내부 구현을 얼마나 노출하는지 추적하세요.", successCondition: "사용자 안내와 서버 진단 정보의 분리를 확인합니다.", operation: "trace" },
  20: { label: "REQUEST REPORT", marker: "request-boundary", mission: "요청·세션·권한 구역의 관찰 결과를 정리하세요.", successCondition: "인증부터 안전한 응답까지의 순서를 연결합니다.", operation: "report" },
  21: { label: "HTML CONTEXT", marker: "html-context", mission: "입력 데이터가 HTML·URL·스크립트 문맥으로 흘러가는 경로를 추적하세요.", successCondition: "문맥별 처리 차이를 확인합니다.", operation: "trace" },
  22: { label: "TEXT ENCODING", marker: "text-encoding", mission: "표현과 실행이 분리되는 출력 처리를 추적하세요.", successCondition: "신뢰하지 않는 값이 텍스트로 남는지 확인합니다.", operation: "trace" },
  23: { label: "SEARCH QUERY", marker: "search-query", mission: "검색 조건이 데이터 조회 경계에 들어가는 요청을 재현하세요.", successCondition: "조회 입력의 안전한 전달 방식을 확인합니다.", operation: "replay" },
  24: { label: "QUERY SHAPE", marker: "query-structure", mission: "쿼리 구조를 바꿀 수 있는 정렬 조건을 조사하세요.", successCondition: "허용 목록이 필요한 구조 입력을 확인합니다.", operation: "inspect" },
  25: { label: "DOCUMENT KEY", marker: "document-key", mission: "문서 식별자가 파일 경로로 해석되는 위험을 재현하세요.", successCondition: "서버 매핑 기반 파일 접근 원칙을 확인합니다.", operation: "probe" },
  26: { label: "UPLOAD POLICY", marker: "upload-policy", mission: "업로드 정책이 실제 저장 경계까지 이어지는지 조사하세요.", successCondition: "다단계 검증과 격리 저장의 필요성을 확인합니다.", operation: "inspect" },
  27: { label: "SAFE ERROR", marker: "error-report", mission: "사용자 오류 보고에 남길 수 있는 식별자를 추적하세요.", successCondition: "추적 가능성과 내부 정보 보호의 균형을 확인합니다.", operation: "trace" },
  28: { label: "STORAGE ITEM", marker: "storage-item", mission: "브라우저 저장소에 기록된 값의 민감도를 조사하세요.", successCondition: "인증 정보 저장 경계의 위험을 확인합니다.", operation: "inspect" },
  29: { label: "INPUT FLOW", marker: "input-flow", mission: "입력이 수신부터 출력까지 이동하는 경로를 추적하세요.", successCondition: "여러 신뢰 경계에서 필요한 처리를 확인합니다.", operation: "trace" },
  30: { label: "DATA REPORT", marker: "data-boundary", mission: "입력·조회·파일·출력 경계의 조사 결과를 정리하세요.", successCondition: "데이터 흐름 전반의 검증 원칙을 연결합니다.", operation: "report" },
  31: { label: "OBJECT ACCESS", marker: "record-104", mission: "다른 사용자의 리소스 식별자에 대한 접근을 안전한 환경에서 조사하세요.", successCondition: "식별자와 소유권 검증의 차이를 확인합니다.", operation: "probe" },
  32: { label: "MEMBER DETAIL", marker: "member-detail", mission: "목록 필터와 상세 인가가 분리되는 경로를 조사하세요.", successCondition: "상세 조회에도 인가가 필요함을 확인합니다.", operation: "probe" },
  33: { label: "AUTHZ ORDER", marker: "authorization-order", mission: "민감한 요청의 인증·인가·자원 조회 순서를 추적하세요.", successCondition: "권한 확인이 자원 접근보다 앞서야 함을 확인합니다.", operation: "trace" },
  34: { label: "ROLE REFRESH", marker: "role-refresh", mission: "권한이 바뀐 뒤 세션 정보가 재확인되는지 조사하세요.", successCondition: "최신 서버 권한 상태의 필요성을 확인합니다.", operation: "inspect" },
  35: { label: "TOKEN SIGNATURE", marker: "token-signature", mission: "토큰의 서명과 만료가 검증되는 경로를 조사하세요.", successCondition: "토큰 메타데이터만 신뢰할 수 없음을 확인합니다.", operation: "inspect" },
  36: { label: "API PROJECTION", marker: "api-projection", mission: "API 응답이 필요한 필드만 선택하는지 조사하세요.", successCondition: "최소 공개 원칙의 적용 지점을 확인합니다.", operation: "inspect" },
  37: { label: "LOGIN THROTTLE", marker: "login-throttle", mission: "반복 로그인 시도에 대한 서버 보호 신호를 조사하세요.", successCondition: "요청 빈도 제한이 필요한 이유를 확인합니다.", operation: "inspect" },
  38: { label: "AUDIT EVENT", marker: "audit-event", mission: "감사 이벤트에 기록할 정보와 제외할 정보를 조사하세요.", successCondition: "추적 가능성과 비밀값 최소화 원칙을 확인합니다.", operation: "inspect" },
  39: { label: "ROLE MATRIX", marker: "role-matrix", mission: "역할별 허용 작업이 기본 거부 원칙을 지키는지 조사하세요.", successCondition: "최소 권한 정책의 경계를 확인합니다.", operation: "inspect" },
  40: { label: "PRIVILEGE REPORT", marker: "privilege-boundary", mission: "권한·토큰·API 노출의 조사 결과를 정리하세요.", successCondition: "서버 인가와 최소 공개 원칙을 연결합니다.", operation: "report" },
  41: { label: "EVIDENCE FACT", marker: "evidence-fact", mission: "사실·가설·검증 결과가 분리된 분석 기록을 작성하세요.", successCondition: "근거 기반 보고의 첫 단계를 확인합니다.", operation: "report" },
  42: { label: "PRIORITY SIGNAL", marker: "priority-signal", mission: "분석 신호의 영향도와 재현 가능성을 기준으로 우선순위를 정리하세요.", successCondition: "조사 순서가 위험도에 따라 달라짐을 확인합니다.", operation: "report" },
  43: { label: "AUTH FLOW", marker: "auth-flow", mission: "로그인부터 자원 인가까지의 연속된 경로를 추적하세요.", successCondition: "인증 이후에도 인가가 반복돼야 함을 확인합니다.", operation: "trace" },
  44: { label: "OUTPUT FLOW", marker: "output-flow", mission: "재사용되는 데이터가 출력 문맥을 이동하는 경로를 추적하세요.", successCondition: "재출력 시점의 처리 필요성을 확인합니다.", operation: "trace" },
  45: { label: "FILE LIFECYCLE", marker: "file-lifecycle", mission: "업로드부터 제공까지의 파일 생명주기를 조사하세요.", successCondition: "각 단계의 검증과 인가 경계를 확인합니다.", operation: "inspect" },
  46: { label: "API CONTRACT", marker: "api-contract", mission: "API 입력 계약·권한 검증·응답 투영의 연결을 조사하세요.", successCondition: "안전한 API 경계를 확인합니다.", operation: "inspect" },
  47: { label: "AUTHZ GAP", marker: "authorization-gap", mission: "관찰된 권한 공백을 재현 가능한 보고 형태로 정리하세요.", successCondition: "영향과 방어 권고가 분리된 기록을 확인합니다.", operation: "report" },
  48: { label: "DEFENSE LAYERS", marker: "defense-layers", mission: "한 가지 문제가 여러 방어 계층을 필요로 하는지 정리하세요.", successCondition: "상호 보완하는 통제 수단을 확인합니다.", operation: "report" },
  49: { label: "EVIDENCE SCOPE", marker: "evidence-scope", mission: "분석 결론이 증거의 범위를 넘지 않는지 정리하세요.", successCondition: "사실과 불확실성을 구분한 결론을 확인합니다.", operation: "report" },
  50: { label: "BOUNDARY PLAN", marker: "boundary-plan", mission: "마지막 사례의 입력·권한·응답 문제를 하나의 방어 계획으로 정리하세요.", successCondition: "모든 신뢰 경계의 우선 방어 조합을 확인합니다.", operation: "report" },
};

export const practiceGuideForNode = (id: number): ProblemBrief | null => {
  const brief = briefs[id];
  return brief ? { ...brief, action: brief.mission } : null;
};
