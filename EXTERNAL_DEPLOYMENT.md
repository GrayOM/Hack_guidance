# Hack Guidance 무료 외부 배포 전환안

## 권장 구성: GitHub Pages + Supabase Free

Hack Guidance에는 **GitHub Pages의 정적 프런트엔드**와 **Supabase Free의 Auth·Postgres·Edge Function** 조합을 권장합니다. 현재 서비스는 대용량 파일·장시간 작업·상시 프로세스가 필요하지 않고, 플래그 검증은 서버 전용 함수에서 짧게 처리하면 되므로 이 구성이 가장 적은 운영비로 보안 경계를 유지합니다.

| 계층 | 권장 서비스 | 무료 한도·역할 | 전환 이유 |
| --- | --- | --- | --- |
| 프런트엔드 | GitHub Pages | 공개 저장소의 정적 사이트를 GitHub Actions로 배포한다. | 기존 `GrayOM/Hack_guidance` 공개 저장소와 직접 연동한다. |
| 인증·DB | Supabase Free | 500MB Postgres, 월간 활성 사용자 50,000명, 1GB 파일 저장소, 무료 프로젝트 2개가 제공된다. | 회원·진행 기록·랭킹·수료 기록을 관리한다. |
| 비밀 검증 API | Supabase Edge Functions | 월 500,000회 호출, 256MB 메모리, 요청당 2초 CPU 시간이 제공된다. | 플래그 맵과 수료 발급 로직을 브라우저에서 분리한다. |
| 보안 | Supabase RLS + Edge Function 비밀 | 브라우저에는 읽기 권한만 주고, 풀이 기록·수료 발급은 서버 전용 함수로만 변경한다. | 점수·랭킹·수료 조작을 줄인다. |

> **비용 0원은 한도 내 사용을 의미합니다.** Supabase Free 프로젝트는 1주일 비활성 후 일시 중지될 수 있으며, 무료 한도 정책도 서비스 제공자가 변경할 수 있습니다. 학교 과제·포트폴리오·초기 공개 서비스에는 적합하지만, 무중단 상용 서비스의 보장은 아닙니다.[1] [2]

## 준비된 전환 패키지

이 저장소에는 외부 전환에 필요한 다음 파일을 추가했습니다.

| 파일 | 역할 |
| --- | --- |
| `supabase/migrations/20260819000000_hack_guidance.sql` | Auth 사용자 프로필, 풀이 기록, 수료 기록, 원자적 제출 제한·풀이 기록·수료 발급 SQL 함수, 공개 랭킹·검증 전용 뷰, RLS 정책을 생성한다. |
| `supabase/migrations/20260819000001_harden_hg_security.sql` | `hg_` 보안 정의 함수의 직접 호출 권한을 차단하고, 랭킹·수료 검증 뷰를 service-role Edge Function 전용으로 제한한다. |
| `supabase/functions/learning/index.ts` | 서버 전용 플래그 맵으로 제출을 검증하고, 제출 제한·진행·랭킹·수료 기록 API를 처리한다. |
| `.github/workflows/deploy-pages.yml` | main 푸시 시 GitHub Actions로 정적 앱을 빌드하고 GitHub Pages에 배포한다. |
| `.env.github-pages.example` | GitHub Pages 정적 빌드에서 사용할 공개 Supabase URL·Publishable Key·로그인 방식 예시를 제공한다. |

외부 정적 빌드에서는 `usePlatformAuth`와 `useLearningApi`가 Supabase Auth·`hg-learning` Edge Function을 사용합니다. 개발·Manus 빌드에서는 기존 OAuth·tRPC 경로가 유지되므로, 두 배포 경로가 서로의 비밀값을 공유하지 않습니다.

## 배포 순서

### 1. Supabase 프로젝트 만들기

Supabase Auth 설정에서 Site URL을 `https://grayom.github.io/Hack_guidance/`로 지정하고, Redirect URL에 `https://grayom.github.io/Hack_guidance/**`를 추가합니다. 기본 로그인 방식은 별도 OAuth 앱 등록이 필요 없는 **이메일 매직 링크**입니다. GitHub·Google OAuth를 추가로 활성화할 때만 해당 제공자의 OAuth 앱과 Redirect URL을 별도로 등록합니다.

Supabase CLI로 이 저장소를 연결하고 스키마를 적용합니다.

```bash
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

### 2. 새 운영 플래그 만들기

기존 Manus 환경의 플래그를 복사하지 말고, **외부 운영용 새 플래그 50개**를 생성합니다. 실제 JSON 맵은 로컬에서만 준비하고 Supabase Function 비밀값으로 직접 등록합니다. 예시는 의도적으로 저장소에 두지 않습니다.

```bash
supabase secrets set LEARNING_FLAG_MAP='<50개 플래그가 든 JSON>'
supabase secrets set ALLOWED_ORIGIN=https://grayom.github.io
supabase functions deploy hg-learning
```

`LEARNING_FLAG_MAP`에는 정확히 1~50 키와 각 문제별 고엔트로피 `HG{...}` 값을 넣어야 합니다. 이 값은 Pages 환경 변수, 프런트엔드 `VITE_` 변수, GitHub Secrets가 아닌 코드 파일, 이슈, 캡처에 남기지 않습니다.

### 3. GitHub Pages에 정적 앱 배포하기

GitHub 저장소 `GrayOM/Hack_guidance`의 **Settings → Pages → Build and deployment → Source**에서 `GitHub Actions`를 선택합니다. 이후 main 브랜치에 `.github/workflows/deploy-pages.yml`이 푸시되면 `https://grayom.github.io/Hack_guidance/`로 배포됩니다. GitHub App 토큰에 Pages·Actions 설정 권한이 없는 경우에는 이 한 번의 저장소 설정을 소유자가 직접 완료해야 합니다.

