---
title: DOM과 이벤트
aliases:
  - DOM과 이벤트
  - DOM
  - querySelector
  - 이벤트 버블링
  - addEventListener
tags:
  - client
  - javascript
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

HTML을 파싱해 브라우저가 다룰 수 있는 객체 자료구조로 바꾼 것이 DOM이고, 그 결과가 `document`에 담긴다. 자바스크립트가 HTML을 조작할 수 있는 이유가 이것이다.

## 요소를 고르고 함수를 등록하기

원하는 요소를 먼저 고른다.

```javascript
document.querySelector(".black-bg") // CSS 선택자, 첫 번째 하나
document.querySelectorAll("li") // 전부
document.getElementById("email") // id로
```

`querySelector`는 CSS 선택자를 그대로 쓴다는 것이 장점이다. `getElementById`가 더 빠르지만 선택자 문법을 쓸 수 없다.

고른 요소에 실행할 함수를 등록한다.

```javascript
element.addEventListener("click", function () { ... });
```

`click`, `input`, `scroll`, `submit` 같은 이벤트를 받고, 등록하는 이 함수가 [[functional-interface|콜백]]이다.

## 이벤트 버블링

이벤트는 상위 HTML로 퍼진다. 모든 브라우저에서 일어나는 이 현상을 이벤트 버블링이라고 부르고, 모달창을 만들 때 바로 부딪힌다.

```javascript
document.querySelector(".black-bg").addEventListener("click", function () {
  // 검은 배경을 누르면 모달을 닫는다
})
```

모달창 안 아무 데나 눌러도 닫힌다. 안쪽 요소를 클릭한 이벤트가 부모인 `.black-bg`까지 올라오기 때문이다.

막는 방법이 둘이다. 하나는 `e.target`으로 진짜 클릭된 요소를 확인하는 방법이다. `e.target`은 실제로 이벤트가 시작된 요소이고 `e.currentTarget`은 리스너가 붙어 있는 요소라, 둘이 같을 때만 처리하면 된다.

```javascript
addEventListener("click", function (e) {
  if (e.target === e.currentTarget) {
    /* 배경을 직접 눌렀을 때만 */
  }
})
```

다른 하나는 `e.stopPropagation()`으로 전파를 멈추는 것이다. 다만 다른 곳에서 그 이벤트를 기다리고 있었다면 그것도 함께 막히므로 조심해야 한다.

## 이벤트 위임

버블링을 문제로만 볼 것은 아니다. 부모 하나에만 리스너를 달고 `e.target`으로 구분하면 자식이 100개여도 리스너는 하나면 된다.

```javascript
ul.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") { ... }
});
```

이것을 이벤트 위임이라고 한다.

## data- 속성

HTML에 `data-`로 시작하는 속성을 두면 자바스크립트에서 읽을 수 있다.

```html
<li data-id="3">항목</li>
```

```javascript
e.target.dataset.id // "3"
```

이벤트 위임과 함께 쓰면 어느 항목이 눌렸는지 알아내는 데 쓸모가 있다.

## 참고

이벤트 위임은 나중에 추가된 자식에도 그대로 걸린다. 리스너가 부모에 붙어 있고, 이벤트가 거슬러 올라갈 경로는 이벤트가 일어나는 그 시점의 트리를 타고 계산되기 때문이다. DOM 표준의 dispatch 알고리즘은 대상의 부모를 반복해서 물어가며 이벤트 경로를 그 자리에서 만든다. [DOM Standard, 2.9 Dispatching events](https://dom.spec.whatwg.org/#dispatching-events)

## 관련

- [[rendering|브라우저 렌더링 과정]]
- [[async-and-storage|비동기와 저장]]
- [[js-variable|var, let, const]]

## 출처

- [[brain/lectures/frontend/apple-js/apple-js-01|코딩애플 자바스크립트 1편 - querySelector, 이벤트리스너]]
- [[brain/lectures/frontend/apple-js/apple-js-02|코딩애플 자바스크립트 2편 - 이벤트 버블링, Dataset]]
- [[brain/lectures/frontend/apple-js/apple-js-03|코딩애플 자바스크립트 3편 - DOM]]
