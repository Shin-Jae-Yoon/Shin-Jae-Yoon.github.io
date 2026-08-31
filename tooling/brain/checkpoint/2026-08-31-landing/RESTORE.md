# 체크포인트 2026-08-31, 소개 페이지 작업 직전

`content/brain/` 아래 index 다섯 개의 작업 전 상태다.

되돌리려면 이 디렉터리에서 원래 자리로 복사한다.

```bash
cd "$(git rev-parse --show-toplevel)"
CK=tooling/brain/checkpoint/2026-08-31-landing
cp "$CK/index.md"           content/brain/index.md
cp "$CK/books/index.md"     content/brain/books/index.md
cp "$CK/lectures/index.md"  content/brain/lectures/index.md
cp "$CK/notes/index.md"     content/brain/notes/index.md
cp "$CK/knowledge/index.md" content/brain/knowledge/index.md
npx quartz build
```

일부만 되돌려도 된다. 다섯 파일은 서로 독립이다.

작업 전 상태에서는 다섯 개 모두 `title` 한 줄이나 한 문장짜리 껍데기였고, 도서와 강의의 소개 페이지로 가는 길이 브레드크럼뿐이었다.
