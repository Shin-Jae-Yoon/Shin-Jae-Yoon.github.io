---
title: 리플렉션
aliases:
  - 리플렉션
  - 클래스로더
tags:
  - language
  - java
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

프로그램이 실행 중에 자신의 구조와 동작을 검사하고 수정하는 것. 컴파일 타임에 인터페이스와 필드, 메서드의 이름을 몰라도 실행 중에 그것들에 접근한다. 새 인스턴스를 만들거나 메서드를 부를 수도 있다.

## 이름을 나중에 아는 경우

`a()` 메서드를 가진 클래스가 있는데 그 클래스의 이름을 지금은 모르고 나중에 알려준다고 하자. 그런 조건에서도 `a()`를 실행하는 코드를 미리 써 두려면, 문자열로 된 클래스 이름과 메서드 이름만으로 인스턴스를 만들고 메서드를 부를 방법이 있어야 한다.

## 프레임워크가 기대는 자리

프레임워크가 여기에 기댄다. [[annotation|어노테이션]]은 그 자체로는 아무 동작도 없는 표식이라, 리플렉션이 그 표식을 읽어 처리해야 기능이 된다. 스프링 컨테이너가 하는 일이 그렇다. 객체가 호출되면 인스턴스를 만들어야 하는데 어떤 클래스인지는 실행해봐야 알 수 있으니, 어노테이션 지정만 보고 필요한 클래스를 찾아 주입한다. [[component-scan|컴포넌트 스캔]]

객체를 대신 만들어주는 공장이 이 과정을 감추면 쓰는 쪽은 클래스 이름만 알면 된다. 새 구현을 추가할 때 팩토리조차 고칠 일이 없다. 설정 파일에 클래스 이름만 적으면 된다. [[factory-method|팩토리 메서드 패턴]]

## 클래스 정보로 메서드 부르기

JVM의 클래스로더는 클래스를 CLASSPATH에서 찾는다. 그것을 이용해 클래스 정보를 얻은 다음, 그 정보로 인스턴스를 만들어 메서드 이름으로 실행한다.

```java
String className = "chap05.Bus";
Class clazz = Class.forName(className);
Object obj = clazz.newInstance();

Method m = clazz.getDeclaredMethod("a", null);
m.invoke(obj, null);
```

`Class.forName()`이 `className`에 해당하는 클래스 정보를 읽어들이고 `clazz`가 그것을 참조한다. `m`은 그 클래스에서 얻어낸 `a()` 메서드의 정보이고, `m.invoke(obj, null)`은 `obj`가 참조하는 객체의 그 메서드를 실행하라는 뜻이다.

`Bus`와 `SuperCar`를 `Car`라는 추상 클래스로 일반화해두었다면 `className`이 어느 쪽이든 형변환해서 쓸 수 있다. `Car`와 아무 관계없는 `MyHome`을 받아오면 형변환이 안 되고, 그때 메서드 정보를 직접 얻어 부르는 위 방식이 필요해진다.

## 정보를 읽는 창구

읽는 창구는 대상에 따라 다르다. 클래스에 적용된 어노테이션 정보는 `java.lang.Class`로 읽고, 필드와 생성자와 메서드에 적용된 것은 `Class`의 메서드를 거쳐 `java.lang.reflect` 패키지의 배열을 얻어 읽는다. `Class.forName()`, `getName()`, `getModifiers()`, `getFields()`, `getPackage()` 같은 메서드가 정보를 내준다.

## 접근 제어자를 뚫는 것

접근 제어자를 무시할 수 있어 `private`도 뚫린다. [[encapsulation|캡슐화]]가 깨지고, [[singleton|Bill Pugh 방식]]으로 만든 싱글톤도 리플렉션과 직렬화로 파괴된다.

## 호출 비용

일반 메서드 호출보다 느리다. 직접 쓸 일은 드물고 프레임워크가 쓰는 기술이지만, 그 프레임워크가 어떻게 동작하는지 알려면 알아둬야 한다.

## 참고

원본은 리플렉션의 대가로 접근 제어자를 무시한다는 것과 오버헤드가 크다는 것을 적었다. 컴파일 시점 검사를 잃는 것도 대가다. 클래스 이름과 메서드 이름을 문자열로 넘기므로 잘못 적어도 컴파일러가 잡아주지 않는다. `Class.forName(String)`은 클래스를 찾지 못하면 `ClassNotFoundException`을, `getDeclaredMethod(String, Class...)`는 맞는 메서드가 없으면 `NoSuchMethodException`을 던지는데 둘 다 실행 시점에야 드러난다. [Class javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html)

## 관련

- [[annotation|어노테이션]]
- [[component-scan|컴포넌트 스캔]]
- [[singleton|싱글톤 패턴]]
- [[brain/knowledge/language/java/runtime/jvm|JVM과 바이트코드]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Reflection]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - 클래스로더 이용 인스턴스 생성]]
- [[brain/notes/Interview/dog-study/dog-week02|면접 스터디 2주차 - Reflection이란]]
