import { practiceTrackForNode } from "./practice-workspace";

export type ProblemBrief = { label: string; action: string; successCondition: string; practiceInput: string };

const briefs: Record<NonNullable<ReturnType<typeof practiceTrackForNode>>, ProblemBrief> = {
  surface: { label: "SOURCE & STORAGE", action: "SANDBOX INPUT에 `role=admin`을 입력하고 실행합니다.", successCondition: "브라우저 값은 바뀌어도 서버 권한 판단에는 재검증이 필요하다는 응답을 확인합니다.", practiceInput: "role=admin" },
  request: { label: "REQUEST REPLAY", action: "GET 또는 POST와 함께 `topic=session`을 입력하고 실행합니다.", successCondition: "요청 방식과 무관하게 서버 검증이 필요하다는 응답을 확인합니다.", practiceInput: "topic=session" },
  input: { label: "OUTPUT SANDBOX", action: "SANDBOX INPUT에 `<sample>`을 입력하고 실행합니다.", successCondition: "원본 입력과 텍스트로 안전하게 처리된 출력의 차이를 확인합니다.", practiceInput: "<sample>" },
  access: { label: "AUTHORIZATION GATE", action: "리소스 식별자 `104`를 입력하고 실행합니다.", successCondition: "식별자를 알아도 권한이 없으면 거부되어야 한다는 응답을 확인합니다.", practiceInput: "104" },
  report: { label: "EVIDENCE NOTEBOARD", action: "SANDBOX INPUT에 `fact: response header`를 작성하고 실행합니다.", successCondition: "사실·가설·방어 권고를 분리한 분석 기록 형식을 확인합니다.", practiceInput: "fact: response header" },
};

export const practiceGuideForNode = (id: number) => {
  const track = practiceTrackForNode(id);
  return track ? briefs[track] : null;
};
