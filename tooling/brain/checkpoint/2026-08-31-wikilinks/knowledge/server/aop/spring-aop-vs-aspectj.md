---
title: Spring AOP와 AspectJ
aliases:
  - Spring AOP와 AspectJ
  - AspectJ
  - AOP vs Interceptor
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

같은 [[AOP]]를 자바에서 구현한 두 갈래. 스프링 AOP는 간단한 AOP 기능을, AspectJ는 완벽한 AOP 기능을 목표로 한다.

## 컨테이너가 만드는 제약

스프링 AOP가 런타임 위빙만 하는 이유는 스프링 컨테이너가 객체 생성을 관리하기 때문이다. 컨테이너가 빈을 만들면서 프록시로 감싸는 방식이라, 컨테이너가 만들지 않은 객체에는 손댈 자리가 없다. 대상이 스프링 빈으로 한정되는 것도 같은 이유다. `@Aspect`로 Aspect임을 표시하고 `@Component`로 빈 등록까지 해야 하는 것이 여기서 나온다.

AspectJ는 컨테이너를 거치지 않는다. 컴파일 시점이나 클래스 로딩 시점에 바이트코드를 직접 조작하므로 스프링이 모르는 객체에도 적용된다.

## 적용 범위와 위빙 시점

|            | Spring AOP  | AspectJ                      |
| ---------- | ----------- | ---------------------------- |
| Join point | 메서드만    | 생성자, 필드, 메서드 등 다양 |
| Weaving    | 런타임에만  | 컴파일과 클래스 로딩 시점    |
| 대상       | 스프링 빈만 | 모든 자바 객체               |

## 인터셉터와 나뉘는 기준

[[Filter와 Interceptor]]에서 본 것처럼 셋 다 공통 관심사를 다루는데, AOP는 층이 더 안쪽이다.

AOP는 메서드 전후 어디에든 자유롭게 설정할 수 있고, 인터셉터는 컨트롤러 전후로 고정이다. 대상을 지정하는 방법도 다르다. 인터셉터와 필터는 주소로 걸러내야 하지만 AOP는 주소, 파라미터, 애노테이션 등으로 지정한다.

실질적인 기준이 되는 것은 파라미터다. Advice는 `JoinPoint`나 `ProceedingJoinPoint`를 받고, 인터셉터는 `HttpServletRequest`와 `HttpServletResponse`를 받는다. HTTP 요청 정보가 필요하면 인터셉터, 메서드 호출 정보가 필요하면 AOP다.

## 참고

원본은 AspectJ가 런타임 위빙을 제공하지 않는 이유로 스프링의 IoC와 DI가 없기 때문이라고 적었다. AspectJ는 로드 타임 위빙을 제공하고 스프링도 `@EnableLoadTimeWeaving`으로 그것을 켤 수 있으므로 이유가 성립하지 않는다. AspectJ가 프록시 대신 바이트코드를 직접 짜 넣는 방식을 택했을 뿐이다. [Spring Framework Reference - Load-time Weaving with AspectJ](https://docs.spring.io/spring-framework/reference/core/aop/using-aspectj.html#aop-aj-ltw)

## 관련

- [[AOP]]
- [[프록시의 한계]]
- [[Filter와 Interceptor]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week04|면접 스터디 4주차 - Spring AOP vs AspectJ]]
