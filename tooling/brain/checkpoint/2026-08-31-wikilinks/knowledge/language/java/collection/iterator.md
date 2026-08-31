---
title: Iterator
aliases:
  - Iterator
  - 반복자
  - hasNext
  - for each
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

자료구조에서 자료를 꺼내기 위한 인터페이스다. 어떤 컬렉션이든 같은 방식으로 순회할 수 있게 해준다.

## 내부 구조를 감추는 공통 인터페이스

컬렉션마다 내부 구조가 전혀 다르다. 배열이기도 하고 연결된 노드이기도 하다. 그런데 다음 것을 달라는 요구는 어느 쪽에나 똑같다.

그 공통점만 인터페이스로 뽑아두면 쓰는 쪽은 내부 구조를 몰라도 된다. `for each` 문이 어떤 컬렉션에나 도는 이유가 이것이다.

```java
for (String s : list) { }   // 내부적으로 Iterator를 쓴다
```

## hasNext와 next

`hasNext()`로 꺼낼 것이 남았는지 확인하고 `next()`로 하나 꺼낸다. 없는데 `next()`를 부르면 예외가 난다.

```java
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
}
```

`remove()`는 방금 꺼낸 것을 제거한다. 무엇을 지울지 정해져 있어야 하므로 `next()`가 먼저 불려야 한다.

## 연결 리스트에서의 값어치

[[연결 리스트]]는 k번째 자리를 찾는 데 $O(N)$이 걸린다. 반복자를 한 번 그 자리에 잡아두면 바로 옆의 삭제와 탐색은 $O(1)$이다. 이 구조의 성능을 실제로 뽑아 쓰려면 인덱스 대신 반복자로 다뤄야 한다.

## ListIterator

원소를 끼워 넣는 일은 `Iterator`가 아니라 `ListIterator`의 몫이다. `LinkedList.listIterator()`로 얻고, 여기에는 `add(E)`와 함께 뒤에서 앞으로 가는 `previous()`, `hasPrevious()`가 있다.

```java
ListIterator<Character> it = l.listIterator();   // l : ['a', 'b', 'c']
it.next();      // remove 전에 next 필요
it.remove();    // 원소 'a'를 제거
it.add('d');    // 원소 'd'를 추가
```

## 순회 중 컬렉션 변경

순회하는 도중 컬렉션이 바뀌면 반복자가 어디까지 갔는지 알 수 없게 된다.

```java
for (String s : list) {
    list.remove(s);      // ConcurrentModificationException
}
```

지우려면 반복자 쪽의 `remove()`를 불러야 한다.

## 묶음으로 다루던 이점

하나씩 꺼내 쓰는 순간 묶음으로 다루던 이점은 잃는다. 컬렉션 전체에 `map`이나 `filter` 같은 함수를 건네는 방식이 불가능해지기 때문이다. 그것을 되찾으려고 나온 것이 [[스트림]]이다.

## 참고

원본은 `ListIterator` 예제를 두고 반복자의 주요 메서드에 `add()`를 함께 적었다. 자바 21의 `java.util.Iterator`가 선언하는 것은 `hasNext()`, `next()`, `remove()`, `forEachRemaining()`뿐이고 `add()`는 없다. [Iterator javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Iterator.html)

원소를 끼워 넣는 `add(E)`와 뒤로 거슬러 가는 `previous()`, `hasPrevious()`는 `List` 전용으로 확장된 `ListIterator`가 선언한다. 삽입까지 $O(1)$이라는 말은 이쪽을 잡았을 때만 성립한다. [ListIterator javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ListIterator.html)

## 관련

- [[컬렉션 프레임워크]]
- [[스트림]]
- [[연결 리스트]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java07|재미있는 자바 7강 - Iterator Interface]]
- [[brain/notes/DevCourse/004|데브코스 회고 4편 - Iterator]]
- [[brain/notes/CodeTree/dataStructure|코드트리 자료구조 - Iterator]]
