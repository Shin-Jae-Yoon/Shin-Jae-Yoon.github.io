---
title: 제네릭
aliases:
  - 제네릭
  - Generic
  - 타입 매개변수
tags:
  - language
  - java
origin:
  verified: 2026-08-31
---

타입을 나중에 정할 수 있게 하는 문법이다.

## Object로 담을 때의 형 변환

모든 클래스의 최상위 부모가 `Object`이므로, `Object` 타입 필드를 두면 무엇이든 담을 수 있는 상자가 된다. 부모 타입으로 자식 인스턴스를 참조하는 것이라 어떤 객체든 들어온다.

```java
ObjectBox box = new ObjectBox();
box.set("kim");
String str = (String) box.get();     // 형 변환이 필요하다

box.set(new Integer(5));             // 아무거나 들어간다
Integer i = (Integer) box.get();
```

`get()`의 반환 타입이 `Object`라 꺼낼 때마다 원래 타입으로 바꿔줘야 한다. 게다가 아무 타입이나 들어가므로 문자열을 넣고 정수로 꺼내려 해도 컴파일이 통과하고 실행할 때 터진다.

## 타입 매개변수 선언

```java
class Box<T> {
    private T item;
    public void set(T item) { this.item = item; }
    public T get() { return item; }
}

Box<String> box = new Box<>();
box.set("kim");
String str = box.get();      // 형 변환 불필요
box.set(5);                  // 컴파일 오류
```

`<T>`는 T라는 이름의 타입을 나중에 정하겠다는 선언이다. T는 Type의 약자라 관례적으로 많이 쓰일 뿐, 다른 이름을 써도 된다. `Box<String>`이라고 적는 순간 그 안의 모든 `T` 자리에 `String`이 들어간다.

정해진 타입만 쓰도록 강제하니 잘못된 타입이 컴파일 시점에 걸리고, 꺼낼 때 형 변환하지 않아도 되며, 코드를 읽는 사람도 무엇이 담기는지 바로 안다.

## 선언하는 자리

선언은 클래스 이름 뒤나 메서드의 반환 타입 앞에 붙는다.

```java
class Box<T> { }                                    // 클래스에 선언
public <U> Box<U> map(Function<T, U> function) { }  // 메서드에 선언
```

메서드에 붙이는 것은 그 타입이 그 메서드에서만 쓰일 때다. 클래스에는 `<T>`밖에 없는데 변환 결과 타입 `<U>`가 필요하면 메서드 쪽에 선언해야 한다. [[함수형 인터페이스]]를 받는 `map`이 그런 모양이다.

[[컬렉션 프레임워크]]는 `List<E>`나 `Map<K, V>`처럼 대부분 제네릭으로 되어 있고, 쓰지 않으면 `Object`로 저장된다. 컬렉션과 제네릭을 늘 같이 쓰게 되는 이유다.

## 관련

- [[컬렉션 프레임워크]]
- [[함수형 인터페이스]]
- [[다형성]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java07|재미있는 자바 7강 - 제네릭]]
- [[brain/notes/DevCourse/004|데브코스 회고 4편 - 제네릭 메서드]]
