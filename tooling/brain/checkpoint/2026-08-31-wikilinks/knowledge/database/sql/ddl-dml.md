---
title: SQL과 DDL, DML
aliases:
  - SQL과 DDL, DML
  - SQL
  - DDL
  - DML
  - multiset
tags:
  - database
origin:
  verified: 2026-08-30
---

관계형 DBMS의 표준 언어. 원래는 구조를 정의하는 DDL, 데이터를 다루는 DML, 외부 스키마를 정의하는 VDL, 내부 스키마를 정의하는 SDL이 따로 있었는데 오늘날에는 SQL 하나가 그 역할을 겸한다. 관계형 DBMS에서 SDL은 거의 사라지고 설정 파라미터가 그 자리를 대신한다.

## 명령의 갈래

DDL은 구조를 정의하는 쪽이라 `CREATE`, `ALTER`, `DROP`이 여기 속한다. DML은 실제 데이터를 다루는 쪽이라 `SELECT`, `INSERT`, `UPDATE`, `DELETE`가 여기 속한다.

DB 자체를 만들고 지우는 `CREATE DATABASE 이름`과 `DROP DATABASE 이름`도 DDL이다. 목록을 보는 `SHOW DATABASES`와 쓸 DB를 고르는 `USE 이름`은 DDL도 DML도 아닌 관리용 명령이고, 지금 무엇이 선택되어 있는지 확인하는 `SELECT database()`는 조회다. 아무것도 고르지 않았으면 NULL이 나온다.

## 컬럼 타입 고르기

타입은 크게 넷으로 나뉜다. 정수는 MySQL에 `TINYINT`부터 `BIGINT`까지 다섯 종류가 있지만 PostgreSQL에는 `SMALLINT`, `INT`, `BIGINT` 셋뿐이다. 문자열은 고정 길이 `CHAR(n)`과 가변 길이 `VARCHAR(n)`, 그보다 긴 `TEXT` 계열이다. 날짜와 시간은 `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`가 있고, 그 밖에 `BOOLEAN`과 `DECIMAL`, 암호화 키를 담는 바이트 문자열 같은 것들이 있다.

`CHAR`는 정해진 길이만큼 자리를 차지하고 남으면 공백으로 채우며, `VARCHAR`는 실제 길이만큼만 쓴다. 저장 공간만 보면 `VARCHAR`가 유리하지만 MySQL에서는 시간 성능이 `CHAR`보다 나쁠 수 있어서, 주민번호나 폼 번호처럼 길이가 고정된 값에는 `CHAR`를 권한다. PostgreSQL은 그냥 `VARCHAR`를 권한다.

돈처럼 정확해야 하는 값은 `DECIMAL(precision, scale)`을 쓴다. 앞이 전체 자릿수, 뒤가 소수점 이하 자릿수라서 `DECIMAL(5, 2)`는 -999.99부터 999.99까지 담는다. SQL 표준은 `DECIMAL`을 유연하게, `NUMERIC`을 엄격하게 다루라고 하지만 MySQL은 둘 다 엄격하게 다뤄서 자릿수를 넘기면 잘라낸다. `FLOAT`이나 `DOUBLE`은 [[부동소수점]] 오차가 있어 이 용도에 맞지 않는다.

`DATETIME`과 `TIMESTAMP`는 담을 수 있는 범위도 다르지만 시간대 처리가 갈린다. MySQL의 `TIMESTAMP`는 서버나 MySQL에 설정된 시간대를 기준으로 UTC로 바꿔 저장하고 읽을 때 되돌린다. 시간대에 영향을 받는다는 뜻이다.

## 되돌리기 어려운 결정

스키마를 정하는 일은 되돌리기 어렵다. 만들려는 서비스의 스펙과 함께 데이터 일관성, 편의성, 확장성을 종합적으로 따져야 한다. 이미 서비스 중인 테이블을 `ALTER TABLE`로 고칠 때는 백엔드에 영향이 없는지 먼저 확인한다. 층을 나눠 그 충격을 줄이는 이야기는 [[스키마와 3단계 스키마]]에 있다.

## 릴레이션과 테이블, 집합과 multiset

[[관계형 모델]]의 수학 용어가 SQL에서는 일상어로 바뀐다. 릴레이션은 테이블, 속성은 컬럼, 튜플은 행이라 부르고 도메인만 이름이 그대로다.

이름만 바뀐 것이 아니라 성질도 하나 달라진다. 관계형 모델에서 릴레이션은 집합이라 중복 튜플을 가질 수 없는데, SQL의 테이블은 multiset(bag)이라 중복 행을 허용한다. 조회 결과에 중복이 섞여 나오고 없애려면 `DISTINCT`를 직접 써야 하는 이유가 여기 있다.

## DATABASE와 SCHEMA

MySQL에서 `DATABASE`와 `SCHEMA`는 같은 뜻이라 `CREATE DATABASE company`와 `CREATE SCHEMA company`가 같은 명령이다. PostgreSQL에서는 `SCHEMA`가 데이터베이스 안의 네임스페이스를 뜻해서, 하나의 데이터베이스가 여러 스키마를 갖고 그 안에서 테이블이 정의된다.

## 표준과 구현의 틈

SQL은 표준이되 구현을 강제하지 않는다. DBMS마다 지원하는 스펙이 조금씩 다르다. 정수 타입의 가짓수가 다르고, MySQL에는 `BOOLEAN`이 따로 없어 `TINYINT`에 0과 1을 넣어 대신한다. 조인 쪽에도 같은 종류의 구멍이 있다. 어느 DBMS에서 돌아간 쿼리가 다른 곳에서는 안 돌 수 있으니 옮길 때 확인해야 한다. [[조인]]

## 관련

- [[SELECT]]
- [[제약조건]]
- [[관계형 모델]]

## 출처

- [[brain/lectures/db/easy-db/lecture03|쉬운코드 데이터베이스 3강 - SQL]]
- [[brain/lectures/db/easy-db/lecture01|쉬운코드 데이터베이스 1강 - DB Language]]
