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
