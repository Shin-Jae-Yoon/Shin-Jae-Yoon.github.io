---
title: 레이아웃
aliases:
  - 레이아웃
  - 박스 모델
  - margin collapse
  - float
  - flex
  - CSS Grid
  - z-index
tags:
  - client
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

CSS로 요소를 배치하는 방법들. 역사적으로 float에서 flex, grid 순으로 왔고 셋이 지금도 다 남아 있다.

## 네 겹의 박스와 box-sizing

모든 요소는 사각형이고 네 겹으로 이루어진다.

```
margin (바깥 여백)
  border (테두리)
    padding (안쪽 여백)
      content (내용)
```

`width`가 무엇의 너비인지가 문제가 된다. 기본값인 `content-box`에서 `width`는 content 영역만 가리키고 padding과 border는 여기에 영향을 주지 않는다. 그래서 padding을 20px 주면 실제로 차지하는 폭이 그만큼 커진다. `box-sizing: border-box`로 바꾸면 padding과 border까지 포함한 크기가 되어 계산이 직관적이다.

## margin collapse

margin collapse는 박스 두 개가 겹쳐 위쪽 테두리가 맞붙었을 때 두 margin이 하나로 합쳐지는 현상이다. 배경 박스 안에 제목이 하나 들어 있고 제목에 `margin-top`을 줬는데 제목이 아니라 배경 박스가 통째로 내려가는 상황이 대표적이다. 처음 만나면 원인을 찾기 어렵다. 테두리가 맞붙지 않게 부모에 `padding: 1px` 정도만 줘도 사라진다.

## position과 z-index

`position`을 주면 요소를 원래 흐름에서 떼어내 좌표로 옮길 수 있다. 기본값 `static`은 좌표 이동을 받지 않고, `relative`는 원래 자리를 기준으로 움직인다. `absolute`는 position이 `static`이 아닌 가장 가까운 조상을 기준으로 잡고, 그런 조상이 하나도 없으면 문서 전체가 기준이 된다. `fixed`는 화면 자체에 고정되어 스크롤해도 따라오고, `sticky`는 스크롤하다 지정한 위치에서 고정되는 조건부 `fixed`다. sticky는 좌표 속성을 함께 줘야 보이고 부모 박스를 벗어나면 풀린다.

`absolute`로 가운데 정렬하는 요령이 있다. 좌우를 0으로 붙이고 margin을 auto로 두면 남는 공간이 균등하게 나뉜다.

```css
.main-btn {
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
  width: 30%;
}
```

`z-index`는 겹치는 순서를 정하고 숫자가 클수록 앞에 온다.

## 반응형과 media query

화면 크기에 따라 스타일을 바꾸는 것은 media query다. 반응형에서는 브라우저 폭에 비례하는 `vw`, 높이에 비례하는 `vh`, 기본 폰트 크기에 비례하는 `rem`을 쓴다. html의 기본 폰트가 16px이므로 `10rem`은 160px이다. 크기를 전부 rem으로 잡아두면 기본 폰트가 커질 때 전부 같이 커진다. breakpoint는 1200px, 992px, 768px, 576px을 많이 쓰고 네 개를 넘어가면 복잡해진다.

```css
@media screen and (max-width: 1200px) {
  .main-title {
    font-size: 30px;
  }
}
```

## float

요소를 공중에 띄워 좌우로 정렬하는 속성이다. 띄우는 성질 때문에 뒤따르는 박스가 보이지 않는 문제가 생긴다.

```css
.left-box {
  float: left;
}
.right-box {
  float: right;
}
.footer {
  clear: both;
}
```

`clear: both`로 흐름을 끊어줘야 한다. 가로 정렬할 때는 float 박스들을 하나의 큰 div로 감싸고 폭을 지정해두는 편이 좋다. 그래야 모바일에서 흘러넘치지 않는다. 이 번거로움 때문에 flex가 나왔다.

## flex

한 방향 배치를 위한 것이다. 부모에 `display: flex`를 주면 자식들이 정렬된다.

```css
.container {
  display: flex;
  justify-content: center; /* 주축 정렬 */
  align-items: center; /* 교차축 정렬 */
}
```

`justify-content`에 `flex-start`, `flex-end`, `center`, `space-between`을 주고, 세로로 세우려면 `flex-direction: column`, 넘칠 때 아래로 내리려면 `flex-wrap: wrap`을 쓴다. 가운데 정렬이 두 줄로 끝나는데 float 시절에는 이것이 큰 일이었다.

