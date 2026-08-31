---
title: 격리 수준
aliases:
  - 격리 수준
  - Isolation Level
  - Dirty Read
  - Non-Repeatable Read
  - Phantom Read
tags:
  - database
  - spring
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

동시에 진행되는 [[트랜잭션]]의 작업 결과를 다른 트랜잭션에게 어디까지 보여줄지를 정하는 설정. [[동시성 제어|직렬 가능성]]을 완벽히 지키면 안전하지만 느려서, 어느 정도까지 타협할지를 고르게 해둔 것이다.

## 안전과 속도의 맞교환

수준이 높을수록 안전하고 느리며, 낮을수록 빠르고 위험하다. 격리를 엄격히 할수록 다른 트랜잭션에게 영향받을 여지가 줄지만 그만큼 동시에 실행될 수 있는 트랜잭션도 줄기 때문이다. 무엇을 얼마나 포기할지는 로직마다 다르므로 DBMS가 고정하지 않고 고르게 한다.

## 세 가지 이상 현상

수준별 차이를 이해하려면 무엇을 막는지부터 봐야 한다.

Dirty Read는 다른 트랜잭션이 아직 커밋하지 않은 변경을 읽어버리는 현상이다. 그 트랜잭션이 롤백하면 존재한 적 없는 값을 읽고 처리한 셈이 된다.

Non-Repeatable Read는 같은 트랜잭션 안에서 같은 행을 두 번 읽었는데 값이 다른 것이다. 사이에 다른 트랜잭션이 그 행을 수정하고 커밋했기 때문이다.

Phantom Read는 같은 조건으로 두 번 조회했는데 없던 행이 나타나거나 있던 행이 사라진다. 사이에 다른 트랜잭션이 행을 추가하거나 삭제했기 때문이다. Non-Repeatable Read의 한 종류인데, 개별 행의 값이 아니라 결과 집합이 달라진다는 점이 다르다.

## READ UNCOMMITTED부터 SERIALIZABLE까지

수준은 넷이다.

READ UNCOMMITTED가 가장 낮다. 커밋 전 변경이 그대로 노출된다. 일관성을 포기하고 성능을 극대화할 때만 쓴다.

READ COMMITTED는 커밋되지 않은 것을 못 읽는다. 다만 내가 읽은 행을 다른 트랜잭션이 수정할 수 있어서, 읽는 시점에 따라 값이 달라진다. 오라클의 기본값이다.

REPEATABLE READ는 트랜잭션이 처음 읽는 시점의 스냅샷을 만들어 그 뒤로도 거기서 읽는다. 다른 트랜잭션이 그 행을 수정해도 내가 보는 값은 바뀌지 않는다. 막아서가 아니라 옛 버전을 보기 때문이다. MySQL의 기본값이다.

SERIALIZABLE이 가장 강력하다. 이름 그대로 트랜잭션을 순차적으로 진행시킨다. 안전하지만 동시성이 크게 떨어져서, 극단적으로 안전해야 하는 작업이 아니면 쓰지 않는다.

## ANSI 표준이 허용하는 범위

아래 표는 ANSI SQL 표준이 각 수준에 허용한 범위다. 실제로 무엇이 일어나는지는 DBMS의 구현에 달렸다.

| 수준 (ANSI 기준) | Dirty Read | Non-Repeatable | Phantom |
| ---------------- | ---------- | -------------- | ------- |
| READ UNCOMMITTED | 발생       | 발생           | 발생    |
| READ COMMITTED   | 막음       | 발생           | 발생    |
| REPEATABLE READ  | 막음       | 막음           | 발생    |
| SERIALIZABLE     | 막음       | 막음           | 막음    |

## InnoDB가 표준보다 강한 자리

표에서 REPEATABLE READ가 Phantom을 허용한다고 되어 있는데, MySQL의 InnoDB는 이 자리에서 표준보다 강하게 동작한다. 일반 `SELECT`는 트랜잭션이 처음 읽은 시점의 스냅샷을 계속 보므로 사이에 다른 트랜잭션이 행을 넣고 커밋해도 그 행이 보이지 않는다. MySQL 기본값이 REPEATABLE READ라고 해서 팬텀이 그대로 노출된다고 읽으면 안 된다.

## 스프링의 DEFAULT가 뜻하는 것

스프링에서는 `@Transactional(isolation = ...)`으로 지정한다. 기본값은 `DEFAULT`인데, 이것은 데이터 액세스 기술이나 DB 드라이버의 설정을 따르고 드라이버는 다시 DB의 설정을 따른다는 뜻이다.

그래서 명시하지 않으면 MySQL에서는 REPEATABLE READ로, 오라클에서는 READ COMMITTED로 돈다. DB를 갈아타면 격리 수준이 조용히 바뀐다는 뜻이라, 중요한 로직에서는 명시하는 편이 낫다. [[선언적 트랜잭션]]

## 참고

InnoDB의 REPEATABLE READ에서 잠금 없는 일반 조회는 같은 스냅샷을 반복해서 읽는다. 원본 노트는 이 수준에서 팬텀이 발생할 수 있다고만 적었는데, 그것은 ANSI 표준이 허용하는 범위이지 InnoDB의 동작이 아니다. [MySQL Reference Manual, InnoDB Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)

## 관련

- [[트랜잭션]]
- [[동시성 제어]]
- [[선언적 트랜잭션]]

## 출처

- [[brain/lectures/db/easy-db/lecture14|쉬운코드 데이터베이스 14강 - Isolation]]
- [[brain/notes/Interview/dog-study/dog-week07|면접 스터디 7주차 - Isolation]]
