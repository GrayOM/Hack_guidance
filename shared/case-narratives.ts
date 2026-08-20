export type CaseNarrative = {
  title: string;
  brief: string;
  targetTitle: string;
  targetBrief: string;
  operatorCue: string;
};

const narratives: Record<number, CaseNarrative> = {
  1: { title: "야간 교대의 위조된 승인", brief: "야간 교대 직후, 외부 계약자 계정이 내부 전용 포털에 통과했다는 경보가 포착됐습니다. 인증 판단이 실제로 어디에서 끝나는지 추적합니다.", targetTitle: "승인 경로를 격리 조사", targetBrief: "계정처럼 보이는 값과 서버가 신뢰해야 할 판단을 분리해, 위조된 통과 신호의 출처를 찾으세요.", operatorCue: "CLIENT-SIDE TRUST" },
  2: { title: "배포 미러의 잔류 파일", brief: "새 릴리스 직전, 공개 패키지 미러가 내부 빌드 흔적을 함께 보내고 있다는 제보가 들어왔습니다. 전달 계층에 남은 단서를 조사합니다.", targetTitle: "릴리스 미러에서 흔적 찾기", targetBrief: "다운로드 경로가 원래 공개돼선 안 되는 빌드 정보를 어떤 방식으로 드러내는지 확인하세요.", operatorCue: "ARTIFACT EXPOSURE" },
  3: { title: "게스트 쿠키의 권한 도약", brief: "지원 계정 하나가 관리자 화면을 읽었다는 기록이 남았습니다. 브라우저가 가진 표식과 서버 권한이 섞이는 지점을 확인합니다.", targetTitle: "세션 표식의 신뢰 경계", targetBrief: "클라이언트 저장값이 서버 권한을 대신하는 순간 어떤 도약이 가능한지 격리 환경에서 추적하세요.", operatorCue: "COOKIE TRUST" },
  4: { title: "공지 채널의 반사 신호", brief: "팀 공지에 남긴 짧은 메시지가 다른 분석자의 화면에서 예상 밖의 동작을 보였다는 신고가 접수됐습니다. 출력 문맥을 따라갑니다.", targetTitle: "메시지 렌더링 경로", targetBrief: "텍스트로 남아야 할 입력이 어느 출력 지점에서 위험한 신호가 되는지 확인하세요.", operatorCue: "OUTPUT CONTEXT" },
  5: { title: "체험 계정 위장 등록", brief: "자동 가입 봇이 형식 검사를 통과해 체험 구역을 점유하고 있습니다. 보기 좋은 입력 규칙 뒤에 남은 서버 판단을 찾아냅니다.", targetTitle: "등록 게이트의 빈틈", targetBrief: "화면의 형식 확인과 서버가 보장해야 하는 실제 가입 규칙 사이의 차이를 조사하세요.", operatorCue: "VALIDATION GAP" },
  6: { title: "프로필 패킷의 숨은 필드", brief: "일반 사용자 프로필 변경 패킷에서 문서화되지 않은 속성 갱신 시도가 감지됐습니다. 요청 본문의 경계를 재현합니다.", targetTitle: "프로필 변경 패킷", targetBrief: "보이는 폼 이외의 값이 서버까지 전달될 때 허용돼야 할 범위를 확인하세요.", operatorCue: "MASS ASSIGNMENT" },
  7: { title: "중계국 리디렉션 유도", brief: "도움말 링크를 밟은 사용자가 외부 중계지로 이동했다는 흔적이 남았습니다. 목적지 신뢰가 끊기는 지점을 찾습니다.", targetTitle: "이동 경로의 신뢰 확인", targetBrief: "서비스가 받아들이는 다음 목적지가 내부 경로인지, 외부 유도 신호인지 구분하세요.", operatorCue: "OPEN REDIRECT" },
  8: { title: "브라우저 캐시의 잔상", brief: "공용 단말에서 이전 사용자 화면의 일부가 되살아났습니다. 인증 뒤 응답이 남기는 캐시 신호를 분석합니다.", targetTitle: "캐시 잔상 조사", targetBrief: "민감한 응답이 재사용되는 조건과 서버가 막아야 할 저장 경계를 확인하세요.", operatorCue: "CACHE RESIDUE" },
  9: { title: "지도 밖의 유지보수 경로", brief: "검색 로봇 제외 목록에 내부 운영 경로가 노출되어 있습니다. 숨김과 접근 통제가 다르다는 점을 증거로 남깁니다.", targetTitle: "공개 경로 지도 재구성", targetBrief: "검색에서 숨긴 정보가 실제로는 누구에게나 닿을 수 있는지 확인하세요.", operatorCue: "PATH DISCLOSURE" },
  10: { title: "첫 구역: 신뢰 경계 브리핑", brief: "초기 정찰에서 수집한 인증·이동·캐시 신호를 한 사건 파일로 묶어, 어느 경계가 먼저 무너졌는지 정리합니다.", targetTitle: "신뢰 경계 사건 파일", targetBrief: "서로 달라 보이는 표식들이 공통으로 가리키는 서버 검증 실패를 연결하세요.", operatorCue: "SURFACE TRIAGE" },
  11: { title: "지식 베이스의 우회 질의", brief: "지원 검색창을 통해 외부 입력이 예상보다 깊게 전달되는 흔적이 발견됐습니다. 요청이 서버로 진입하는 경로를 따라갑니다.", targetTitle: "검색 요청 추적", targetBrief: "주소창에서 시작한 질의가 어떤 검증 없이 서비스 경계로 넘어가는지 확인하세요.", operatorCue: "QUERY REPLAY" },
  12: { title: "회원 레코드의 과잉 갱신", brief: "프로필 보정 요청 뒤에 예상치 못한 회원 속성이 바뀌었습니다. 정상적인 POST처럼 보이는 패킷의 권한 범위를 점검합니다.", targetTitle: "본문 필드 경계", targetBrief: "요청 방식이 안전을 보장하지 않는 이유와 서버가 걸러야 할 갱신 필드를 확인하세요.", operatorCue: "BODY CONTROL" },
  13: { title: "로그인과 권한의 혼선", brief: "인증 성공 표시가 난 뒤 낮은 권한 계정이 고권한 화면을 탐색한 기록이 있습니다. 세션 안의 역할 신호를 분리합니다.", targetTitle: "세션 역할 분해", targetBrief: "로그인 상태와 실제 권한이 다르게 취급돼야 하는 지점을 찾아내세요.", operatorCue: "ROLE CONFUSION" },
  14: { title: "사라지지 않는 세션", brief: "분실 신고된 기기에서 오랜 시간이 지난 뒤에도 작업 공간 접근이 계속됐습니다. 세션 수명과 재인증 경계를 확인합니다.", targetTitle: "세션 수명 분석", targetBrief: "민감한 작업이 오래된 승인 신호를 계속 받아들이는지 조사하세요.", operatorCue: "SESSION TTL" },
  15: { title: "숨겨진 보고서 엔드포인트", brief: "메뉴에는 없는 운영 보고서가 주소만으로 응답했습니다. 화면 은닉과 서버 인가가 분리되는 장면을 분석합니다.", targetTitle: "보이지 않는 보고서 경로", targetBrief: "표시되지 않은 기능이 실제로도 막혀 있는지 격리 환경에서 확인하세요.", operatorCue: "MISSING AUTHZ" },
  16: { title: "전송함의 메타데이터 흔적", brief: "파일 자체는 안전해 보이지만, 전달 응답이 내부 처리 정보를 남기고 있습니다. 헤더와 이름 처리 경로를 조사합니다.", targetTitle: "파일 전달 메타데이터", targetBrief: "파일명·유형·전달 지시문이 통제되지 않을 때 남는 단서를 확인하세요.", operatorCue: "DOWNLOAD META" },
  17: { title: "위장된 업로드 상자", brief: "이미지로 신고된 파일이 검토 큐에서 예상과 다르게 분류됐습니다. 이름·선언 형식·실제 콘텐츠가 갈라지는 경계를 찾습니다.", targetTitle: "업로드 분류 우회", targetBrief: "파일이 스스로 주장하는 정보와 서비스가 확인해야 할 사실을 분리하세요.", operatorCue: "FILE POLYGLOT" },
  18: { title: "규칙을 통과한 비정상 요청", brief: "형식 검사는 통과했지만 권한 밖의 작업이 큐에 들어왔습니다. 비즈니스 규칙이 빠진 지점을 조사합니다.", targetTitle: "요청 규칙의 사각", targetBrief: "입력 형식이 맞더라도 서버가 거절해야 하는 조건을 찾아내세요.", operatorCue: "BUSINESS RULE" },
  19: { title: "오류 화면의 내부 지도", brief: "사용자용 오류 안내에서 저장소 이름과 모듈 경로가 새어 나왔습니다. 진단 신호가 외부로 넘치는 순간을 추적합니다.", targetTitle: "오류 신호 절제", targetBrief: "문제 해결에 필요한 안내와 공격 표면이 되는 내부 정보의 선을 확인하세요.", operatorCue: "STACK TRACE" },
  20: { title: "두 번째 구역: 접근 벡터", brief: "요청·세션·권한·오류 응답에서 모은 단서를 하나의 접근 벡터로 정리합니다. 사고가 시작되는 순서를 재구성하세요.", targetTitle: "접근 벡터 사건 파일", targetBrief: "정상 요청처럼 보이는 흐름에서 인증과 인가가 끊기는 지점을 연결하세요.", operatorCue: "ACCESS CHAIN" },
  21: { title: "템플릿 안의 낯선 태그", brief: "공유 노트가 서로 다른 화면에서 서로 다른 모습으로 되살아납니다. 입력이 들어간 출력 문맥을 추적합니다.", targetTitle: "출력 문맥 추적", targetBrief: "데이터가 HTML·속성·스크립트 경계를 넘을 때 어떤 처리가 필요한지 확인하세요.", operatorCue: "HTML SINK" },
  22: { title: "문자열 위장 전송", brief: "상태 피드의 특수문자가 단순 텍스트가 아닌 명령처럼 해석될 조짐이 보입니다. 표현과 실행 사이를 점검합니다.", targetTitle: "인코딩 경계 조사", targetBrief: "신뢰하지 않는 문자가 화면에 도착하기 전 어떤 안전 장치가 필요한지 찾으세요.", operatorCue: "ENCODING BOUNDARY" },
  23: { title: "카탈로그의 조작된 검색선", brief: "참조 카탈로그 검색이 데이터 저장소의 조건과 지나치게 밀접하게 연결돼 있습니다. 질의 입력의 경계를 재현합니다.", targetTitle: "카탈로그 질의 분석", targetBrief: "검색 조건이 데이터 조회 구조로 바뀌는 경로를 안전한 환경에서 관찰하세요.", operatorCue: "QUERY INJECTION" },
  24: { title: "정렬 키가 바꾼 시야", brief: "대시보드 정렬 옵션 하나가 의도하지 않은 조회 구조를 선택하는 흔적이 발견됐습니다. 구조 입력을 분리합니다.", targetTitle: "조회 구조 통제", targetBrief: "값이 아닌 구조를 바꾸는 입력에 왜 허용 목록이 필요한지 확인하세요.", operatorCue: "STRUCTURAL INPUT" },
  25: { title: "문서 보관함의 탈출 경로", brief: "문서 키가 저장소 경로처럼 해석되면서 보관함 밖의 파일을 가리킬 수 있다는 제보가 들어왔습니다. 경로 경계를 조사합니다.", targetTitle: "보관함 경로 검증", targetBrief: "사람이 입력한 식별자가 실제 파일 시스템 경로가 되는 순간을 찾아내세요.", operatorCue: "PATH TRAVERSAL" },
  26: { title: "검수 큐의 변장 파일", brief: "업로드 검수 정책은 존재하지만 저장소까지 이어지는 보호선이 비어 있습니다. 격리와 검증의 단절을 찾습니다.", targetTitle: "업로드 격리 구역", targetBrief: "수신 후 저장·검토·제공까지 이어지는 파일 처리 경계를 확인하세요.", operatorCue: "INGEST CONTROL" },
  27: { title: "추적 번호와 과잉 노출", brief: "오류 보고 기능이 추적에 유용한 정보를 주지만 내부 시스템의 위치까지 드러낼 위험이 있습니다. 안전한 식별자를 고릅니다.", targetTitle: "안전한 오류 추적", targetBrief: "사건을 이어갈 수 있으면서도 서비스 구조를 숨기는 응답을 구분하세요.", operatorCue: "ERROR HYGIENE" },
  28: { title: "브라우저 금고의 잘못된 보관", brief: "개인 설정과 인증 흔적이 같은 저장소에 놓여 있습니다. 공격 표면이 되는 브라우저 보관 값을 조사합니다.", targetTitle: "클라이언트 보관함", targetBrief: "편의를 위한 저장값과 민감한 승인 신호가 섞이는 지점을 확인하세요.", operatorCue: "LOCAL STORAGE" },
  29: { title: "입력 패킷의 연쇄 이동", brief: "하나의 요청이 수신·저장·조회·출력을 거치며 여러 형태로 바뀝니다. 데이터 흐름 안의 검증 공백을 추적합니다.", targetTitle: "입력 흐름 재구성", targetBrief: "각 경계를 지날 때 무엇을 다시 확인해야 하는지 패킷 흐름으로 정리하세요.", operatorCue: "DATA FLOW" },
  30: { title: "세 번째 구역: 데이터 벡터", brief: "출력·질의·파일·저장소의 단서를 합쳐, 데이터가 신뢰 경계를 넘는 전체 경로를 사건 파일로 완성합니다.", targetTitle: "데이터 벡터 종합", targetBrief: "단일 입력이 여러 시스템 층을 통과할 때 생기는 연쇄 위험을 연결하세요.", operatorCue: "FLOW CORRELATION" },
  31: { title: "다른 분석자의 사건 번호", brief: "현재 작업 공간에 속하지 않는 사건 번호가 응답하는지 확인해야 합니다. 식별자와 소유권의 차이를 추적합니다.", targetTitle: "객체 소유권 경계", targetBrief: "번호를 알고 있다는 사실이 접근 권한으로 바뀌는 경로를 조사하세요.", operatorCue: "IDOR" },
  32: { title: "디렉터리의 숨은 인물", brief: "목록에는 보이지 않는 구성원 기록이 상세 조회로 남아 있을 수 있습니다. 필터와 인가가 분리되는 지점을 찾습니다.", targetTitle: "구성원 조회 경계", targetBrief: "보이지 않는 정보가 정말 접근 불가한지 세부 요청 경로를 확인하세요.", operatorCue: "OBJECT AUTHZ" },
  33: { title: "승인 이전의 자원 조회", brief: "보호된 작업 요청에서 권한을 확인하기 전에 자원을 읽는 순서 문제가 관찰됐습니다. 처리 순서를 추적합니다.", targetTitle: "인가 순서 조사", targetBrief: "인증·인가·자원 조회가 뒤바뀔 때 어떤 정보가 먼저 노출되는지 확인하세요.", operatorCue: "AUTHZ ORDER" },
  34: { title: "변경된 역할, 남은 세션", brief: "권한이 회수된 계정이 기존 세션을 통해 작업을 이어갈 수 있다는 신호가 포착됐습니다. 최신 권한 확인을 조사합니다.", targetTitle: "세션 권한 재검증", targetBrief: "서버 상태가 바뀐 뒤 세션 표식만 믿는 경로를 찾아내세요.", operatorCue: "STALE SESSION" },
  35: { title: "서명 없는 토큰의 그림자", brief: "API 키 관리 화면에서 토큰 형태만 보고 권한을 판단한 흔적이 보입니다. 토큰 검증의 핵심 신호를 분석합니다.", targetTitle: "토큰 검증 워크벤치", targetBrief: "보이는 클레임과 서버가 검증해야 할 서명·만료의 경계를 구분하세요.", operatorCue: "TOKEN VERIFY" },
  36: { title: "API 응답의 과잉 투영", brief: "프로필 API가 화면에 쓰이지 않는 내부 필드까지 전달하고 있습니다. 응답이 넓어지는 지점을 확인합니다.", targetTitle: "응답 필드 최소화", targetBrief: "클라이언트가 요청하지 않은 정보가 응답에 실리는 경로를 조사하세요.", operatorCue: "DATA OVEREXPOSURE" },
  37: { title: "로그인 게이트의 반복 타격", brief: "짧은 시간에 같은 게이트를 두드리는 요청이 급증했습니다. 차단·완화·관찰이 시작되는 지점을 분석합니다.", targetTitle: "인증 게이트 보호", targetBrief: "반복 시도가 서비스 보호 신호를 우회하는지 안전한 환경에서 확인하세요.", operatorCue: "RATE LIMIT" },
  38: { title: "감사 스트림의 비밀값", brief: "활동 기록은 충분해야 하지만 비밀값까지 남기면 또 다른 노출이 됩니다. 추적과 최소화의 균형을 찾습니다.", targetTitle: "감사 기록 정제", targetBrief: "조사에 필요한 이벤트와 기록하면 안 되는 민감 값의 경계를 구분하세요.", operatorCue: "AUDIT HYGIENE" },
  39: { title: "정책 격자의 기본 허용", brief: "일부 역할 매트릭스가 예외 처리에서 기본 허용으로 떨어집니다. 역할·행동·예외의 연결을 분석합니다.", targetTitle: "권한 격자 점검", targetBrief: "최소 권한이 무너지는 예외 경로와 기본 거부 원칙을 확인하세요.", operatorCue: "RBAC MATRIX" },
  40: { title: "네 번째 구역: 권한 경로", brief: "객체·세션·토큰·API에서 수집한 신호를 겹쳐, 권한 검증이 끊기는 경로를 최종 추적합니다.", targetTitle: "권한 경로 종합", targetBrief: "각기 다른 표식이 하나의 인가 공백으로 이어지는 방식을 사건 파일로 정리하세요.", operatorCue: "PRIVILEGE PATH" },
  41: { title: "증거 노트의 오염 방지", brief: "마지막 조사 구역에서는 사실과 가설이 섞인 메모가 사고 대응을 흐릴 수 있습니다. 증거 사슬을 정리합니다.", targetTitle: "증거 체인 정리", targetBrief: "관찰·추정·검증 결과를 분리해 다음 분석자도 재현할 수 있게 만드세요.", operatorCue: "EVIDENCE CHAIN" },
  42: { title: "신호 큐의 우선순위", brief: "여러 알림이 한꺼번에 들어왔고, 모두 같은 위험은 아닙니다. 영향·노출·재현성을 기준으로 첫 조사 대상을 고릅니다.", targetTitle: "신호 우선순위 조정", targetBrief: "잡음 속에서 실제 침해 경로가 될 수 있는 신호를 분리하세요.", operatorCue: "TRIAGE SIGNAL" },
  43: { title: "로그인 이후의 빈 경로", brief: "정상 로그인 뒤 자원 접근까지 이어지는 지도에서 인가 확인이 사라진 구간이 발견됐습니다. 연속 흐름을 조사합니다.", targetTitle: "인증 흐름 추적", targetBrief: "로그인 성공 이후에도 반복돼야 하는 권한 확인 지점을 찾아내세요.", operatorCue: "AUTH FLOW" },
  44: { title: "두 번째 출력의 위험", brief: "안전해 보이던 데이터가 보고서 템플릿에서 다시 해석될 조짐이 있습니다. 저장 후 재출력되는 경로를 분석합니다.", targetTitle: "재출력 경계 감시", targetBrief: "한 번 저장된 데이터가 다른 문맥에서 다시 위험해지는 순간을 확인하세요.", operatorCue: "SECOND-ORDER OUTPUT" },
  45: { title: "파일 전달선의 끊긴 고리", brief: "업로드부터 배포까지 이어지는 전달선 중 한 단계가 이전 검증을 잊고 있습니다. 파일의 전 생명주기를 추적합니다.", targetTitle: "파일 전달 사슬", targetBrief: "수신·저장·검토·제공 중 어느 단계에서 권한과 검증이 사라지는지 찾으세요.", operatorCue: "FILE LIFECYCLE" },
  46: { title: "계약 밖의 API 호출", brief: "문서화된 API 계약과 실제 응답 사이에 차이가 발견됐습니다. 입력·권한·응답 투영이 연결되는 경계를 검증합니다.", targetTitle: "API 계약 검증", targetBrief: "요청 스키마를 통과한 뒤에도 서버가 반드시 확인해야 할 항목을 조사하세요.", operatorCue: "API CONTRACT" },
  47: { title: "권한 공백의 책임 있는 보고", brief: "발견한 인가 문제를 다른 사람이 재현할 수 있게 남기되, 실제 시스템에 피해를 주지 않는 사건 보고를 구성합니다.", targetTitle: "발견 보고 워크스페이스", targetBrief: "영향·근거·방어 권고를 분리해 검증 가능한 사건 파일을 준비하세요.", operatorCue: "RESPONSIBLE DISCLOSURE" },
  48: { title: "방어 계층의 공명", brief: "하나의 입력 문제를 막는 데 검증·인가·응답 절제가 함께 필요합니다. 서로 겹치는 방어 층을 비교합니다.", targetTitle: "방어 계층 매핑", targetBrief: "단일 통제가 놓치는 경로를 보완하는 보호 조합을 확인하세요.", operatorCue: "DEFENSE IN DEPTH" },
  49: { title: "결론을 넘지 않는 증거", brief: "최종 보고 직전, 강한 가설이 확인된 사실처럼 기록될 위험이 있습니다. 증거 범위와 불확실성을 다시 점검합니다.", targetTitle: "증거 범위 검증", targetBrief: "회수한 단서가 뒷받침하는 결론의 한계를 명확히 구분하세요.", operatorCue: "EVIDENCE SCOPE" },
  50: { title: "최종 노드: 경계 붕괴 연쇄", brief: "입력·권한·응답의 작은 공백이 연결되면 하나의 침해 경로가 됩니다. 마지막 사건 파일에서 방어 우선순위를 완성하세요.", targetTitle: "경계 붕괴 최종 분석", targetBrief: "여러 약한 신호를 하나의 공격 사슬로 연결하고, 가장 먼저 끊어야 할 방어선을 확인하세요.", operatorCue: "FINAL CHAIN" },
};

export const caseNarrativeForNode = (id: number): CaseNarrative | null => narratives[id] ?? null;
export const caseNarratives = narratives;
