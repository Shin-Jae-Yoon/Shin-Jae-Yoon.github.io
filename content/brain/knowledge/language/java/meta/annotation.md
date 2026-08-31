---
title: 어노테이션
aliases:
  - 어노테이션
  - 메타 어노테이션
  - "@Retention"
  - "@Target"
tags:
  - language
  - java
  - spring
origin:
  verified: 2026-08-31
  scouted: 2026-08-31
---

코드 사이에 주석처럼 쓰이지만 특별한 의미와 기능을 갖는 표식. 메타데이터의 일종으로, 애플리케이션이 처리할 데이터가 아니라 컴파일러와 도구를 위한 정보다.

## 표식이 기능이 되는 과정

쓰이는 자리는 여럿이다. 컴파일러가 코드 작성 문법을 검사하도록 정보를 준다. 빌드나 배치 때 개발 도구가 코드를 자동 생성하는 데도 쓰이고, 실행 중에 특정 기능을 실행하라고 알려주기도 한다.

```
1. 어노테이션을 정의한다
2. 원하는 위치에 배치한다
3. 코드가 실행되는 중 리플렉션으로 읽어 기능을 수행한다
```

마지막 단계가 없으면 아무 일도 일어나지 않는다. 어노테이션 자체는 동작을 갖지 않는 단순한 표식이고, [[reflection|리플렉션]]이 적용 여부와 엘리먼트 값을 읽어 처리해야 비로소 기능이 된다. 스프링이 `@Component`가 붙은 클래스를 찾아 빈으로 등록하는 일이 정확히 이 과정이다. [[component-scan|컴포넌트 스캔]]

## 표준 어노테이션

`@Override`는 선언한 메서드가 오버라이드되었음을 나타낸다. 상위 클래스나 인터페이스에서 그 메서드를 찾을 수 없으면 컴파일 에러가 난다. `@FunctionalInterface`도 검사하는 쪽이다. 자바 8부터 [[functional-interface|함수형 인터페이스]]를 지정하는 데 쓰고, 추상 메서드가 없거나 default를 뺀 메서드가 둘 이상이면 컴파일 오류를 낸다. 의도를 적어두면 컴파일러가 그 의도가 지켜지는지 대신 확인해준다.

경고를 다루는 쪽도 있다. `@Deprecated`는 해당 메서드가 곧 없어질 것이니 쓰지 말라고 알리고, `@SuppressWarnings`는 선언한 곳의 컴파일 경고를 무시한다.

## 메타 어노테이션

직접 정의해 쓰는 커스텀 어노테이션을 만들 때 붙이는 어노테이션이다. 커스텀 어노테이션은 `@interface`로 작성하고, 내부에 값을 두려면 `default 값` 형태로 설정한다.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface PerformanceCheck {
    String value() default "";
}
```

`@Retention`은 어노테이션이 유지되는 기간을 정하고, `@Target`은 클래스나 메서드, 필드처럼 붙일 수 있는 대상을 지정한다.

그 밖에 `@Documented`는 어노테이션 정보를 javadoc 문서에 포함시킨다. `@Inherited`를 붙이면 하위 클래스에 상속되고, `@Repeatable`을 붙이면 같은 어노테이션을 여러 번 붙일 수 있다.

## 참고

원본은 `@Retention`이 유지 기간을 정한다는 데까지만 적었다. `RetentionPolicy` javadoc이 세 값을 이렇게 가른다. `SOURCE`는 "컴파일러가 버린다", `CLASS`는 "컴파일러가 클래스 파일에 기록하지만 VM이 실행 시점까지 들고 있을 필요는 없다"이며 이것이 기본값이고, `RUNTIME`은 "컴파일러가 클래스 파일에 기록하고 VM이 실행 시점까지 들고 있어서 리플렉션으로 읽을 수 있다"이다. 어노테이션을 리플렉션으로 읽어 처리하려면 `RUNTIME`이어야 하는 까닭이 여기 있다. [RetentionPolicy javadoc](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/annotation/RetentionPolicy.html)

## 관련

- [[reflection|리플렉션]]
- [[component-scan|컴포넌트 스캔]]
- [[aop-basics|AOP]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week05|면접 스터디 5주차 - Annotation]]
