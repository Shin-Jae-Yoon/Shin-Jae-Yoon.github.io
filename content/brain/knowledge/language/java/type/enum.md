---
title: enum
aliases:
  - 열거형
  - Enumeration
  - EnumMap
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

정해진 값만 가질 수 있는 타입. Enumeration의 약자로 JDK 5부터 지원한다.

## int 상수의 타입 안전성

JDK 5 이전에는 요일 같은 상수 묶음을 클래스에 `final static int`로 모아두고 썼다.

```java
class DayType {
    static final int SUNDAY = 0;
    static final int MONDAY = 1;
    // ...
}

int today = DayType.SUNDAY;
if (today == DayType.SUNDAY) { }
```

동작은 한다. 그런데 `today`가 `int`라서 정의해둔 0부터 6 말고 아무 값이나 들어간다. `int today = 99;`도 그대로 컴파일된다. 정해진 값만 할당되도록 막을 방법이 없는 이런 상태를 타입에 안전하지 않다고 한다.

enum으로 선언하면 그 안에 적은 상수 외에는 들어가지 못한다.

```java
public enum Day {
    SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
}

Day day = Day.SUNDAY;
Day day = 5;              // 컴파일 오류
```

## 필드와 생성자를 가진 클래스

enum은 상수 목록이 아니라 클래스다. 필드와 메서드를 두고 인터페이스를 구현할 수 있다. 상수 이름 뒤에 괄호를 붙이면 생성자가 호출되어 그 필드가 초기화된다.

```java
public enum Gender {
    MALE("XY"),
    FEMALE("XX");

    private String chromosome;                 // 염색체
    private Gender(String chromosome) { this.chromosome = chromosome; }
}
```

생성자는 `private`이어야 하고 enum 안에서만 호출된다. `Object`의 메서드도 재정의할 수 있어서, `toString()`을 고치면 `Gender.MALE`을 출력할 때 `MALE` 대신 `Gender{chromosome='XY'}`가 나온다.

## 상수마다 다른 동작

추상 메서드를 두면 상수마다 다르게 동작하게 만들 수 있다. 이때는 상수를 정의하는 자리에서 그 메서드를 함께 구현해야 한다.

```java
public enum Country {
    KOREA { public void print() { System.out.println("대한민국"); } },
    JAPAN { public void print() { System.out.println("일본"); } },
    USA   { public void print() { System.out.println("미국"); } };
    public abstract void print();
}
```

사칙연산마다 클래스를 하나씩 만드는 대신 연산 전체를 enum 하나에 담으라는 조언, 메뉴 번호로 1과 2만 받고 나머지는 예외로 던지라는 조언이 모두 이 성질에 기댄다. 계산기 과제에서 `Operator` 인터페이스를 `Addition`, `Subtraction`, `Multiplication`, `Division` 넷으로 구현하려던 설계가 enum 하나로 줄어든 것이 그런 경우다. [[good-object|좋은 객체]]

## 비교와 switch

상수는 메모리에 하나만 올라가 같은 것을 참조하므로, 값끼리 비교할 때는 `equals`가 아니라 `==`를 쓴다. switch 문의 `case`에도 쓸 수 있는데, 이 자리에는 `Day.SUNDAY`라고 적으면 컴파일 오류가 나므로 `SUNDAY`처럼 상수 이름만 적는다.

## 싱글톤으로서의 enum

생성자가 `private`이고 상수만 갖는 클래스라 [[singleton|싱글톤 패턴]]의 성질을 그대로 만족한다. 리플렉션이나 직렬화로도 깨지지 않는 것은 JVM이 보장한다. `Serializable`과 `Comparable`도 이미 구현되어 있다.

## EnumMap과 EnumSet

키가 enum인 전용 컬렉션도 있다. `EnumMap`은 `new EnumMap(Day.class)`처럼 만들어 그 enum의 상수만 키로 받고, `EnumSet`은 `allOf(Day.class)`로 모든 상수를 `range(Day.MONDAY, Day.WEDNESDAY)`로 구간을 꺼낸다.

## 참고

원본은 `EnumMap`과 `EnumSet`을 쓰는 법까지만 적었다. 성능이 갈리는 까닭은 내부 구조에 있다. `EnumMap` javadoc은 "enum 맵은 내부적으로 배열로 표현된다. 이 표현은 매우 compact하고 효율적이다"라고 밝히고, 구현 노트에 "모든 기본 연산이 상수 시간에 실행되며 `HashMap`의 대응 연산보다 빠를 가능성이 높다(보장되지는 않는다)"고 적는다. [EnumMap javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/EnumMap.html)

## 관련

- [[singleton|싱글톤 패턴]]
- [[factory-method|팩토리 메서드 패턴]]
- [[collection-framework|컬렉션 프레임워크]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java08|재미있는 자바 8강 - enum]]
- [[brain/notes/DevCourse/005|데브코스 회고 5편 - enum으로 빼기]]
- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Enum 싱글턴]]
