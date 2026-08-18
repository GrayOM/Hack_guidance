/**
 * Design reminder — Signal Room Console: problem-board metadata, not a curriculum.
 */
export type ProblemStatus = "available" | "locked" | "complete";

export type LabProblem = {
  id: number;
  level: number;
  title: string;
  shortTitle: string;
  category: string;
  difficulty: "Foundation" | "Core" | "Practice" | "Final";
  duration: string;
  goal: string;
  observation: string[];
  hints: string[];
  outcome: string;
  source?: "existing";
};

const levelContent = [
  {
    title: "Web Observation",
    label: "웹 관찰 기초",
    description: "브라우저에 표시된 정보와 숨겨진 단서를 읽는 법을 익힙니다.",
    categories: ["Page source", "Parameters", "Cookies", "Headers", "Forms"],
  },
  {
    title: "Request Logic",
    label: "요청과 인증",
    description: "요청의 구조와 서버가 상태를 판단하는 방식을 확인합니다.",
    categories: ["GET / POST", "Sessions", "Access control", "Downloads", "Validation"],
  },
  {
    title: "Input Safety",
    label: "입력과 출력",
    description: "입력값이 데이터·파일·브라우저 화면으로 이동하는 과정을 분석합니다.",
    categories: ["Output context", "Queries", "Files", "Errors", "Encoding"],
  },
  {
    title: "Access Analysis",
    label: "권한과 API",
    description: "사용자별 데이터와 API 응답의 경계를 점검합니다.",
    categories: ["IDOR", "Tokens", "APIs", "Rate limits", "Metadata"],
  },
  {
    title: "Applied Review",
    label: "종합 분석",
    description: "여러 관찰 결과를 연결해 근거 있는 결론을 작성합니다.",
    categories: ["Recon", "Chaining", "Reporting", "Defense", "Final review"],
  },
];

const plannedTitles = [
  ["페이지 주석 찾기", "숨은 입력값 확인", "주소에 담긴 값", "쿠키의 역할", "응답 헤더 읽기", "폼 데이터 비교", "리디렉션 추적", "캐시의 흔적", "robots.txt 확인", "Surface Scan Final"],
  ["GET 요청 분석", "POST 요청 분석", "인증 상태 구분", "세션 유지 시간", "권한 검증이 빠진 화면", "다운로드 응답 분석", "파일 이름 검증", "입력 형식 검증", "오류 응답 읽기", "Access Vector Final"],
  ["출력 위치와 문맥", "안전한 인코딩", "검색 요청 구조", "질의 조건식", "파일 경로 처리", "업로드 검증", "오류 정보 노출", "브라우저 저장소", "입력 흐름 검토", "Input Vector Final"],
  ["리소스 식별자 확인", "사용자별 데이터", "권한 검증 흐름", "세션 상태 재확인", "토큰 구조 읽기", "API 응답 필드", "요청 빈도 제한", "감사 로그", "접근 정책 검토", "Privilege Path Final"],
  ["정보 수집 정리", "단서 우선순위", "인증 흐름 검토", "입력과 출력 연결", "파일 처리 검토", "API 경계 분석", "권한 검증 결과 보고", "방어 방법 비교", "최종 분석 준비", "Final Grid Clear"],
];

