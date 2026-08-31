---
title: 스트림
aliases:
  - 스트림
  - 자바 스트림
  - Optional
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

컨테이너를 덩어리로도 아니고 하나씩 꺼내는 것도 아닌, 흐름으로 보는 방식. 자바 8에 추가되었다.

## 하나씩 처리하면서 묶음을 유지하기

[[collection-framework|컬렉션]]은 여러 데이터의 묶음이다. 묶여 있으니 통째로 함수를 건네 걸러내거나 변환할 수 있다. 그런데 [[iterator|Iterator]]로 하나씩 꺼내 쓰기 시작하면 묶음이 풀리면서 `map`, `filter`, `reduce` 같은 고차 함수를 놓친다. 하나씩 처리하면서도 묶음의 이점을 유지하려는 것이 스트림이다.

```java
list.stream()
    .filter(x -> x > 10)
    .map(x -> x * 2)
    .forEach(System.out::println);
```

고차 함수를 이어 붙일 수 있어서 까다로운 데이터 처리를 짧게 적는다. 이름이 같은 [[I/O 스트림]]은 입출력 통로를 다루는 다른 것이다.

## 없는 데서 만드는 스트림

컬렉션에서 `.stream()`으로 얻는 것 말고 없는 데서 만드는 방법이 있다. `Stream.generate()`는 `Supplier`를 받아 입력 없이 값을 계속 만들어내고, `Stream.iterate()`는 시드 값과 규칙을 받아 직전 값으로 다음 값을 만든다.

```java
Random r = new Random();
Stream.generate(() -> r.nextInt())
    .limit(10)
    .forEach(System.out::println);

Stream.iterate(0, (i) -> i + 1)
    .limit(20)
    .forEach(System.out::println);
```

둘 다 무한 스트림이라 `limit()` 같은 것으로 잘라 써야 한다.

## 연산과 받는 인터페이스

자주 쓰는 연산은 받는 함수형 인터페이스로 구별된다.

| 연산      | 무엇                    | 받는 것                               |
| --------- | ----------------------- | ------------------------------------- |
| `filter`  | 조건에 맞는 것만 남긴다 | [[functional-interface\|Predicate]]   |
| `map`     | 다른 것으로 바꾼다      | Function                              |
| `forEach` | 원소마다 무언가 한다    | Consumer                              |
| `sorted`  | 정렬한다                | [[comparable-comparator\|Comparator]] |
| `collect` | 결과를 모은다           | Collector                             |

## Optional

모던 자바에는 Optional도 함께 들어왔다. 자바는 거의 모든 것이 참조 값이라 null이 될 가능성을 늘 안고 있고, 그래서 매번 null인지 확인해야 했다. Optional은 null이 될 수 있는 값을 실어 나르는 캐리어다.

```java
optional.isPresent();   // 값이 있으면 true, 자바 8
optional.isEmpty();     // 값이 없으면 true, 자바 11
```

비어 있는지 확인해 `NullPointerException`을 피하면서 값이 없는 상황도 다룰 수 있다. 다만 남발하지 않는다. 애초에 Optional을 꺼낼 일이 없는 상황이 가장 좋고, null이 나올 것 같다고 무조건 감싸기보다 방어적으로 짜는 편이 낫다.

## 참고

원본은 `isEmpty()`와 `isPresent()`를 나란히 두어 둘 다 자바 8의 Optional 기능처럼 읽힌다. `Optional` 자체는 자바 8에 들어왔지만 `isEmpty()`는 자바 11에 추가되었다. javadoc의 `Since` 태그가 `isEmpty()`에만 11로 붙어 있다. [Optional javadoc](<https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html#isEmpty()>)

## 관련

- [[functional-interface|함수형 인터페이스]]
- [[collection-framework|컬렉션 프레임워크]]
- [[iterator|Iterator]]

## 출처

- [[brain/notes/DevCourse/004|데브코스 회고 4편 - Stream, Optional]]
- [[brain/lectures/pl/fun-java/fun-java01|재미있는 자바 1강 - 모던 자바]]
