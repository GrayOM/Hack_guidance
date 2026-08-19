# 무료 배포 조사 기록

이 문서는 Hack Guidance를 외부에서 가능한 한 **월 비용 0원**으로 운영하기 위한 서비스 후보의 공식 한도를 기록합니다. 무료 티어는 공급자의 정책 변화, 과도한 사용, 계정 상태에 따라 제한될 수 있으므로 실제 배포 직전에 다시 확인합니다.

## 1차 확인 결과

| 후보 | 확인된 무료 한도 | Hack Guidance 적합성 | 판단 |
| --- | --- | --- | --- |
| Cloudflare Workers + Pages Functions + D1 | Workers/Pages Functions 요청은 하루 100,000회, Worker 호출당 CPU 시간은 10ms이다. D1은 하루 읽기 500만 행, 쓰기 10만 행, 총 저장소 5GB를 제공한다. | 정적 웹과 API, 풀이 기록·랭킹·수료 데이터를 단일 공급자에서 처리할 수 있다. 단, 현재 Express·MySQL 코드는 Workers·SQLite(D1) 방식으로 전환해야 한다. | 비용 0원 우선안으로 검토한다. |
| Render Free Web Service | 워크스페이스당 월 750 인스턴스 시간이 제공되며 유휴 서비스는 내려간다. 무료 한도를 소진하면 다음 달까지 서비스가 중지된다. | 현재 Node/Express 서버를 거의 그대로 실행할 수 있으나, 데이터베이스·인증을 별도로 마련해야 하고 즉시 응답이 필요한 공개 학습 서비스에는 콜드 스타트가 불리하다. | 최소 코드 변경 대안으로 유지한다. |
| Cloudflare Pages + Supabase | Pages는 정적 호스팅, Supabase Free는 500MB Postgres와 월간 활성 사용자 50,000명을 제공한다. Edge Function은 256MB 메모리·요청당 2초 CPU·150초 활성 시간 한도다. | React 정적 프런트엔드와 OAuth·진행 기록·랭킹·서버 전용 플래그 검증을 명확히 분리할 수 있다. 현재 Express/tRPC·MySQL 의존성은 Supabase Auth·Postgres·Edge Functions로 이전해야 한다. | 구현 난이도와 무료 운영 안정성의 균형이 가장 좋은 권장안으로 검토한다. |

## 확인 출처

Cloudflare는 Workers Free에서 하루 100,000 요청과 호출당 10ms CPU 시간을 명시하며, Pages Functions 요청도 같은 Workers 무료 요청 한도를 공유한다고 설명합니다.[1][2] D1 Free는 하루 500만 읽기 행, 10만 쓰기 행, 총 5GB 저장소를 제공하지만 무료 한도 초과 시 해당 일의 쿼리가 실패합니다.[3][4]

Render Free는 워크스페이스당 월 750 인스턴스 시간을 제공하고, 모두 소진되면 무료 웹 서비스가 다음 달까지 중지된다고 명시합니다.[5]

Supabase Free는 프로젝트당 500MB 데이터베이스, 월간 활성 사용자 50,000명, 1GB 파일 저장소를 제공하지만, 무료 프로젝트는 1주일 동안 활동이 없으면 일시 중지될 수 있습니다.[6] Edge Functions는 무료 플랜에서 256MB 메모리, 요청당 2초 CPU 시간과 150초 활성 시간을 제공합니다.[7]

## References

[1]: https://developers.cloudflare.com/workers/platform/pricing/ "Cloudflare Workers pricing"
[2]: https://developers.cloudflare.com/pages/functions/pricing/ "Cloudflare Pages Functions pricing"
[3]: https://developers.cloudflare.com/d1/platform/pricing/ "Cloudflare D1 pricing"
[4]: https://developers.cloudflare.com/d1/platform/limits/ "Cloudflare D1 limits"
[5]: https://render.com/docs/free "Render free instances"
[6]: https://supabase.com/pricing "Supabase pricing"
[7]: https://supabase.com/docs/guides/functions/limits "Supabase Edge Functions limits"
