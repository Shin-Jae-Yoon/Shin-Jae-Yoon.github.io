---
title: var, let, const
aliases:
  - var, let, const
  - 자바스크립트 변수
  - truthy와 falsy
  - 호이스팅
tags:
  - language
  - javascript
origin:
  verified: 2026-08-30
---

자바스크립트에서 변수를 선언하는 세 키워드. 무엇을 고르느냐에 따라 재선언과 재할당의 허용 여부가 갈리고 변수가 살아 있는 범위가 달라진다.

## 선언과 할당과 범위

변수는 선언, 할당, 범위만 기억하면 된다. 변수를 만들겠다는 것이 선언이고, 거기에 자료를 넣는 것이 할당이다. 함수 안에서 만든 변수를 함수 밖에서 쓰려고 하면 `Uncaught ReferenceError`가 나는데, 그것이 범위다.

```javascript
var 이름 // 선언
이름 = "kim" // 할당

var 이름 = "kim" // 선언과 할당
이름 = "park" // 재할당
```

## 세 키워드의 차이

세 키워드의 차이는 이렇다.

|        | var             | let          | const        |
| ------ | --------------- | ------------ | ------------ |
| 재선언 | O               | X            | X            |
| 재할당 | O               | O            | X            |
| 범위   | function        | `{ }`        | `{ }`        |
|        | Function-scoped | Block-scoped | Block-scoped |

`let`은 같은 이름을 두 번 선언하지 못하게 막는다. 코드가 길어지면 이미 쓴 변수를 까먹고 또 만들 수 있는데 그것을 방지해준다.

```javascript
let 이름 = "kim"
let 이름 = "park"
// Uncaught SyntaxError: Identifier '이름' has already been declared
```

`const`는 재선언에 더해 재할당까지 막는다. 변하면 안 되는 값, 상수를 보관할 때 좋다.

```javascript
const 이름 = "kim"
이름 = "park"
// Uncaught TypeError: Assignment to constant variable.
```

범위는 `let`과 `const`가 함수뿐 아니라 중괄호 내부를 모두 범위로 취급한다는 점에서 갈린다. `if` 블록 안에서 선언한 `let` 변수는 블록 밖에서 쓸 수 없다.

## truthy와 falsy

자바스크립트는 조건문에서 불리언이 아닌 값도 참과 거짓으로 판단한다. 0을 제외한 숫자, 내용이 있는 문자, 빈 배열 `[]`, 빈 객체 `{}`가 truthy 자료이고, `0`, 빈 문자열 `''`, `null`, `undefined`, `NaN`이 falsy 자료다. 빈 배열과 빈 객체가 참이라는 것이 함정이다.

## undefined와 null

`undefined`와 `null`은 값이 없다는 점에서 비슷하지만 엄밀히 말하면 다른 개념이다. `typeof`로 확인해보면 `undefined`는 undefined 타입, `null`은 object 타입으로 나온다. 변수는 존재하는데 어떠한 값으로도 할당되지 않아 자료형이 정해지지 않은 상태가 `undefined`이고, 변수가 존재하면서 `null`로 값이 할당되어 자료형까지 정해진 상태가 `null`이다.

```javascript
var var1
// undefined, 어떤 값도 할당되지 않아 자료형을 알 수 없다

var var2 = null
// null, null로 할당되어 자료형을 알 수 있다
```

그런데 둘을 비교하면 true가 나온다. 엄격한 비교냐 아니냐의 차이다.

```javascript
undefined == null // true, 형변환까지 해줘서
undefined === null // false, 형변환을 하지 않아서
```

## var의 함수 단위 범위

`var`의 범위가 함수 단위라는 것이 실제로 문제를 일으킨다. 탭 기능을 만들 때가 그렇다.

```javascript
var 탭버튼 = $(".tab-button")
var 탭내용 = $(".tab-content")

for (var i = 0; i < 탭버튼.length; i++) {
  탭버튼.eq(i).on("click", function () {
    탭버튼.eq(i).addClass("orange")
    탭내용.eq(i).addClass("show")
  })
}
```

이 코드는 제대로 돌아가지 않는다. 이벤트리스너 내부의 코드는 바로 실행되는 코드가 아니라 이벤트가 발생해야 실행되는 코드다. 반복문은 내부 코드를 실행하지 않고 세 번 돌아 끝나고, 한참 뒤 사용자가 버튼을 클릭할 때는 이미 `i`가 3이다. `var`의 범위는 `for`문 밖에도 적용되므로 `eq(i)`에 3이 들어가는데 네 번째 버튼은 없으니 에러가 난다.

`let`으로 바꾸면 잘 된다. block-scoped라 반복문 안에서 선언한 변수가 반복문 밖의 값에 영향을 끼치지 못한다. C에서 배웠던 상식적인 반복문 내부 변수 선언의 범위가 `let`이다.

## 관련

- [[immutable-object|불변 객체]]
- [[control-flow|제어 흐름]]

## 출처

- [[brain/lectures/frontend/apple-js/apple-js-01|코딩애플 자바스크립트 1편 - 변수 문법]]
- [[brain/lectures/frontend/apple-js/apple-js-02|코딩애플 자바스크립트 2편 - for 반복문]]
