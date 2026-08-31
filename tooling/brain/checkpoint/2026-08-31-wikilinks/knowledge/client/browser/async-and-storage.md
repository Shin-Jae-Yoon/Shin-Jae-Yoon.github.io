---
title: 비동기와 저장
aliases:
  - 비동기와 저장
  - Ajax
  - fetch
  - JSON
  - localStorage
  - setTimeout
tags:
  - client
  - javascript
origin:
  verified: 2026-08-30
---

화면을 새로 그리지 않고 서버와 데이터를 주고받는 방법과, 그렇게 받은 것을 브라우저에 남겨두는 방법. 둘 다 기다리지 않고 등록만 해두는 비동기 방식으로 돈다.

## 새로고침 없는 요청

서버는 데이터를 요청하면 보내주는 것이고, 요청할 때 정해야 할 것이 둘이다. 어떤 데이터인지를 가리키는 URL과, GET인지 POST인지 하는 방법이다.

원래는 주소창에 URL을 입력하는 것이 GET 요청이었고, `<form action="/url" method="post">`의 전송 버튼을 누르는 것이 POST였다. 문제는 그때마다 브라우저가 새로고침된다는 것이다.

새로고침 없이 GET과 POST를 하려고 나온 것이 Ajax다. 쇼핑몰에서 "상품 더보기"를 누르면 화면 전환 없이 목록이 늘어나는 것이 그 예다.

## fetch로 주고받기

`fetch`는 브라우저 기본 함수라 라이브러리 없이 쓸 수 있다.

```javascript
fetch("https://example.com/data")
  .then((res) => res.json())
  .then((data) => console.log(data))
```

jQuery의 `$.get()`과 `$.post()`도 같은 일을 하고, 리액트나 뷰에서는 axios 라이브러리를 주로 쓴다.

## 문자열과 객체 사이의 JSON

주고받을 때 쓰는 형식은 JSON이다. 객체처럼 생겼지만 문자열이다.

```javascript
JSON.parse(문자열) // 문자열에서 객체로
JSON.stringify(객체) // 객체에서 문자열로
```

네트워크로는 문자열만 보낼 수 있으므로 변환이 필요하다. 자바의 [[직렬화]]와 같은 문제를 푸는 것이고, JSON은 언어에 매이지 않는다는 점이 다르다.

## localStorage와 sessionStorage

`localStorage`는 브라우저에 데이터를 저장한다. 새로고침해도, 브라우저를 껐다 켜도 남는다.

```javascript
localStorage.setItem("key", "value")
localStorage.getItem("key")
localStorage.removeItem("key")
```

문자열만 저장할 수 있으므로 객체를 넣으려면 `JSON.stringify`로 바꿔야 한다. `sessionStorage`는 같은 방식인데 탭을 닫으면 사라진다.

## setTimeout과 setInterval

시간을 다루는 함수도 있다. `setTimeout(함수, ms)`은 몇 초 후에 한 번 실행하고, `setInterval(함수, ms)`은 몇 초마다 반복 실행하며, `clearTimeout`과 `clearInterval`로 취소한다. 1000ms가 1초이고, 함수 자리에는 미리 만들어둔 함수를 넣어도 된다.

```javascript
setTimeout(알림창제거, 3000)
```

`setInterval`은 반드시 취소할 방법을 마련해두어야 한다. 안 그러면 페이지가 살아 있는 내내 계속 돈다.

## 콜백으로 등록해두기

`setTimeout`도 `fetch`도 기다리지 않고 등록해두고 다음 줄로 넘어간다. 자바스크립트는 [[브라우저 렌더링 과정|스레드가 하나]]라 기다리면 화면 전체가 멈추기 때문에, 결과가 오면 실행할 함수를 콜백으로 등록해두고 다음 일을 한다.

## 관련

- [[DOM과 이벤트]]
- [[HTTP 메서드]]
- [[직렬화]]

## 출처

- [[brain/lectures/frontend/apple-js/apple-js-02|코딩애플 자바스크립트 2편 - setTimeout, setInterval]]
- [[brain/lectures/frontend/apple-js/apple-js-03|코딩애플 자바스크립트 3편 - Ajax, JSON, localStorage]]
