---
title: JDBC
aliases:
  - Java Database Connectivity
  - 영속성
  - Persistence
tags:
  - server
  - database
  - java
origin:
  verified: 2026-08-30
---

자바에서 DB에 접속할 수 있게 해주는 자바 API. 애플리케이션은 JDBC API 하나만 보고 코드를 쓰고, DBMS마다 그 인터페이스를 구현한 드라이버를 갈아 끼운다.

## 영속성을 부여하는 세 가지 방법

영속성은 데이터를 생성한 프로그램이 종료되어도 데이터가 사라지지 않는 성질을 말한다. 객체의 상태를 DB에 저장하는 것을 객체에 영속성을 부여했다고 한다.

부여하는 방법은 셋이다. JDBC를 직접 쓰거나, [[sql-mapper|SQL Mapper]]를 쓰거나, [[orm-jpa|ORM]]을 쓴다. 뒤의 둘을 영속성 프레임워크라고 묶어 부르는데, 모든 영속성 프레임워크가 내부적으로 JDBC API를 쓴다. JDBC가 바닥에 있는 이유다.

## 드라이버를 갈아 끼우는 인터페이스

JDBC가 인터페이스라는 사실이 그 값어치를 만든다. MySQL을 쓰다 PostgreSQL로 옮겨도 드라이버만 바꾸면 코드는 그대로다. [[psa|추상화 계층]]의 전형적인 예다.

## 연결에서 자원 해제까지

```
1. DriverManager  드라이버를 로드한다
2. Connection     DB와 연결되는 통로를 연다
3. Statement      쿼리를 만들고 실행한다
4. ResultSet      결과를 받는다
5. 자원 해제       연 순서의 반대로 닫는다
```

## 반복 코드, 예외 처리, 자원 반환

중복 코드가 반복된다. 간단한 SQL 하나를 실행하는 데도 연결하고, 문장 만들고, 실행하고, 결과를 꺼내고, 닫는 코드가 매번 똑같이 들어간다.

예외 처리가 번거롭다. `SQLException`이 검사 예외라 매번 `try-catch`로 감싸야 한다. DB마다 오류 코드가 달라서 예외를 받아도 무슨 문제인지 일관되게 판단할 수 없다.

자원을 반환하지 않으면 시스템이 멈춘다. `Connection`은 공유 자원이라 닫지 않으면 쌓이다가 더 이상 연결할 수 없게 된다. 그런데 `finally`에서 닫는 코드를 빠뜨리기 쉽고, 닫는 코드 자체도 예외를 던진다.

이 셋을 대신 처리해주는 것이 영속성 프레임워크다. [[jdbc-template|JdbcTemplate]]은 반복 코드를 걷어내고, 스프링은 DB별 예외를 일관된 예외 계층으로 바꿔준다.

## 관련

- [[sql-mapper|SQL Mapper]]
- [[orm-jpa|ORM과 JPA]]
- [[connection-pool|커넥션 풀]]

## 출처

- [[brain/notes/Interview/dog-study/dog-week06|면접 스터디 6주차 - Persistence, JDBC]]
- [[brain/lectures/backend/kim-spring/spring-intro/spring-basic-02|김영한 스프링 입문 - 순수 JDBC]]
