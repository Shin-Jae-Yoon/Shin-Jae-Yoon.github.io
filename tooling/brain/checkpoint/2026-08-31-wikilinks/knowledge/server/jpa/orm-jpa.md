---
title: ORM과 JPA
aliases:
  - ORM과 JPA
  - ORM
  - JPA
  - Java Persistence API
  - Hibernate
tags:
  - server
  - jpa
  - database
  - java
  - spring
origin:
  verified: 2026-08-30
---

ORM(Object-Relational Mapping)은 객체와 관계형 DB의 테이블을 매핑해 SQL을 직접 쓰지 않고 객체를 다루듯 DB를 다루게 하는 기술이다. JPA(Java Persistence API)는 자바 진영이 그것을 위해 만든 표준 인터페이스이고, Hibernate가 대표적인 구현체다.

## 패러다임 불일치

관계형 DB와 객체지향은 상속과 연관관계, 타입을 다루는 방식이 서로 다르다. JPA는 그 패러다임 불일치를 메우려고 나왔고, SQL을 매핑하는 대신 자바 클래스와 DB 테이블을 매핑한다.

## 표준 인터페이스와 PSA

왜 굳이 표준 인터페이스를 두었는지가 더 중요하다. 객체가 Hibernate를 직접 의존하는 순간 특정 기술에 묶여 [[POJO]]가 아니게 된다. 그래서 JPA라는 표준을 정의하고 ORM 프레임워크들이 그 구현체가 되게 했다. 애플리케이션은 JPA만 보고 아래에서 무엇이 도는지 모른다. 이 방식이 [[PSA]]이고, [[JDBC]]도 트랜잭션 매니저도 같은 구조다. JPA가 스프링이 아니라 자바가 제공하는 API라는 사실도 여기서 나온다.

## 얻는 것

얻는 것은 여럿이다. SQL 중심이 아니라 객체 중심으로 개발하게 되고, 반복되는 CRUD 쿼리를 쓰지 않아도 된다. 같은 트랜잭션 안에서는 같은 엔티티를 돌려주므로 1차 캐시로 조회 성능이 조금 오르고 동일성이 보장된다. 커밋할 때까지 insert를 모아 JDBC BATCH SQL로 한 번에 보내는 쓰기 지연도 있다. 지연 로딩을 쓸 수 있고, 스키마가 바뀌어도 엔티티만 고치면 관련 쿼리에 자동으로 반영된다. 특정 DB 기술에 종속되지 않으니 벤더가 바뀌어도 코드는 거의 그대로다.

## 표현하기 어려운 쿼리

복잡한 쿼리를 표현하기 어렵다. 통계나 리포트는 [[SQL Mapper|SQL Mapper나 네이티브 쿼리]]로 빼거나 [[Querydsl]]로 처리한다.

## 눈에 안 보이는 성능 문제

성능 문제가 눈에 잘 안 보인다. 객체 간 매핑 설계를 잘못하면 성능이 떨어지고, 자동으로 생성되는 쿼리가 많아 의도하지 않은 쿼리가 나가기 쉽다. [[N+1 문제]]와 FetchType, fetch join, 프록시가 전부 그 자리에 있다.

## 학습 비용과 SQL 읽기

학습 비용이 크다. [[영속성 컨텍스트]]의 동작을 모르면 예상과 다르게 움직인다.

그래서 ORM을 쓴다고 SQL을 몰라도 되는 것이 아니라 오히려 더 잘 알아야 한다. 내가 쓴 코드가 어떤 쿼리로 번역되는지 읽을 수 있어야 쿼리 수백 개가 나가는 상황을 알아챈다. 잘 쓰면 튜닝할 지점이 줄기는커녕 늘어난다.

## 관련

- [[Entity]]
- [[영속성 컨텍스트]]
- [[N+1 문제]]
- [[SQL Mapper]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - PSA와 JPA]]
- [[brain/notes/Interview/dog-study/dog-week08|면접 스터디 8주차 - JPA]]
- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - ORM 관련 질문]]
