---
title: 브라우저 렌더링 과정
aliases:
  - 브라우저 렌더링 과정
  - Render Tree
  - Layout
  - Paint
  - 합성 단계
  - will-change
tags:
  - client
origin:
  verified: 2026-08-30
---

웹 브라우저는 HTML과 CSS를 2D 그래픽으로 바꿔주는 프로그램이고, 그림을 그리는 순서가 정해져 있다. 이 순서를 알면 왜 어떤 애니메이션은 부드럽고 어떤 것은 버벅이는지가 설명된다.

## 네 단계와 다시 그리는 범위

| 단계           | 무엇                        | 여기서 처리되는 속성                   |
| -------------- | --------------------------- | -------------------------------------- |
| 1. Render Tree | HTML과 CSS를 읽어 정리한다  | 그리기 전 참고 자료라 없다             |
| 2. Layout      | 박스를 그리고 위치를 잡는다 | `margin`, `padding`, `width`, `height` |
| 3. Paint       | 픽셀에 색을 입힌다          | `background-color`                     |
| 4. Composite   | 합성 처리                   | `transform`, `opacity`                 |

속성을 바꾸면 그 단계부터 아래가 전부 다시 실행된다. `margin`을 바꾸면 2단계 Layout부터 다시 도니 3, 4단계도 함께 다시 돌고, `transform`을 바꾸면 4단계만 다시 돈다. 애니메이션은 초당 수십 번 값을 바꾸므로 이 차이가 그대로 성능 차이가 된다. 위치를 옮기는 애니메이션은 `margin`이나 `left`가 아니라 `transform`으로 주는 이유다.

이유가 하나 더 있다. 브라우저는 원래 HTML과 CSS 처리든 자바스크립트 실행이든 스레드 하나만 쓰는데, Composite 단계의 속성들은 다른 스레드에서 처리한다. 자바스크립트가 아무리 많아도 `transform` 애니메이션은 그것에 방해받지 않는다. 자바스크립트가 많은 사이트일수록 애니메이션을 `transform`으로 줘야 한다.

## will-change

여기서 더 짜낼 수단도 있다. `will-change`로 바뀔 속성을 미리 알려주면 브라우저가 미리 렌더링해둔다.

```css
.box {
  will-change: transform;
}
```

애니메이션이 버벅일 때만 쓴다. 많이 쓰면 오히려 느려진다.

## GPU 하드웨어 가속

CPU만으로 부족하면 GPU를 쓰는 하드웨어 가속이 있다.

```css
.box {
  transform: translate3d(0, 0, 0);
}
```

3D 이동은 GPU가 연산한다. 아무 데도 움직이지 않는 3D 이동 명령을 넣어두면 그 요소의 `transform`이 GPU로 처리되게 만드는 요령이다.

## 관련

- [[레이아웃]]
- [[애니메이션]]
- [[DOM과 이벤트]]

## 출처

- [[brain/lectures/frontend/apple-html/all-in-one-last|코딩애플 HTML/CSS - 브라우저가 그림 그리는 순서, 애니메이션 성능]]
