---
title: Comparable과 Comparator
aliases:
  - Comparable과 Comparator
  - Comparable
  - Comparator
  - compareTo
  - 객체 정렬
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

객체를 정렬하려면 무엇이 더 큰지를 자바에게 알려줘야 한다. 그 기준을 받는 통로가 `Comparable`과 `Comparator` 두 인터페이스다.

## ClassCastException이 나는 이유

`Arrays.sort()`는 `Object` 배열도 정렬한다고 되어 있지만, 참조형 인스턴스를 만들어 그냥 넣으면 `ClassCastException`이 난다. 정렬하려면 먼저 비교가 되어야 하는데, 무엇을 기준으로 비교할지 객체가 말해주지 않았기 때문이다.

```java
Item[] items = new Item[]{
        new Item("java", 5000),
        new Item("python", 4000),
        new Item("c++", 7500)
};

Arrays.sort(items);   // ClassCastException
```

## 붙박이 기준과 건네받는 기준

`Comparable`은 기준을 클래스 안에 붙박이로 두고, `Comparator`는 밖에서 건네받는다. 그 객체의 자연스러운 순서가 하나로 정해져 있으면 앞엣것을, 상황마다 기준이 달라지면 뒤엣것을 쓴다. 가격순이 기본이면서 이름순으로도 정렬해야 한다면 가격순은 `Comparable`로 박아두고 이름순만 필요할 때 넘긴다.

### Comparable

`compareTo(T o)`를 재정의해 자기 자신과 매개변수 객체를 비교한다. `java.lang`에 속해 있어 import가 필요 없다.

```java
class Item implements Comparable<Item> {
    @Override
    public int compareTo(Item o) {
        return this.price - o.price;
    }
}
```

반환값에 약속이 있다. 자기 자신이 크면 양수, 같으면 0, 작으면 음수다. `String`의 `compareTo`가 사전순으로 비교하는 것도 `String` 클래스가 이 인터페이스를 구현하고 있어서다.

```java
str1.compareTo(str2) < 0    // str1이 사전순으로 앞
```

### Comparator

`compare(T o1, T o2)`로 두 매개변수 객체를 비교하며, `java.util`에 있으니 import해야 한다. 기준이 밖에 있으므로 같은 타입을 여러 기준으로 정렬할 수 있다.

이름순과 가격순이 둘 다 필요할 때 `compareTo`를 두 벌 써놓고 하나씩 주석 처리할 수는 없다. 그럴 때 정렬하는 순간에 기준을 넘긴다.

```java
Arrays.sort(items, (a, b) -> a.getName().compareTo(b.getName()));
```

추상 메서드가 하나뿐인 [[functional-interface|함수형 인터페이스]]라서 클래스를 따로 만들지 않고 람다로 줄일 수 있다.

## 기준을 넘기지 않은 sort

`Arrays.sort(arr)`와 `Collections.sort(list)`는 `Comparable`을 쓰므로 구현이 없으면 오류가 난다. 기준을 넘긴 `Arrays.sort(arr, comparator)`는 그 기준을 쓴다.

## 기본형 배열의 내림차순

기본형 배열은 한 번에 내림차순으로 정렬할 방법이 없다. `Comparator`가 객체를 받으므로 `int[]`에는 넘길 수 없기 때문이다. 박싱해서 `Integer[]`로 만들어야 한다.

```java
Integer[] boxed = Arrays.stream(arr).boxed().toArray(Integer[]::new);
Arrays.sort(boxed, Collections.reverseOrder());
```

## 두 sort의 정렬 알고리즘

갈리는 기준은 배열이냐 컬렉션이냐가 아니라 기본형이냐 객체냐다. `Arrays.sort(int[])`처럼 기본형 배열을 정렬할 때만 Dual-Pivot Quick Sort가 쓰인다. `Arrays.sort(Object[])`는 Tim Sort이고, `Collections.sort(list)`도 그 자리로 내려가므로 같은 Tim Sort다. 여기서 기준을 넘기는 `Comparable`과 `Comparator`가 필요해지는 쪽은 언제나 객체를 정렬하는 Tim Sort 쪽이다.

Tim Sort는 삽입 정렬과 병합 정렬을 섞은 안정 정렬이라 평균과 최악이 모두 $O(N log N)$이다.

## 참고

원본은 정렬 알고리즘이 `Arrays.sort()`냐 `Collections.sort()`냐로 갈린다고 적었다. javadoc은 기본형 배열과 객체 배열을 나눈다. `sort(int[])`에는 "Dual-Pivot Quicksort by Vladimir Yaroslavskiy, Jon Bentley, and Joshua Bloch"라고 적혀 있고, `sort(Object[])`에는 "adapted from Tim Peters's list sort for Python"이라는 안정 병합 정렬이라고 적혀 있다. `Collections.sort()`는 `List.sort()`를 거쳐 후자로 간다. [Arrays javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Arrays.html)

원본이 적은 최악 $O(N^2)$도 지금은 맞지 않는다. 자바 11 javadoc은 "offers O(n log(n)) performance on many data sets that cause other quicksorts to degrade to quadratic performance"라고 적었지만, 자바 14에서 재귀 깊이가 한계를 넘으면 힙 정렬로 넘어가도록 바뀌면서 문구가 "on all data sets"로 바뀌었다. [JDK-8226297](https://bugs.openjdk.org/browse/JDK-8226297)

## 관련

- [[collection-framework|컬렉션 프레임워크]]
- [[functional-interface|함수형 인터페이스]]
- [[stable-sort|안정 정렬]]

## 출처

- [[brain/lectures/pl/fun-java/fun-java06|재미있는 자바 6강 - Comparable, Comparator]]
- [[brain/notes/CodeTree/array|코드트리 정렬 - 객체 정렬]]
