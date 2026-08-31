---
title: SQL Mapper
aliases:
  - SQL Mapper
  - MyBatis
  - 마이바티스
tags:
  - server
  - database
  - java
  - spring
origin:
  verified: 2026-08-30
---

직접 쓴 SQL의 실행 결과와 객체의 필드를 매핑해주는 영속성 프레임워크. [[JDBC]]의 반복 코드를 걷어내되 SQL은 내가 쓴다.

## MyBatis와 JdbcTemplate

대표 프레임워크는 MyBatis다. SQL 쿼리를 XML 파일에 작성해 코드와 SQL을 분리한다. JDBC만 쓰면 결과를 꺼내 객체의 인스턴스에 매핑하는 코드가 잔뜩 필요한데, Mapper 인터페이스와 매핑 파일만 만들어두면 객체의 필드와 SQL 문이 자연스럽게 연결된다.

스프링이 제공하는 SQL Mapper 기능은 [[JdbcTemplate과 스프링 데이터 JPA|JdbcTemplate]]이다. XML 대신 자바 코드 안에서 SQL을 다룬다.

## ORM과의 매핑 대상 차이

이름이 비슷해서 ORM과 뒤섞이는데 매핑하는 대상이 다르다.

|                    | 무엇과 무엇을 매핑하나 | SQL은 누가 쓰나     |
| ------------------ | ---------------------- | ------------------- |
| SQL Mapper         | 쿼리 결과와 객체 필드  | 내가 쓴다           |
| [[ORM과 JPA\|ORM]] | 테이블과 객체          | 프레임워크가 만든다 |

SQL Mapper는 객체와 관계를 매핑하지 않는다. 내가 쓴 SQL이 뱉은 결과를 객체에 담아주는 것까지가 역할이다.

## 복잡한 조회가 남긴 자리

[[ORM과 JPA]]가 표준이 된 지금도 SQL Mapper가 사라지지 않는 이유는 복잡한 조회 때문이다. 통계나 리포트처럼 조인이 여러 겹이고 집계가 얽힌 쿼리는 ORM으로 표현하기 어렵거나, 표현할 수 있어도 성능이 안 나온다. 그럴 때 그 쿼리만 SQL Mapper나 네이티브 쿼리로 처리한다. 둘 중 하나만 골라야 하는 것이 아니라 같이 쓴다.

같은 문제를 ORM 안에서 풀어보려는 시도가 [[Querydsl]]이다. 동적 쿼리를 다룰 때 MyBatis가 편해서 사람들이 그쪽으로 돌아섰던 흐름을 되돌리려는 것이다.

## 관련

- [[JDBC]]
- [[ORM과 JPA]]
- [[Querydsl]]
- [[JdbcTemplate과 스프링 데이터 JPA]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - SQL Mapper]]
- [[brain/notes/Interview/dog-study/dog-week09|면접 스터디 9주차 - Querydsl 사용 이유]]
