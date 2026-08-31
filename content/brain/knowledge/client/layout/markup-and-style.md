---
title: 마크업과 스타일
aliases:
  - 마크업과 스타일
  - HTML 태그
  - CSS 셀렉터
  - 폼 요소
  - nth-child
tags:
  - client
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

HTML은 문서의 구조를 나타내고 CSS는 그 구조에서 어디에 어떤 모양을 줄지 정한다. 태그로 "이것은 제목", "이것은 목록"을 표시하는 것이지 모양을 정하는 것이 아니다.

## 폼 요소의 name과 label

사용자 입력을 받는 폼 요소에는 서버로 보낼 때 필요한 규칙이 있다. `input`의 `name` 속성은 서버로 보낼 때의 키가 되므로 없으면 값이 전송되지 않는다. `label`은 `for` 속성을 `input`의 `id`와 맞추면 라벨을 눌러도 입력창이 선택되고, 접근성에도 필요하다. `select`는 선택 목록을 만들고 `option`으로 항목을 채운다.

## 후손과 자식을 가르는 셀렉터

셀렉터는 어느 요소에 스타일을 줄지 고르는 문법이다. 공백과 꺾쇠의 차이부터 본다.

```css
.navbar li span   /* 후손 전부 */
.navbar li > span /* 바로 아래 자식만 */
```

꺾쇠를 네다섯 개 이상 연달아 쓰는 것은 권장되지 않는다. 구조가 조금만 바뀌어도 깨져서 버그의 원인이 된다.

## nth-child

`nth-child`는 여러 요소 중 n번째를 고른다.

```css
td:nth-child(2)       /* 두 번째 td만 */
td:nth-child(n + 2)   /* 두 번째 이후 전부 */
```

## 의사 클래스와 의사 요소

콜론 개수로 갈리는 것도 있다. pseudo-class는 콜론 하나로 요소의 상태를 고르고 `:hover`, `:focus`, `:checked`, `:first-child`가 그것이다. pseudo-element는 콜론 둘로 요소의 일부나 가상의 부분을 고르며 `::before`, `::after`, `::first-letter`가 있다. `::before`와 `::after`는 HTML에 없는 요소를 CSS로 만들어내는 것이라 아이콘이나 장식을 마크업 없이 넣을 때 쓴다.

## 클래스 작명법

CSS가 길어지면 이름 짓기가 문제가 된다. OOCSS(Object Oriented CSS)는 구조와 겉모습을 분리해, 반복되는 스타일을 재사용 가능한 클래스로 빼서 조합한다.

BEM(Block, Element, Modifier)은 이름에 관계를 담는다.

```
.card            /* Block */
.card__title     /* Element */
.card--dark      /* Modifier */
```

클래스 이름만 보고 어디 속한 무엇인지 알 수 있다. 셀렉터를 깊게 중첩하지 않아도 되어 위의 꺾쇠 문제도 피한다.

## 스타일 도구

Sass는 CSS를 프로그래밍처럼 쓰게 해준다. 변수를 두면 색이나 크기를 한곳에서 관리할 수 있고 Nesting으로 셀렉터를 중첩하면 구조가 드러난다. 반복되는 코드는 `@mixin`으로 한 단어에 묶고, 이미 있는 클래스는 `@extend`로 확장하며, 다른 파일의 내용은 `@use`로 가져온다.

normalize는 브라우저마다 다른 기본 스타일을 맞춰준다. 초기 설정으로 깔아두면 편하다.

Shadow DOM은 브라우저가 기본 제공하는 `input`이나 `video` 같은 요소의 내부 구조다. 일반 CSS로는 스타일을 줄 수 없어서 전용 의사 요소를 써야 한다.

## 참고

`nth-child`에는 원본에 없는 `odd`와 `even` 키워드가 있어서 표의 줄무늬를 만들 때 쓴다. MDN은 odd를 "형제 중 순서가 홀수인 요소, 곧 1, 3, 5"로, even을 "순서가 짝수인 요소, 곧 2, 4, 6"으로 적고, 각각 `2n+1`과 `2n`과 같다고 덧붙인다. [MDN, :nth-child()](https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child)

## 관련

- [[box-model|레이아웃]]
- [[rendering|브라우저 렌더링 과정]]

## 출처

- [[brain/lectures/frontend/apple-html/all-in-one-basic|코딩애플 HTML/CSS 기초 - Selector, 작명법]]
- [[brain/lectures/frontend/apple-html/all-in-one-last|코딩애플 HTML/CSS 심화 - Pseudo-element, Shadow DOM, Sass]]
