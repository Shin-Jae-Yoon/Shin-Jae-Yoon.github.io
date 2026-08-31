---
title: 익명 클래스
aliases:
  - 익명 클래스
  - Anonymous Class
  - 메서드 레퍼런스
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

이름 없이 그 자리에서 정의하고 바로 인스턴스를 만드는 클래스.

## 한 번 쓰고 마는 구현

[[인터페이스]]와 추상 클래스는 인스턴스를 만들 수 없어서 구현 클래스를 따로 두어야 했다. 한 번 쓰고 말 구현에 클래스 파일을 하나 만드는 것이 번거로웠고, 익명 클래스가 그 수고를 없앤다. 재사용할 일이 없다고 판단한 자리에 쓴다.

## new 뒤에 따라오는 중괄호

`new 생성자() { 구현 }` 형태다. 보통 생성자 호출은 세미콜론으로 끝나는데, 익명 클래스는 뒤에 중괄호가 따라붙고 그 안에서 필요한 메서드를 재정의한다.

```java
MyRunnable r = new MyRunnable() {
    @Override
    public void run() { System.out.println("hello!!!"); }
};
```

인터페이스를 매개변수로 받는 메서드에는 그 자리에서 만들어 넘기기도 한다.

```java
runnableExecute.execute(new MyRunnable() {
    @Override
    public void run() { System.out.println("hello!!!"); }
});
```

## 람다로 줄이기

이 코드에는 뻔한 부분이 많다. `new`, 타입 이름, `@Override`, 메서드 시그니처가 전부 문맥에서 읽힌다. 추상 메서드가 하나뿐이라면 무엇을 구현하는 것인지 확정되므로 그것들을 몽땅 지울 수 있다. 자바 8에 들어온 람다 표현식이다.

```java
runnableExecute.execute(() -> System.out.println("hello!!!"));
```

추상 메서드를 하나만 가져서 이렇게 줄일 수 있는 인터페이스를 [[함수형 인터페이스]]라고 부른다.

## 메서드 레퍼런스

메서드 레퍼런스는 여기서 한 단계 더 줄인 것이다. 람다가 받은 값을 손대지 않고 그대로 다른 메서드에 넘기기만 한다면 그 메서드 이름만 적어도 뜻이 통한다.

```java
MyMapper<String, Integer> m = (str) -> str.length();
MyMapper<String, Integer> m = String::length;
```

IDE가 노란 줄을 긋고 바꾸라고 권하는 것이 이 경우다. 짧아지는 것 말고 얻는 것이 하나 더 있다. 중간에 아무 처리도 하지 않으니 값이 바뀌지 않았다고 확신할 수 있다. 넓게 보면 입력 값을 바꾸지 말라는 표현이고, 나중에 유지보수하는 사람이 결과를 마음대로 손대지 못하게 막아준다.

## 참고

원본은 익명 클래스를 람다로 줄이는 데까지만 다룬다. 람다가 익명 클래스를 다 대신하지는 못한다. 자바 언어 명세는 람다로 인스턴스를 만들 수 있는 대상을 함수형 인터페이스, 곧 "`Object`의 메서드를 뺀 추상 메서드가 딱 하나인 인터페이스"로 한정한다. 추상 메서드가 둘 이상이면 어느 것을 구현하는지 확정되지 않아 줄일 수 없다. [JLS SE 21 §9.8](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.8)

람다 표현식의 문법은 매개변수와 몸체뿐이고 몸체는 식 하나 아니면 블록이다. 필드를 선언할 자리가 없으니 상태를 들고 있어야 하면 익명 클래스가 남는다. [JLS SE 21 §15.27](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27)

`this`가 가리키는 것도 다르다. 명세는 "람다 몸체 안의 `this`가 가리키는 값은 그것을 둘러싼 문맥의 `this`가 가리키는 값과 같다"고 적는다. 익명 클래스의 `this`는 자기 인스턴스를 가리키므로, 자기 자신을 가리키는 `this`가 필요한 자리에는 익명 클래스를 쓴다. [JLS SE 21 §15.8.3](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.8.3)

## 관련

- [[함수형 인터페이스]]
- [[인터페이스]]
- [[스트림]]

## 출처

- [[brain/notes/DevCourse/003|데브코스 회고 3편 - 익명 클래스와 람다 표현식, 메서드 레퍼런스]]
- [[brain/lectures/pl/fun-java/fun-java05|재미있는 자바 5강 - 익명 클래스]]
