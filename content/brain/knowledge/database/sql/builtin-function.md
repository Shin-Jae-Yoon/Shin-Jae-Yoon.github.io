---
title: 내장 함수
aliases:
  - 내장 함수
  - 문자열 함수
  - 날짜 함수
  - SUBSTRING
  - DATEDIFF
tags:
  - database
origin:
  verified: 2026-08-30
---

SQL이 기본으로 제공하는 함수들. 집계 함수는 [[group-by|집계와 GROUP BY]]에서 다룬다. 여기서는 개별 값을 가공하는 것들을 모았다. 이름과 동작이 DBMS마다 다른 경우가 많아서 옮겨 쓸 때 확인이 필요하다.

## 문자열

`SUBSTRING(문자열, 시작, 길이)`는 시작 위치부터 길이만큼 잘라낸다. `REPLACE(문자열, 찾을것, 바꿀것)`은 해당 부분을 바꾸며 `LENGTH(문자열)`은 길이를 구한다.

`LTRIM`과 `RTRIM`은 좌우 공백을 없앤다. 인자를 하나 더 주면 공백 대신 지정한 문자를 그쪽 끝에서 없앤다. 양 끝만 처리하므로 문자열 중간의 공백은 그대로 남는다. 중간까지 지우려면 `REPLACE`를 쓴다.

`LPAD(문자열, n, 채울문자)`는 길이가 n이 되도록 좌측을 채운다. 우측을 채우는 `RPAD`도 있다. 번호를 `001`, `002` 형태로 만들 때처럼 자릿수를 맞추는 데 쓴다.

## 날짜와 시간

`NOW()`가 현재 날짜와 시간을 준다.

두 날짜의 차이를 구하는 방법은 DBMS마다 다르다. PostgreSQL은 `AGE(timestamp, timestamp)`를 쓴다. 인자가 하나면 현재와의 차이를 준다. MySQL에는 `AGE`가 없고 `DATEDIFF(뒤, 앞)`가 일 단위로, `TIMESTAMPDIFF(단위, 앞, 뒤)`가 지정한 단위로 계산한다.

```sql
SELECT DATEDIFF('2023-04-19 11:44:59', '2023-04-01 00:00:00');
SELECT TIMESTAMPDIFF(minute, '2023-04-01 00:00:00', '2023-04-19 11:44:59');
```

`TIMESTAMPDIFF`의 단위로는 year, quarter, month, week, day, hour, minute, second를 쓸 수 있다. 인자 순서가 `DATEDIFF`와 반대라 헷갈리기 쉽다.

날짜에서 일부만 뽑거나 자르는 함수도 있다. PostgreSQL의 `DATE_PART(단위, timestamp)`는 해당 단위 값을 뽑아내고, `DATE_TRUNC(단위, timestamp)`는 그 단위 아래를 잘라 버린다. 월별 집계를 낼 때 `DATE_TRUNC('month', ...)`로 묶는 식으로 쓴다.

날짜를 원하는 모양의 문자열로 바꾸는 것은 PostgreSQL이 `TO_CHAR(timestamp, 포맷)`, MySQL이 `DATE_FORMAT(날짜, 포맷)`이다. MySQL 포맷 문자는 네 자리 연도가 `%Y`, 월이 `%m`, 일이 `%d`, 24시간제 시각이 `%H`, 분이 `%i`, 초가 `%s`다. 분이 `%m`이 아니라 `%i`인 것만 조심하면 된다.

```sql
SELECT DATE_FORMAT(now(), '%Y-%m-%d');
```

MySQL에서 날짜 간격을 계산할 때 `CAST`로 직접 빼는 것은 지원되지 않는다. 기준 날짜에서 얼마를 빼려면 `DATE_SUB(기준날짜, INTERVAL 1 DAY)`처럼 `DATE_SUB`을 쓴다. 간격 자리에는 SECOND, MINUTE, HOUR, DAY, MONTH, YEAR이 온다. 음수를 주면 더하는 쪽이 된다.

## 값을 고르고 바꾸는 것

`ROUND(값, 자릿수)`는 소수점 이하를 반올림한다. `AVG()` 결과처럼 소수가 길게 나오는 값을 정리할 때 쓴다. MySQL에는 반올림하지 않고 그냥 버리는 `TRUNCATE()`도 있다.

`COALESCE(값1, 값2, ...)`는 앞에서부터 보다가 NULL이 아닌 첫 값을 돌려준다. `CAST(값 AS 타입)`은 타입을 바꾼다.

조건 분기는 `CASE WHEN 조건 THEN 값 ELSE 값 END`가 표준이고, `CASE 속성 WHEN 비교값 THEN 값 ...` 형태로 속성을 앞에 둘 수도 있다. MySQL에는 `IF(조건, 참일때, 거짓일때)`가 따로 있다.

```sql
SELECT IF(5 - 3 > 0, 'TRUE', 'FALSE');                    -- MySQL
SELECT CASE WHEN 5 - 3 > 0 THEN 'TRUE' ELSE 'FALSE' END;  -- PostgreSQL
```

## 관련

- [[group-by|집계와 GROUP BY]]
- [[select|SELECT]]
- [[ddl-dml|SQL과 DDL, DML]]

## 출처

- [[brain/lectures/algo/fastcampus-algo/part6/p6-ch01|패스트캠퍼스 SQL 코딩테스트 - 함수]]
