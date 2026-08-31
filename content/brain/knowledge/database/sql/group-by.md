---
title: 집계와 GROUP BY
aliases:
  - 집계와 GROUP BY
  - 집계 함수
  - Aggregate Function
  - HAVING
tags:
  - database
origin:
  verified: 2026-08-30
  scouted: 2026-08-30
---

집계 함수는 여러 행의 정보를 요약해 하나의 값으로 만든다. `COUNT`, `SUM`, `MAX`, `MIN`, `AVG`가 대표적이다. `GROUP BY`는 그 요약을 전체가 아니라 그룹별로 하게 만든다.

## 집계 함수와 NULL

집계 함수는 NULL을 빼고 센다. `AVG(salary)`는 연봉이 NULL인 사람을 빼고 평균을 내므로 전체 인원으로 나눈 값과 다르다.

`COUNT`가 특히 헷갈린다.

```sql
COUNT(*)          -- 행의 개수. NULL과 무관하다
COUNT(position)   -- position이 NULL이 아닌 행의 개수
```

수를 셀 때는 `COUNT(*)`를 쓰는 편이 안전하다. 컬럼을 넣으면 그 컬럼이 NULL인 행이 빠진다. 반대로 부서가 배정된 직원 수처럼 NULL을 빼고 싶으면 컬럼을 넣는다. 어느 쪽이든 값의 중복은 그대로 세므로, 중복을 빼려면 `COUNT(DISTINCT dept_id)`라고 쓴다.

## 행을 그룹으로 묶기

`GROUP BY`는 기준이 되는 컬럼으로 행을 묶고 그룹마다 집계 함수를 적용한다.

```sql
SELECT project_id, COUNT(*), AVG(salary)
FROM works_on JOIN employee ON ...
GROUP BY project_id;
```

그룹 기준 컬럼에 NULL이 있으면 NULL끼리 한 그룹이 된다. 무시되는 것이 아니다. 그리고 `SELECT`에는 그룹 기준 컬럼과 집계 함수만 올 수 있다. 그룹으로 묶인 순간 개별 행의 값은 하나로 정할 수 없기 때문이다.

## 집계 결과로 그룹 거르기

`HAVING`은 집계 결과로 그룹을 거른다. `GROUP BY`와 함께 쓴다.

```sql
SELECT project_id, COUNT(*)
FROM works_on
GROUP BY project_id
HAVING COUNT(*) >= 7;
```

## 결과 정렬

`ORDER BY`는 결과를 정렬한다. 기본은 오름차순인 `ASC`이고 `DESC`로 뒤집는다. 여러 컬럼을 적으면 앞에 적힌 것부터 정렬하므로 아래는 부서로 먼저 묶고 그 안에서 연봉 내림차순이 된다.

```sql
ORDER BY dept_id, salary DESC;
```

MySQL은 NULL을 가장 작은 값으로 취급해서 오름차순일 때 맨 앞에 나온다. DBMS마다 다르다.

## 작성 순서와 실행 순서

작성 순서와 실행 순서가 다르다는 것이 이 모든 규칙의 뿌리다.

> FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY

`WHERE`가 `GROUP BY`보다 먼저라 집계 함수를 못 쓰고, `SELECT`가 `GROUP BY`보다 나중이라 그룹 기준 컬럼만 남아 있다. `ORDER BY`가 맨 마지막이라 `SELECT`에서 붙인 별칭을 쓸 수 있다. 실제 실행 순서는 DBMS가 어떻게 구현했느냐에 따라 달라지고, 이것은 결과를 설명하기 위한 개념적 순서다.

## WHERE와 HAVING

`WHERE`와 `HAVING`은 거르는 대상이 다르다. `WHERE`는 그룹으로 묶기 전에 개별 행을 거르고, `HAVING`은 묶어서 집계한 뒤에 그룹을 거른다. 그래서 `WHERE`에는 집계 함수를 쓸 수 없다. 아직 집계하기 전이기 때문이다.

같은 조건이라도 어느 절에 두느냐로 뜻이 달라진다. 참여 인원이 7명 이상인 프로젝트에 한정해 90년대생 수를 세는 경우, 90년대생 조건을 `WHERE`에 두면 전체 참여 인원으로 7명을 세고, `HAVING`에 두면 90년대생만 세어 7명을 따진다.

## 참고

실행 순서에서 `SELECT`와 `ORDER BY`의 자리는 원본 강의와 다르게 적었다. 원본은 `ORDER BY`를 다섯 번째, `SELECT`를 마지막으로 놓았는데, 그러면 `ORDER BY`에서 `SELECT`가 붙인 별칭을 쓸 수 있는 이유를 설명할 수 없다. PostgreSQL 문서는 출력 행이 `SELECT` 목록으로 계산된 다음 `ORDER BY`가 정렬한다고 명시한다. [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html)

## 관련

- [[select|SELECT]]
- [[subquery|서브쿼리]]
- [[null-and-three-valued-logic|NULL과 3값 논리]]

## 출처

- [[brain/lectures/db/easy-db/lecture09|쉬운코드 데이터베이스 9강 - 정렬, 집계, 그룹]]
