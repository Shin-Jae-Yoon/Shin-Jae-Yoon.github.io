---
title: 상속
aliases:
  - 상속
  - extends
  - is-a 관계
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

B가 A를 상속받으면 B는 A의 멤버 변수와 메서드를 쓸 수 있다. 일반적인 클래스에서 더 구체적인 클래스를 뽑아내는 문법이다.

## extends와 Object

```java
class B extends A { }
```

A가 상위 클래스이자 부모 클래스, B가 하위 클래스이자 자식 클래스다. 클래스 다이어그램의 화살표는 언제나 자식에서 부모로 향한다. 자식은 부모를 알지만 부모는 자식을 모른다. 아무것도 상속받지 않으면 `java.lang.Object`를 상속받으므로 모든 클래스가 `Object`의 자손이다.

## 부모부터 만들어지는 객체

객체는 부모부터 만들어진다. 자식 생성자는 부모 생성자 호출로 시작하고, 명시하지 않으면 컴파일러가 `super()`를 끼워 넣는다. [[constructor|생성자]] 부모의 멤버가 먼저 메모리에 자리를 잡고 그 위에 자식의 것이 얹히니, 자식 객체 하나 안에 부모의 몫이 함께 들어 있다.

## is-a와 has-a

상속은 코드를 나눠 쓰는 수단이 아니라 "B는 A다"라는 관계를 적는 것이다. `VIPCustomer is a Customer`는 맞고 `Car is an Engine`은 어색하다. 뒤쪽은 가진다는 관계이므로 합성이다.

과목을 나타내는 `Subject`의 메서드를 쓰고 싶다고 `Student`가 `Subject`를 상속받으면 안 된다. `Subject`가 `Student`를 포괄하는 개념이 아니기 때문이다. 학생이 과목을 가지고 있으니 `Subject`는 `Student`의 멤버 변수 자리에 들어가는 것이 맞다.

```java
class Student {
    Subject majorSubject;
}
```

이 판단이 [[solid|LSP]]와 직결된다. 부모 자리에 자식을 넣어도 아무 문제가 없어야 하는데, is-a가 아닌 것을 상속하면 그것이 깨진다. [[inheritance-vs-composition|상속과 합성]]

## 가장 센 결합

상속은 결합이 가장 센 관계다. 상위 클래스가 흔들리면 하위 클래스가 같이 흔들리므로 반드시 써야 할 때만 쓴다. 등급마다 `if`로 가르는 코드가 답이 없다고 해서 아무 데나 `extends`를 붙일 이유가 되지는 않는다.

## 단일 상속

클래스는 하나만 상속할 수 있다. 두 부모가 같은 이름의 메서드를 가지면 어느 쪽을 물려받을지 정할 수 없는 [[default-method|다이아몬드 문제]] 때문이다. 여러 타입을 만족해야 하면 [[interface|인터페이스]]를 쓴다. 인터페이스에는 구현이 없어서 여럿을 구현해도 충돌하지 않는다.

## 부모의 private 멤버

부모의 `private` 멤버는 자식이 접근할 수 없다. 메모리에는 있지만 직접 쓸 수 없으니 필요하면 `protected`로 열거나 부모의 메서드를 거쳐 접근한다. 자식에게만 열어주는 것이 `protected`다. [[access-modifier|접근 제어자]]

## 관련

- [[overriding|오버라이딩]]
- [[casting|업캐스팅과 다운캐스팅]]
- [[polymorphism|다형성]]
- [[inheritance-vs-composition|상속과 합성]]

## 출처

- [[brain/books/do-it-java/chap08|Do it 자바 8장 - 상속과 다형성]]
- [[brain/lectures/pl/fun-java/fun-java04|재미있는 자바 4강 - 상속]]
