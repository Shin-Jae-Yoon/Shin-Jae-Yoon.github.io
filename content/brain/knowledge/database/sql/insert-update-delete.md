---
title: 데이터 추가와 수정, 삭제
aliases:
  - 데이터 추가와 수정, 삭제
  - INSERT
  - UPDATE
  - DELETE
tags:
  - database
origin:
  verified: 2026-08-30
---

조회를 뺀 나머지 DML이다. 셋 다 `WHERE`를 빠뜨리면 되돌리기 어려운 일이 생기므로 [[acid|트랜잭션]]과 함께 이해해야 한다.

## INSERT의 세 형태

`INSERT`는 세 가지 형태로 쓴다.

```sql
-- 1. 정의된 컬럼 순서대로 전부
INSERT INTO employee VALUES (1, 'KIM', 'DEV', 1001);

-- 2. 컬럼을 지정해서
INSERT INTO employee (name, position) VALUES ('KIM', 'DEV');

-- 3. 여러 행을 한 번에
INSERT INTO employee VALUES (1, 'KIM', ...), (2, 'LEE', ...);
```

첫째 형태는 모든 컬럼에 값을 넣어야 한다. NULL이 허용된 컬럼이라도 `NULL`이라고 적어줘야 하고 순서도 정의된 그대로여야 한다. 둘째 형태는 순서가 자유롭고 원하는 컬럼에만 넣을 수 있다. 빠뜨린 컬럼에는 `DEFAULT` 값이 있으면 그것이, 없으면 NULL이 들어간다. 나중에 컬럼이 추가되어도 쿼리가 깨지지 않아서 실무에서는 대개 이 형태를 쓴다. 셋째 형태는 여러 행을 한 번에 넣으므로 한 행씩 여러 번 보내는 것보다 훨씬 빠르다.

## 값을 계산해 넣는 UPDATE

`UPDATE`는 `SET`에서 자기 자신을 참조할 수 있다. 현재 값을 읽어와 계산한 뒤 다시 쓰는 왕복 없이 한 문장으로 끝난다.

```sql
UPDATE employee
SET salary = salary * 2
WHERE dept_id = 1003;
```

두 테이블을 엮어서 수정할 수도 있다. 이때 컬럼 이름 앞에 테이블 이름을 붙여두면 어느 쪽 컬럼인지 읽기가 훨씬 낫다.

```sql
UPDATE employee, works_on
SET salary = salary * 2
WHERE employee.id = works_on.empl_id AND works_on.proj_id = 2003;
```

## DELETE와 연쇄 삭제

`DELETE`도 같은 모양이다. 조건에서 무언가를 제외할 때는 `!=`와 같은 뜻인 `<>`를 쓸 수 있다.

```sql
DELETE FROM employee WHERE id = 8;
DELETE FROM works_on WHERE empl_id = 5 AND proj_id <> 2001;
```

참조하는 쪽까지 함께 지울지는 외래키 옵션이 정한다. `works_on`의 외래키가 `CASCADE`로 걸려 있으면 `employee`에서 8번을 지우는 것만으로 `works_on`의 관련 행도 따라 사라진다.

## WHERE를 빠뜨렸을 때

`UPDATE`와 `DELETE`에서 `WHERE`는 문법상 선택이다. 빠뜨리면 테이블의 모든 행에 적용된다.

```sql
UPDATE employee SET salary = 0;   -- 전 직원 연봉이 0이 된다
DELETE FROM employee;             -- 전부 지워진다
```

막는 방법은 두 가지다. 같은 `WHERE` 조건으로 먼저 `SELECT`해서 대상이 맞는지 눈으로 본 다음 앞부분만 바꿔 쓰거나, [[acid|트랜잭션]]으로 감싼다. `START TRANSACTION`으로 시작해두면 결과를 확인한 뒤 `ROLLBACK`으로 되돌릴 수 있다. AUTOCOMMIT이 켜져 있으면 실행하는 순간 확정되므로 되돌릴 수 없다.

## 제약조건에 걸리는 값

[[constraint|제약조건]]을 위반하는 데이터는 DBMS가 거부한다. 중복된 기본키, `NOT NULL` 컬럼의 NULL, `CHECK`에 걸리는 값, 없는 부서를 가리키는 외래키 같은 것들이다. 마지막 경우에는 참조 무결성 위반을 알리는 `a foreign key constraint fails` 메시지가 뜬다. 오류를 보고 고치면 되니 오히려 다행인 쪽이다.

## 관련

- [[select|SELECT]]
- [[acid|트랜잭션]]
- [[constraint|제약조건]]

## 출처

- [[brain/lectures/db/easy-db/lecture04|쉬운코드 데이터베이스 4강 - 데이터 다루기]]
