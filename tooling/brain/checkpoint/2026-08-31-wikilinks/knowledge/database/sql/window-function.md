---
title: 순위 함수와 UNION
aliases:
  - 순위 함수와 UNION
  - RANK
  - DENSE_RANK
  - ROW_NUMBER
  - UNION
  - 윈도우 함수
tags:
  - database
origin:
  verified: 2026-08-30
---

[[집계와 GROUP BY|집계 함수]]는 여러 행을 하나로 줄이지만, 순위 함수는 행을 그대로 두면서 각 행에 순위를 붙인다. 이런 종류를 윈도우 함수라고 한다. `UNION`은 결이 다르지만 결과를 합친다는 점에서 함께 익히게 되는 연산자다.

## OVER와 PARTITION BY

```sql
SELECT name, salary,
       RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
FROM employee;
```

`PARTITION BY`가 어떤 그룹 안에서 순위를 매길지 정한다. 전체에서 매기려면 빼면 된다. `ORDER BY`는 무엇을 기준으로 순위를 매길지 정한다. `GROUP BY`와 달리 원래 행이 사라지지 않아서, 부서별 연봉 순위를 붙이면서 각 직원의 이름과 연봉을 그대로 볼 수 있다.

## 결과를 세로로 쌓기

`UNION`은 두 개 이상의 쿼리 결과를 세로로 합친다. [[조인]]이 가로로 붙이는 것이라면 이쪽은 세로로 쌓는 것이다.

```sql
SELECT id, name FROM employee
UNION
SELECT id, name FROM contractor;
```

쓰려면 조건이 붙는다. 각 `SELECT`가 반환하는 컬럼 개수와 순서가 같아야 하고, 대응하는 컬럼의 데이터 타입이 호환되어야 한다. 컬럼 이름은 달라도 되며 결과의 컬럼 이름은 첫 번째 쿼리를 따른다.

## 동점을 다루는 세 방식

순위 함수는 동점을 어떻게 처리하느냐로 갈린다.

| 함수           | 동점일 때                    | 100, 90, 85, 85, 85, 80 이면 |
| -------------- | ---------------------------- | ---------------------------- |
| `RANK()`       | 같은 순위를 주고 건너뛴다    | 1, 2, 3, 3, 3, 6             |
| `DENSE_RANK()` | 같은 순위를 주고 안 건너뛴다 | 1, 2, 3, 3, 3, 4             |
| `ROW_NUMBER()` | 동점이어도 다른 번호         | 1, 2, 3, 4, 5, 6             |

3등이 몇 명인지가 중요하면 `RANK`, 몇 종류의 등급이 있는지가 중요하면 `DENSE_RANK`, 그냥 번호를 매기려면 `ROW_NUMBER`다.

## UNION과 UNION ALL

`UNION`은 중복된 행을 제거하고 `UNION ALL`은 중복을 그대로 둔다. 중복 제거에는 정렬이나 해싱이 필요하므로 `UNION ALL`이 더 빠르다. 중복이 없다는 것을 알거나 중복이 상관없으면 `UNION ALL`을 쓴다.

MySQL에서 `FULL OUTER JOIN`을 흉내낼 때 `LEFT JOIN`과 `RIGHT JOIN`을 합치는데, 여기서는 양쪽에 걸친 행이 두 번 나오므로 `UNION` 쪽을 써야 한다. [[조인]]

## 관련

- [[집계와 GROUP BY]]
- [[조인]]
- [[SELECT]]

## 출처

- [[brain/lectures/algo/fastcampus-algo/part6/p6-ch01|패스트캠퍼스 SQL 코딩테스트]]
