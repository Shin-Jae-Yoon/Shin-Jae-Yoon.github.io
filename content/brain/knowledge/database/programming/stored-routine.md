---
title: 저장 함수와 저장 프로시저
aliases:
  - 저장 함수와 저장 프로시저
  - Stored Function
  - Stored Procedure
  - DELIMITER
tags:
  - database
origin:
  verified: 2026-08-30
---

DBMS 안에 저장해두고 부르는 사용자 정의 루틴. 자주 쓰는 쿼리를 모듈화하려고 만든다. 둘 다 조건 분기, 반복, 예외 처리를 할 수 있어서 비슷해 보이지만 쓰임이 다르다.

## DELIMITER와 정의 틀

정의할 때 먼저 만나는 낯선 것이 `DELIMITER`다.

```sql
DELIMITER $$
CREATE FUNCTION 이름(파라미터)
RETURNS 리턴타입
OPTION
BEGIN
    수행할 것;
END $$
DELIMITER ;
```

문장의 끝을 알리는 기호가 원래 `;`인데 함수 본문 안에도 `;`가 들어간다. 그대로 두면 본문 중간에서 정의가 끝난 것으로 잘못 읽힌다. 잠시 구분자를 `$$`로 바꿔놓고 정의를 마친 뒤 되돌리는 이유다.

## 데이터 접근 선언

`OPTION` 자리에는 이 루틴이 데이터를 어떻게 다루는지 선언한다. `NO SQL`은 SQL 문이 아예 없다는 뜻이고, `CONTAINS SQL`은 `SET @x = 1`처럼 SQL은 있지만 데이터를 읽지도 쓰지도 않는다는 뜻이다. 읽기만 하면 `READS SQL DATA`, 쓰기까지 하면 `MODIFIES SQL DATA`다.

## 파라미터의 방향

프로시저는 파라미터마다 방향을 붙인다. `IN`은 값을 받되 바꿀 수 없고, `OUT`은 받을 필요 없이 결과를 내보낼 때 쓰고, `INOUT`은 둘 다 한다. 기본이 `IN`이라 `IN`은 생략할 수 있지만 `OUT`은 반드시 적어야 한다.

```sql
CREATE PROCEDURE 이름(IN a INT, OUT b INT, INOUT c INT)
```

## 만들어진 자리와 조회, 삭제

`DB이름.함수이름` 형태로 쓰지 않으면 현재 선택된 DB에 만들어진다. 의도한 곳에 만들어졌는지 확인하는 습관이 필요하다. 남이 만들어둔 것을 파악할 때는 `SHOW FUNCTION STATUS WHERE DB = '이름'`으로 목록을 보고 `SHOW CREATE FUNCTION 함수이름`으로 본문을 연다. 지울 때는 `DROP FUNCTION 함수이름`이다.

## 값을 만드는 쪽과 일을 시키는 쪽

|                | 저장 함수                                       | 저장 프로시저               |
| -------------- | ----------------------------------------------- | --------------------------- |
| 목적           | 값을 하나 반환한다                              | 하나의 작업을 수행한다      |
| SQL 문 안에서  | `SELECT`, `INSERT`, `UPDATE`, `DELETE`에서 쓴다 | 쓸 수 없다. `CALL`로 부른다 |
| 반환           | `RETURNS`로 타입을 선언한다                     | `OUT` 파라미터로 내보낸다   |
| 결과 집합 반환 | 못 한다                                         | 할 수 있다                  |

한 줄로 줄이면 함수는 값을 만들려고, 프로시저는 일을 시키려고 쓴다. 미리 컴파일된 실행 계획을 만드는지, 안에서 다른 루틴을 부를 수 있는지, try-catch를 쓸 수 있는지도 DBMS마다 갈린다.

## 로직이 놓일 자리

로직을 DB에 두느냐 애플리케이션에 두느냐의 문제가 남는다. 유틸리티 함수 정도라면 무난하지만 비즈니스 로직을 여기 두면 로직 계층과 데이터 계층을 오가며 관리해야 한다. 장단이 뚜렷해서 [[procedure-tradeoff|프로시저의 장단점]]에서 따로 다룬다.

## 관련

- [[procedure-tradeoff|프로시저의 장단점]]
- [[trigger|트리거]]
- [[ddl-dml|SQL과 DDL, DML]]

## 출처

- [[brain/lectures/db/easy-db/lecture10|쉬운코드 데이터베이스 10강 - Stored function]]
- [[brain/lectures/db/easy-db/lecture11|쉬운코드 데이터베이스 11강 - Stored procedure]]
