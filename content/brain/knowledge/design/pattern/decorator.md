---
title: 데코레이터 패턴
aliases:
  - 데코레이터 패턴
  - Composite
tags:
  - design
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

객체를 다른 객체로 감싸서 기능을 덧붙이는 구조 패턴. 상속이 아니라 합성으로 기능을 확장한다.

## 조합의 폭발

데코레이터는 같은 인터페이스를 구현하면서 내부에 같은 인터페이스의 객체를 하나 갖는다. 그래서 겹겹이 감쌀 수 있고, 조합을 런타임에 정할 수 있다.

## 자바 I/O가 감싸는 방식

자바 I/O가 통째로 이 패턴이다.

```java
new BufferedReader(new InputStreamReader(System.in))
```

`System.in`은 바이트를 읽는 기본 스트림이고, `InputStreamReader`가 감싸서 바이트를 문자로 바꾸고, `BufferedReader`가 다시 감싸서 버퍼링을 더한다.

바깥쪽 객체는 안쪽 객체가 무엇인지 모른다. 그저 같은 인터페이스를 구현한 무언가일 뿐이다. 그래서 원하는 기능만 골라 원하는 순서로 쌓을 수 있다. [[io-stream|I/O 스트림]]의 클래스가 그렇게 많은 이유이자, 그럼에도 조합이 자유로운 이유다.

## Composite와의 차이

Composite는 여러 객체를 하나처럼 다루는 패턴이다. 트리 구조를 만들어 개별 객체와 묶음을 같은 인터페이스로 취급한다.

데코레이터와 구조가 비슷해서 둘 다 같은 인터페이스를 구현하면서 그 인터페이스의 객체를 품는다. 차이는 데코레이터가 하나를 감싸 기능을 더하는 반면 Composite는 여럿을 묶어 하나로 보이게 한다는 것이다.

## 참고

기능 조합마다 클래스를 만들면 조합이 폭발한다는 이야기는 원본 강의에 없다. 자바 표준 라이브러리는 버퍼링과 압축과 암호화를 각각 `FilterInputStream`의 독립된 자식으로 두어 필요한 것만 겹쳐 쓰게 하는데, 오라클 문서는 이 클래스를 "다른 입력 스트림을 감싸서 그것을 데이터의 원천으로 삼고, 오가는 길에 데이터를 바꾸거나 기능을 더한다"고 설명하고 직계 자식으로 `BufferedInputStream`과 `DeflaterInputStream`, `CipherInputStream`을 나란히 든다. 세 기능을 켜고 끄는 모든 경우를 상속만으로 표현하려면 2³인 여덟 개의 클래스가 필요하다. [Java SE 21 API, FilterInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/FilterInputStream.html)

## 관련

- [[io-stream|I/O 스트림]]
- [[design-pattern|디자인 패턴]]
- [[inheritance-vs-composition|상속과 합성]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java09|재미있는 자바 9강 - Decorator 패턴, Composite 패턴]]
