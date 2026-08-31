---
title: SELECT
aliases:
  - SELECT
  - 조회
  - DISTINCT
  - AS
  - 별칭
tags:
  - database
origin:
  verified: 2026-08-30
---

데이터를 꺼내는 명령. 구조는 단순하다.

```sql
SELECT 속성 FROM 테이블 [WHERE 조건];
```

## 세 가지 조건

쿼리가 복잡해질수록 조건을 세 가지로 갈라 보는 눈이 중요해진다.

```sql
SELECT employee.id, employee.name, position     -- projection condition
FROM project, employee
WHERE project.id = 2002                          -- selection condition
  AND project.leader_id = employee.id;           -- join condition
```

projection condition은 관심 있는 속성 목록이라 `SELECT` 절에 온다. selection condition은 어떤 행을 고를지 정하고 `WHERE` 절에 온다. join condition은 테이블을 어떻게 연결할지 정한다. 암시적 조인에서는 뒤의 둘이 `WHERE`에 섞여 있어서 읽기 어렵고, 이것을 떼어내는 것이 명시적 [[조인]] 문법이다.

여러 테이블을 다룰 때 `id`나 `name`처럼 흔한 컬럼 이름은 어느 테이블 것인지 모호하다는 오류가 난다. 테이블 이름을 붙여야 한다.

## 별칭

`AS`로 테이블이나 컬럼에 다른 이름을 붙인다. `AS`는 생략할 수 있다. 리더의 ID와 이름을 뽑으면서 그냥 `id`, `name`으로 나오는 것이 싫을 때 쓴다.

```sql
SELECT E.id AS leader_id, E.name AS leader_name
FROM employee AS E;
```

같은 테이블을 두 번 조인하는 셀프 조인에서는 별칭이 필수다. 구분할 방법이 달리 없기 때문이다.

## 중복 행 없애기

`DISTINCT`는 결과에서 중복 행을 없앤다. SQL의 테이블은 [[SQL과 DDL, DML|multiset]]이라 중복이 그대로 나오므로 필요하면 명시해야 한다. 디자이너가 참여한 프로젝트를 뽑을 때 한 프로젝트에 디자이너가 여럿이면 프로젝트가 여러 번 나오는데, 그때 쓴다.

```sql
SELECT DISTINCT project_id FROM works_on;
```

## LIKE와 패턴 문자

`LIKE`는 문자열의 패턴을 맞춘다. `%`는 0개 이상의 임의 문자, `_`는 정확히 한 글자다.

```sql
WHERE name LIKE 'N%'    -- N으로 시작
WHERE name LIKE '%N'    -- N으로 끝남
WHERE name LIKE '%N%'   -- N이 들어감
WHERE name LIKE 'J___'  -- J로 시작하는 네 글자
```

`%`나 `_` 자체를 찾고 싶으면 역슬래시로 이스케이프한다. `'\%%'`는 `%`로 시작하는 이름, `'%\_'`는 `_`로 끝나는 이름이다.

## 앞이 열린 패턴과 인덱스

앞에 `%`가 붙은 패턴은 인덱스를 못 쓴다. `'%N'`이나 `'%N%'`은 테이블 전체를 훑게 되므로 큰 테이블에서 주의해야 한다. 애초에 `WHERE`에 자주 오는 컬럼에는 인덱스가 걸려 있어야 데이터가 늘어도 조회 속도가 유지된다.

## 모든 컬럼을 가져올 때

`SELECT *`는 모든 컬럼을 가져온다. 편하지만 실무에서는 필요한 컬럼만 명시하는 편이 낫다. 컬럼이 추가되면 의도치 않은 데이터가 딸려오고 전송량도 늘어난다.

## 관련

- [[조인]]
- [[서브쿼리]]
- [[집계와 GROUP BY]]

## 출처

- [[brain/lectures/db/easy-db/lecture05|쉬운코드 데이터베이스 5강 - 데이터 조회]]
