---
title: 애니메이션
aliases:
  - 애니메이션
  - transition
  - keyframes
  - overflow 속성
tags:
  - client
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

요소의 상태가 바뀔 때 그 사이를 CSS가 알아서 채우게 하는 것. 중간 값을 직접 계산하지 않아도 된다는 것이 이 기능의 전부다.

## transition으로 두 상태 잇기

한 방향으로 흐르는 one-way 애니메이션은 이 순서로 만든다.

1. 시작 스타일을 만든다
2. 최종 스타일을 만든다
3. 언제 최종 스타일로 변할지 정한다 (`:hover` 등)
4. `transition`으로 애니메이션 속성을 준다

```css
.box {
  transition-delay: 1s; /* 시작 전 딜레이 */
  transition-duration: 0.5s; /* 작동 속도 */
  transition-property: opacity; /* 어떤 속성에 적용할지 */
  transition-timing-function: ease-in; /* 속도 그래프 */
}
```

## 여러 단계를 만드는 @keyframes

`transition`은 두 상태 사이만 다룬다. 여러 단계를 거치는 애니메이션은 `@keyframes`로 만들고, 진행도를 퍼센트로 나눠 각 시점의 스타일을 적는다.

```css
@keyframes 이름 {
  0% {
  }
  50% {
  }
  100% {
  }
}

.box:hover {
  animation-name: 이름;
  animation-duration: 1s;
}
```

## 넘치는 내용을 다루는 overflow

`overflow`는 박스의 폭이나 높이를 넘치는 내부 요소를 어떻게 처리할지 정하는 속성이라 애니메이션과 함께 자주 쓰인다. `visible`은 넘치는 부분을 그대로 보여주고 `hidden`은 숨기며 `scroll`은 넘치는 요소를 보기 위한 스크롤바를 만든다. 캐러셀처럼 옆으로 미는 애니메이션에는 `overflow: hidden`이 필수다. 없으면 화면 밖에 있어야 할 요소가 다 보인다.

## 크롬 개발자 도구의 Animations 탭

다른 사이트의 애니메이션은 크롬 개발자 도구로 뜯어볼 수 있다. 요소를 선택하고 점 세 개에서 More tools의 Animations 탭을 열면 어떤 속성이 얼마 동안 어떻게 변하는지 보여준다.

## transform과 opacity를 쓰는 이유

무엇을 애니메이션하느냐에서 성능이 갈린다. `margin`이나 `left`가 아니라 `transform`과 `opacity`를 쓴다. 그 이유는 [[rendering|브라우저 렌더링 과정]]에 있다.

## 참고

`transition-property`를 지정하지 않으면 바뀌는 모든 속성에 적용된다. 초깃값이 `all`이라서 그렇고, 의도하지 않은 속성까지 애니메이션되므로 명시하는 편이 낫다. [MDN, transition-property](https://developer.mozilla.org/en-US/docs/Web/CSS/transition-property)

`overflow`의 초깃값은 `visible`이고, 원본에 나오지 않는 네 번째 값 `auto`가 있다. MDN은 auto를 "`scroll`과 달리 내용이 넘칠 때에만 스크롤바를 보여준다"고 적는다. 넘치지 않을 때 스크롤바 자리를 비워두지 않아 캐러셀 바깥의 일반 스크롤 영역에는 이쪽이 맞는다. [MDN, overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow)

## 관련

- [[rendering|브라우저 렌더링 과정]]
- [[box-model|레이아웃]]

## 출처

- [[brain/lectures/frontend/apple-html/all-in-one-mid|코딩애플 HTML/CSS 중급 - 애니메이션 만드는 원리]]
- [[brain/lectures/frontend/apple-html/all-in-one-last|코딩애플 HTML/CSS 심화 - @keyframes]]
