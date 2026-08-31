# 체크포인트 2026-08-31, 위키링크 경로화 직전

`content/brain/knowledge/` 전체의 작업 전 상태다.

지식 노트의 위키링크 1507개가 한글 제목(별칭)을 가리키고 있었다. 별칭은 사이트 최상위에 meta refresh 스텁 파일을 만드는데, SPA 라우터는 body만 갈아끼우므로 그 refresh가 걸리지 않는다. 그래서 `[[유니온 파인드]]`를 누르면 `/유니온-파인드`라는 빈 페이지에서 멈췄다.

되돌리려면:

```bash
cd "$(git rev-parse --show-toplevel)"
rm -rf content/brain/knowledge
cp -R tooling/brain/checkpoint/2026-08-31-wikilinks/knowledge content/brain/knowledge
npx quartz build
```

고친 방식은 표시명은 그대로 두고 대상만 파일명으로 바꾼 것이다.
`[[유니온 파인드]]` -> `[[union-find|유니온 파인드]]`
파일명이 겹치는 array, graph, stack, schema 네 개는 전체 경로를 썼다.
