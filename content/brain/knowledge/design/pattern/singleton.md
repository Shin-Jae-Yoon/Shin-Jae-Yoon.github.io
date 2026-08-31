---
title: 싱글톤 패턴
aliases:
  - 싱글톤 패턴
  - 싱글턴
  - Bill Pugh
  - DCL
tags:
  - design
  - java
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

클래스의 인스턴스가 하나만 존재하도록 보장하는 생성 패턴. 만드는 방법이 여럿인데 각각이 앞 방법의 문제를 고치면서 나온 것이라, 순서대로 보면 왜 그렇게 쓰는지가 드러난다.

## 순수한 구현

인스턴스를 `private static` 필드에 두고, `getInstance()`에서 없으면 만들고 있으면 그대로 준다. 생성자는 `private`으로 막아 밖에서 만들지 못하게 한다.

```java
if (instance == null) {
    instance = new Settings();
}
```

스레드 안전하지 않다. 스레드 A가 `if`를 통과하고 아직 만들기 전에 스레드 B도 통과하면 인스턴스가 두 개 생긴다.

## synchronized

`getInstance()`에 `synchronized`를 붙여 한 스레드가 쓰는 동안 나머지가 못 들어오게 한다.

인스턴스가 이미 만들어진 뒤에는 동기화가 필요 없는데도 호출할 때마다 락이 걸려 자원이 낭비된다.

## DCL (Double Checked Locking)

두 번 확인해서 낭비를 줄인다. 동기화 시점을 미뤄 인스턴스가 없을 때만 락을 잡고, 필드에는 `volatile`을 붙인다.

`volatile`이 필요한 까닭은 스레드마다 CPU 캐시를 쓰기 때문이다. 한 스레드가 메인 메모리에 값을 쓰기 전에 다른 스레드가 읽으러 오면 시간차가 생기는데, `volatile`은 대입과 읽기를 모두 메인 메모리에서 하게 만들어 가시성을 보장한다. 아직 초기화가 끝나지 않은 객체를 다른 스레드가 보는 것을 이렇게 막는다.

그래도 완벽하지 않다. `volatile`은 JDK 1.5 이상에서만 제대로 동작하고, 자바 메모리 모델이 out-of-order write를 허용해 JVM에 따라 스레드 안전하지 않은 경우가 생긴다. 구현이 까다롭고 실수하기 쉽다.

## Bill Pugh Solution

Initialization on demand holder idiom이라고 부르며 권장되는 방법 중 하나다. Holder 역할을 하는 `private static` 내부 클래스를 두고 거기서 인스턴스를 만든다.

```java
public class Settings {
    private Settings() {}

    private static class SettingsHolder {
        private static final Settings SETTINGS = new Settings();
    }

    public static Settings getInstance() {
        return SettingsHolder.SETTINGS;
    }
}
```

`synchronized`를 한 글자도 쓰지 않고 같은 효과를 낸다. Holder 클래스는 `getInstance()`가 처음 참조하는 순간에야 초기화되고, 그 초기화를 JVM이 클래스마다 하나씩 가진 초기화 락으로 직렬화하기 때문이다. 스레드 안전과 지연 로딩을 둘 다 만족한다.

문제는 리플렉션과 직렬화로 싱글톤을 깰 수 있다는 것이다.

## enum

enum 자체가 싱글톤이다. 생성자가 `private`이고 상수만 갖는 클래스라 성질이 그대로 맞는다.

```java
public enum Settings {
    INSTANCE;
}
```

스레드 안전하고 리플렉션과 직렬화로도 깨지지 않는다. 무엇보다 간편하다. 대신 싱글톤을 해제할 때 번거롭고, enum이라 다른 클래스를 상속할 수 없다.

## 고르는 기준과 스프링 빈

지연 로딩이 필요하면 Bill Pugh 방식을, 간편함과 안전이 우선이면 enum을 쓴다.

스프링에서는 이 구현을 직접 할 일이 없다. [[spring-bean|스프링 빈]]은 기본이 싱글톤이라 컨테이너가 인스턴스를 하나만 만들어 관리한다. 다만 스프링의 싱글톤은 컨테이너당 하나이지 JVM당 하나가 아니라는 점이 다르다.

## 참고

원본은 Bill Pugh 방식이 스레드 안전한 근거를 `loadClass()` 안의 동기화라고 적었다. 클래스 로딩과 클래스 초기화는 다른 단계이고, Holder의 `static final` 필드가 딱 한 번만 초기화되는 것을 보장하는 쪽은 초기화 절차다. JLS는 클래스나 인터페이스 C마다 유일한 초기화 락 LC가 있고, 초기화 절차의 첫 단계가 그 LC를 얻을 때까지 기다리는 것이라고 정한다. [JLS SE 21, 12.4.2 Detailed Initialization Procedure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-12.html#jls-12.4.2)

## 관련

- [[design-pattern|디자인 패턴]]
- [[spring-bean|스프링 컨테이너와 빈]]
- [[synchronization|동기화]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - 싱글턴]]
- [[brain/books/do-it-java/chap06|Do it 자바 6장 - 싱글톤 패턴]]
