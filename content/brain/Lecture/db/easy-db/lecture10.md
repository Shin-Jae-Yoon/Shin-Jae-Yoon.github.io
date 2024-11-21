---
title: "10. stored function"
date: "2023-04-23 20:45"
enableToc: true
tags: [""]
weight: 11
---

유튜버 쉬운코드 님의 <a href='https://www.youtube.com/@ez./playlists' target='_blank'>데이터베이스</a> 강의를 정리한 내용

<hr>

## Stored function

==**Stored function : 사용자가 정의한 함수**==
- DBMS에 저장되고 사용되는 함수
- SQL의 **select, insert, update, delete statement**에서 사용 가능
- 자주 사용되는 일반적인 쿼리를 모듈화시켜서 편리하게 사용하기 위함
- [stored procedure](brain/Lecture/db/easy-db/lecture11.md)과는 다른 것

<br>

**stored function 특징**
- 이외에도 loop를 돌면서 반복적인 작업 수행 가능
- case 키워드를 사용하여 값에 따라 분기 처리 가능
- 에러를 핸들링하거나 에러를 일으키는 등의 다양한 동작 정의 가능

<br>

==**delimiter \$$**==
- 딜리미터는 기본적으로 `;`의 역할
- 함수가 시작하는 부분의 `;`와 함수 내부의 여러 쿼리에 대한 `;`와 혼동이 생기지 않게 하려고 임시적으로 사용하기 위함

<br>

```sql
> DELIMITER $$

> CREATE FUNCTION 이름(파라미터) 
> RETURNS 리턴타입
> OPTION
> BEGIN
> 	수행할 것
> END
> $$

> DELIMITER ;
```

- Option 자리는 MySQL의 옵션이 들어감
	- `CONTAINS SQL`
		- 데이터를 읽거나 쓰는 명령이 포함되어있지 않음
		- ex) 실행되지만 데이터를 읽거나 쓰는것을 하지 않는 `@SET @x = 1`
	- `NO SQL`
		- 루틴에 SQL 문이 없음을 의미
	- `READS SQL DATA`
		- 루틴에 데이터를 읽는 쿼리 (ex. `SELECT`)이 포함되어 있지만 쓰는 것은 없음
	- `MODIFIES SQL DATA`
		- 루틴에 데이터를 쓸 수 있는 쿼리 (ex. `INSERT`, `DELETE`)가 포함되어 있음
- `DB.이름`이라고 하지 않으면 현재 설정되어 있는 DB에 함수가 생성됨
	- 혹시 까먹었니!? DB 목록은 `SHOW DATABASES;`로 확인 가능해!

<br>

**stored function 삭제하기**

```sql
DROP FUNCTION 함수이름;
```

<br>

### 예제

**ex) 임직원의 ID를 열 자리 정수로 랜덤하게 발급하고 싶음. ID의 맨 앞자리는 1로 고정됨**

![](brain/image/lecture10-2.png)
- 10자리 정수니까 10억
- MySQL 내장 함수 `rand()`는 0과 1 사이의 값을 가져오는 것
- `rand() * 10억`을 하면 9자리 정수부를 가지는 값이 나올 것

<br><br>

**ex) 위에서 정의한 `id_generator()`를 이용하여 Employee 테이블에 임직원 정보 추가해보자**

![](brain/image/lecture10-3.png)

![](brain/image/lecture10-5.png)

<br><br>

**ex) 부서의 ID를 파라미터로 받으면, 해당 부서의 평균 연봉을 알려주는 함수 작성해보자**

![](brain/image/lecture10-6.png)

![](brain/image/lecture10-7.png)

- `DECLARE`로 변수를 선언하지 않고 사용할 수 있음
	- `@`를 붙이면 변수로 인식함

<br><br>

**ex) 위에서 정의한 `dept_avg_salary(int)` 함수로 부서 정보와 부서 평균 연봉을 함께 가져와보자**

![](brain/image/lecture10-9.png)

<br><br>

**ex) 졸업 요건 중 하나인 토익 800 이상을 충족했는지를 알려주는 함수를 작성해보자**

![](brain/image/lecture10-10.png)

![](brain/image/lecture10-11.png)

- `DECLARE`로 변수를 선언하지 않고 사용할 수 있음
	- `@`를 붙이면 변수로 인식함

<br><br>

**ex) 위에서 정의한 `toeic_pass_fail(int)` 함수로 학생 정보와 함께 토익 점수 조건을 충족했는지 여부를 같이 가져와보자**

![](brain/image/lecture10-12.png)

<br><br>

### 파악하기

- 회사에 입사했는데, 등록된 stored function이 많이 있다고 하자.
- 이걸 파악하는 방법

```sql
// 해당 DB에 있는 함수 목록
SHOW FUNCTION STATUS where DB = '이름';

// 함수의 코드 보고 싶으면
SHOW CREATE FUNCTION 함수이름;
```

<br><br>

**ex) 예를 들어, 위에서 정의한 함수들을 확인해보려면?**

![](brain/image/lecture10-13.png)

![](brain/image/lecture10-14.png)

<br>

<hr>

## 언제 쓰면 좋을까?

Stored function은 언제 사용하면 좋을까?
- 내부적으로 개발팀에서 결정한 것이 있을 것.
- 지금부터는 쉬운코드님의 개인적인 생각

### three-tier architecture

==**Three-tier architecture**==

보통, 클라이언트-서버 모델은 three-tier architecture를 따른다.

![](brain/image/lecture11-14.png)

**Presentation tier**
- 사용자에게 보여지는 부분을 담당하는 tier
- HTML, javascript, CSS, native app, desktop app

**Logic tier**
- 서비스와 관련된 기능, 정책 등등 비즈니스 로직을 담당하는 tier
- application tier, middle tier라고도 불림
- Java + Spring, Python + Django, etc..

**Data tier**
- 데이터를 저장하고 관리하고 제공하는 역할을 하는 tier
- MySQL, Oracle, SQL Server, PostgreSQL, MongoDB


<br>

### 그래서 언제 사용?

- util 함수로 쓰기에는 좋을 것 같음
- 비즈니스 로직을 stored function에 두는 것은 좋지 않을 것 같다.
	- 비즈니스 로직은 Logic tier에서 담당하는 것인데, 비즈니스 로직 일부를 stored function에서 담당하게 되면, 비즈니스 로직의 일부가 Data tier에 위치하게 됨
	- 서비스가 커질수록 관리 비용이 늘어남.
		- Logic tier 봤다가~ Data tier 봤다가~

<br>

### 위에서 구현한 함수 예시

![](brain/image/lecture10-18.png)