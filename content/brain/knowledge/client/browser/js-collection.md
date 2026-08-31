---
title: 자바스크립트 배열과 객체
aliases:
  - 자바스크립트 배열과 객체
  - 자바스크립트 Array
  - 자바스크립트 Object
  - Array.forEach
  - Array.map
  - Array.filter
  - 배열 고차 함수
tags:
  - client
  - javascript
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

자바스크립트가 값을 여럿 담는 두 그릇과 그것을 다루는 함수들. 자바의 [[collection-framework|List와 Map]], 파이썬의 [[python-collection|리스트와 딕셔너리]]와 같은 구도다.

## Array와 Object

```javascript
let car = ["소나타", 50000, "white"]
let car2 = { name: "소나타", price: 50000 }
```

|               | Array          | Object         |
| ------------- | -------------- | -------------- |
| 문법          | `[]`           | `{key: value}` |
| 순서          | 있다           | 없다           |
| 접근          | 인덱스         | 키             |
| 할 수 있는 것 | 정렬, 슬라이싱 | 이름으로 찾기  |

순서가 있다는 것에서 배열의 능력이 전부 나온다. 정렬할 수 있고 `slice(n, m)`으로 잘라낼 수 있다.

## 배열 고차 함수

반복문을 대신하는 고차 함수도 배열 쪽에 있다. 자바 [[stream|스트림]]의 연산과 이름까지 같다.

| 함수      | 무엇                | 반환    |
| --------- | ------------------- | ------- |
| `forEach` | 원소마다 실행       | 없음    |
| `map`     | 각 원소를 변환      | 새 배열 |
| `filter`  | 조건에 맞는 것만    | 새 배열 |
| `find`    | 조건에 맞는 첫 번째 | 원소    |

```javascript
arr.forEach((x) => console.log(x))
let doubled = arr.map((x) => x * 2)
let big = arr.filter((x) => x > 10)
```

`map`과 `filter`는 원본을 바꾸지 않고 새 배열을 주기 때문에 이어 쓸 수 있다.

```javascript
arr.filter((x) => x > 10).map((x) => x * 2)
```

## for in과 for of

도는 방법도 둘로 갈린다. `for in`은 키를, `for of`는 값을 준다.

```javascript
for (let key in obj) {
}
for (let value of arr) {
}
```

배열에는 `for of`나 `forEach`를 쓴다.

## sort의 기본 정렬

```javascript
;[10, 9, 8].sort() // [10, 8, 9]
```

기본 `sort`는 값을 문자로 바꿔서 사전순으로 정렬한다. 그래서 숫자가 이상하게 정렬된다. 숫자를 정렬하려면 비교 함수를 넘겨야 한다.

```javascript
arr.sort((a, b) => a - b) // 오름차순
```

반환값이 음수면 a가 앞, 양수면 b가 앞이다. 자바의 [[comparable-comparator|Comparator]]와 정확히 같은 약속이다.

## 참고

원본 강의는 `forEach`, `map`, `filter`, `find`까지만 다룬다. 여러 원소를 하나로 접는 `reduce`도 같은 자리의 함수다. MDN은 reduce를 "앞 원소의 계산에서 나온 반환값을 넘겨가며 리듀서 콜백을 원소마다 차례로 실행하고, 전체를 훑은 결과로 값 하나를 남기는 메서드"로 적는다. [MDN, Array.prototype.reduce()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce)

배열에 `for in`을 쓰면 인덱스가 숫자가 아니라 문자열로 나온다. MDN은 배열에는 숫자 인덱스를 쓰는 `for`나 `forEach`, `for of`를 쓰라면서 그 까닭을 "인덱스를 문자열이 아니라 숫자로 돌려주고, 인덱스가 아닌 속성도 피하기 때문"이라고 적는다. [MDN, for...in](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in)

문자열 정렬을 언어에 맞게 하려면 `localeCompare`를 쓴다. MDN은 이 메서드를 "정렬 순서에서 이 문자열이 주어진 문자열보다 앞인지 뒤인지 같은지를 나타내는 수를 돌려준다"고 적고, 큰 배열을 정렬할 때는 `Intl.Collator`를 만들어 그 `compare`를 쓰는 편이 낫다고 덧붙인다. [MDN, String.prototype.localeCompare()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)

## 관련

- [[collection-framework|컬렉션 프레임워크]]
- [[stream|스트림]]
- [[js-variable|var, let, const]]

## 출처

- [[brain/lectures/frontend/apple-js/apple-js-03|코딩애플 자바스크립트 3편 - Array, Object, 배열 함수]]
