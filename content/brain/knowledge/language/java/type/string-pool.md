---
title: 문자열과 String Pool
aliases:
  - 문자열과 String Pool
  - String
  - 상수 풀
  - intern
  - StringBuilder
  - StringBuffer
tags:
  - language
  - java
origin:
  verified: 2026-08-31
  scouted: 2026-08-30
---

`String`은 대표적인 [[immutable-object|불변 객체]]다. 변수에 할당된 뒤에는 참조를 바꾸거나 내부 상태를 변경할 방법이 없다.

## String이 불변인 이유

성능이 첫 이유다. 문자열 리터럴을 상수 풀에 캐싱해두고 재사용하므로 heap 공간을 크게 절약한다.

동기화도 함께 딸려 온다. 값이 바뀌지 않으니 여러 스레드가 같은 문자열을 공유해도 안전하다. 어떤 스레드가 값을 바꾸려 하면 원본을 수정하는 대신 새 문자열이 만들어진다.

해시코드를 캐싱할 수 있다는 것도 크다. `String`은 `HashMap`, `HashTable`, `HashSet`의 키로 널리 쓰이는데, `hashCode()` 구현을 보면 아직 계산한 적이 없을 때 한 번만 실제로 계산하고 그 뒤로는 저장해둔 값을 돌려주도록 재정의되어 있다. 키가 가변이라면 넣을 때와 찾을 때의 해시가 달라져서, 원하는 값을 찾으려고 계산을 두 번 세 번 되풀이해야 한다.

마지막은 보안이다. 사용자 이름, 암호, 연결 URL 같은 중요한 정보가 문자열로 저장되고 JVM 클래스 로더도 문자열을 광범위하게 쓴다. 문자열이 가변이면 메서드를 호출한 클라이언트가 참조를 계속 쥐고 있다가 보안 검사를 통과한 뒤에 값을 바꿔버릴 수 있다.

## 리터럴과 new의 차이

```java
String s1 = "Cat";
String s2 = "Cat";
String s3 = new String("Cat");

s1 == s2;   // true
s1 == s3;   // false
```

리터럴로 만들면 String Pool에 들어가고, 같은 값이 이미 있으면 그 참조를 그대로 쓴다. `new`로 만들면 상수 풀에 값이 있어도 heap에 새 객체를 따로 만든다. 불변 객체인 String의 이점을 못 누리는 방식이라 특별한 이유가 없으면 쓰지 않는다.

## intern()

`intern()`이 그 사이를 잇는다. 풀에 객체가 있으면 그것을 그대로 돌려주고, 없으면 호출된 객체를 풀에 추가한 뒤 참조를 돌려준다.

```java
String s1 = "Hello";
String s2 = "Java";
String s3 = s1 + s2;   // 런타임에 만들어져 힙에 놓인다. 풀에는 안 들어간다
```

## StringBuffer와 StringBuilder

문자열을 이어 붙일 때마다 새 객체가 생기므로 연산이 잦으면 성능이 나빠진다. 기존 객체의 공간이 부족해지면 버퍼 크기를 늘려 유연하게 동작하는 가변 문자열 클래스가 그래서 있다.

`StringBuffer`는 메서드마다 `synchronized` 키워드가 붙어 있어 멀티스레드 환경에서도 동기화를 지원한다. `StringBuilder`는 동기화를 보장하지 않는 대신 가볍다. 문자열 연산 자체가 적으면 `String`을 그대로 쓰고, 연산이 많고 여러 스레드가 공유하는 자리라면 `StringBuffer`, 연산이 많아도 단일 스레드라면 `StringBuilder`를 고른다.

자바와 스프링은 대개 멀티스레드 환경이라 실무에서는 `String`이나 `StringBuffer`를 쓰는 편이라는 이야기가 나온다. 다만 메서드 안의 지역 변수라면 스레드가 공유하지 않으니 `StringBuilder`가 맞다.

`setLength(0)`으로 내용을 비우면 새 객체를 만들지 않고 같은 버퍼를 재사용할 수 있다.

## 참고

원본은 `s1 + s2`의 결과까지 String Pool에 들어간다고 적었다. 양쪽이 변수이면 연결은 런타임에 `StringBuilder`로 일어나고 결과는 힙에 놓인다. `s3 == "HelloJava"`는 거짓이다. 풀에 넣으려면 `intern()`을 부르거나 양쪽이 컴파일 타임 상수여야 한다. [JLS 15.18.1](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.18.1)

## 관련

- [[immutable-object|불변 객체]]
- [[equals-hashcode|equals와 hashCode]]
- [[synchronization|동기화]]
- [[memory-and-gc|메모리 구조]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week01|면접 스터디 1주차 - String, String이 불변인 이유]]
- [[brain/notes/DevCourse/001|데브코스 회고 1편 - String, StringBuilder, StringBuffer]]
