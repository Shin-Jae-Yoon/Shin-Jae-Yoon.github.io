---
title: PSA
aliases:
  - Portable Service Abstraction
  - 서비스 추상화
tags:
  - server
  - spring
origin:
  verified: 2026-08-30
---

환경과 세부 기술이 바뀌어도 일관된 방식으로 그 기술에 접근할 수 있게 해주는 것. 추상화 계층을 하나 두어 아래의 기술을 감추고 쓰는 쪽에는 편의를 주는 방식을 서비스 추상화라고 부른다.

## 표준 인터페이스와 POJO

표준 인터페이스를 정의하고, 여러 기술이 그 인터페이스의 구현체가 되고, 애플리케이션은 인터페이스만 본다. 이렇게 하면 새로운 엔터프라이즈 기술을 도입하면서도 객체는 [[pojo|POJO]]로 남는다. Hibernate를 쓰지만 Hibernate를 의존하지 않는 것이다.

자바 객체가 ORM을 쓰려고 Hibernate를 직접 의존하는 순간 특정 기술에 종속되어 POJO가 아니게 된다. 그래서 [[orm-jpa|JPA]]라는 표준 인터페이스를 정의해두고 ORM 프레임워크들이 그 구현체가 되게 했다.

## 스프링 안의 세 가지 예

스프링에서 PSA가 적용된 대표적인 예는 셋이다. [[jdbc|JDBC]] 아래에는 MySQL과 PostgreSQL과 Oracle 드라이버가 있고, JPA 아래에는 Hibernate와 EclipseLink가 있으며, 트랜잭션 매니저 아래에는 JDBC 트랜잭션과 JPA 트랜잭션과 JTA가 있다.

트랜잭션 매니저가 특히 좋은 예다. DB에 JDBC로 접근하든 JPA로 접근하든 `@Transactional` 하나로 트랜잭션이 유지된다. 이렇게 하나의 추상화로 여러 서비스를 묶어둔 것을 스프링에서 PSA라고 부른다.

## DIP와 갈리는 시점

[[dip|DIP]]와 구조가 거의 같은데 시점이 다르다. DIP는 내 코드를 설계할 때의 원칙이라 인터페이스를 내가 정의하고, PSA는 프레임워크가 이미 만들어둔 추상화라 나는 그것을 쓴다. 원리는 하나이고 PSA는 그 원리를 프레임워크 수준에서 적용해둔 결과물이다.

## 관련

- [[pojo|POJO]]
- [[dip|DIP]]
- [[orm-jpa|ORM과 JPA]]
- [[declarative-transaction|선언적 트랜잭션]]

## 출처

- [[brain/notes/DevCourse/002|데브코스 회고 2편 - POJO와 PSA]]
- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - PSA와 JPA]]
