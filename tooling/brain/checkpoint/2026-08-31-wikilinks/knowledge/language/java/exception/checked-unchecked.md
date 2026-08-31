---
title: Checked와 Unchecked
aliases:
  - Checked와 Unchecked
  - 예외 체계
  - Error와 Exception
  - Checked Exception
  - Unchecked Exception
tags:
  - language
  - java
  - spring
origin:
  verified: 2026-08-30
---

자바는 실행 중에 생기는 문제 가운데 개발자가 대비할 수 있는 쪽을 예외로 다루고, 그 예외를 `RuntimeException`을 상속했는지에 따라 다시 가른다. 상속하지 않으면 Checked, 상속하면 Unchecked다.

## 오류가 나는 시점

오류 자체는 나는 시점으로 갈린다. 컴파일 에러는 컴파일할 때 나서 실행 자체가 되지 않고, 런타임 에러는 실행할 때 난다. 실행은 되는데 의도와 다르게 동작하는 논리적 에러가 가장 잡기 어렵다.

## Error와 Exception

실행 시점에 생기는 것은 다시 Error와 Exception으로 나뉜다. 메모리 부족이나 스택 오버플로우처럼 일단 나면 복구할 수 없는 심각한 오류가 Error다. 개발자가 예측해서 코드로 대비할 방법이 없고, 메모리를 늘리거나 알고리즘을 다시 짜는 식으로 원인을 없애야 한다. Exception은 예측해서 대비할 수 있는 쪽이다.

## RuntimeException 상속 여부

Checked는 `RuntimeException`을 상속하지 않는 예외다. `IOException`, `SQLException`, `FileNotFoundException`, `ClassNotFoundException`이 여기 든다. Unchecked는 상속하는 쪽으로 `NullPointerException`, `IndexOutOfBoundsException`, `ArithmeticException`이 있다.

## 처리 강제와 롤백 정책

|                           | Checked            | Unchecked   |
| ------------------------- | ------------------ | ----------- |
| 확인 시점                 | 컴파일 시점        | 런타임 시점 |
| 처리 여부                 | 반드시 처리해야 함 | 안 해도 됨  |
| 스프링 트랜잭션 기본 롤백 | 롤백되지 않음      | 롤백됨      |

마지막 줄이 함정이다. `@Transactional`이 붙은 메서드에서 Checked Exception이 나면 롤백되지 않는다. 스프링의 기본 롤백 정책이 Unchecked와 Error만 대상으로 삼기 때문이다. `IOException`이 터졌는데 앞의 DB 작업이 그대로 커밋되는 상황이 여기서 생긴다. 롤백하려면 `rollbackFor`를 명시해야 한다. [[@Transactional 속성]]

## 실무에서 Unchecked를 쓰는 이유

실무에서는 대체로 Unchecked를 쓴다. Checked는 모든 호출부에 `try-catch`나 `throws`를 강제해서 코드를 지저분하게 만들고, 처리할 수도 없는 예외를 억지로 잡게 만들어 빈 catch 블록을 낳는다.

다만 체크드든 언체크드든 던질 때는 확실히 던져야 한다. 조용히 삼키는 것이 가장 나쁘다.

## 관련

- [[예외 처리 전략]]
- [[커스텀 예외]]
- [[@Transactional 속성]]
- [[스프링 예외 처리]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week01|면접 스터디 1주차 - Exception]]
- [[brain/lectures/pl/fun-java/fun-java08|재미있는 자바 8강 - Checked / UnChecked]]
