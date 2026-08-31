---
title: 컬렉션 프레임워크
aliases:
  - 컬렉션 프레임워크
  - Collections Framework
  - Collection 인터페이스
  - List
  - Set
  - Map
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

자바 2부터 들어온 자료구조 클래스 묶음이다. 자료를 다룰 때 쓰는 여러 인터페이스와 그것을 구현한 클래스들로 이루어져 있다. 쓰는 쪽은 구현체가 아니라 인터페이스로 받는 것이 원칙이다.

## Collection과 Map의 계층

```
Collection ─ List (순서 O, 중복 O)
           ─ Set  (순서 X, 중복 X)

Map (key-value, 별도 계층)
```

`Map`은 `Collection`을 상속하지 않는다. 담는 단위가 값 하나가 아니라 키와 값의 쌍이라 성격이 다르기 때문이다.

## 제네릭과 함께 쓰는 이유

자료구조 객체는 [[generic|제네릭]]을 쓰지 않으면 `Object` 타입으로 저장한다. 꺼낼 때마다 형 변환해야 하며 잘못된 타입을 넣어도 컴파일 시점에 걸리지 않는다. 그래서 사실상 항상 제네릭과 함께 쓴다.

```java
List list = new ArrayList();            // Object로 저장된다
List<String> list = new ArrayList<>();  // 이렇게 쓴다
```

## 인터페이스로 받고 구현체로 만들기

참조 타입은 인터페이스로, 인스턴스 타입은 클래스로 잡는다. `List`로 받아두면 나중에 `LinkedList`로 갈아 끼워도 쓰는 코드가 그대로다. `Collection`을 구현한 클래스는 아주 많은데, 그것들의 메서드를 전부 외우는 것보다 인터페이스 하나의 메서드를 외우는 편이 낫기도 하다. [[polymorphism|다형성]]이 실제로 쓰이는 가장 흔한 자리다.

## Collection

여기에 자료가 있다는 것을 표현하는 바구니다. 순서를 기억하지 않고 중복을 허용한다. `add(Object)`로 넣고 `size()`로 개수를 세고 `iterator()`로 전부 꺼낸다. 꺼낼 자료가 있는지 살피고, 있으면 꺼내고, 없을 때까지 그 두 과정을 반복한다. [[iterator|Iterator]]가 그 반복을 맡는다.

## List

순서가 중요한 자료를 다룬다. `Collection`을 상속하므로 그 메서드를 전부 쓸 수 있고 순서를 기억하니 `get(int)`로 원하는 자리의 값을 꺼낼 수 있다. 구현체는 [[brain/knowledge/algorithm/data-structure/array|ArrayList]]와 [[linked-list|LinkedList]]다.

## Set

중복을 허용하지 않아 같은 값은 하나만 저장된다. 저장되는 객체는 `equals()`와 `hashCode()`를 재정의해야 한다. `HashSet`은 자료를 넣을 때 먼저 `hashCode()`를 불러 그 값의 바구니를 찾고 같은 바구니에 이미 무언가 있으면 `equals()`로 값을 비교한다. 재정의하지 않으면 `Object`의 것이 쓰이는데 그것은 아무것도 검사해주지 않는다. 내용이 같은 객체가 그대로 중복해서 들어간다. [[equals-hashcode|equals와 hashCode]]

## Map

키와 값의 쌍을 담고 같은 키로는 하나의 값만 저장된다. `put(key, value)`로 넣고 `get(key)`로 꺼낸다. 같은 키에 다시 넣으면 기존 값을 덮어쓴다. `keySet()`은 키를 모아 `Set`으로 돌려준다. 키는 유일하므로 모아놓으면 그 자체로 `Set`이 되기 때문이다. 문자열이 키가 될 수 있는 것도 `String` 클래스가 `hashCode()`와 `equals()`를 구현하고 있어서다.

## 없는 키를 꺼낼 때

`get()`은 없는 키에 `null`을 돌려준다. 그것을 그대로 쓰면 `NullPointerException`이 난다. `containsKey()`로 먼저 확인해 참일 때만 꺼낸다.

## 참고

원본은 없는 키를 꺼낼 때 `containsKey()`로 먼저 확인하라고만 적었다. 자바 8에 들어온 `Map.getOrDefault(key, defaultValue)`는 "지정한 키에 매핑된 값을 돌려주고, 매핑이 없으면 `defaultValue`를 돌려준다"고 정의되어 있어 확인과 꺼내기를 한 번에 한다. [Map javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Map.html)

## 관련

- [[equals-hashcode|equals와 hashCode]]
- [[generic|제네릭]]
- [[comparable-comparator|Comparable과 Comparator]]
- [[iterator|Iterator]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java07|재미있는 자바 7강 - 컬렉션 프레임워크]]
- [[brain/notes/DevCourse/004|데브코스 회고 4편 - Collection]]
- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - HashMap]]