```text
VITE_SUPABASE_URL=https://xouowashfoyobgcdtagt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<SUPABASE_PUBLISHABLE_KEY>
VITE_SUPABASE_AUTH_PROVIDER=email
```

Supabase Publishable Key는 RLS가 적용된 브라우저용 공개 키이며, 정적 번들에 포함되어도 됩니다. `SUPABASE_SERVICE_ROLE_KEY`·`LEARNING_FLAG_MAP`는 Function 서버에만 남겨야 합니다.

### 4. 전환 후 확인할 보안 흐름

| 확인 항목 | 기대 결과 |
| --- | --- |
| 브라우저 번들·Pages 환경 변수 | 실제 플래그·Service Role Key 없음 |
| 비로그인 제출 | `401` 거부 |
| 올바르지 않은 플래그 | 풀이 기록·랭킹 변화 없음 |
| 동일 사용자 연속 제출 | 분당 12회 이후 `429` |
| 49개 해결 | 수료 기록 미발급 |
| 50개 해결 | 임의의 수료 검증 코드가 1회 발급되며 재요청은 기존 코드 반환 |
| 공개 랭킹·수료 검증 | 공개 뷰의 허용된 정보만 반환 |

## 현재 Express 버전을 유지해야 하는 경우

Render Free Web Service와 Supabase를 결합하면 기존 Express/tRPC 화면을 더 적게 수정할 수 있습니다. 다만 Render의 무료 웹 서비스는 월 750 인스턴스 시간 제한과 유휴 중지 특성이 있어, 첫 요청이 느릴 수 있고 한도 소진 시 다음 달까지 중지될 수 있습니다.[3] 따라서 비용 0원과 응답 일관성을 우선할 때는 GitHub Pages + Supabase 전환을 기본안으로, 빠른 호환성 검증에는 Render를 보조안으로 둡니다.

## 2026-08-19 배포 검증 현황

현재 `https://grayom.github.io/Hack_guidance/`의 GitHub Pages 배포는 GitHub Actions 실행 성공 상태로 확인되었습니다. 홈페이지와 `/problems` 직접 경로에서 50개 고유 문제 노드가 렌더링되며, `/ranking`은 배포된 Edge Function의 빈 랭킹 응답을 정상적으로 표시합니다. Edge Function에 대한 관리형 검증에서는 `ranking`이 `200 { ranking: [] }`, 존재하지 않는 수료 코드의 `verifyCertificate`가 `200 { certificate: null }`, 비인증 `dashboard`가 `401 { error: "Please sign in" }` JSON 계약을 반환했습니다.

인증된 `dashboard`·`records`·`issueCertificate`의 **성공 응답**은 실제 이메일 매직 링크 세션으로만 완전 종단간 검증할 수 있습니다. 배포된 함수 소스와 프로젝트 회귀 테스트는 해당 계약을 검증하지만, 운영 데이터를 만들지 않고 개인 브라우저 연결도 사용하지 않는 현재 원칙에 따라 이 마지막 시나리오는 최초 실제 사용자의 로그인 이후에 확인합니다. 이 검증은 플래그·서비스 역할 키·개인 학습 데이터를 노출하지 않는 범위에서 수행해야 합니다.

매직 링크 로그인은 정적 빌드에서 Supabase 클라이언트의 `detectSessionInUrl` 옵션으로 콜백 URL의 세션을 처리하도록 구성되어 있습니다. 잘못된 이메일 차단, `signInWithOtp` 호출 값, Supabase 오류, 네트워크 오류 및 성공 안내는 자동화 단위 테스트로 검증했습니다. 다만 실제 메일 수신·링크 클릭·세션 반영은 이메일 소유권을 요구하므로, 개인 브라우저와 실사용자 데이터를 사용하지 않는 현재 검증 범위에서는 실행하지 않았습니다. 운영 확인 시에는 전용 테스트 사서함을 사용해 GitHub Pages 주소로 돌아온 직후 사용자 표시와 개인 진행 화면을 확인합니다.

## References

[1]: https://supabase.com/pricing "Supabase pricing"
[2]: https://supabase.com/docs/guides/platform/billing-on-supabase "Supabase Free plan and quotas"
[3]: https://render.com/docs/free "Render free instances"
[4]: https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations "Supabase Edge Function invocation quotas"
[5]: https://supabase.com/docs/guides/functions/limits "Supabase Edge Function limits"
