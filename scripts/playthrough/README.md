# 50노드 플레이스루

세 edge function을 Node에서 띄우고 1번부터 50번까지 **실제로 풀어 본다.** 흔적은 정답표를
읽는 것이 아니라 조작자가 얻는 경로 그대로 얻는다. 정적 파일에서 읽고, 채널 함수를 호출하고,
모의 응용프로그램을 조작한다.

단위 테스트가 잡지 못하는 것을 잡는다. 테스트는 각 조각이 스스로 일관적인지 보지만, 이것은
브라우저가 만드는 값과 서버가 기대하는 값이 **실제로 같은지**를 본다. 흔적 발급이 노드 이름
대신 번호로 표를 찾아 모든 토큰을 null로 돌려주던 결함이 이 방식으로 드러났다. 단위 테스트는
전부 통과하고 있었다.

```
node scripts/playthrough/run.mjs
```

사전 준비: 세 함수를 전사해 둔다.

```
mkdir -p /tmp/hg-play/src
for f in learning/index black-trace/index range/index range/sql; do
  sed 's#from "./sql.ts"#from "./range-sql"#' supabase/functions/$f.ts \
    > /tmp/hg-play/src/$(echo $f | tr '/' '-').ts
done
npx tsc /tmp/hg-play/src/*.ts --target es2022 --module es2022 \
  --moduleResolution bundler --outDir /tmp/hg-play --skipLibCheck
```

`db.mjs`가 Postgres 대신 선다. 중요한 제약은 그대로 둔다. 단계 상한, 사용자별 기본 키,
원자적 쿠폰 반영, 수료증 요건. Postgres를 다시 시험하려는 것이 아니라 **배포되는 함수**를
그대로 돌려 보려는 것이다.

## 브라우저 전수 검사

플레이스루는 서버가 기대하는 값과 브라우저가 만드는 값이 같은지를 본다. 그것으로는 **계기가
실제로 화면에 값을 심는지**를 알 수 없다. `browser-sweep.mjs`가 그 부분을 본다. 심는 방식
스물세 개를 전부 열어 보고, 흔적이 그 노드가 말한 자리에 실제로 있는지 확인한다.

- DOM·저장소 노드: 마크업·입력 칸·shadow DOM·쿠키·localStorage·sessionStorage·IndexedDB·주소창
  가운데 어딘가에서 찾아내고, 화면에 그대로 보이지는 않아야 한다.
- 해독 노드: 평문이 **없어야** 하고, 동시에 화면의 값이 되돌리면 평문이 **되어야** 한다.
  평문이 없다는 조건만 보면 빈 화면도 통과하므로 두 가지를 함께 본다.

```
npm run dev   # VITE_SUPABASE_URL=https://stand-in.test 로 띄운다
node scripts/playthrough/browser-sweep.mjs
```

노드 화면은 로그인한 요청에만 자료를 받으므로, 검사 중에는 `BlackTraceStage.tsx`의
`isAuthenticated`와 `isOpen`을 잠시 열어 두어야 한다. 되돌릴 때는 `git checkout`이 아니라
따로 떠 둔 사본으로 되돌린다. 아직 커밋하지 않은 다른 변경까지 함께 날아간 적이 두 번 있다.