const existing: Record<number, Partial<LabProblem>> = {
  1: {
    title: "브라우저에서 이루어지는 인증 확인",
    shortTitle: "인증 확인",
    category: "Page source",
    goal: "로그인 화면에서 인증 판단이 어디에서 이루어지는지 확인합니다.",
    observation: ["페이지 소스에 포함된 스크립트", "입력값을 비교하는 위치", "브라우저와 서버의 역할"],
    hints: ["로그인 버튼이 눌린 뒤 실행되는 코드를 살펴보세요.", "브라우저에 전달된 코드는 누구나 읽을 수 있습니다.", "인증 판단은 어느 환경에서 수행되어야 할까요?"],
    outcome: "클라이언트 측 코드만으로 인증을 신뢰하면 안 되는 이유를 설명할 수 있습니다.",
    source: "existing",
  },
  2: {
    title: "다운로드 기능에서 발생하는 소스 코드 노출",
    shortTitle: "파일 응답",
    category: "Downloads",
    goal: "다운로드 기능이 응답 내용과 파일 정보를 어떻게 제공하는지 확인합니다.",
    observation: ["다운로드 링크의 파라미터", "응답 헤더의 파일명", "서버가 노출하는 코드 범위"],
    hints: ["링크를 눌렀을 때 주소와 응답 형식을 비교해 보세요.", "파일 다운로드는 HTTP 응답의 한 형태입니다.", "서버 코드가 노출되면 어떤 정보가 드러날 수 있을까요?"],
    outcome: "파일 처리 기능에서 노출 범위를 제한해야 하는 이유를 설명할 수 있습니다.",
    source: "existing",
  },
  3: {
    title: "쿠키 기반 권한 확인",
    shortTitle: "쿠키 권한",
    category: "Cookies",
    goal: "브라우저 쿠키와 서버 측 권한 검증의 관계를 관찰합니다.",
    observation: ["브라우저에 저장된 user 값", "권한에 따라 달라지는 응답", "신뢰 경계"],
    hints: ["로그인 후 브라우저에 저장된 값을 확인하세요.", "쿠키는 클라이언트에 존재하는 데이터입니다.", "서버는 권한을 어떤 근거로 검증해야 할까요?"],
    outcome: "클라이언트가 보낸 역할 값만으로 권한을 판단하면 안 되는 이유를 설명할 수 있습니다.",
    source: "existing",
  },
  4: {
    title: "메시지가 출력되는 위치",
    shortTitle: "출력 위치",
    category: "Output context",
    goal: "입력값이 브라우저 화면의 어느 문맥에 출력되는지 확인합니다.",
    observation: ["입력값을 받는 지점", "출력되는 HTML 또는 스크립트 문맥", "인코딩 필요성"],
    hints: ["입력값이 화면에 보이는 위치를 먼저 찾으세요.", "같은 문자열도 HTML과 JavaScript 안에서는 다르게 해석됩니다.", "출력 전에 문맥에 맞는 처리 과정이 필요한지 확인하세요."],
    outcome: "출력 문맥별 인코딩의 필요성을 설명할 수 있습니다.",
    source: "existing",
  },
  5: {
    title: "입력 검증과 정규표현식",
    shortTitle: "입력 검증",
    category: "Validation",
    goal: "형식 검증이 무엇을 확인하고 무엇을 보장하지 않는지 구분합니다.",
    observation: ["입력 형식 조건", "검증 후 출력 경로", "클라이언트·서버 검증의 차이"],
    hints: ["입력값이 어떤 형태인지 확인하는 규칙을 읽어 보세요.", "형식이 맞는 것과 안전한 것은 같은 의미가 아닙니다.", "서버에서도 같은 검증이 필요한지 생각해 보세요."],
    outcome: "형식 검증, 범위 검증, 문맥별 처리를 구분할 수 있습니다.",
    source: "existing",
  },
};

export const levels = levelContent.map((level, index) => ({
  id: index + 1,
  ...level,
  range: `${index * 10 + 1}–${index * 10 + 10}`,
}));

export const problems: LabProblem[] = plannedTitles.flatMap((titles, levelIndex) =>
  titles.map((title, problemIndex) => {
    const id = levelIndex * 10 + problemIndex + 1;
    const isFinalNode = problemIndex === 9;
    const base = {
      id,
      level: levelIndex + 1,
      title,
      shortTitle: title,
      category: levelContent[levelIndex].categories[Math.min(problemIndex, 4)],
      difficulty: isFinalNode ? "Final" : problemIndex > 5 ? "Practice" : problemIndex > 2 ? "Core" : "Foundation",
      duration: isFinalNode ? "20 min" : problemIndex > 5 ? "15 min" : "10 min",
      goal: `${levelContent[levelIndex].label}에서 필요한 관찰 흐름을 연습합니다.`,
      observation: ["화면에 드러난 정보", "요청과 응답의 변화", "서버가 신뢰하는 값"],
      hints: ["우선 화면에서 제공되는 정보를 분류해 보세요.", "값이 이동하는 경로를 비교해 보세요.", "안전한 설계라면 서버가 무엇을 검증해야 하는지 생각해 보세요."],
      outcome: `${levelContent[levelIndex].label}의 핵심 분석 기준을 설명할 수 있습니다.`,
    } satisfies LabProblem;
    return { ...base, ...existing[id] } as LabProblem;
  }),
);

export const getProblem = (id: number) => problems.find((problem) => problem.id === id) ?? problems[0];