크기를 px 대신 비율로 줄 수도 있다. `flex-grow`가 배수라서 1, 2, 1을 주면 가운데가 두 배로 넓어진다. navbar에서 가운데만 `flex-grow: 1`을 주면 양끝이 붙고 가운데가 비는 모양이 된다.

## CSS Grid

격자 모눈종이를 색칠해나가는 방식이다. 부모에 `display: grid`와 함께 칸의 개수와 크기를 정한다.

```css
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 100px 100px;
  grid-gap: 10px;
}
```

`fr`은 여유 공간을 비율로 나누는 단위이고 퍼센트와 달리 길이가 아니다. 자식에 `grid-column: 1 / 5`처럼 주면 세로선 1번부터 5번까지를 차지하고, `grid-row: 2 / 4`는 가로선 기준이다. 자식마다 `grid-area`로 이름을 붙이고 부모에서 `grid-template-areas`로 배치하는 방법도 있다. 이때 기역자 모양은 안 되고 사각형으로만 묶인다.

## 참고

`z-index`가 아무 요소에서나 듣는 것은 아니다. MDN은 이 속성이 "위치가 잡힌 요소와 그 자손, 그리고 flex 항목과 grid 항목"의 z 순서를 정한다고 적고, 값 설명에서 "위치가 잡힌 박스, 곧 `position`이 `static`이 아닌 박스"라고 못박는다. `position`을 주지 않은 요소라도 부모가 flex나 grid 컨테이너라면 듣는다. [MDN, z-index](https://developer.mozilla.org/en-US/docs/Web/CSS/z-index)

한 줄에 늘어놓는 내비게이션이나 카드 목록은 flex, 페이지 전체 구조는 grid가 맞는다. MDN은 이 갈림길을 차원으로 설명한다. "flexbox는 행이나 열 중 한 방향의 배치를 위해, grid는 행과 열을 동시에 다루는 2차원 배치를 위해 설계되었다"는 것이고, 판단 기준으로 "행이나 열 한쪽만 제어하면 되는가"를 물으라고 적는다. [MDN, Relationship of grid layout with other layout methods](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Relationship_of_grid_layout_with_other_layout_methods)

margin collapse는 부모와 첫 자식뿐 아니라 인접한 형제 사이에서도 일어난다. 위 요소의 `margin-bottom`과 아래 요소의 `margin-top`이 더해지지 않고 둘 중 큰 값 하나로 합쳐지는 이 경우가 실제로는 더 자주 부딪힌다. 명세는 collapse의 대상을 "두 개 이상 박스의 맞닿은 margin(형제일 수도, 아닐 수도 있다)"으로 정의하며, 세로 margin만 합쳐지고 가로 margin은 절대 합쳐지지 않는다고 못박는다. [CSS 2.2 8.3.1 Collapsing margins](https://www.w3.org/TR/CSS22/box.html#collapsing-margins)

원본 강의는 flex 가운데 정렬을 `justify-content: flex-center`로 적었는데 그런 값은 없다. 주축 가운데 정렬은 `center`이고, `flex-start`와 `flex-end`만 접두어를 가진다. [MDN, justify-content](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content)

`absolute`의 기준은 `relative` 조상이 아니라 position이 `static`이 아닌 조상이다. CSS 2.2는 `absolute`, `relative`, `fixed` 중 하나를 가진 가장 가까운 조상이 컨테이닝 블록을 만든다고 적었고, 뒤에 `sticky`가 더해진 Position Level 3은 "`static`이 아닌 값은 그 박스를 positioned box로 만들고 자손에게 absolute positioning containing block을 세운다"로 일반화했다. 원본 강의는 `relative`만 언급했는데 `absolute`, `fixed`, `sticky` 조상도 똑같이 기준이 된다. [CSS 2.2 10.1 Definition of containing block](https://www.w3.org/TR/CSS22/visudet.html#containing-block-details), [CSS Positioned Layout Level 3 2. Choosing a positioning scheme](https://www.w3.org/TR/css-position-3/#position-property)

## 관련

- [[브라우저 렌더링 과정]]
- [[마크업과 스타일]]
- [[애니메이션]]

## 출처

- [[brain/lectures/frontend/apple-html/all-in-one-basic|코딩애플 HTML/CSS 기초 - float, margin collapse, z-index]]
- [[brain/lectures/frontend/apple-html/all-in-one-mid|코딩애플 HTML/CSS 중급 - flex, 반응형 웹]]
- [[brain/lectures/frontend/apple-html/all-in-one-last|코딩애플 HTML/CSS 심화 - CSS Grid, sticky]]
