---
title: 디폴트 메서드
aliases:
  - 디폴트 메서드
  - default method
  - 인터페이스 static 메서드
  - private 메서드
  - 다이아몬드 문제
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

인터페이스에 구현이 있는 메서드를 둘 수 있게 한 것. 자바 8부터다.

## 어댑터 클래스를 대신하는 자리

[[인터페이스]]는 정의한 메서드를 전부 구현하도록 강제한다. 세 개 중 하나만 쓰고 싶어도 나머지 둘을 빈 몸체로 채워야 했다.

옛 해법은 어댑터였다. 인터페이스를 구현해 빈 몸체를 채워둔 중간 클래스를 만들고, 쓰는 쪽이 그것을 상속한다.

```java
public class MyAdapter implements MyInterface {
    @Override public void method1() {}
    @Override public void method2() {}
    @Override public void method3() {}
}

class HelloClass extends MyAdapter {
    @Override
    public void method1() { System.out.println("Hello World!"); }
}
```

자바는 다중 상속을 지원하지 않으므로 이미 다른 클래스를 상속하고 있으면 이 방법이 막힌다. 디폴트 메서드가 그 어댑터 역할을 대신한다. 인터페이스가 기본 구현을 들고 있으면 중간 클래스를 둘 이유가 없다.

## 라이브러리 호환

호환 문제도 함께 풀린다. 인터페이스를 라이브러리로 공개한 뒤에 메서드를 하나 추가하면, 그것을 구현해 쓰던 쪽은 업데이트하는 순간 컴파일 오류를 맞는다. 새로 추가한 메서드를 선언에서 그치지 않고 구현까지 해두면 기존 구현체가 깨지지 않는다. 인터페이스를 추가하는 것만으로 기능을 확장할 수 있게 되었고, 필요한 기능만 갈라 보여주는 [[SOLID|ISP]] 설계도 편해졌다.

## default 선언

`default` 예약어를 붙여 선언한다. 구현한 클래스 입장에서 재정의가 강제되지 않고, 원하면 재정의해서 덮는다.

## 인터페이스의 static 메서드

디폴트 메서드가 들어오면서 인터페이스가 `static` 메서드도 가질 수 있게 되었다. 클래스가 JVM에 올라갈 때 함께 올라가므로 인스턴스 없이 부른다. 배열 요소를 모두 더하는 `total()`을 `Calc`에 두면 구현 클래스를 거치지 않고 `Calc.total(arr)`로 바로 쓴다.

```java
public interface Calc {
    static int total(int[] arr) {
        int total = 0;
        for (int i : arr) total += i;
        return total;
    }
}
```

용어도 이때 바뀌었다. 클래스에 종속된 함수를 메서드라고 부르는데, 인터페이스의 `static` 메서드는 종속되지 않은 채로 쓸 수 있어서 다시 함수라고 불리게 되었다. 인터페이스가 정의만이 아니라 기능 자체를 제공하는 자리가 된 것이고, [[함수형 인터페이스]]로 이어진다.

## private 메서드

자바 9부터는 `private` 메서드도 둘 수 있다. 디폴트 메서드와 `static` 메서드가 공통 로직을 나눠 쓰려고 만든 것이라 구현한 클래스에서는 호출도 재정의도 못 한다. 몸체를 반드시 구현해야 하니 `abstract`와는 함께 쓸 수 없고, `private static`은 `static` 메서드 안에서 부른다.

## 추상 클래스와의 경계

인터페이스가 구현을 가지게 되면서 [[추상 클래스]]와의 경계가 흐려 보인다. 자바가 둘을 나눈 이유는 사용 목적에 있고 그 목적은 그대로다. 어떻게 갈리는지는 추상 클래스 쪽에 적어두었다.

## 다이아몬드 문제

같은 시그니처의 디폴트 메서드를 가진 인터페이스 둘을 한 클래스가 함께 구현하면 다이아몬드 문제가 생긴다. `Buy`와 `Sell`이 각각 `order()`를 디폴트로 구현해 두면 `Customer`가 어느 쪽을 불러야 할지 정할 수 없어 컴파일 오류가 난다. 구현 클래스가 직접 재정의해서 푼다.

`static` 메서드는 이 문제를 겪지 않는다. `Buy.pay()`처럼 인터페이스 이름을 앞에 적고 부르니 헷갈릴 일이 없다. 추상 메서드끼리 겹치는 경우도 마찬가지로, 구현은 클래스에서 한 번만 이루어진다.

## 참고

원본은 다이아몬드 문제를 구현 클래스에서 재정의하는 것으로만 푼다. 자바 언어 명세의 메서드 호출 문법에는 `TypeName . super . [TypeArguments] Identifier ( [ArgumentList] )` 꼴이 들어 있어서, 재정의한 몸체 안에서 `InterfaceA.super.method()`라고 적으면 어느 인터페이스의 디폴트 구현을 쓸지 지목할 수 있다. [JLS SE 21 §15.12](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12)

## 관련

- [[인터페이스]]
- [[추상 클래스]]
- [[함수형 인터페이스]]

## 출처

- [[brain/books/do-it-java/chap10|Do it 자바 10장 - 디폴트 메서드와 정적 메서드]]
- [[brain/notes/DevCourse/003|데브코스 회고 3편 - default 메서드]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - JDK8 추가 문법]]
