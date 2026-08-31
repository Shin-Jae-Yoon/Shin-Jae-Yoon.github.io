---
title: 조인
aliases:
  - 조인
  - JOIN
  - INNER JOIN
  - OUTER JOIN
  - 셀프 조인
tags:
  - database
origin:
  verified: 2026-08-30
---

두 개 이상의 테이블에 있는 데이터를 한 번에 조회하는 것. 관계형 DB는 데이터를 여러 테이블에 나눠 담고 [[키|외래키]]로 이어놓으므로, 실제로 쓸 만한 조회는 대부분 조인이다.

## ON과 USING

`FROM`에서 `JOIN`과 `ON`으로 어느 테이블을 어떤 조건으로 잇는지 밝힌다.

```sql
SELECT D.name
FROM employee AS E JOIN department AS D ON E.dept_id = D.id
WHERE E.id = 1;
```

조인 조건에는 `=` 말고 `<`, `>`, `!=` 같은 비교 연산자도 쓸 수 있다. 잇는 컬럼의 이름이 양쪽에서 같다면 `ON E.dept_id = D.dept_id` 대신 `USING (dept_id)`라고 줄여 쓸 수 있다. 이때 그 컬럼은 결과에 한 번만, 그것도 맨 앞에 나온다.

## 여러 번 이어 붙이기

조인은 여러 번 이어 붙일 수 있다. 프로젝트 2001에 참여한 직원의 이름과 직군과 소속 부서명을 뽑으려면 `works_on`을 `employee`에 내부 조인해 참여자 정보를 얻고, 그 결과를 `department`에 `LEFT JOIN`한다. 마지막을 왼쪽 외부 조인으로 두는 이유는 아직 부서 배정을 받지 않아 `dept_id`가 NULL인 직원을 떨어뜨리지 않기 위해서다.

## 내부 조인과 외부 조인

내부 조인은 조인 조건을 만족하는 행들만 결과에 넣는다. `INNER`는 생략할 수 있어서 그냥 `JOIN`이라고 쓰면 이것이다.

```sql
FROM table1 [INNER] JOIN table2 ON join_condition
```

외부 조인은 조건을 만족하지 않는 행도 결과에 넣는다. 짝이 없는 쪽은 NULL로 채운다. `LEFT JOIN`이 왼쪽 테이블의 행을 전부 남기고 `RIGHT JOIN`이 오른쪽을, `FULL JOIN`이 양쪽을 남긴다. `OUTER`는 생략할 수 있다. 부서가 없는 직원까지 보고 싶다면 `LEFT JOIN`이다.

## 조건으로 갈리는 이름들

여기까지가 무엇을 남기느냐의 축이고, 조건을 어떻게 쓰느냐로 갈리는 이름들은 축이 다르다. 겹쳐서 쓸 수 있다.

equi join은 조인 조건에 `=`를 쓰는 조인이다. 대부분의 조인이 여기 해당하고 내부든 외부든 상관없다. 다만 내부 조인으로 한정해서 부르는 시각도 있다.

natural join은 양쪽 테이블에서 이름이 같은 컬럼을 모두 찾아 알아서 equi join한다. 조인 조건을 아예 쓰지 않아 짧지만 위험하다. 이름이 같은 컬럼이 여럿이면 그것들이 전부 조건에 들어가는데, `employee`와 `department`에 `dept_id`와 `name`이 함께 있으면 사람 이름과 부서 이름까지 같아야 한다는 조건이 붙어 결과가 통째로 비어버린다.

cross join은 조인 조건이 없다. 카테시안 곱이라 결과가 두 테이블 행 수의 곱이 된다.

self join은 같은 테이블을 자기 자신과 조인한다. 직원과 그 직원의 상사처럼 한 테이블 안에서 관계가 맺어질 때 쓴다. 별도 문법은 없고 같은 테이블을 두 번 적으면 되는데, 양쪽을 가를 별칭이 반드시 필요하다.

## 옛 방식의 암시적 조인

조인을 쓰는 옛 방식도 있다. `FROM`에 테이블만 나열하고 조인 조건을 `WHERE`에 쓰는 암시적 조인이다.

```sql
SELECT D.name
FROM employee AS E, department AS D
WHERE E.id = 1 AND E.dept_id = D.id;
```

명시적 조인을 쓰는 편이 좋다. 암시적 방식은 행을 고르는 조건과 테이블을 잇는 조건이 `WHERE`에 뒤섞여 읽기 어렵다. 조인이 복잡해지면 조건 하나를 빠뜨려도 알아채기 어렵다. 빠뜨리면 조용히 cross join이 되어 결과가 폭발한다.

## NULL인 행이 사라지는 자리

조인 컬럼이 NULL인 행은 내부 조인 결과에 들어가지 못한다. [[NULL과 3값 논리|NULL과의 비교는 UNKNOWN]]이라 조건을 만족하지 못하기 때문이다. 부서가 배정되지 않은 직원은 사라진다.

## MySQL에서 다른 점

MySQL은 `FULL OUTER JOIN`을 지원하지 않는다. `LEFT JOIN` 결과와 `RIGHT JOIN` 결과를 `UNION`으로 합쳐 흉내내야 한다.

MySQL에서는 `CROSS JOIN`과 `INNER JOIN`과 `JOIN`이 사실상 같은 키워드다. 조건이 없는 cross join에 `ON`이나 `USING`을 붙이면 내부 조인처럼 동작하고 반대로 `JOIN`을 `ON` 없이 쓰면 cross join으로 동작한다. 키워드가 아니라 `ON`의 유무가 동작을 정한다.

## 관련

- [[SELECT]]
- [[키]]
- [[서브쿼리]]

## 출처

- [[brain/lectures/db/easy-db/lecture08|쉬운코드 데이터베이스 8강 - Join]]
