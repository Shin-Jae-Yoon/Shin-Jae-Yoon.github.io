---
title: 함수형 인터페이스
aliases:
  - 함수형 인터페이스
  - 람다
  - Lambda
  - 람다 인터페이스
  - Consumer
  - Function
  - Predicate
tags:
  - language
  - java
origin:
  verified: 2026-08-30
---

추상 메서드가 단 하나뿐인 인터페이스. 무엇을 구현해야 하는지가 하나로 확정되므로, 클래스를 만들지 않고 표현식만 적어 넘길 수 있다.

## 하나로 확정되는 구현

인터페이스는 인스턴스를 만들 수 없어서 그 자리에서 구현하려면 [[anonymous-class|익명 클래스]]가 필요했다. 추상 메서드가 하나뿐이면 거기 적은 코드가 그 하나를 구현한 것으로 확정되고, `new`나 `@Override` 같은 뻔한 부분을 걷어낸 람다 표현식이 성립한다. 익명 클래스가 람다로 줄어드는 과정은 그 항목에 적어두었다.

## 행위를 넘겨받는 컨테이너

이렇게 하면 기능을 쓰는 쪽이 그 기능을 직접 정의한다. 컨테이너가 함수를 매개변수로 받으면 무엇을 할지는 부르는 곳이 정하고, 컨테이너는 그것을 모른 채 원소를 넘겨주기만 하면 된다. 같은 컨테이너가 걸러내기도 하고 변환하기도 한다. 구현부를 하나도 건드리지 않고 호출하는 쪽에서 동작을 바꾸는 것이라 [[dependency-injection|의존성 주입]]과 같은 발상이고, 객체 대신 행위를 주입하는 셈이다.

## 직접 만들 때

직접 만들 때는 추상 메서드를 하나만 두고 `@FunctionalInterface`를 붙인다.

```java
@FunctionalInterface
public interface MyRunnable {
    void run();
}
```

## 컬렉션에 붙여보기

컬렉션에 붙여보면 감이 온다. 원소마다 무언가 하고 반환은 없는 `foreach`에는 `Consumer`가 맞는다.

```java
public void foreach(Consumer<T> consumer) {
    for (int i = 0; i < list.size(); i++) {
        T data = list.get(i);
        consumer.accept(data);
    }
}
```

원소를 다른 타입으로 바꾸는 `map`을 만들다 보면 타입 변수에서 걸린다.

```java
public <U> MyCollection<U> map(Function<T, U> function) {
    List<U> newList = new ArrayList<>();
    foreach(data -> newList.add(function.apply(data)));
    return new MyCollection<>(newList);
}
```

`MyCollection`이 들고 있는 타입 변수는 `<T>` 하나뿐인데 `<U>`는 이 메서드에서만 쓴다. 클래스가 아니라 메서드에 선언해야 하고, 반환 타입 앞에 붙은 `<U>`가 그 선언이다. 빠뜨리면 컴파일 오류가 난다.

조건에 맞는 것만 남기는 `filter`는 `boolean`을 돌려주는 `Predicate`를 받는다.

```java
public MyCollection<T> filter(Predicate<T> predicate) {
    List<T> newList = new ArrayList<>();
    foreach(data -> {
        if (predicate.test(data)) newList.add(data);
    });
    return new MyCollection<>(newList);
}
```

## java.util.function에 있는 넷

자주 쓰는 형태는 `java.util.function`에 미리 만들어져 있고, 입력과 출력이 있느냐 없느냐로 갈린다.

| 인터페이스      | 메서드        | 입력 | 출력          |
| --------------- | ------------- | ---- | ------------- |
| `Consumer<T>`   | `accept(T t)` | 있다 | 없다          |
| `Supplier<T>`   | `get()`       | 없다 | 있다          |
| `Function<T,R>` | `apply(T t)`  | 있다 | 다른 타입으로 |
| `Predicate<T>`  | `test(T t)`   | 있다 | `boolean`     |

이 넷이 [[stream|스트림]]의 연산에 그대로 대응된다. 원소마다 무언가 하고 반환이 없는 `forEach`가 `Consumer`를, 원소를 다른 것으로 바꾸는 `map`이 `Function`을, 조건에 맞는지 판단하는 `filter`가 `Predicate`를 받는다. 아무것도 받지 않고 값을 만들어내는 `Stream.generate`에는 `Supplier`가 들어간다.

## 관련

- [[anonymous-class|익명 클래스]]
- [[anonymous-class|메서드 레퍼런스]]
- [[stream|스트림]]
- [[default-method|디폴트 메서드]]

## 출처

- [[brain/notes/DevCourse/003|데브코스 회고 3편 - 함수형 인터페이스]]
- [[brain/notes/DevCourse/004|데브코스 회고 4편 - 함수형 인터페이스 적용]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - 람다 인터페이스]]
