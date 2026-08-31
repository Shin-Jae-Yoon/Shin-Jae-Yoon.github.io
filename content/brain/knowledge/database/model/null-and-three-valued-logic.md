---
title: NULL과 3값 논리
aliases:
  - NULL과 3값 논리
  - NULL
  - three-valued logic
  - UNKNOWN
  - IS NULL
tags:
  - database
origin:
  verified: 2026-08-30
---

SQL의 NULL은 "값이 없다"가 아니다. 여러 의미를 하나의 표시로 뭉뚱그린 것이고, 그래서 비교 연산이 참도 거짓도 아닌 세 번째 결과를 내놓는다. 이 사실을 모르면 조회 결과가 조용히 틀린다.

## 값이 없다는 말의 여러 뜻

NULL 하나가 적어도 세 가지를 가리킨다. 알려지지 않았거나(unknown), 알지만 공개하지 않았거나(unavailable, withheld), 애초에 해당 사항이 없는(not applicable) 경우다. 생일이 NULL이면 생일이 없는 것이 아니라 아직 모르는 것이고, 집 전화가 NULL이면 아예 없다는 뜻일 수 있다.

토익 점수가 NULL이라면 시험을 안 쳤을 수도, 쳤는데 제출을 안 했을 수도, 제출했는데 누락됐을 수도 있다. 편입 정보가 NULL이라면 편입을 안 했을 수도, 했는데 아직 반영이 안 됐을 수도 있다. 어느 쪽인지 SQL은 구분하지 못한다. 가능하면 NULL을 쓰지 않는 편이 좋다는 말이 여기서 나온다.

## 세 번째 진리값

의미가 여럿이니 NULL이 어떤 값과 같은지 다른지 단정할 수 없다. NULL이 한쪽에라도 있으면 비교 결과는 무조건 UNKNOWN이다. UNKNOWN은 참일 수도 있고 거짓일 수도 있다는 뜻이고, 참과 거짓에 이것을 더한 체계를 3값 논리라고 한다.

생일이 NULL인 두 사람의 생일이 같냐고 물으면 답은 UNKNOWN이다. `WHERE` 절은 참인 것만 가져오므로 아무것도 안 나온다. 생일이 NULL인 행이 없다는 뜻이 아니다.

```sql
WHERE birth_date = NULL      -- 항상 UNKNOWN, 아무것도 안 나온다
WHERE birth_date IS NULL     -- 이렇게 써야 한다
WHERE birth_date IS NOT NULL
```

동등 연산자로는 NULL을 찾을 수 없다. `IS`와 `IS NOT`이 그 용도로 따로 있다.

## AND, OR, NOT의 결과

UNKNOWN이 섞인 논리 연산은 대체로 UNKNOWN을 뱉는다. 예외는 결과가 이미 정해지는 두 자리뿐이다. AND에서 한쪽이 FALSE면 나머지가 무엇이든 FALSE이고, OR에서 한쪽이 TRUE면 나머지가 무엇이든 TRUE다. 그 밖의 조합은 TRUE AND UNKNOWN이든 UNKNOWN OR UNKNOWN이든 NOT UNKNOWN이든 전부 UNKNOWN이다.

## NOT IN과 빈 결과

`NOT IN`의 목록에 NULL이 하나라도 있으면 결과가 항상 비어버린다. `v NOT IN (v1, v2, v3)`은 `v != v1 AND v != v2 AND v != v3`으로 풀리는데, 목록에 NULL이 섞이면 그 항이 언제나 UNKNOWN이 된다. `3 != 1 AND 3 != 2 AND 3 != NULL`은 TRUE AND TRUE AND UNKNOWN이라 전체가 UNKNOWN이고, `WHERE`는 참인 것만 고르므로 아무 행도 남지 않는다.

[[subquery|서브쿼리]]의 결과를 `NOT IN`에 쓸 때 자주 걸린다. "2000년대 생이 없는 부서의 ID와 이름"을 뽑는데 아직 부서를 배치받지 않아 `dept_id`가 NULL인 사원이 하나라도 있으면, 바깥 `D.id`가 무슨 값이든 FALSE 아니면 UNKNOWN이라 결과가 통째로 빈다.

빠져나갈 길은 세 갈래다. 애초에 `employee.dept_id`를 `NOT NULL`로 막거나, 서브쿼리 안에서 `dept_id IS NOT NULL` 조건을 걸어 NULL을 걸러내거나, `NOT IN`을 `NOT EXISTS`로 바꾼다.

## 관련

- [[constraint|제약조건]]
- [[subquery|서브쿼리]]
- [[select|SELECT]]

## 출처

- [[brain/lectures/db/easy-db/lecture02|쉬운코드 데이터베이스 2강 - NULL]]
- [[brain/lectures/db/easy-db/lecture07|쉬운코드 데이터베이스 7강 - three-valued logic]]
