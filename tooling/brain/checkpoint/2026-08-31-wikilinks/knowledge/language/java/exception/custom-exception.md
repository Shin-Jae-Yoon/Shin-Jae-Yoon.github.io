---
title: 커스텀 예외
aliases:
  - 커스텀 예외
  - Custom Exception
  - 사용자 정의 예외
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

직접 만들어 쓰는 예외 클래스다. `Exception`이나 `RuntimeException`을 상속해서 만든다.

## 타입으로 구분되는 예외

오류 메시지를 담거나, 이미 발생한 예외를 감싼 결과로 자기가 만든 예외를 던지고 싶은 경우가 많다. 예외 이름 자체가 무슨 일이 났는지 말해주기 때문이다.

```java
throw new IllegalArgumentException("이미 존재하는 회원입니다");
throw new DuplicateMemberException("이미 존재하는 회원입니다");
```

아래쪽은 잡는 쪽에서 타입만 보고 구분할 수 있다. 메시지 문자열을 비교할 필요가 없다. [[예외 처리 전략|예외 전환]]이 값어치를 하는 것도 이 때문이다. 도메인 용어로 예외를 만들면 코드가 업무 언어에 가까워진다는 이점도 따라온다. [[DDD|유비쿼터스 언어]]

## 무엇을 상속할지

```java
public class DuplicateMemberException extends RuntimeException {
    public DuplicateMemberException(String message) {
        super(message);
    }
}
```

`Exception`을 상속하면 [[Checked와 Unchecked|Checked]]가 되고 `RuntimeException`을 상속하면 [[Checked와 Unchecked|Unchecked]]가 된다. 되도록 Unchecked 쪽으로 만드는 편이 낫다. 예외를 강제하지 않고 쓰는 사람이 알아서 처리하도록 두는 것이 여러모로 낫고, 체크드가 늘어나면 강제로 처리해야 하는 자리가 너무 많아진다.

## 생성자에 넘기는 것

생성자는 둘을 많이 쓴다. `super(message)`로 메시지를 넘겨야 무엇이 문제였는지 로그에 남고, 원인이 되는 예외가 있으면 `super(message, cause)`로 함께 넘겨야 원래 스택 트레이스가 보존된다. `Throwable` 자리에는 다른 예외든 `RuntimeException`이든 들어갈 수 있다.

```java
public int divide(int i, int k) throws MyException {
    try {
        return i / k;
    } catch (ArithmeticException ae) {
        throw new MyException("0으로 나눌 수 없슴");
    }
}
```

JVM이 던진 `ArithmeticException`을 받아서 자기가 만든 예외로 다시 던진 모양이다.

## ControllerAdvice와 짝지을 때

스프링에서는 `@ControllerAdvice`와 짝을 이룰 때 가장 쓸모가 있다. 커스텀 예외마다 `@ExceptionHandler`를 두면 예외 종류별로 다른 HTTP 상태 코드와 응답을 내보낼 수 있다. [[스프링 예외 처리]]

## 너무 많이 만들지 않기

의미가 드러나는 이름을 붙이되 너무 많이 만들지는 않는다. 표준 예외로 충분한 것까지 만들면 종류만 늘어난다.

## 관련

- [[Checked와 Unchecked]]
- [[예외 처리 전략]]
- [[스프링 예외 처리]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java08|재미있는 자바 8강 - Custom Exception]]
- [[brain/notes/Interview/dog-study/dog-week02|면접 스터디 2주차 - 예외전환]]
